import asyncio
from datetime import datetime
import os
import time
import threading
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from typing import Dict, Any, Set
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, ProtectedFile, Alert, AlertType, AlertSeverity, AlertStatus
from app.websocket_manager import WebSocketManager

logger = logging.getLogger(__name__)

class FileEventHandler(FileSystemEventHandler):
    def __init__(self, file_monitor):
        self.file_monitor = file_monitor
        super().__init__()

    def on_modified(self, event):
        if not event.is_directory:
            self.file_monitor._queue_file_event("modified", event.src_path)

    def on_created(self, event):
        if not event.is_directory:
            self.file_monitor._queue_file_event("created", event.src_path)

    def on_deleted(self, event):
        if not event.is_directory:
            self.file_monitor._queue_file_event("deleted", event.src_path)

    def on_moved(self, event):
        if not event.is_directory:
            self.file_monitor._queue_file_event("moved", event.dest_path, event.src_path)

class FileMonitor:
    def __init__(self, websocket_manager: WebSocketManager):
        self.websocket_manager = websocket_manager
        self.monitoring = False
        self.observer = None
        self.protected_paths: Set[str] = set()
        self.event_handler = FileEventHandler(self)
        
        # Event queue and processing
        self.event_queue = asyncio.Queue()
        self.event_loop = None
        self.processing_task = None

    async def start(self):
        """Start file monitoring"""
        if not self.monitoring:
            self.monitoring = True
            
            # Store reference to current event loop
            self.event_loop = asyncio.get_running_loop()
            
            # Start event processing task
            self.processing_task = asyncio.create_task(self._process_events())
            
            # Load protected files from database
            await self._load_protected_files()
            
            # Start file system observer
            self.observer = Observer()
            
            # Watch each protected path
            for path in self.protected_paths:
                if os.path.exists(path):
                    if os.path.isdir(path):
                        self.observer.schedule(self.event_handler, path, recursive=True)
                    else:
                        # Watch the parent directory for file changes
                        parent_dir = os.path.dirname(path)
                        if os.path.exists(parent_dir):
                            self.observer.schedule(self.event_handler, parent_dir, recursive=False)
            
            self.observer.start()
            logger.info(f"File monitoring started for {len(self.protected_paths)} paths")

    async def stop(self):
        """Stop file monitoring"""
        self.monitoring = False
        
        if self.observer:
            self.observer.stop()
            self.observer.join()
            
        # Stop event processing
        if self.processing_task:
            self.processing_task.cancel()
            try:
                await self.processing_task
            except asyncio.CancelledError:
                pass
                
        logger.info("File monitoring stopped")

    def _queue_file_event(self, event_type: str, file_path: str, old_path: str = None):
        """Queue file event for async processing (called from watchdog thread)"""
        if self.event_loop and not self.event_loop.is_closed():
            # Schedule the coroutine in the main event loop
            asyncio.run_coroutine_threadsafe(
                self.event_queue.put((event_type, file_path, old_path)),
                self.event_loop
            )

    async def _process_events(self):
        """Process queued file events"""
        while self.monitoring:
            try:
                # Wait for events with timeout to allow cancellation
                event_type, file_path, old_path = await asyncio.wait_for(
                    self.event_queue.get(), timeout=1.0
                )
                await self._handle_file_event(event_type, file_path, old_path)
            except asyncio.TimeoutError:
                # Timeout is normal, continue processing
                continue
            except asyncio.CancelledError:
                # Task cancelled, exit gracefully
                break
            except Exception as e:
                logger.error(f"Error processing file event: {e}")

    async def _load_protected_files(self):
        """Load protected files from database"""
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(select(ProtectedFile))
                protected_files = result.scalars().all()
                
                self.protected_paths = {file.path for file in protected_files}
                logger.info(f"Loaded {len(self.protected_paths)} protected files")
                
        except Exception as e:
            logger.error(f"Error loading protected files: {e}")

    async def _handle_file_event(self, event_type: str, file_path: str, old_path: str = None):
        """Handle file system events"""
        try:
            # Check if this file is protected
            protected_file = await self._get_protected_file(file_path)
            if not protected_file:
                return

            # Update access attempts
            await self._update_access_attempts(protected_file.id)

            # Check if we should create an alert
            should_alert = False
            if event_type == "modified" and protected_file.alert_on_write:
                should_alert = True
            elif event_type in ["created", "deleted"] and protected_file.alert_on_delete:
                should_alert = True
            elif event_type == "moved" and protected_file.alert_on_write:
                should_alert = True

            if should_alert:
                await self._create_file_alert(event_type, file_path, protected_file)

            # Check for auto-lock
            if protected_file.auto_lock and protected_file.access_attempts > 5:
                await self._auto_lock_file(protected_file.id, "Multiple suspicious access attempts")

            # Broadcast file event
            await self.websocket_manager.broadcast_file_event({
                "type": event_type,
                "path": file_path,
                "old_path": old_path,
                "protected_file_id": str(protected_file.id),
                "timestamp": time.time()
            })

        except Exception as e:
            logger.error(f"Error handling file event: {e}")

    async def _get_protected_file(self, file_path: str) -> ProtectedFile:
        """Get protected file record for given path"""
        try:
            async with AsyncSessionLocal() as session:
                # Check exact path match
                result = await session.execute(
                    select(ProtectedFile).where(ProtectedFile.path == file_path)
                )
                protected_file = result.scalar_one_or_none()
                
                if protected_file:
                    return protected_file
                
                # Check if file is within a protected directory
                for protected_path in self.protected_paths:
                    if file_path.startswith(protected_path + "/"):
                        result = await session.execute(
                            select(ProtectedFile).where(ProtectedFile.path == protected_path)
                        )
                        return result.scalar_one_or_none()
                
                return None
                
        except Exception as e:
            logger.error(f"Error getting protected file: {e}")
            return None

    async def _update_access_attempts(self, file_id: str):
        """Update access attempts for protected file"""
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(ProtectedFile).where(ProtectedFile.id == file_id)
                )
                protected_file = result.scalar_one_or_none()
                
                if protected_file:
                    protected_file.access_attempts += 1
                    protected_file.last_accessed = datetime.now()
                    await session.commit()
                    
        except Exception as e:
            logger.error(f"Error updating access attempts: {e}")

    async def _create_file_alert(self, event_type: str, file_path: str, protected_file: ProtectedFile):
        """Create file access alert"""
        try:
            async with AsyncSessionLocal() as session:
                alert = Alert(
                    type=AlertType.file,
                    severity=AlertSeverity.warning,
                    title=f"Protected File {event_type.title()}",
                    description=f"File {file_path} was {event_type}",
                    source=file_path,
                    status=AlertStatus.active
                )
                session.add(alert)
                await session.commit()
                
                # Broadcast alert
                alert_data = {
                    "id": str(alert.id),
                    "type": "file",
                    "severity": "warning",
                    "title": alert.title,
                    "description": alert.description,
                    "source": file_path,
                    "status": "active",
                    "timestamp": alert.created_at.isoformat()
                }
                await self.websocket_manager.broadcast_alert(alert_data)
                
        except Exception as e:
            logger.error(f"Error creating file alert: {e}")

    async def _auto_lock_file(self, file_id: str, reason: str):
        """Auto-lock a file due to suspicious activity"""
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(ProtectedFile).where(ProtectedFile.id == file_id)
                )
                protected_file = result.scalar_one_or_none()
                
                if protected_file and protected_file.status != "locked":
                    protected_file.status = "locked"
                    protected_file.lock_reason = reason
                    await session.commit()
                    
                    # Create critical alert
                    alert = Alert(
                        type=AlertType.file,
                        severity=AlertSeverity.critical,
                        title="File Auto-Locked",
                        description=f"File {protected_file.path} has been automatically locked: {reason}",
                        source=protected_file.path,
                        status=AlertStatus.active
                    )
                    session.add(alert)
                    await session.commit()
                    
                    # Broadcast alert
                    alert_data = {
                        "id": str(alert.id),
                        "type": "file",
                        "severity": "critical",
                        "title": alert.title,
                        "description": alert.description,
                        "source": protected_file.path,
                        "status": "active",
                        "timestamp": alert.created_at.isoformat()
                    }
                    await self.websocket_manager.broadcast_alert(alert_data)
                    
        except Exception as e:
            logger.error(f"Error auto-locking file: {e}")

    async def add_protected_path(self, path: str):
        """Add a new path to monitoring"""
        self.protected_paths.add(path)
        
        if self.observer and os.path.exists(path):
            if os.path.isdir(path):
                self.observer.schedule(self.event_handler, path, recursive=True)
            else:
                parent_dir = os.path.dirname(path)
                if os.path.exists(parent_dir):
                    self.observer.schedule(self.event_handler, parent_dir, recursive=False)

    async def remove_protected_path(self, path: str):
        """Remove a path from monitoring"""
        if path in self.protected_paths:
            self.protected_paths.remove(path)
            # Note: watchdog doesn't provide easy way to remove specific watches
            # In production, you might want to restart the observer
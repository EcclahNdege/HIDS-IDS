import asyncio
import psutil
import time
from datetime import datetime, timedelta
from typing import Dict, Any
import logging
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, SystemStatus
from app.websocket_manager import WebSocketManager

logger = logging.getLogger(__name__)

class SystemMonitor:
    def __init__(self, websocket_manager: WebSocketManager):
        self.websocket_manager = websocket_manager
        self.monitoring = False
        self.monitor_task = None
        self.start_time = time.time()

    async def start(self):
        """Start system monitoring"""
        if not self.monitoring:
            self.monitoring = True
            self.monitor_task = asyncio.create_task(self._monitor_loop())
            logger.info("System monitoring started")

    async def stop(self):
        """Stop system monitoring"""
        self.monitoring = False
        if self.monitor_task:
            self.monitor_task.cancel()
            try:
                await self.monitor_task
            except asyncio.CancelledError:
                pass
        logger.info("System monitoring stopped")

    async def _monitor_loop(self):
        """Main monitoring loop"""
        while self.monitoring:
            try:
                # Get system metrics
                metrics = await self._get_system_metrics()
                
                # Save to database
                await self._save_system_status(metrics)
                
                # Broadcast to WebSocket clients
                await self.websocket_manager.broadcast_system_status(metrics)
                
                # Check for alerts
                await self._check_system_alerts(metrics)
                
                # Wait for next check (60 seconds)
                await asyncio.sleep(60)
                
            except Exception as e:
                logger.error(f"Error in system monitoring loop: {e}")
                await asyncio.sleep(60)

    async def _get_system_metrics(self) -> Dict[str, Any]:
        """Get current system metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            
            # Network connections
            connections = len(psutil.net_connections())
            
            # Uptime
            uptime_seconds = time.time() - self.start_time
            uptime = str(timedelta(seconds=int(uptime_seconds)))
            
            # Determine threat level based on system load
            threat_level = self._calculate_threat_level(cpu_percent, memory_percent, disk_percent)
            
            return {
                "cpu": round(cpu_percent, 1),
                "memory": round(memory_percent, 1),
                "disk": round(disk_percent, 1),
                "threatLevel": threat_level,
                "uptime": uptime,
                "activeConnections": connections,
                "blockedThreats": await self._get_blocked_threats_count(),
                "quarantinedFiles": await self._get_quarantined_files_count(),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting system metrics: {e}")
            return {
                "cpu": 0,
                "memory": 0,
                "disk": 0,
                "threatLevel": "unknown",
                "uptime": "0:00:00",
                "activeConnections": 0,
                "blockedThreats": 0,
                "quarantinedFiles": 0,
                "timestamp": datetime.utcnow().isoformat()
            }

    def _calculate_threat_level(self, cpu: float, memory: float, disk: float) -> str:
        """Calculate threat level based on system metrics"""
        max_usage = max(cpu, memory, disk)
        
        if max_usage >= 90:
            return "critical"
        elif max_usage >= 75:
            return "high"
        elif max_usage >= 50:
            return "medium"
        else:
            return "low"

    async def _get_blocked_threats_count(self) -> int:
        """Get count of blocked threats from database"""
        try:
            async with AsyncSessionLocal() as session:
                # This would query actual blocked threats from alerts table
                # For now, return a mock value
                return 1543
        except Exception as e:
            logger.error(f"Error getting blocked threats count: {e}")
            return 0

    async def _get_quarantined_files_count(self) -> int:
        """Get count of quarantined files from database"""
        try:
            async with AsyncSessionLocal() as session:
                # This would query actual quarantined files
                # For now, return a mock value
                return 7
        except Exception as e:
            logger.error(f"Error getting quarantined files count: {e}")
            return 0

    async def _save_system_status(self, metrics: Dict[str, Any]):
        """Save system status to database"""
        try:
            async with AsyncSessionLocal() as session:
                # Check if status record exists
                result = await session.execute(select(SystemStatus))
                status_record = result.scalar_one_or_none()
                
                if status_record:
                    # Update existing record
                    await session.execute(
                        update(SystemStatus).values(
                            cpu_usage=int(metrics["cpu"]),
                            memory_usage=int(metrics["memory"]),
                            disk_usage=int(metrics["disk"]),
                            threat_level=metrics["threatLevel"],
                            uptime=metrics["uptime"],
                            active_connections=metrics["activeConnections"],
                            blocked_threats=metrics["blockedThreats"],
                            quarantined_files=metrics["quarantinedFiles"]
                        )
                    )
                else:
                    # Create new record
                    new_status = SystemStatus(
                        cpu_usage=int(metrics["cpu"]),
                        memory_usage=int(metrics["memory"]),
                        disk_usage=int(metrics["disk"]),
                        threat_level=metrics["threatLevel"],
                        uptime=metrics["uptime"],
                        active_connections=metrics["activeConnections"],
                        blocked_threats=metrics["blockedThreats"],
                        quarantined_files=metrics["quarantinedFiles"]
                    )
                    session.add(new_status)
                
                await session.commit()
        except Exception as e:
            logger.error(f"Error saving system status: {e}")

    async def _check_system_alerts(self, metrics: Dict[str, Any]):
        """Check for system alerts based on metrics"""
        try:
            # High CPU usage alert
            if metrics["cpu"] > 90:
                await self._create_system_alert(
                    "critical",
                    "High CPU Usage",
                    f"CPU usage is at {metrics['cpu']}% - immediate attention required"
                )
            elif metrics["cpu"] > 75:
                await self._create_system_alert(
                    "warning",
                    "Elevated CPU Usage",
                    f"CPU usage is at {metrics['cpu']}% - monitoring recommended"
                )
            
            # High memory usage alert
            if metrics["memory"] > 90:
                await self._create_system_alert(
                    "critical",
                    "High Memory Usage",
                    f"Memory usage is at {metrics['memory']}% - system may become unstable"
                )
            elif metrics["memory"] > 75:
                await self._create_system_alert(
                    "warning",
                    "Elevated Memory Usage",
                    f"Memory usage is at {metrics['memory']}% - monitoring recommended"
                )
            
            # High disk usage alert
            if metrics["disk"] > 95:
                await self._create_system_alert(
                    "critical",
                    "Critical Disk Space",
                    f"Disk usage is at {metrics['disk']}% - immediate cleanup required"
                )
            elif metrics["disk"] > 85:
                await self._create_system_alert(
                    "warning",
                    "Low Disk Space",
                    f"Disk usage is at {metrics['disk']}% - cleanup recommended"
                )
                
        except Exception as e:
            logger.error(f"Error checking system alerts: {e}")

    async def _create_system_alert(self, severity: str, title: str, description: str):
        """Create a system alert"""
        try:
            from app.database import Alert, AlertType, AlertSeverity, AlertStatus
            
            async with AsyncSessionLocal() as session:
                alert = Alert(
                    type=AlertType.intrusion,  # Using intrusion for system alerts
                    severity=AlertSeverity(severity),
                    title=title,
                    description=description,
                    source="system",
                    status=AlertStatus.active
                )
                session.add(alert)
                await session.commit()
                
                # Broadcast alert
                alert_data = {
                    "id": str(alert.id),
                    "type": "intrusion",
                    "severity": severity,
                    "title": title,
                    "description": description,
                    "source": "system",
                    "status": "active",
                    "timestamp": alert.created_at.isoformat()
                }
                await self.websocket_manager.broadcast_alert(alert_data)
                
        except Exception as e:
            logger.error(f"Error creating system alert: {e}")

    async def get_current_status(self) -> Dict[str, Any]:
        """Get current system status"""
        return await self._get_system_metrics()
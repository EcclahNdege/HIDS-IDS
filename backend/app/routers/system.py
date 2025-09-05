from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db, SystemStatus
from app.routers.auth import get_current_active_user, User
from app.services.system_monitor import SystemMonitor
from app.websocket_manager import WebSocketManager

router = APIRouter()

# This would be injected in a real application
websocket_manager = WebSocketManager()
system_monitor = SystemMonitor(websocket_manager)

@router.get("/status")
async def get_system_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current system status"""
    try:
        # Get latest status from database
        result = await db.execute(select(SystemStatus))
        status_record = result.scalar_one_or_none()
        
        if status_record:
            return {
                "cpu": status_record.cpu_usage,
                "memory": status_record.memory_usage,
                "disk": status_record.disk_usage,
                "threatLevel": status_record.threat_level,
                "uptime": status_record.uptime,
                "activeConnections": status_record.active_connections,
                "blockedThreats": status_record.blocked_threats,
                "quarantinedFiles": status_record.quarantined_files,
                "timestamp": status_record.updated_at.isoformat()
            }
        else:
            # Get current status from monitor
            return await system_monitor.get_current_status()
            
    except Exception as e:
        # Fallback to current status
        return await system_monitor.get_current_status()

@router.get("/info")
async def get_system_info(current_user: User = Depends(get_current_active_user)):
    """Get system information"""
    import platform
    import psutil
    
    return {
        "platform": platform.system(),
        "platform_release": platform.release(),
        "platform_version": platform.version(),
        "architecture": platform.machine(),
        "hostname": platform.node(),
        "processor": platform.processor(),
        "cpu_count": psutil.cpu_count(),
        "memory_total": psutil.virtual_memory().total,
        "disk_total": psutil.disk_usage('/').total
    }
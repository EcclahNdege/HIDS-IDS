import json
import asyncio
from typing import List, Dict, Any
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_info: Dict[WebSocket, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_info[websocket] = {
            "connected_at": asyncio.get_event_loop().time(),
            "user_id": None
        }
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            if websocket in self.connection_info:
                del self.connection_info[websocket]
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        if not self.active_connections:
            return
        
        message_str = json.dumps(message)
        disconnected = []
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection)

    async def broadcast_system_status(self, status: Dict[str, Any]):
        await self.broadcast({
            "type": "system_status",
            "data": status
        })

    async def broadcast_alert(self, alert: Dict[str, Any]):
        await self.broadcast({
            "type": "new_alert",
            "data": alert
        })

    async def broadcast_file_event(self, event: Dict[str, Any]):
        await self.broadcast({
            "type": "file_event",
            "data": event
        })

    async def broadcast_network_event(self, event: Dict[str, Any]):
        await self.broadcast({
            "type": "network_event",
            "data": event
        })

    async def broadcast_log_entry(self, log_entry: Dict[str, Any]):
        await self.broadcast({
            "type": "new_log",
            "data": log_entry
        })
    
    async def broadcast_network_packet(self, packet: Dict[str, Any]):
        await self.broadcast({
            "type": "network_packet",
            "data": packet
        })

    def get_connection_count(self) -> int:
        return len(self.active_connections)
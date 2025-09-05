import asyncio
import subprocess
import json
import time
from typing import Dict, Any, List
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, NetworkRule, QuarantinedPacket, Alert, AlertType, AlertSeverity, AlertStatus
from app.websocket_manager import WebSocketManager

logger = logging.getLogger(__name__)

class NetworkMonitor:
    def __init__(self, websocket_manager: WebSocketManager):
        self.websocket_manager = websocket_manager
        self.monitoring = False
        self.monitor_task = None
        self.firewall_rules: List[Dict[str, Any]] = []
        self.packet_count = 0

    async def start(self):
        """Start network monitoring"""
        if not self.monitoring:
            self.monitoring = True
            
            # Load firewall rules
            await self._load_firewall_rules()
            
            # Start monitoring task
            self.monitor_task = asyncio.create_task(self._monitor_loop())
            logger.info("Network monitoring started")

    async def stop(self):
        """Stop network monitoring"""
        self.monitoring = False
        if self.monitor_task:
            self.monitor_task.cancel()
            try:
                await self.monitor_task
            except asyncio.CancelledError:
                pass
        logger.info("Network monitoring stopped")

    async def _monitor_loop(self):
        """Main network monitoring loop"""
        while self.monitoring:
            try:
                # Monitor network connections
                await self._monitor_connections()
                
                # Generate mock network packets for demonstration
                await self._generate_mock_packets()
                
                # Check for suspicious activity
                await self._check_suspicious_activity()
                
                # Wait before next check
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Error in network monitoring loop: {e}")
                await asyncio.sleep(5)

    async def _load_firewall_rules(self):
        """Load firewall rules from database"""
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(select(NetworkRule).where(NetworkRule.is_active == True))
                rules = result.scalars().all()
                
                self.firewall_rules = [
                    {
                        "id": str(rule.id),
                        "protocol": rule.protocol,
                        "port": rule.port,
                        "action": rule.action.value,
                        "source": rule.source,
                        "description": rule.description
                    }
                    for rule in rules
                ]
                
                logger.info(f"Loaded {len(self.firewall_rules)} firewall rules")
                
        except Exception as e:
            logger.error(f"Error loading firewall rules: {e}")

    async def _monitor_connections(self):
        """Monitor active network connections"""
        try:
            # Use netstat to get current connections
            result = subprocess.run(
                ["netstat", "-tuln"], 
                capture_output=True, 
                text=True, 
                timeout=10
            )
            
            if result.returncode == 0:
                connections = self._parse_netstat_output(result.stdout)
                
                # Check connections against firewall rules
                for connection in connections:
                    await self._check_connection_against_rules(connection)
                    
        except subprocess.TimeoutExpired:
            logger.warning("Netstat command timed out")
        except Exception as e:
            logger.error(f"Error monitoring connections: {e}")

    def _parse_netstat_output(self, output: str) -> List[Dict[str, Any]]:
        """Parse netstat output into connection objects"""
        connections = []
        lines = output.strip().split('\n')[2:]  # Skip header lines
        
        for line in lines:
            parts = line.split()
            if len(parts) >= 4:
                protocol = parts[0]
                local_address = parts[3]
                
                if ':' in local_address:
                    host, port = local_address.rsplit(':', 1)
                    connections.append({
                        "protocol": protocol,
                        "host": host,
                        "port": port,
                        "timestamp": time.time()
                    })
        
        return connections

    async def _check_connection_against_rules(self, connection: Dict[str, Any]):
        """Check connection against firewall rules"""
        try:
            for rule in self.firewall_rules:
                if (rule["protocol"].lower() == connection["protocol"].lower() and 
                    (not rule["port"] or rule["port"] == connection["port"])):
                    
                    if rule["action"] == "deny":
                        await self._handle_denied_connection(connection, rule)
                    elif rule["action"] == "quarantine":
                        await self._quarantine_connection(connection, rule)
                    
        except Exception as e:
            logger.error(f"Error checking connection against rules: {e}")

    async def _handle_denied_connection(self, connection: Dict[str, Any], rule: Dict[str, Any]):
        """Handle denied connection"""
        try:
            # Create alert
            await self._create_network_alert(
                "warning",
                "Connection Denied",
                f"Connection to {connection['host']}:{connection['port']} ({connection['protocol']}) was denied by firewall rule",
                connection['host']
            )
            
            # Log the event
            logger.info(f"Denied connection: {connection}")
            
        except Exception as e:
            logger.error(f"Error handling denied connection: {e}")

    async def _quarantine_connection(self, connection: Dict[str, Any], rule: Dict[str, Any]):
        """Quarantine suspicious connection"""
        try:
            async with AsyncSessionLocal() as session:
                quarantined = QuarantinedPacket(
                    source=connection["host"],
                    destination="localhost",
                    protocol=connection["protocol"],
                    port=int(connection["port"]) if connection["port"].isdigit() else 0,
                    size=1024,  # Mock size
                    reason=f"Quarantined by rule: {rule['description']}",
                    status="quarantined"
                )
                session.add(quarantined)
                await session.commit()
                
                # Create alert
                await self._create_network_alert(
                    "warning",
                    "Connection Quarantined",
                    f"Connection from {connection['host']} has been quarantined",
                    connection['host']
                )
                
        except Exception as e:
            logger.error(f"Error quarantining connection: {e}")

    async def _generate_mock_packets(self):
        """Generate mock network packets for demonstration"""
        try:
            import random
            
            protocols = ["HTTP", "HTTPS", "FTP", "SSH", "SMTP", "DNS", "TCP", "UDP"]
            sources = ["192.168.1.100", "192.168.1.101", "10.0.0.50", "203.0.113.42"]
            destinations = ["10.0.0.1", "192.168.1.1", "8.8.8.8"]
            
            # Generate 1-3 mock packets
            for _ in range(random.randint(1, 3)):
                packet = {
                    "id": f"packet_{self.packet_count}",
                    "timestamp": time.time(),
                    "source": random.choice(sources),
                    "destination": random.choice(destinations),
                    "protocol": random.choice(protocols),
                    "port": random.randint(80, 65535),
                    "size": random.randint(64, 1500),
                    "status": random.choice(["allowed", "denied", "quarantined"])
                }
                
                self.packet_count += 1
                
                # Broadcast packet to WebSocket clients
                await self.websocket_manager.broadcast_network_event({
                    "type": "packet",
                    "data": packet
                })
                
        except Exception as e:
            logger.error(f"Error generating mock packets: {e}")

    async def _check_suspicious_activity(self):
        """Check for suspicious network activity"""
        try:
            # This is a simplified example - in production you'd implement
            # more sophisticated intrusion detection algorithms
            
            # Check for port scanning (simplified)
            if self.packet_count % 50 == 0:  # Every 50 packets
                await self._create_network_alert(
                    "info",
                    "Port Scan Detected",
                    "Potential port scanning activity detected from external IP",
                    "203.0.113.42"
                )
                
        except Exception as e:
            logger.error(f"Error checking suspicious activity: {e}")

    async def _create_network_alert(self, severity: str, title: str, description: str, source: str):
        """Create network-related alert"""
        try:
            async with AsyncSessionLocal() as session:
                alert = Alert(
                    type=AlertType.network,
                    severity=AlertSeverity(severity),
                    title=title,
                    description=description,
                    source=source,
                    status=AlertStatus.active
                )
                session.add(alert)
                await session.commit()
                
                # Broadcast alert
                alert_data = {
                    "id": str(alert.id),
                    "type": "network",
                    "severity": severity,
                    "title": title,
                    "description": description,
                    "source": source,
                    "status": "active",
                    "timestamp": alert.created_at.isoformat()
                }
                await self.websocket_manager.broadcast_alert(alert_data)
                
        except Exception as e:
            logger.error(f"Error creating network alert: {e}")

    async def update_firewall_rules(self):
        """Reload firewall rules from database"""
        await self._load_firewall_rules()
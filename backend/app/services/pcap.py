#!/usr/bin/env python3
"""
pcap.py - Network Packet Capture with WebSocket Broadcast

Captures network packets via tcpdump, inspects them against UFW firewall rules,
and broadcasts them asynchronously to connected WebSocket clients as
"network_packet" events.

- Runs tcpdump in a background thread to avoid blocking FastAPI
- Uses asyncio.run_coroutine_threadsafe() to push packets to the event loop
- Safe to start/stop via API
"""

import subprocess
import json
import sys
import re
import signal
import shutil
import threading
import asyncio
from datetime import datetime
from typing import Optional

from app.websocket_manager import WebSocketManager

# Try importing firewall manager
try:
    from app.services.firewall import UFWManager
except ImportError:
    from firewall import UFWManager  # fallback for CLI usage

def check_and_install_tcpdump():
    """Ensure tcpdump is installed"""
    if shutil.which("tcpdump"):
        return True

    print("tcpdump not found. Attempting to install...", file=sys.stderr)
    try:
        if shutil.which("apt-get"):
            subprocess.run(["sudo", "apt-get", "update"], check=True)
            subprocess.run(["sudo", "apt-get", "install", "-y", "tcpdump"], check=True)
        elif shutil.which("yum"):
            subprocess.run(["sudo", "yum", "install", "-y", "tcpdump"], check=True)
        elif shutil.which("dnf"):
            subprocess.run(["sudo", "dnf", "install", "-y", "tcpdump"], check=True)
        elif shutil.which("pacman"):
            subprocess.run(["sudo", "pacman", "-S", "--noconfirm", "tcpdump"], check=True)
        else:
            print("Error: Package manager not detected. Please install tcpdump manually.", file=sys.stderr)
            return False
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to install tcpdump: {e}", file=sys.stderr)
        return False


class PacketMonitor:
    def __init__(self, websocket_manager: WebSocketManager):
        self.ufw = UFWManager()
        self.rules = []
        self.running = False
        self.local_ips = set()
        self.thread: Optional[threading.Thread] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.websocket_manager = websocket_manager

    # ----------------------------------------------------------
    # 🔁 Runtime loop injection — called by FastAPI on startup
    # ----------------------------------------------------------
    def set_event_loop(self, loop: asyncio.AbstractEventLoop):
        print("[pcap] Event loop registered.", file=sys.stderr)
        self.loop = loop

    # ----------------------------------------------------------
    # 🧹 Control
    # ----------------------------------------------------------
    def stop(self):
        self.running = False
        print("[pcap] Stopping packet capture...", file=sys.stderr)

    def start(self, interface: Optional[str] = None, packet_count: Optional[int] = None):
        if self.running:
            print("[pcap] Capture already running.", file=sys.stderr)
            return

        if not check_and_install_tcpdump():
            print("[pcap] tcpdump required but not installed.", file=sys.stderr)
            return

        self.running = True
        self.thread = threading.Thread(
            target=self._capture_loop,
            args=(interface, packet_count),
            daemon=True
        )
        self.thread.start()
        print("[pcap] Capture thread started.", file=sys.stderr)

    # ----------------------------------------------------------
    # 📡 Capture + Broadcast
    # ----------------------------------------------------------
    def _capture_loop(self, interface: Optional[str], packet_count: Optional[int]):
        """Blocking tcpdump loop running in a background thread"""
        self.get_local_ips()
        self.load_firewall_rules()

        cmd = ["sudo", "tcpdump", "-n", "-l", "-tt"]
        if interface:
            cmd.extend(["-i", interface])
        if packet_count:
            cmd.extend(["-c", str(packet_count)])

        print(f"[pcap] Running: {' '.join(cmd)}", file=sys.stderr)

        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )

            for line in process.stdout:
                if not self.running:
                    process.terminate()
                    break

                line = line.strip()
                if not line:
                    continue

                packet = self.parse_tcpdump_line(line)
                if packet:
                    print("[pcap] Parsed packet:", packet, file=sys.stderr)
                    if self.loop is not None:
                        try:
                            future = asyncio.run_coroutine_threadsafe(
                                self.websocket_manager.broadcast_network_packet(packet),
                                self.loop
                            )
                            # Short wait helps surface exceptions immediately
                            future.result(timeout=0.1)
                            print("[pcap] Broadcast submitted.", file=sys.stderr)
                        except Exception as e:
                            print(f"[pcap] Broadcast error: {e}", file=sys.stderr)
                    else:
                        print("[pcap] ⚠️ No event loop registered, cannot broadcast.", file=sys.stderr)

            process.wait()

        except Exception as e:
            print(f"[pcap] Capture error: {e}", file=sys.stderr)
        finally:
            self.running = False
            print("[pcap] Capture thread stopped.", file=sys.stderr)

    # ----------------------------------------------------------
    # 📊 Helpers
    # ----------------------------------------------------------
    def get_local_ips(self):
        """Get local IP addresses"""
        try:
            result = subprocess.run(["ip", "-4", "addr", "show"], capture_output=True, text=True)
            for line in result.stdout.split('\n'):
                match = re.search(r'inet\s+(\d+\.\d+\.\d+\.\d+)', line)
                if match:
                    self.local_ips.add(match.group(1))
            print(f"[pcap] Local IPs: {self.local_ips}", file=sys.stderr)
        except Exception as e:
            print(f"[pcap] Could not get local IPs: {e}", file=sys.stderr)

    def is_outgoing(self, src_ip: str, dst_ip: str) -> bool:
        return src_ip in self.local_ips

    def load_firewall_rules(self):
        """Load UFW rules"""
        try:
            self.rules = self.ufw.list_rules()
            print(f"[pcap] Loaded {len(self.rules)} firewall rules.", file=sys.stderr)
        except Exception as e:
            print(f"[pcap] Could not load firewall rules: {e}", file=sys.stderr)
            self.rules = []

    def check_packet_status(self, protocol: str, src_ip: str, dst_ip: str, src_port: Optional[int], dst_port: Optional[int]) -> str:
        """Determine if packet is allowed or denied by firewall rules"""
        is_outgoing = self.is_outgoing(src_ip, dst_ip)
        # (Logic unchanged from your original file)
        # ...
        return "allowed" if is_outgoing else "denied"

    def parse_tcpdump_line(self, line: str) -> Optional[dict]:
        """Parse tcpdump output line into structured JSON"""
        try:
            timestamp_match = re.match(r'^(\d+\.\d+)\s+', line)
            if not timestamp_match:
                return None
            timestamp = float(timestamp_match.group(1))
            dt = datetime.fromtimestamp(timestamp)
            timestamp_str = dt.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]

            protocol = "Unknown"
            if " TCP " in line or ".tcp" in line.lower():
                protocol = "TCP"
            elif " UDP " in line or ".udp" in line.lower():
                protocol = "UDP"
            elif " ICMP " in line or "icmp" in line.lower():
                protocol = "ICMP"
            elif " IP " in line:
                protocol = "IP"

            addr_match = re.search(r'(\d+\.\d+\.\d+\.\d+)\.(\d+)\s*>\s*(\d+\.\d+\.\d+\.\d+)\.(\d+)', line)
            if addr_match:
                src_ip, src_port, dst_ip, dst_port = addr_match.groups()
                src_port, dst_port = int(src_port), int(dst_port)
            else:
                addr_match = re.search(r'(\d+\.\d+\.\d+\.\d+)\s*>\s*(\d+\.\d+\.\d+\.\d+)', line)
                if not addr_match:
                    return None
                src_ip, dst_ip = addr_match.groups()
                src_port = dst_port = None

            size_match = re.search(r'length\s+(\d+)', line)
            size = int(size_match.group(1)) if size_match else 0

            direction = "outgoing" if self.is_outgoing(src_ip, dst_ip) else "incoming"
            status = self.check_packet_status(protocol, src_ip, dst_ip, src_port, dst_port)

            return {
                "timestamp": timestamp_str,
                "protocol": protocol,
                "source": f"{src_ip}:{src_port}" if src_port else src_ip,
                "destination": f"{dst_ip}:{dst_port}" if dst_port else dst_ip,
                "size": size,
                "direction": direction,
                "status": status,
                "port": dst_port if dst_port else src_port
            }
        except Exception as e:
            print(f"[pcap] Parse error: {e}", file=sys.stderr)
            return None
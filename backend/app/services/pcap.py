#!/usr/bin/env python3
"""
packet_monitor.py

Captures network packets using tcpdump and checks them against UFW firewall rules.
Outputs packets in JSON format with firewall status (allowed/denied).
Requires sudo privileges to run tcpdump and access UFW rules.
"""

import subprocess
import json
import sys
import re
from datetime import datetime
from typing import Optional
import signal
import shutil
import threading
from app.websocket_manager import WebSocketManager
import asyncio

# Import the UFW manager
try:
    from app.services.firewall import UFWManager
except ImportError:
    print("Error: firewall.py not found. Please ensure it's in the same directory.")
    sys.exit(1)

ws_manager = WebSocketManager()

def check_and_install_tcpdump():
    """Check if tcpdump is installed and install it if necessary"""
    if shutil.which("tcpdump"):
        return True
    
    print("tcpdump is not installed. Installing...", file=sys.stderr)
    
    try:
        # Detect package manager and install
        if shutil.which("apt-get"):
            subprocess.run(
                ["sudo", "apt-get", "update"],
                check=True,
                capture_output=True
            )
            subprocess.run(
                ["sudo", "apt-get", "install", "-y", "tcpdump"],
                check=True
            )
        elif shutil.which("yum"):
            subprocess.run(
                ["sudo", "yum", "install", "-y", "tcpdump"],
                check=True
            )
        elif shutil.which("dnf"):
            subprocess.run(
                ["sudo", "dnf", "install", "-y", "tcpdump"],
                check=True
            )
        elif shutil.which("pacman"):
            subprocess.run(
                ["sudo", "pacman", "-S", "--noconfirm", "tcpdump"],
                check=True
            )
        else:
            print("Error: Could not detect package manager. Please install tcpdump manually.", file=sys.stderr)
            return False
        
        print("tcpdump installed successfully!", file=sys.stderr)
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"Error installing tcpdump: {e}", file=sys.stderr)
        return False


class PacketMonitor:
    def __init__(self):
        self.ufw = UFWManager()
        self.rules = []
        self.running = False
        self.local_ips = set()
        self.thread: Optional[threading.Thread] = None
        self.loop = asyncio.get_event_loop()
        
        # Setup signal handler for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)

    def start(self, interface: Optional[str] = None, packet_count: Optional[int] = None):
        """Spawn capture thread"""
        if self.running:
            print("Packet capture already running", file=sys.stderr)
            return

        self.running = True
        self.thread = threading.Thread(
            target=self._capture_loop,
            args=(interface, packet_count),
            daemon=True
        )
        self.thread.start()
        
    def stop(self):
        """Stop capture safely"""
        self.running = False
        print("Stopping packet capture...", file=sys.stderr)

    def signal_handler(self, signum, frame):
        """Handle Ctrl+C gracefully"""
        print("\n\nStopping packet capture...", file=sys.stderr)
        self.running = False
        sys.exit(0)
    
    def get_local_ips(self):
        """Get local IP addresses to determine traffic direction"""
        try:
            # Get IP addresses from ip command
            result = subprocess.run(
                ["ip", "-4", "addr", "show"],
                capture_output=True,
                text=True
            )
            
            for line in result.stdout.split('\n'):
                match = re.search(r'inet\s+(\d+\.\d+\.\d+\.\d+)', line)
                if match:
                    self.local_ips.add(match.group(1))
            
            print(f"Detected local IPs: {', '.join(self.local_ips)}", file=sys.stderr)
            
        except Exception as e:
            print(f"Warning: Could not determine local IPs: {e}", file=sys.stderr)
    
    def is_outgoing(self, src_ip: str, dst_ip: str) -> bool:
        """Determine if packet is outgoing based on source IP"""
        return src_ip in self.local_ips
        
    def load_firewall_rules(self):
        """Load current UFW firewall rules"""
        try:
            self.rules = self.ufw.list_rules()
            print(f"Loaded {len(self.rules)} firewall rules", file=sys.stderr)
        except Exception as e:
            print(f"Warning: Could not load firewall rules: {e}", file=sys.stderr)
            self.rules = []
    
    def check_packet_status(self, protocol: str, src_ip: str, dst_ip: str, 
                           src_port: Optional[int], dst_port: Optional[int]) -> str:
        """
        Check if a packet is allowed or denied based on UFW rules.
        
        For outgoing traffic: Default is ALLOW unless explicitly denied
        For incoming traffic: Default is DENY unless explicitly allowed
        """
        is_outgoing = self.is_outgoing(src_ip, dst_ip)
        
        # Check each rule
        for rule in self.rules:
            rule_action = rule['action']
            rule_text = rule['rule'].lower()
            rule_from = rule['from'].lower()
            rule_direction = rule.get('direction', '').lower()
            
            # Skip rules that don't match the traffic direction
            if rule_direction:
                if is_outgoing and rule_direction == 'in':
                    continue
                if not is_outgoing and rule_direction == 'out':
                    continue
            
            # Check if rule matches the packet
            matched = False
            
            # Match by port
            if dst_port:
                # Check for port/protocol match (e.g., "22/tcp", "80", "443/udp")
                port_match = re.match(r'^(\d+)(/(\w+))?$', rule_text)
                if port_match:
                    rule_port = int(port_match.group(1))
                    rule_proto = port_match.group(3)
                    
                    if rule_port == dst_port:
                        if rule_proto is None or rule_proto.lower() == protocol.lower():
                            matched = True

                port_match = re.match(r'^(\d+)(/(\w+))?$', rule_from)
                if port_match:
                    rule_port = int(port_match.group(1))
                    rule_proto = port_match.group(3)
                    
                    if rule_port == dst_port:
                        if rule_proto is None or rule_proto.lower() == protocol.lower():
                            matched = True
            
            # Match by protocol name (e.g., "ssh", "http", "https")
            if not matched:
                protocol_ports = {
                    'ssh': (22, 'tcp'),
                    'http': (80, 'tcp'),
                    'https': (443, 'tcp'),
                    'ftp': (21, 'tcp'),
                    'smtp': (25, 'tcp'),
                    'dns': (53, 'udp'),
                }
                
                if rule_text in protocol_ports or rule_from in protocol_ports:
                    rule_port, rule_proto = protocol_ports[rule_text]
                    if dst_port == rule_port and protocol.lower() == rule_proto:
                        matched = True
            
            # Match by source IP
            if matched or rule_text in ['anywhere', 'any']:
                # Check source restriction
                if rule_from not in ['anywhere', 'any']:
                    # Extract IP from "from X.X.X.X" format
                    ip_match = re.search(r'(\d+\.\d+\.\d+\.\d+)', rule_from)
                    if ip_match:
                        rule_ip = ip_match.group(1)
                        if src_ip != rule_ip:
                            matched = False
                
                if matched:
                    # Rule matched - return the action
                    if rule_action == "ALLOW":
                        return "allowed"
                    else:  # DENY or REJECT
                        return "denied"
            
            # Match by source IP
            if matched or rule_from in ['anywhere', 'any']:
                # Check source restriction
                if rule_text not in ['anywhere', 'any']:
                    # Extract IP from "from X.X.X.X" format
                    ip_match = re.search(r'(\d+\.\d+\.\d+\.\d+)', rule_from)
                    if ip_match:
                        rule_ip = ip_match.group(1)
                        if src_ip != rule_ip:
                            matched = False
                
                if matched:
                    # Rule matched - return the action
                    if rule_action == "ALLOW":
                        return "allowed"
                    else:  # DENY or REJECT
                        return "denied"
        
        # No matching rule found - apply default policy based on direction
        if is_outgoing:
            # Default policy for outgoing: ALLOW
            return "allowed"
        else:
            # Default policy for incoming: DENY
            return "denied"
    
    def parse_tcpdump_line(self, line: str) -> Optional[dict]:
        """
        Parse a tcpdump line and extract packet information.
        Expected format: timestamp proto src > dst: details
        """
        try:
            # tcpdump output format (with -n -l -tt flags):
            # timestamp IP src.port > dst.port: flags data
            
            # Extract timestamp
            timestamp_match = re.match(r'^(\d+\.\d+)\s+', line)
            if not timestamp_match:
                return None
            
            timestamp = float(timestamp_match.group(1))
            dt = datetime.fromtimestamp(timestamp)
            timestamp_str = dt.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
            
            # Extract protocol
            protocol = "Unknown"
            if " IP " in line:
                protocol = "IP"
            if " TCP " in line or ".tcp" in line.lower():
                protocol = "TCP"
            elif " UDP " in line or ".udp" in line.lower():
                protocol = "UDP"
            elif " ICMP " in line or "icmp" in line.lower():
                protocol = "ICMP"
            
            # Extract source and destination
            # Pattern: src_ip.src_port > dst_ip.dst_port
            addr_pattern = r'(\d+\.\d+\.\d+\.\d+)\.(\d+)\s*>\s*(\d+\.\d+\.\d+\.\d+)\.(\d+)'
            addr_match = re.search(addr_pattern, line)
            
            if addr_match:
                src_ip = addr_match.group(1)
                src_port = int(addr_match.group(2))
                dst_ip = addr_match.group(3)
                dst_port = int(addr_match.group(4))
            else:
                # Try without port (for ICMP, etc.)
                addr_pattern_no_port = r'(\d+\.\d+\.\d+\.\d+)\s*>\s*(\d+\.\d+\.\d+\.\d+)'
                addr_match = re.search(addr_pattern_no_port, line)
                if addr_match:
                    src_ip = addr_match.group(1)
                    dst_ip = addr_match.group(2)
                    src_port = None
                    dst_port = None
                else:
                    return None
            
            # Extract packet size (length field)
            size = 0
            size_match = re.search(r'length\s+(\d+)', line)
            if size_match:
                size = int(size_match.group(1))
            
            # Determine direction
            direction = "outgoing" if self.is_outgoing(src_ip, dst_ip) else "incoming"
            
            # Check firewall status
            status = self.check_packet_status(
                protocol, src_ip, dst_ip, src_port, dst_port
            )
            
            packet_info = {
                "timestamp": timestamp_str,
                "protocol": protocol,
                "source": f"{src_ip}:{src_port}" if src_port else src_ip,
                "destination": f"{dst_ip}:{dst_port}" if dst_port else dst_ip,
                "port": dst_port if dst_port else None,
                "size": size,
                "direction": direction,
                "status": status
            }
            
            return packet_info
            
        except Exception as e:
            print(f"Error parsing line: {e}", file=sys.stderr)
            return None
    
    def start_capture(self, interface: Optional[str] = None, packet_count: Optional[int] = None):
        """
        Start capturing packets using tcpdump.
        
        Args:
            interface: Network interface to capture on (None for all)
            packet_count: Number of packets to capture (None for continuous)
        """
        # Get local IPs for direction detection
        self.get_local_ips()
        
        # Load firewall rules
        self.load_firewall_rules()
        
        # Build tcpdump command
        cmd = ["sudo", "tcpdump", "-n", "-l", "-tt"]
        
        if interface:
            cmd.extend(["-i", interface])
        
        if packet_count:
            cmd.extend(["-c", str(packet_count)])
        
        try:
            # Start tcpdump process
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )
            
            # Read and process output line by line
            for line in process.stdout:
                if not self.running:
                    process.terminate()
                    break
                    
                line = line.strip()
                if not line:
                    continue
                
                packet = self.parse_tcpdump_line(line)
                if packet:
                    # Output as JSON
                    asyncio.create_task(ws_manager.broadcast_network_packet(packet))
            
            process.wait()
            
        except Exception as e:
            print(f"Error during capture: {e}", file=sys.stderr)
            sys.exit(1)
    
    def _capture_loop(self, interface: Optional[str], packet_count: Optional[int]):
        """Blocking tcpdump loop — runs in separate thread"""
        self.get_local_ips()
        self.load_firewall_rules()

        cmd = ["sudo", "tcpdump", "-n", "-l", "-tt"]
        if interface:
            cmd.extend(["-i", interface])
        if packet_count:
            cmd.extend(["-c", str(packet_count)])

        print(f"Starting tcpdump: {' '.join(cmd)}", file=sys.stderr)

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
                    asyncio.run_coroutine_threadsafe(
                        ws_manager.broadcast_network_packet(packet),
                        self.loop
                    )

            process.wait()
        except Exception as e:
            print(f"Error during capture: {e}", file=sys.stderr)
        finally:
            self.running = False
            print("Packet capture thread exiting.", file=sys.stderr)

Monitor = PacketMonitor()

# def main():
#     import argparse
    
#     parser = argparse.ArgumentParser(
#         description="Capture network packets and check against UFW firewall rules"
#     )
#     parser.add_argument(
#         "-i", "--interface",
#         help="Network interface to capture on (default: all interfaces)"
#     )
#     parser.add_argument(
#         "-c", "--count",
#         type=int,
#         help="Number of packets to capture (default: continuous)"
#     )
    
#     args = parser.parse_args()
    
#     # Check if tcpdump is installed, install if not
#     if not check_and_install_tcpdump():
#         print("Error: tcpdump is required but could not be installed.", file=sys.stderr)
#         sys.exit(1)
    
#     monitor = PacketMonitor()
#     monitor.start_capture(interface=args.interface, packet_count=args.count)


# if __name__ == "__main__":
#     main()
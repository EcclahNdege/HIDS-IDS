#!/bin/bash

# Network monitoring script for SecureWatch
# This script monitors network activity and can be called by the Python backend

# Function to get active network connections
get_active_connections() {
    echo "=== Active Network Connections ==="
    netstat -tuln | head -20
}

# Function to monitor network traffic
monitor_traffic() {
    echo "=== Network Traffic Monitor ==="
    if command -v iftop &> /dev/null; then
        timeout 10 iftop -t -s 10
    elif command -v nethogs &> /dev/null; then
        timeout 10 nethogs -t
    else
        echo "Installing network monitoring tools..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y iftop nethogs
        elif command -v yum &> /dev/null; then
            sudo yum install -y iftop nethogs
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y iftop nethogs
        fi
    fi
}

# Function to check for suspicious connections
check_suspicious_connections() {
    echo "=== Checking for Suspicious Connections ==="
    
    # Check for connections to unusual ports
    echo "Connections to unusual ports:"
    netstat -an | grep ESTABLISHED | awk '{print $5}' | cut -d: -f2 | sort | uniq -c | sort -nr | head -10
    
    # Check for multiple connections from same IP
    echo ""
    echo "Multiple connections from same IP:"
    netstat -an | grep ESTABLISHED | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -nr | head -10
    
    # Check for listening services
    echo ""
    echo "Listening services:"
    netstat -tlnp 2>/dev/null | grep LISTEN
}

# Function to scan for open ports
port_scan() {
    local target=${1:-localhost}
    echo "=== Port Scan for $target ==="
    
    if command -v nmap &> /dev/null; then
        nmap -sT -O $target
    else
        echo "nmap not found. Installing..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y nmap
        elif command -v yum &> /dev/null; then
            sudo yum install -y nmap
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y nmap
        fi
        nmap -sT -O $target
    fi
}

# Function to check firewall status
check_firewall() {
    echo "=== Firewall Status ==="
    
    # Check iptables
    if command -v iptables &> /dev/null; then
        echo "IPTables rules:"
        sudo iptables -L -n
    fi
    
    # Check ufw (Ubuntu)
    if command -v ufw &> /dev/null; then
        echo ""
        echo "UFW status:"
        sudo ufw status verbose
    fi
    
    # Check firewalld (CentOS/RHEL/Fedora)
    if command -v firewall-cmd &> /dev/null; then
        echo ""
        echo "Firewalld status:"
        sudo firewall-cmd --list-all
    fi
}

# Function to monitor DNS queries
monitor_dns() {
    echo "=== DNS Query Monitor ==="
    
    if command -v tcpdump &> /dev/null; then
        echo "Monitoring DNS queries for 30 seconds..."
        timeout 30 sudo tcpdump -i any -n port 53
    else
        echo "tcpdump not found. Installing..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y tcpdump
        elif command -v yum &> /dev/null; then
            sudo yum install -y tcpdump
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y tcpdump
        fi
        timeout 30 sudo tcpdump -i any -n port 53
    fi
}

# Function to get network interface statistics
get_interface_stats() {
    echo "=== Network Interface Statistics ==="
    cat /proc/net/dev | column -t
}

# Function to check for failed connection attempts
check_failed_connections() {
    echo "=== Failed Connection Attempts ==="
    
    # Check auth.log for failed SSH attempts
    if [[ -f /var/log/auth.log ]]; then
        echo "Recent failed SSH attempts:"
        grep "Failed password" /var/log/auth.log | tail -10
    fi
    
    # Check secure log for failed attempts (CentOS/RHEL)
    if [[ -f /var/log/secure ]]; then
        echo "Recent failed SSH attempts:"
        grep "Failed password" /var/log/secure | tail -10
    fi
}

# Function to generate network report as JSON
generate_network_report() {
    local connections=$(netstat -an | grep ESTABLISHED | wc -l)
    local listening=$(netstat -tln | grep LISTEN | wc -l)
    local interfaces=$(ip link show | grep "state UP" | wc -l)
    
    cat << EOF
{
    "active_connections": $connections,
    "listening_ports": $listening,
    "active_interfaces": $interfaces,
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
}
EOF
}

# Function to block suspicious IP
block_ip() {
    local ip=$1
    if [[ -z "$ip" ]]; then
        echo "Usage: $0 block <IP_ADDRESS>"
        return 1
    fi
    
    echo "Blocking IP: $ip"
    
    # Use iptables to block IP
    if command -v iptables &> /dev/null; then
        sudo iptables -A INPUT -s $ip -j DROP
        echo "IP $ip blocked using iptables"
    fi
    
    # Use ufw if available
    if command -v ufw &> /dev/null; then
        sudo ufw deny from $ip
        echo "IP $ip blocked using ufw"
    fi
}

# Function to unblock IP
unblock_ip() {
    local ip=$1
    if [[ -z "$ip" ]]; then
        echo "Usage: $0 unblock <IP_ADDRESS>"
        return 1
    fi
    
    echo "Unblocking IP: $ip"
    
    # Remove from iptables
    if command -v iptables &> /dev/null; then
        sudo iptables -D INPUT -s $ip -j DROP 2>/dev/null
        echo "IP $ip unblocked from iptables"
    fi
    
    # Remove from ufw
    if command -v ufw &> /dev/null; then
        sudo ufw delete deny from $ip 2>/dev/null
        echo "IP $ip unblocked from ufw"
    fi
}

# Main script logic
case "$1" in
    "connections")
        get_active_connections
        ;;
    "traffic")
        monitor_traffic
        ;;
    "suspicious")
        check_suspicious_connections
        ;;
    "scan")
        port_scan $2
        ;;
    "firewall")
        check_firewall
        ;;
    "dns")
        monitor_dns
        ;;
    "interfaces")
        get_interface_stats
        ;;
    "failed")
        check_failed_connections
        ;;
    "report")
        generate_network_report
        ;;
    "block")
        block_ip $2
        ;;
    "unblock")
        unblock_ip $2
        ;;
    *)
        echo "Usage: $0 {connections|traffic|suspicious|scan|firewall|dns|interfaces|failed|report|block|unblock}"
        echo ""
        echo "Commands:"
        echo "  connections  - Show active network connections"
        echo "  traffic      - Monitor network traffic"
        echo "  suspicious   - Check for suspicious connections"
        echo "  scan [host]  - Port scan (default: localhost)"
        echo "  firewall     - Check firewall status"
        echo "  dns          - Monitor DNS queries"
        echo "  interfaces   - Show network interface statistics"
        echo "  failed       - Check for failed connection attempts"
        echo "  report       - Generate network report as JSON"
        echo "  block <ip>   - Block an IP address"
        echo "  unblock <ip> - Unblock an IP address"
        exit 1
        ;;
esac
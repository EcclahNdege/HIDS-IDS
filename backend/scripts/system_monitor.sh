#!/bin/bash

# System monitoring script for SecureWatch
# This script collects system metrics and can be called by the Python backend

# Function to get CPU usage
get_cpu_usage() {
    # Get CPU usage percentage (1-second average)
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    if [[ -z "$cpu_usage" ]]; then
        # Fallback method using /proc/stat
        cpu_usage=$(grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage}')
    fi
    echo "${cpu_usage:-0}"
}

# Function to get memory usage
get_memory_usage() {
    # Get memory usage percentage
    memory_info=$(free | grep Mem)
    total=$(echo $memory_info | awk '{print $2}')
    used=$(echo $memory_info | awk '{print $3}')
    
    if [[ $total -gt 0 ]]; then
        memory_usage=$(echo "scale=2; $used * 100 / $total" | bc)
    else
        memory_usage=0
    fi
    echo "${memory_usage:-0}"
}

# Function to get disk usage
get_disk_usage() {
    # Get disk usage percentage for root filesystem
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    echo "${disk_usage:-0}"
}

# Function to get network connections
get_network_connections() {
    # Count active network connections
    connections=$(netstat -an 2>/dev/null | grep ESTABLISHED | wc -l)
    echo "${connections:-0}"
}

# Function to get system uptime
get_uptime() {
    # Get system uptime in human readable format
    uptime_seconds=$(cat /proc/uptime | awk '{print int($1)}')
    
    days=$((uptime_seconds / 86400))
    hours=$(((uptime_seconds % 86400) / 3600))
    minutes=$(((uptime_seconds % 3600) / 60))
    
    if [[ $days -gt 0 ]]; then
        echo "${days}d ${hours}h ${minutes}m"
    elif [[ $hours -gt 0 ]]; then
        echo "${hours}h ${minutes}m"
    else
        echo "${minutes}m"
    fi
}

# Function to get load average
get_load_average() {
    # Get 1-minute load average
    load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | xargs)
    echo "${load_avg:-0}"
}

# Function to get process count
get_process_count() {
    # Get total number of processes
    process_count=$(ps aux | wc -l)
    echo "$((process_count - 1))"  # Subtract 1 for header
}

# Function to check disk space alerts
check_disk_alerts() {
    # Check if any filesystem is over 90% full
    df -h | awk 'NR>1 {
        usage = int($5)
        if (usage > 90) {
            print "ALERT: Filesystem " $6 " is " usage "% full"
        }
    }'
}

# Function to check memory alerts
check_memory_alerts() {
    memory_usage=$(get_memory_usage)
    memory_int=$(echo "$memory_usage" | cut -d. -f1)
    
    if [[ $memory_int -gt 90 ]]; then
        echo "ALERT: Memory usage is ${memory_usage}%"
    fi
}

# Function to check CPU alerts
check_cpu_alerts() {
    cpu_usage=$(get_cpu_usage)
    cpu_int=$(echo "$cpu_usage" | cut -d. -f1)
    
    if [[ $cpu_int -gt 90 ]]; then
        echo "ALERT: CPU usage is ${cpu_usage}%"
    fi
}

# Function to get all system metrics as JSON
get_all_metrics() {
    cpu=$(get_cpu_usage)
    memory=$(get_memory_usage)
    disk=$(get_disk_usage)
    connections=$(get_network_connections)
    uptime=$(get_uptime)
    load_avg=$(get_load_average)
    processes=$(get_process_count)
    
    cat << EOF
{
    "cpu_usage": $cpu,
    "memory_usage": $memory,
    "disk_usage": $disk,
    "network_connections": $connections,
    "uptime": "$uptime",
    "load_average": $load_avg,
    "process_count": $processes,
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
}
EOF
}

# Function to run system checks
run_system_checks() {
    echo "=== System Health Check ==="
    echo "Timestamp: $(date)"
    echo ""
    
    echo "CPU Usage: $(get_cpu_usage)%"
    echo "Memory Usage: $(get_memory_usage)%"
    echo "Disk Usage: $(get_disk_usage)%"
    echo "Network Connections: $(get_network_connections)"
    echo "System Uptime: $(get_uptime)"
    echo "Load Average: $(get_load_average)"
    echo "Process Count: $(get_process_count)"
    echo ""
    
    echo "=== Alerts ==="
    check_cpu_alerts
    check_memory_alerts
    check_disk_alerts
    echo ""
}

# Main script logic
case "$1" in
    "cpu")
        get_cpu_usage
        ;;
    "memory")
        get_memory_usage
        ;;
    "disk")
        get_disk_usage
        ;;
    "connections")
        get_network_connections
        ;;
    "uptime")
        get_uptime
        ;;
    "load")
        get_load_average
        ;;
    "processes")
        get_process_count
        ;;
    "json")
        get_all_metrics
        ;;
    "check")
        run_system_checks
        ;;
    *)
        echo "Usage: $0 {cpu|memory|disk|connections|uptime|load|processes|json|check}"
        echo ""
        echo "Commands:"
        echo "  cpu         - Get CPU usage percentage"
        echo "  memory      - Get memory usage percentage"
        echo "  disk        - Get disk usage percentage"
        echo "  connections - Get number of network connections"
        echo "  uptime      - Get system uptime"
        echo "  load        - Get load average"
        echo "  processes   - Get process count"
        echo "  json        - Get all metrics as JSON"
        echo "  check       - Run full system health check"
        exit 1
        ;;
esac
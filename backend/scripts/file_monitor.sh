#!/bin/bash

# File monitoring script for SecureWatch
# This script monitors file system changes and can be called by the Python backend

# Function to monitor file changes using inotify
monitor_files() {
    local watch_path=${1:-"/etc"}
    echo "=== Monitoring file changes in $watch_path ==="
    
    if command -v inotifywait &> /dev/null; then
        inotifywait -m -r -e modify,create,delete,move "$watch_path" --format '%T %w%f %e' --timefmt '%Y-%m-%d %H:%M:%S'
    else
        echo "inotify-tools not found. Installing..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y inotify-tools
        elif command -v yum &> /dev/null; then
            sudo yum install -y inotify-tools
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y inotify-tools
        fi
        inotifywait -m -r -e modify,create,delete,move "$watch_path" --format '%T %w%f %e' --timefmt '%Y-%m-%d %H:%M:%S'
    fi
}

# Function to check file permissions
check_permissions() {
    local file_path=$1
    if [[ -z "$file_path" ]]; then
        echo "Usage: $0 permissions <file_path>"
        return 1
    fi
    
    echo "=== File Permissions for $file_path ==="
    if [[ -e "$file_path" ]]; then
        ls -la "$file_path"
        echo ""
        echo "Detailed permissions:"
        stat "$file_path"
    else
        echo "File or directory does not exist: $file_path"
    fi
}

# Function to find recently modified files
find_recent_changes() {
    local days=${1:-1}
    local search_path=${2:-"/"}
    
    echo "=== Files modified in the last $days day(s) in $search_path ==="
    find "$search_path" -type f -mtime -$days -ls 2>/dev/null | head -50
}

# Function to check for suspicious files
check_suspicious_files() {
    echo "=== Checking for Suspicious Files ==="
    
    # Check for files with unusual permissions
    echo "Files with world-writable permissions:"
    find /etc /usr/bin /usr/sbin -type f -perm -002 2>/dev/null | head -20
    
    echo ""
    echo "SUID/SGID files:"
    find /usr -type f \( -perm -4000 -o -perm -2000 \) -ls 2>/dev/null | head -20
    
    echo ""
    echo "Hidden files in system directories:"
    find /etc /usr/bin /usr/sbin -name ".*" -type f 2>/dev/null | head -20
    
    echo ""
    echo "Recently created executable files:"
    find /tmp /var/tmp -type f -executable -mtime -1 2>/dev/null | head -20
}

# Function to monitor specific file for changes
watch_file() {
    local file_path=$1
    if [[ -z "$file_path" ]]; then
        echo "Usage: $0 watch <file_path>"
        return 1
    fi
    
    echo "=== Watching file: $file_path ==="
    if [[ ! -e "$file_path" ]]; then
        echo "File does not exist: $file_path"
        return 1
    fi
    
    # Get initial checksum
    local initial_checksum=$(md5sum "$file_path" | cut -d' ' -f1)
    echo "Initial checksum: $initial_checksum"
    echo "Monitoring for changes... (Press Ctrl+C to stop)"
    
    while true; do
        sleep 5
        local current_checksum=$(md5sum "$file_path" 2>/dev/null | cut -d' ' -f1)
        if [[ "$current_checksum" != "$initial_checksum" ]]; then
            echo "$(date): File changed! New checksum: $current_checksum"
            initial_checksum=$current_checksum
        fi
    done
}

# Function to create file integrity baseline
create_baseline() {
    local directory=${1:-"/etc"}
    local baseline_file="baseline_$(date +%Y%m%d_%H%M%S).txt"
    
    echo "=== Creating file integrity baseline for $directory ==="
    echo "Baseline file: $baseline_file"
    
    find "$directory" -type f -exec md5sum {} \; > "$baseline_file" 2>/dev/null
    echo "Baseline created with $(wc -l < "$baseline_file") files"
}

# Function to check against baseline
check_baseline() {
    local baseline_file=$1
    if [[ -z "$baseline_file" || ! -f "$baseline_file" ]]; then
        echo "Usage: $0 check-baseline <baseline_file>"
        return 1
    fi
    
    echo "=== Checking against baseline: $baseline_file ==="
    
    local changes=0
    while IFS= read -r line; do
        local checksum=$(echo "$line" | cut -d' ' -f1)
        local filepath=$(echo "$line" | cut -d' ' -f3-)
        
        if [[ -f "$filepath" ]]; then
            local current_checksum=$(md5sum "$filepath" 2>/dev/null | cut -d' ' -f1)
            if [[ "$current_checksum" != "$checksum" ]]; then
                echo "CHANGED: $filepath"
                changes=$((changes + 1))
            fi
        else
            echo "DELETED: $filepath"
            changes=$((changes + 1))
        fi
    done < "$baseline_file"
    
    echo "Total changes detected: $changes"
}

# Function to quarantine suspicious file
quarantine_file() {
    local file_path=$1
    if [[ -z "$file_path" ]]; then
        echo "Usage: $0 quarantine <file_path>"
        return 1
    fi
    
    local quarantine_dir="/var/quarantine"
    sudo mkdir -p "$quarantine_dir"
    
    if [[ -f "$file_path" ]]; then
        local filename=$(basename "$file_path")
        local quarantine_path="$quarantine_dir/${filename}_$(date +%Y%m%d_%H%M%S)"
        
        echo "Quarantining file: $file_path -> $quarantine_path"
        sudo mv "$file_path" "$quarantine_path"
        sudo chmod 000 "$quarantine_path"
        
        echo "File quarantined successfully"
        echo "Original path: $file_path"
        echo "Quarantine path: $quarantine_path"
    else
        echo "File does not exist: $file_path"
        return 1
    fi
}

# Function to restore quarantined file
restore_file() {
    local quarantine_path=$1
    local restore_path=$2
    
    if [[ -z "$quarantine_path" || -z "$restore_path" ]]; then
        echo "Usage: $0 restore <quarantine_path> <restore_path>"
        return 1
    fi
    
    if [[ -f "$quarantine_path" ]]; then
        echo "Restoring file: $quarantine_path -> $restore_path"
        sudo mv "$quarantine_path" "$restore_path"
        sudo chmod 644 "$restore_path"
        echo "File restored successfully"
    else
        echo "Quarantined file does not exist: $quarantine_path"
        return 1
    fi
}

# Function to list quarantined files
list_quarantined() {
    local quarantine_dir="/var/quarantine"
    echo "=== Quarantined Files ==="
    
    if [[ -d "$quarantine_dir" ]]; then
        ls -la "$quarantine_dir"
    else
        echo "No quarantine directory found"
    fi
}

# Function to generate file system report
generate_fs_report() {
    cat << EOF
{
    "disk_usage": {
        "total": "$(df / | tail -1 | awk '{print $2}')",
        "used": "$(df / | tail -1 | awk '{print $3}')",
        "available": "$(df / | tail -1 | awk '{print $4}')",
        "percentage": "$(df / | tail -1 | awk '{print $5}' | sed 's/%//')"
    },
    "inode_usage": {
        "total": "$(df -i / | tail -1 | awk '{print $2}')",
        "used": "$(df -i / | tail -1 | awk '{print $3}')",
        "available": "$(df -i / | tail -1 | awk '{print $4}')",
        "percentage": "$(df -i / | tail -1 | awk '{print $5}' | sed 's/%//')"
    },
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
}
EOF
}

# Main script logic
case "$1" in
    "monitor")
        monitor_files $2
        ;;
    "permissions")
        check_permissions $2
        ;;
    "recent")
        find_recent_changes $2 $3
        ;;
    "suspicious")
        check_suspicious_files
        ;;
    "watch")
        watch_file $2
        ;;
    "baseline")
        create_baseline $2
        ;;
    "check-baseline")
        check_baseline $2
        ;;
    "quarantine")
        quarantine_file $2
        ;;
    "restore")
        restore_file $2 $3
        ;;
    "list-quarantined")
        list_quarantined
        ;;
    "report")
        generate_fs_report
        ;;
    *)
        echo "Usage: $0 {monitor|permissions|recent|suspicious|watch|baseline|check-baseline|quarantine|restore|list-quarantined|report}"
        echo ""
        echo "Commands:"
        echo "  monitor [path]           - Monitor file changes (default: /etc)"
        echo "  permissions <file>       - Check file permissions"
        echo "  recent [days] [path]     - Find recently modified files"
        echo "  suspicious               - Check for suspicious files"
        echo "  watch <file>             - Watch specific file for changes"
        echo "  baseline [path]          - Create file integrity baseline"
        echo "  check-baseline <file>    - Check against baseline"
        echo "  quarantine <file>        - Quarantine suspicious file"
        echo "  restore <qfile> <path>   - Restore quarantined file"
        echo "  list-quarantined         - List quarantined files"
        echo "  report                   - Generate filesystem report as JSON"
        exit 1
        ;;
esac
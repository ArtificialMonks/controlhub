#!/bin/bash

# MCP Connection Wrapper Script
# Provides reliable MCP connections with automatic recovery

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MCP_CONFIG_PRIMARY=".mcp.json"
MCP_CONFIG_BACKUP=".mcp-backup.json"
MCP_HEALTH_CHECK_SCRIPT="scripts/mcp-health-check.ts"
LOG_FILE="logs/mcp-wrapper.log"

# Ensure logs directory exists
mkdir -p logs

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

# Check if required files exist
check_prerequisites() {
    if [[ ! -f "${MCP_CONFIG_PRIMARY}" ]]; then
        log "ERROR" "Primary MCP config not found: ${MCP_CONFIG_PRIMARY}"
        return 1
    fi
    
    if [[ ! -f "${MCP_CONFIG_BACKUP}" ]]; then
        log "WARN" "Backup MCP config not found: ${MCP_CONFIG_BACKUP}"
    fi
    
    if [[ ! -f "${MCP_HEALTH_CHECK_SCRIPT}" ]]; then
        log "WARN" "Health check script not found: ${MCP_HEALTH_CHECK_SCRIPT}"
    fi
    
    return 0
}

# Test MCP server connectivity
test_mcp_connection() {
    local server_name=$1
    log "INFO" "Testing connection to ${server_name}..."
    
    # Try to connect to the MCP server
    local result
    if result=$(timeout 30 claude /mcp status "${server_name}" 2>&1); then
        log "SUCCESS" "${server_name} is responsive"
        return 0
    else
        log "ERROR" "${server_name} connection failed: ${result}"
        return 1
    fi
}

# Reconnect to MCP server with retries
reconnect_mcp_server() {
    local server_name=$1
    local max_attempts=${2:-3}
    local attempt=1
    
    while [[ ${attempt} -le ${max_attempts} ]]; do
        log "INFO" "Reconnection attempt ${attempt}/${max_attempts} for ${server_name}"
        
        if claude /mcp reconnect "${server_name}" 2>/dev/null; then
            log "SUCCESS" "${server_name} reconnected successfully"
            
            # Wait a moment and test the connection
            sleep 2
            if test_mcp_connection "${server_name}"; then
                return 0
            fi
        fi
        
        log "WARN" "Attempt ${attempt} failed, waiting before retry..."
        sleep $((attempt * 2))
        ((attempt++))
    done
    
    log "ERROR" "Failed to reconnect ${server_name} after ${max_attempts} attempts"
    return 1
}

# Switch to backup configuration
switch_to_backup_config() {
    log "INFO" "Switching to backup MCP configuration..."
    
    if [[ ! -f "${MCP_CONFIG_BACKUP}" ]]; then
        log "ERROR" "Backup configuration not available"
        return 1
    fi
    
    # Backup current config
    cp "${MCP_CONFIG_PRIMARY}" "${MCP_CONFIG_PRIMARY}.bak"
    
    # Switch to backup
    cp "${MCP_CONFIG_BACKUP}" "${MCP_CONFIG_PRIMARY}"
    
    # Restart MCP services
    claude /mcp restart
    
    log "SUCCESS" "Switched to backup configuration"
    return 0
}

# Restore primary configuration
restore_primary_config() {
    log "INFO" "Restoring primary MCP configuration..."
    
    if [[ -f "${MCP_CONFIG_PRIMARY}.bak" ]]; then
        cp "${MCP_CONFIG_PRIMARY}.bak" "${MCP_CONFIG_PRIMARY}"
        claude /mcp restart
        log "SUCCESS" "Primary configuration restored"
    else
        log "WARN" "No backup of primary configuration found"
    fi
}

# Optimize system for MCP performance
optimize_system() {
    log "INFO" "Applying system optimizations for MCP..."
    
    # Increase file descriptor limits
    ulimit -n 4096 2>/dev/null || log "WARN" "Could not increase file descriptor limit"
    
    # Set Node.js environment variables for better performance
    export NODE_OPTIONS="--max-old-space-size=4096 --max-http-header-size=65536"
    export UV_THREADPOOL_SIZE=16
    export NODE_HTTP_MAX_HEADER_SIZE=65536
    export NODE_HTTP_TIMEOUT=300000
    
    log "SUCCESS" "System optimizations applied"
}

# Monitor MCP health in background
start_health_monitor() {
    log "INFO" "Starting MCP health monitor..."
    
    if [[ -f "${MCP_HEALTH_CHECK_SCRIPT}" ]]; then
        # Run health monitor in background
        nohup npx tsx "${MCP_HEALTH_CHECK_SCRIPT}" monitor 30000 >> "${LOG_FILE}" 2>&1 &
        local monitor_pid=$!
        echo ${monitor_pid} > logs/mcp-monitor.pid
        
        log "SUCCESS" "Health monitor started (PID: ${monitor_pid})"
    else
        log "WARN" "Health check script not available, skipping monitor"
    fi
}

# Stop health monitor
stop_health_monitor() {
    if [[ -f "logs/mcp-monitor.pid" ]]; then
        local monitor_pid=$(cat logs/mcp-monitor.pid)
        if kill -0 ${monitor_pid} 2>/dev/null; then
            kill ${monitor_pid}
            log "INFO" "Health monitor stopped (PID: ${monitor_pid})"
        fi
        rm -f logs/mcp-monitor.pid
    fi
}

# Main connection establishment function
establish_reliable_connection() {
    log "INFO" "Establishing reliable MCP connections..."
    
    # Apply system optimizations
    optimize_system
    
    # Test primary Supabase MCP connection
    if ! test_mcp_connection "supabase-community-supabase-mcp"; then
        log "WARN" "Primary Supabase MCP connection failed, attempting recovery..."
        
        # Try to reconnect
        if ! reconnect_mcp_server "supabase-community-supabase-mcp" 3; then
            log "WARN" "Could not restore primary connection, switching to backup..."
            switch_to_backup_config
        fi
    fi
    
    # Start health monitoring
    start_health_monitor
    
    log "SUCCESS" "MCP connection setup complete"
}

# Cleanup function
cleanup() {
    log "INFO" "Cleaning up MCP wrapper..."
    stop_health_monitor
    restore_primary_config
}

# Signal handlers
trap cleanup EXIT
trap cleanup SIGINT
trap cleanup SIGTERM

# Main script logic
case "${1:-}" in
    "start")
        check_prerequisites
        establish_reliable_connection
        ;;
    "stop")
        stop_health_monitor
        ;;
    "restart")
        stop_health_monitor
        claude /mcp restart
        establish_reliable_connection
        ;;
    "status")
        log "INFO" "Checking MCP server status..."
        claude /mcp list
        ;;
    "test")
        test_mcp_connection "${2:-supabase-community-supabase-mcp}"
        ;;
    "backup")
        switch_to_backup_config
        ;;
    "restore")
        restore_primary_config
        ;;
    "optimize")
        optimize_system
        ;;
    *)
        echo -e "${BLUE}MCP Connection Wrapper${NC}"
        echo ""
        echo -e "${GREEN}Usage:${NC}"
        echo "  $0 start           # Start reliable MCP connections with monitoring"
        echo "  $0 stop            # Stop health monitoring"
        echo "  $0 restart         # Restart MCP services and monitoring" 
        echo "  $0 status          # Show current MCP server status"
        echo "  $0 test [server]   # Test connection to specific server"
        echo "  $0 backup          # Switch to backup configuration"
        echo "  $0 restore         # Restore primary configuration"
        echo "  $0 optimize        # Apply system optimizations"
        echo ""
        echo -e "${GREEN}Examples:${NC}"
        echo "  $0 start"
        echo "  $0 test supabase-community-supabase-mcp"
        echo "  $0 restart"
        ;;
esac
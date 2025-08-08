#!/bin/bash

# Auto-Monitor Service Startup Script
# Starts the automatic monitoring system that watches for Claude Task tool agent deployments

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/../logs/auto-monitor-hook.pid"
LOG_FILE="$SCRIPT_DIR/../logs/auto-monitor-hook.log"

# Function to start the auto-monitor service
start_service() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "🟡 Auto-Monitor Hook is already running (PID: $(cat $PID_FILE))"
        return 1
    fi

    echo "🚀 Starting Auto-Monitor Hook service..."
    
    # Ensure logs directory exists
    mkdir -p "$(dirname "$PID_FILE")"
    mkdir -p "$(dirname "$LOG_FILE")"

    # Start the auto-monitor hook in background
    nohup npx tsx "$SCRIPT_DIR/auto-monitor-hook.ts" > "$LOG_FILE" 2>&1 &
    
    # Save PID
    echo $! > "$PID_FILE"
    
    echo "✅ Auto-Monitor Hook started successfully (PID: $!)"
    echo "📋 View logs: tail -f $LOG_FILE"
    echo "🛑 Stop service: $SCRIPT_DIR/stop-auto-monitor-service.sh"
}

# Function to stop the auto-monitor service
stop_service() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "🔴 Stopping Auto-Monitor Hook (PID: $PID)..."
            kill "$PID"
            rm -f "$PID_FILE"
            echo "✅ Auto-Monitor Hook stopped successfully"
        else
            echo "⚠️ Auto-Monitor Hook was not running"
            rm -f "$PID_FILE"
        fi
    else
        echo "⚠️ No PID file found - Auto-Monitor Hook may not be running"
    fi
}

# Function to check service status
check_status() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "🟢 Auto-Monitor Hook is running (PID: $(cat $PID_FILE))"
        echo "📊 Active since: $(stat -f "%Sm" "$PID_FILE")"
        return 0
    else
        echo "🔴 Auto-Monitor Hook is not running"
        return 1
    fi
}

# Parse command line arguments
case "$1" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        stop_service
        sleep 2
        start_service
        ;;
    status)
        check_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the Auto-Monitor Hook service"
        echo "  stop    - Stop the Auto-Monitor Hook service"
        echo "  restart - Restart the Auto-Monitor Hook service"
        echo "  status  - Check if the service is running"
        echo ""
        echo "The Auto-Monitor Hook automatically detects when agents are deployed"
        echo "via Claude's Task tool and starts continuous monitoring with intervention."
        exit 1
        ;;
esac
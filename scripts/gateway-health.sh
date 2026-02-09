#!/bin/bash
# OpenClaw Gateway Health Check & Auto-Recovery
# Checks if gateway is running and attempts to restart if needed

GATEWAY_URL="http://127.0.0.1:18789"
LOG_FILE="$HOME/.openclaw/backups/gateway-health.log"

log_message() {
    echo "[$(date)] $1" >> "$LOG_FILE"
}

log_message "🔍 Starting gateway health check..."

# Function to check if gateway is running
check_gateway() {
    if curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL" | grep -q "200\|404"; then
        log_message "✅ Gateway is running"
        return 0
    else
        log_message "❌ Gateway is NOT running"
        return 1
    fi
}

# Function to restart gateway
restart_gateway() {
    log_message "🔄 Attempting to restart gateway..."

    # Try using openclaw command first
    if command -v openclaw &> /dev/null; then
        openclaw gateway restart >> "$LOG_FILE" 2>&1
        # Wait for restart
        sleep 5

        # Check if gateway is now running
        if check_gateway; then
            log_message "✅ Gateway restarted successfully"
            return 0
        else
            log_message "❌ Gateway restart failed via openclaw command"
        fi
    else
        log_message "❌ openclaw command not found"
    fi

    return 1
}

# Function to send alert notification
send_alert() {
    MESSAGE="⚠️ OpenClaw Gateway Alert: $1"
    log_message "📢 ALERT: $1"
    # Could add webhook, email, or other notification here
}

# Main health check
if check_gateway; then
    log_message "✅ Gateway health check passed"
    exit 0
fi

# Gateway is not running - attempt recovery
log_message "🚨 Gateway recovery initiated"

# Attempt to restart
if restart_gateway; then
    send_alert "Gateway was down but has been restarted successfully"
    log_message "✅ Gateway recovery successful"
    exit 0
else
    send_alert "Gateway is down and automatic recovery failed. Manual intervention required."
    log_message "❌ Gateway recovery failed - manual intervention required"
    exit 1
fi
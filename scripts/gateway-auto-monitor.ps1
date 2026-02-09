# Gateway Auto-Monitor & Restart Script
# Created: 2026-02-04
# Purpose: Automatically monitor and restart OpenClaw Gateway if it goes offline
# No special permissions needed - just run it!

param(
    [int]$CheckInterval = 30,  # Check every 30 seconds
    [string]$GatewayUrl = "http://127.0.0.1:18789",
    [string]$LogFile = "C:\Users\Karan\.openclaw\logs\gateway-auto-monitor.log"
)

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp][$Level] $Message"
    Add-Content -Path $LogFile -Value $logMessage
    Write-Host $logMessage
}

function Test-Gateway {
    try {
        # Use curl.exe for more reliable HTTP checks
        $result = curl.exe -s -w "%{http_code}" $GatewayUrl 2>&1
        $lastLine = ($result -split "`n") | Select-Object -Last 1
        return $lastLine -eq "200"
    } catch {
        return $false
    }
}

function Restart-Gateway {
    Write-Log "Gateway is OFFLINE. Attempting to restart..." "WARNING"

    try {
        # Try standard restart first
        Write-Log "Attempting standard restart via openclaw CLI..." "INFO"
        $result = & openclaw gateway restart 2>&1
        Write-Log "Standard restart executed: $result" "INFO"

        # Wait and check
        Start-Sleep -Seconds 10

        if (Test-Gateway) {
            Write-Log "✅ Gateway successfully restarted via CLI!" "SUCCESS"
            return $true
        }

        # If standard restart failed, try hard restart
        Write-Log "Standard restart failed. Trying hard restart..." "WARNING"
        $hardRestartPath = Join-Path $PSScriptRoot "gateway-hard-restart.ps1"

        if (Test-Path $hardRestartPath) {
            $result = & $hardRestartPath 2>&1
            Write-Log "Hard restart executed: $result" "INFO"
            Start-Sleep -Seconds 5
        }

        if (Test-Gateway) {
            Write-Log "✅ Gateway successfully restarted via hard restart!" "SUCCESS"
            return $true
        } else {
            Write-Log "❌ Gateway still offline after both restart attempts" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Failed to restart gateway: $_" "ERROR"
        return $false
    }
}

# Ensure log directory exists
$logDir = Split-Path -Parent $LogFile
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# Main monitoring loop
Write-Log "Gateway Auto-Monitor started"
Write-Log "Gateway URL: $GatewayUrl"
Write-Log "Check Interval: $CheckInterval seconds"
Write-Log "Log File: $LogFile"
Write-Log "=" * 60

$consecutiveOfflineCount = 0
$maxRetries = 3

while ($true) {
    if (Test-Gateway) {
        Write-Log "✅ Gateway is ONLINE"
        $consecutiveOfflineCount = 0
    } else {
        $consecutiveOfflineCount++
        Write-Log "⚠️ Gateway is OFFLINE (Attempt $consecutiveOfflineCount/$maxRetries)" "WARNING"

        if ($consecutiveOfflineCount -ge $maxRetries) {
            Write-Log "Gateway offline for $maxRetries consecutive checks. Restarting..." "ERROR"
            Restart-Gateway
            $consecutiveOfflineCount = 0
            Write-Log "Resetting offline counter after restart attempt" "INFO"
        }
    }

    Write-Log "Next check in $CheckInterval seconds..."
    Start-Sleep -Seconds $CheckInterval
}
# Gateway Auto-Restart Monitor
# Continuously monitors OpenClaw Gateway and auto-restarts on failure
# Runs as Windows Startup Service

param(
    [int]$CheckIntervalSeconds = 60,
    [string]$GatewayUrl = "http://127.0.0.1:18789",
    [string]$LogPath = "C:\Users\Karan\.openclaw\logs\gateway-auto-restart.log",
    [switch]$TelegramAlerts = $true
)

# Ensure log directory exists
$logDir = Split-Path $LogPath
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logLine = "[$timestamp] [$Level] $Message"
    Add-Content -Path $LogPath -Value $logLine
    Write-Host $logLine
}

function Send-TelegramAlert {
    param([string]$Message)
    if ($TelegramAlerts) {
        try {
            # Use OpenClaw CLI to send message instead of REST API
            $escapedMessage = $Message -replace '"', '\"'
            $result = & openclaw message send --channel telegram --target 8284494839 --message $escapedMessage 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Telegram alert sent: $Message"
            } else {
                Write-Log "OpenClaw CLI returned error: $result" -Level "WARN"
            }
        } catch {
            Write-Log "Failed to send Telegram alert: $($_.Exception.Message)" -Level "WARN"
        }
    }
}

function Test-Gateway {
    try {
        $response = Invoke-WebRequest -Uri "$GatewayUrl/healthz" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            return $true
        }
        return $false
    } catch {
        return $false
    }
}

function Stop-Gateway {
    try {
        openclaw gateway stop 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        Write-Log "Gateway stopped" -Level "INFO"
    } catch {
        Write-Log "Error stopping gateway: $($_.Exception.Message)" -Level "WARN"
    }
}

function Start-Gateway {
    try {
        openclaw gateway start 2>&1 | Out-Null
        Start-Sleep -Seconds 5
        Write-Log "Gateway start command executed" -Level "INFO"
    } catch {
        Write-Log "Error starting gateway: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
    return $true
}

function Restart-Gateway {
    Write-Log "Gateway is down, attempting restart..." -Level "WARN"
    $alertMsg = "[GATEWAY MONITOR] Gateway is down, restarting..."

    Stop-Gateway
    Start-Sleep -Seconds 2

    if (Start-Gateway) {
        Start-Sleep -Seconds 5
        if (Test-Gateway) {
            Write-Log "Gateway successfully restarted!" -Level "INFO"
            $alertMsg += " SUCCESS - Gateway is back online"
            Send-TelegramAlert -Message $alertMsg
            return $true
        } else {
            Write-Log "Gateway restart failed - not responding" -Level "ERROR"
            $alertMsg += " FAILED - Gateway not responding after restart"
            Send-TelegramAlert -Message $alertMsg
            return $false
        }
    } else {
        Write-Log "Gateway restart failed" -Level "ERROR"
        $alertMsg += " FAILED - Could not restart gateway"
        Send-TelegramAlert -Message $alertMsg
        return $false
    }
}

# Main loop
Write-Log "=== Gateway Auto-Restart Monitor Started ==="
Write-Log "Gateway URL: $GatewayUrl"
Write-Log "Check interval: $CheckIntervalSeconds seconds"
Write-Log "Telegram alerts: $TelegramAlerts"

$lastStatus = $null
$failureCount = 0
$maxRetries = 3

try {
    while ($true) {
        $gatewayRunning = Test-Gateway

        if ($gatewayRunning) {
            if ($lastStatus -ne $true) {
                Write-Log "Gateway is online" -Level "INFO"
                $failureCount = 0
            }
            $lastStatus = $true
        } else {
            Write-Log "Gateway is DOWN" -Level "WARN"
            $failureCount++

            if ($failureCount -ge $maxRetries) {
                Write-Log "Gateway failed $failureCount consecutive checks, restarting..." -Level "WARN"
                $restartResult = Restart-Gateway
                if ($restartResult) {
                    $failureCount = 0
                    $lastStatus = $true
                } else {
                    $lastStatus = $false
                }
            }
        }

        Start-Sleep -Seconds $CheckIntervalSeconds
    }
} catch {
    Write-Log "MONITOR CRASHED: $($_.Exception.Message)" -Level "ERROR"
    Write-Log "Stack trace: $($_.ScriptStackTrace)" -Level "ERROR"
    Send-TelegramAlert -Message "[GATEWAY MONITOR] CRASHED - Manual intervention required! Error: $($_.Exception.Message)"
}

Write-Log "=== Gateway Auto-Restart Monitor Stopped ==="
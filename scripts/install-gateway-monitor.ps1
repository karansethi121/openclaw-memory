# Install Gateway Auto-Restart Monitor as Windows Startup Task

$taskName = "OpenClaw Gateway Auto-Restart Monitor"
$scriptPath = "C:\Users\Karan\.openclaw\scripts\start-gateway-monitor.bat"
$monitorScript = "C:\Users\Karan\.openclaw\workspace\scripts\gateway-auto-restart.ps1"

Write-Host "[GATEWAY MONITOR INSTALLER]"
Write-Host "Installing auto-restart monitor as Windows Startup Task..." -ForegroundColor Green

# Check if script exists
if (-not (Test-Path $scriptPath)) {
    Write-Host "ERROR: Batch file not found at $scriptPath" -ForegroundColor Red
    exit 1
}

# Remove existing task if it exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Removing existing task..."
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create the scheduled task
$trigger = New-ScheduledTaskTrigger -AtStartup
$action = New-ScheduledTaskAction -Execute $scriptPath
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -DontStopOnIdleEnd -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName $taskName -Trigger $trigger -Action $action -Settings $settings -RunLevel Highest -Force | Out-Null

Write-Host "Scheduled task created: $taskName" -ForegroundColor Green

# Start the monitor immediately
Write-Host "Starting gateway monitor now..."
Start-Process powershell -WindowStyle Hidden -ArgumentList "-ExecutionPolicy Bypass -File `"$monitorScript`""

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "The gateway monitor will:"
Write-Host "  - Run automatically at Windows startup"
Write-Host "  - Check gateway health every 60 seconds"
Write-Host "  - Auto-restart if gateway crashes"
Write-Host "  - Send Telegram alerts on failures and restarts"
Write-Host ""
Write-Host "Check logs: C:\Users\Karan\.openclaw\logs\gateway-auto-restart.log"
# System Monitoring Script
# Monitors system resources and alerts on thresholds

param(
    [int]$CheckIntervalSeconds = 60,

    [int]$CPUThreshold = 80,

    [int]$MemoryThreshold = 85,

    [switch]$OneTime
)

function Get-MemoryPercent {
    $os = Get-CimInstance Win32_OperatingSystem
    $totalMemory = $os.TotalVisibleMemorySize
    $freeMemory = $os.FreePhysicalMemory
    $usedMemory = $totalMemory - $freeMemory
    return [math]::Round(($usedMemory / $totalMemory) * 100, 2)
}

function Get-CPUUsage {
    $cpu = Get-CimInstance Win32_Processor
    return $cpu.LoadPercentage
}

function Get-DiskUsage {
    $systemDrive = Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DeviceID -eq "C:" }
    $usedSpace = $systemDrive.Size - $systemDrive.FreeSpace
    $percentUsed = [math]::Round(($usedSpace / $systemDrive.Size) * 100, 2)
    return @{
        Drive = "C:"
        PercentUsed = $percentUsed
        FreeSpaceGB = [math]::Round($systemDrive.FreeSpace / 1GB, 2)
        SizeGB = [math]::Round($systemDrive.Size / 1GB, 2)
    }
}

function Get-Timestamp {
    return Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Timestamp
    Write-Output "[$timestamp] $Message"
}

if ($OneTime) {
    Write-Log "=== System Status Check ==="
    $cpu = Get-CPUUsage
    $memory = Get-MemoryPercent
    $disk = Get-DiskUsage

    Write-Log "CPU Usage: $cpu%"
    Write-Log "Memory Usage: $memory%"
    Write-Log "Disk Usage: $($disk.PercentUsed)% (Free: $($disk.FreeSpaceGB)GB / Total: $($disk.SizeGB)GB)"

    $alerts = @()
    if ($cpu -gt $CPUThreshold) { $alerts += "High CPU usage: $cpu%" }
    if ($memory -gt $MemoryThreshold) { $alerts += "High memory usage: $memory%" }

    if ($alerts.Count -gt 0) {
        Write-Log "!!! ALERTS !!!"
        foreach ($alert in $alerts) {
            Write-Log "  - $alert"
        }
    } else {
        Write-Log "System status: Normal"
    }
} else {
    Write-Log "Starting continuous monitoring (Ctrl+C to stop):"
    Write-Log "Check interval: $CheckIntervalSeconds seconds"
    Write-Log "CPU Threshold: $CPUThreshold%"
    Write-Log "Memory Threshold: $MemoryThreshold%"

    while ($true) {
        $cpu = Get-CPUUsage
        $memory = Get-MemoryPercent

        $alert = $false

        if ($cpu -gt $CPUThreshold) {
            Write-Log "⚠️ Alert: High CPU usage ($cpu%)"
            $alert = $true
        }

        if ($memory -gt $MemoryThreshold) {
            Write-Log "⚠️ Alert: High memory usage ($memory%)"
            $alert = $true
        }

        if (-not $alert) {
            Write-Log "CPU: $cpu% | Memory: $memory% - Normal"
        }

        Start-Sleep -Seconds $CheckIntervalSeconds
    }
}
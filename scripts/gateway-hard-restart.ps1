# Gateway Hard Restart Script
# More aggressive restart - kills old processes and starts fresh

function Stop-Gateway {
    Write-Host "Stopping any existing gateway processes..."

    # Kill any node processes running openclaw gateway
    Get-Process | Where-Object {
        $_.ProcessName -eq "node" -and $_.MainWindowTitle -like "*openclaw*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue

    # Kill any openclaw processes
    Get-Process | Where-Object { $_.ProcessName -eq "openclaw" } | Stop-Process -Force -ErrorAction SilentlyContinue

    Start-Sleep -Seconds 2
}

function Start-Gateway {
    Write-Host "Starting OpenClaw Gateway..."

    $openclawPath = "$env:APPDATA\npm\node_modules\openclaw\dist\index.js"

    if (Test-Path $openclawPath) {
        # Start gateway in background
        Start-Process powershell -ArgumentList "-NoProfile", "-ExecutionPolicy Bypass", "-Command", "node '$openclawPath' gateway --port 18789" -WindowStyle Hidden

        Write-Host "Gateway started. Waiting 10 seconds for initialization..."
        Start-Sleep -Seconds 10

        # Check if online
        $maxAttempts = 6
        $attempt = 1

        do {
            try {
                $response = Invoke-WebRequest -Uri "http://127.0.0.1:18789" -UseBasicProgramming -TimeoutSec 3
                if ($response.StatusCode -eq 200) {
                    Write-Host "✅ Gateway is now ONLINE!" -ForegroundColor Green
                    return $true
                }
        do {
            $result = curl.exe -s -w "%{http_code}" "http://127.0.0.1:18789" 2>&1
            $statusCode = ($result -split "`n") | Select-Object -Last 1

            if ($statusCode -eq "200") {
                Write-Host "✅ Gateway is now ONLINE!" -ForegroundColor Green
                return $true
            }

            Write-Host "Attempt ${attempt}/${maxAttempts}: Gateway not responding yet..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
            $attempt++
        } while ($attempt -le $maxAttempts)

        Write-Host "❌ Gateway failed to come online" -ForegroundColor Red
        return $false
    } else {
        Write-Host "Error: Could not find OpenClaw at $openclawPath" -ForegroundColor Red
        return $false
    }
}

# Execute restart
Write-Host "Starting Gateway Hard Restart..." -ForegroundColor Cyan
Write-Host "=" * 60

Stop-Gateway
Start-Gateway

Write-Host "=" * 60
Write-Host "Restart complete. Checking status..."
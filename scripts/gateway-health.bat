@echo off
REM OpenClaw Gateway Health Check & Auto-Recovery (Windows)

set GATEWAY_URL=http://127.0.0.1:18789
set LOG_FILE=%USERPROFILE%\.openclaw\backups\gateway-health.log

echo [%date% %time%] Starting gateway health check... >> "%LOG_FILE%"

REM Function-like check for gateway status
powershell -Command "try { $response = Invoke-WebRequest -Uri '%GATEWAY_URL%' -UseBasicParsing -TimeoutSec 5; exit 0 } catch { exit 1 }"
if %errorlevel% equ 0 (
    echo [%date% %time%] Gateway is running >> "%LOG_FILE%"
    echo Gateway is running
    exit /b 0
) else (
    echo [%date% %time%] Gateway is NOT running >> "%LOG_FILE%"
    echo Gateway is NOT running
    echo.
    echo Attempting to restart gateway...

    REM Try to restart gateway
    openclaw gateway restart >> "%LOG_FILE%" 2>&1

    REM Wait for restart
    timeout /t 5 /nobreak

    REM Check again
    powershell -Command "try { $response = Invoke-WebRequest -Uri '%GATEWAY_URL%' -UseBasicParsing -TimeoutSec 5; exit 0 } catch { exit 1 }"
    if %errorlevel% equ 0 (
        echo [%date% %time%] Gateway restarted successfully >> "%LOG_FILE%"
        echo Gateway restarted successfully
        exit /b 0
    ) else (
        echo [%date% %time%] Gateway restart failed - manual intervention required >> "%LOG_FILE%"
        echo Gateway restart failed - manual intervention required
        exit /b 1
    )
)
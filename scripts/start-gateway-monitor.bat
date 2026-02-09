@echo off
REM Gateway Auto-Monitor - Start Script
REM Double-click this file to start the monitor

echo Starting Gateway Auto-Monitor...
echo Checking if gateway is online...
curl -s http://127.0.0.1:18789 >nul 2>&1
if %errorlevel% equ 0 (
    echo Gateway is online
) else (
    echo Gateway is offline - will attempt restart
)

echo.
echo Press Ctrl+C to stop the monitor
echo Logs saved to: C:\Users\Karan\.openclaw\logs\gateway-auto-monitor.log
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0gateway-auto-monitor.ps1"
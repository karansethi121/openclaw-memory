@echo off
REM OpenClaw Backup Script - Daily Automated Backup (Windows)
REM Creates backups of memory, sessions, config, and workspace files

set BACKUP_DIR=%USERPROFILE%\.openclaw\backups
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do (set DATE=%%c-%%a-%%b)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set TIME=%%a-%%b)
set TIME=%TIME::=-%
set BACKUP_NAME=backup_%DATE%_%TIME%
set CURRENT_BACKUP=%BACKUP_DIR%\%BACKUP_NAME%

echo Starting OpenClaw backup...
echo Date: %date% %time%
echo Backup location: %CURRENT_BACKUP%
echo.

REM Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%CURRENT_BACKUP%" mkdir "%CURRENT_BACKUP%"

REM Backup memory files
echo Backing up memory files...
xcopy "%USERPROFILE%\.openclaw\workspace\memory" "%CURRENT_BACKUP%\memory\" /E /I /Y /Q 2>nul

REM Backup sessions
echo Backing up sessions...
if not exist "%CURRENT_BACKUP%\sessions" mkdir "%CURRENT_BACKUP%\sessions"
copy "%USERPROFILE%\.openclaw\agents\main\sessions\*.jsonl" "%CURRENT_BACKUP%\sessions\" /Y 2>nul
copy "%USERPROFILE%\.openclaw\agents\main\sessions\sessions.json" "%CURRENT_BACKUP%\sessions\" /Y 2>nul

REM Backup config
echo Backing up config...
copy "%USERPROFILE%\.openclaw\openclaw.json" "%CURRENT_BACKUP%\" /Y 2>nul

REM Backup workspace
echo Backing up workspace...
if not exist "%CURRENT_BACKUP%\workspace" mkdir "%CURRENT_BACKUP%\workspace"
if exist "%USERPROFILE%\.openclaw\workspace\one4health-website" xcopy "%USERPROFILE%\.openclaw\workspace\one4health-website" "%CURRENT_BACKUP%\workspace\one4health-website\" /E /I /Y /Q
if exist "%USERPROFILE%\.openclaw\workspace\research" xcopy "%USERPROFILE%\.openclaw\workspace\research" "%CURRENT_BACKUP%\workspace\research\" /E /I /Y /Q
if exist "%USERPROFILE%\.openclaw\workspace\brand" xcopy "%USERPROFILE%\.openclaw\workspace\brand" "%CURRENT_BACKUP%\workspace\brand\" /E /I /Y /Q
copy "%USERPROFILE%\.openclaw\workspace\IDENTITY.md" "%CURRENT_BACKUP%\workspace\" /Y 2>nul
copy "%USERPROFILE%\.openclaw\workspace\SOUL.md" "%CURRENT_BACKUP%\workspace\" /Y 2>nul
copy "%USERPROFILE%\.openclaw\workspace\USER.md" "%CURRENT_BACKUP%\workspace\" /Y 2>nul

REM Create backup manifest
echo Creating backup manifest...
(
    echo === OpenClaw Backup Manifest ===
    echo Date: %date% %time%
    echo Backup Location: %CURRENT_BACKUP%
    echo.
    echo === Memory Files ===
    dir /B "%CURRENT_BACKUP%\memory" 2>nul
    echo.
    echo === Session Files ===
    dir /B "%CURRENT_BACKUP%\sessions" 2>nul
    echo.
    echo === Workspace ===
    dir /B "%CURRENT_BACKUP%\workspace" 2>nul
) > "%CURRENT_BACKUP%\MANIFEST.txt"

REM Compress backup
echo Compressing backup...
cd /d "%BACKUP_DIR%"
powershell -Command "Compress-Archive -Path '%BACKUP_NAME%' -DestinationPath '%BACKUP_NAME%.zip' -Force"
rmdir /S /Q "%BACKUP_NAME%"

REM Show backup size
for %%F in ("%BACKUP_DIR%\%BACKUP_NAME%.zip") do set SIZE=%%~zF
set /a SIZE_MB=%SIZE% / 1048576

REM Cleanup old backups (keep last 30 days)
echo Cleaning up old backups...
forfiles /P "%BACKUP_DIR%" /M backup_*.zip /D -30 /C "cmd /c del @path" 2>nul

REM Count backup files
for /f %%C in ('dir /B "%BACKUP_DIR%\backup_*.zip" 2^>nul ^| find /c /v ""') do set BACKUP_COUNT=%%C

echo.
echo Backup completed!
echo Archive: %BACKUP_DIR%\%BACKUP_NAME%.zip
echo Size: ~%SIZE_MB% MB
echo Total backups: %BACKUP_COUNT%
echo.
echo === Backup Summary ===
echo Memory files backed up
echo Sessions backed up
echo Configuration backed up
echo Workspace backed up
echo Manifest created
echo Old backups cleaned up (30-day retention)
# Local Task Assistant - Skill Package

## About

A general-purpose task automation agent that combines web capabilities with local system control for seamless task execution.

## What It Does

- **Web Research**: Search the web and gather information
- **Browser Automation**: Control web browsers, fill forms, take screenshots
- **File Operations**: Batch file processing, search, organize
- **System Commands**: Execute scripts, manage processes
- **Task Automation**: Chain operations, schedule recurring tasks
- **Monitoring**: Watch resources, alert on thresholds

## Included Scripts

### `scripts/web-research.ps1`
Automated web research tool that can search, fetch, and summarize web content.

**Usage:**
```powershell
.\web-research.ps1 -SearchQuery "topic here" -ResultCount 5 -OutputPath "output.md"
```

### `scripts/file-utility.ps1`
Batch file operations for list, copy, delete, rename, and archive.

**Usage:**
```powershell
# List files
.\file-utility.ps1 -Operation list -SourcePath "C:\Path" -Pattern "*.md"

# Copy files (dry run first)
.\file-utility.ps1 -Operation copy -SourcePath "C:\Source" -TargetPath "C:\Target" -DryRun

# Delete matching files
.\file-utility.ps1 -Operation delete -SourcePath "C:\Path" -Pattern "*.tmp" -Recurse
```

### `scripts/system-monitor.ps1`
Monitor CPU, memory, and disk usage with alerting.

**Usage:**
```powershell
# One-time check
.\system-monitor.ps1 -OneTime

# Continuous monitoring
.\system-monitor.ps1 -CheckIntervalSeconds 60 -CPUThreshold 80
```

### `scripts/browser-automation.ps1`
Template for browser automation workflows.

**Usage:**
```powershell
.\browser-automation.ps1 -Action open -Url "https://example.com"
.\browser-automation.ps1 -Action click -Selector "#button-id"
.\browser-automation.ps1 -Action type -Selector "#input-id" -Text "Hello"
```

## How OpenClaw Uses This Skill

When you ask for tasks like:
- "Search for X and summarize"
- "Organize all PDFs in my Downloads folder"
- "Monitor my system for high CPU usage"
- "Automate logging into this website and downloading reports"

OpenClaw loads this skill and uses the bundled scripts and tools to execute your request efficiently.

## Configuration

No configuration needed by default. For custom behavior:
- Scripts accept parameters for customization
- Modify thresholds in system-monitor.ps1
- Set custom paths in file-utility.ps1

## Security notes

- Scripts use safe operations (no hidden deletes)
- DryRun mode available for destructive operations
- Logs provide audit trail
- User confirmation is requested for critical operations
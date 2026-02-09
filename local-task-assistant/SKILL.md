---
name: local-task-assistant
description: General-purpose task automation agent for local machine operations, web research, and browser automation. Use when the user needs help with: (1) searching the web and gathering information, (2) controlling web browsers for automated tasks, (3) file system operations and file management, (4) executing system commands and scripts, (5) automating repetitive local tasks, (6) research and data collection from websites, (7) taking screenshots or capturing web content, or any task requiring web access and local system automation.
---

# Local Task Assistant

A general-purpose automation agent that combines web capabilities with local system control for seamless task execution.

## Core Capabilities

### Web Research & Search
- Conduct targeted web searches using Brave Search API
- Extract readable content from web pages
- Gather information from multiple sources
- Compile research into summaries or reports

### Browser Automation
- Navigate to websites and perform actions
- Fill forms, click buttons, interact with page elements
- Take screenshots of web pages
- Extract data from web pages (scraping)
- Monitor website changes

### File System Operations
- Create, read, edit, delete files
- Search for files by name or content
- Copy, move, rename files and directories
- Archive and compress files
- Batch file operations

### System Commands
- Execute PowerShell, CMD, or Bash scripts
- Run installed applications
- Manage Windows services and processes
- Schedule tasks via Windows Task Scheduler or cron
- Check system status and resources

### Task Automation
- Chain multiple operations together
- Create automation scripts
- Schedule recurring tasks
- Monitor and respond to system events
- Generate reports from system data

## Tool Integration

### Web Search (web_search)
Use the web_search tool for information gathering:

```
web_search(query="search terms", count=5, country="US")
```

### Web Fetch (web_fetch)
Use web_fetch to extract readable content from URLs:

```
web_fetch(url="https://example.com", extractMode="markdown", maxChars=5000)
```

### Browser Control (browser)
Use browser tool for direct interaction:

- **Tabs**: List, open, close, or switch browser tabs
- **Navigate**: Go to URLs, handle page loads
- **Snapshot**: Get page structure for analysis
- **Act**: Click, type, hover, select elements
- **Screenshot**: Capture full page or element as image

### Execute Commands (exec)
Use exec tool for system operations with proper escaping:

```bash
# For Windows
exec(command='dir "C:\Path\To\Directory"')

# For complex commands, use PowerShell script files
exec(command='powershell -File "script.ps1"')
```

### Manage Processes (process)
Control background exec sessions for long-running tasks:

```
process(action="list")        # List all sessions
process(action="poll", sessionId="xyz")  # Check status
process(action="kill", sessionId="xyz")   # Stop a session
```

## Common Workflows

### Web Research Task
1. Search for topic with web_search
2. Open relevant pages with browser.open or web_fetch
3. Extract key information
4. Compile findings into summary
5. Save result to file if needed

### Batch File Processing
1. List files in directory
2. Filter by name pattern or extension
3. For each file:
   - Read or process file
   - Apply transformation
   - Write output
4. Log operations and results

### Automated Form Submission
1. browser.open(targetUrl="https://site.com/form")
2. browser.snapshot() to see form elements
3. browser.act to fill in text fields
4. browser.act to submit form
5. browser.screenshot() to capture result

## Best Practices

### Error Handling
- Wrap file operations in try-catch blocks
- Check if files/directories exist before operations
- Log errors for debugging
- Provide meaningful error messages to user

### Communication
- Send progress updates via Telegram for long tasks
- Confirm before destructive operations (delete, overwrite)
- Provide clear summaries of completed tasks
- Ask for clarification on ambiguous requests

### Resource Management
- Close browser tabs when done
- Clean up temporary files
- Stop long-running background processes
- Monitor disk space for large operations

### Security
- Don't expose sensitive data in logs
- Confirm before executing commands that modify system
- Be careful with file paths (escape properly)
- Don't send private credentials in messages

## Task Examples

**"Search for information about X and summarize"**
- Use web_search with topic query
- Fetch promising results with web_fetch
- Compile information into summary
- Save to file if requested

**"Automate logging into website Y and downloading report"**
- browser.open to login page
- Fill in credentials (ask for them)
- Navigate to report page
- Download file
- Confirm completion

**"Find all .md files in folder and combine into one"**
- exec(command) to find files
- Read each file with read tool
- Concatenate content
- Write combined file

**"Monitor website for changes and alert me"**
- Take baseline snapshot with browser.snapshot
- Set up periodic checks via cron
- Compare snapshots
- Alert on changes via Telegram

## When to Escalate

Escalate to human when:
- Task requires authentication with unknown credentials
- Operation would make irreversible changes
- User's request is ambiguous or conflicting
- Task requires decisions based on subjective criteria
- System resource limits would be exceeded

## Configuration

No configuration required by default. For automation requiring persistence:

- Store settings in workspace/config/
- Use JSON or YAML for structured data
- Document any required API keys or tokens
- Provide clear setup instructions

## Limitations

- Cannot access websites behind VPNs without special configuration
- May need credentials for authenticated websites
- Some websites actively block automation
- Resource-intensive operations may impact system performance
- Cannot interact with GUI applications that require focus
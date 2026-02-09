# Telegram Task Dashboard for OpenClaw
# Handles task management via Telegram commands

param(
    [Parameter(Mandatory=$true)]
    [string]$Command,
    
    [string]$Argument = "",
    [string]$Argument2 = ""
)

$configPath = "C:\Users\Karan\.openclaw\workspace\config\tasks.json"
$logPath = "C:\Users\Karan\.openclaw\workspace\logs\task-dashboard.log"
$workspacePath = "C:\Users\Karan\.openclaw\workspace"

$logDir = Split-Path $logPath
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

if (-not (Test-Path $logPath)) {
    "" | Out-File -FilePath $logPath -Encoding UTF8
}

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp | $Message" | Out-File -FilePath $logPath -Append -Encoding UTF8
}

function Get-TasksConfig {
    if (-not (Test-Path $configPath)) {
        $defaultConfig = @{
            todos = @()
            nextId = 1
            logFilePath = $logPath
            gitCommitLogPath = "C:\Users\Karan\.openclaw\logs\git-auto-commit.log"
            workspace = $workspacePath
        }
        $defaultConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $configPath -Encoding UTF8
        return $defaultConfig
    }
    return Get-Content $configPath | ConvertFrom-Json
}

function Save-TasksConfig {
    param($Config)
    $Config | ConvertTo-Json -Depth 10 | Out-File -FilePath $configPath -Encoding UTF8
}

function Format-TodoList {
    param([array]$Todos)
    Write-Log "Format-TodoList: Count = $($Todos.Count), Type = $($Todos.GetType().Name)"
    if ($Todos.Count -eq 0) {
        return "No todos yet. Use /todo add <task> to create one."
    }

    Write-Log "Todos[0].status = $($Todos[0].status)"
    Write-Log "Todos[1].status = $($Todos[1].status)"

    $output = "TODO LIST`n`n"
    $pending = $Todos | Where-Object { $_.status -eq "pending" }
    $done = $Todos | Where-Object { $_.status -eq "done" }

    Write-Log "Pending count = $($pending.Count)"
    Write-Log "Done count = $($done.Count)"
    if ($pending.Count -gt 0) {
        $output += "Pending:`n"
        foreach ($todo in $pending) {
            $dateCreated = [DateTime]$todo.created
            $timeAgo = Get-TimeAgo -Date $dateCreated
            $output += "  [$($todo.id)] $($todo.task) ($timeAgo)`n"
        }
        $output += "`n"
    }
    if ($done.Count -gt 0) {
        $output += "Done:`n"
        foreach ($todo in $done | Select-Object -First 10) {
            $dateCompleted = if ($todo.completed) { [DateTime]$todo.completed } else { $null }
            if ($dateCompleted) {
                $timeAgo = Get-TimeAgo -Date $dateCompleted
                $output += "  [$($todo.id)] ~~$($todo.task)~~ ($timeAgo)`n"
            } else {
                $output += "  [$($todo.id)] ~~$($todo.task)~~`n"
            }
        }
        if ($done.Count -gt 10) {
            $output += "  ... and $($done.Count - 10) more completed tasks`n"
        }
    }
    return $output
}

function Get-TimeAgo {
    param([DateTime]$Date)
    $now = Get-Date
    $diff = $now - $Date
    if ($diff.TotalMinutes -lt 1) {
        return "just now"
    } elseif ($diff.TotalMinutes -lt 60) {
        $mins = [Math]::Floor($diff.TotalMinutes)
        return "$mins minute$(if($mins -ne 1){'s'}) ago"
    } elseif ($diff.TotalHours -lt 24) {
        $hours = [Math]::Floor($diff.TotalHours)
        return "$hours hour$(if($hours -ne 1){'s'}) ago"
    } elseif ($diff.TotalDays -lt 7) {
        $days = [Math]::Floor($diff.TotalDays)
        return "$days day$(if($days -ne 1){'s'}) ago"
    } else {
        $weeks = [Math]::Floor($diff.TotalDays / 7)
        return "$weeks week$(if($weeks -ne 1){'s'}) ago"
    }
}

function Get-StatusOverview {
    $config = Get-TasksConfig
    $output = "PROJECT STATUS`n`n"
    $roadmapPath = Join-Path $workspacePath "TOOLS-ROADMAP.md"
    if (Test-Path $roadmapPath) {
        $roadmapContent = Get-Content $roadmapPath -Raw
        $completedProjects = [regex]::Matches($roadmapContent, "- \*\*.*?\*\* \(\d{4}-\d{2}-\d{2}")
        $inProgressProjects = [regex]::Matches($roadmapContent, "## In Progress")
        $output += "Roadmap Progress:`n"
        $output += "  Completed: $($completedProjects.Count) project$(if($completedProjects.Count -ne 1){'s'})`n"
        $output += "  In Progress: $($inProgressProjects.Count)`n`n"
    }
    $todos = $config.todos
    $pending = ($todos | Where-Object { $_.status -eq "pending" }).Count
    $done = ($todos | Where-Object { $_.status -eq "done" }).Count
    $output += "Tasks:`n"
    if ($pending -gt 0) {
        $output += "  $pending pending task$(if($pending -ne 1){'s'})`n"
    } else {
        $output += "  No pending tasks!`n"
    }
    $output += "  $done completed task$(if($done -ne 1){'s'})`n`n"
    $gitLogPath = $config.gitCommitLogPath
    if (Test-Path $gitLogPath) {
        $output += "Recent Git Activity:`n"
        try {
            $recentLogs = Get-Content $gitLogPath -Tail 5 -ErrorAction SilentlyContinue
            foreach ($log in $recentLogs) {
                if ($log -match "(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \| (.+)") {
                    $timestamp = $matches[1]
                    $message = if ($matches[2].Length -gt 50) { $matches[2].Substring(0, 48) + ".." } else { $matches[2] }
                    $output += "  - $message`n"
                }
            }
        } catch {
            $output += "  - No recent activity logged`n"
        }
    } else {
        $output += "Git Activity: Log file not found`n"
    }
    $output += "`nLast Updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    return $output
}

function Get-OvernightLog {
    $output = "OVERNIGHT ACTIVITY`n"
    $output += "=========================`n`n"
    $config = Get-TasksConfig
    $gitLogPath = $config.gitCommitLogPath
    $yesterday = (Get-Date).AddHours(-12)
    if (Test-Path $gitLogPath) {
        $output += "Git Auto-Commit Activity:`n"
        try {
            $logs = Get-Content $gitLogPath -ErrorAction SilentlyContinue
            $relevantLogs = @()
            foreach ($log in $logs) {
                if ($log -match "(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \| (.+)") {
                    $logTime = [DateTime]::ParseExact($matches[1], "yyyy-MM-dd HH:mm:ss", [CultureInfo]::InvariantCulture)
                    if ($logTime -gt $yesterday) {
                        $relevantLogs += @{ time = $logTime; message = $matches[2]; raw = $log }
                    }
                }
            }
            if ($relevantLogs.Count -gt 0) {
                foreach ($log in ($relevantLogs | Sort-Object time)) {
                    $timeStr = $log.time.ToString("HH:mm")
                    if ($log.message -match "successful|completed") {
                        $output += "  [OK] [$timeStr] $($log.message)`n"
                    } elseif ($log.message -match "error|failed") {
                        $output += "  [ERR] [$timeStr] $($log.message)`n"
                    } else {
                        $output += "  [INFO] [$timeStr] $($log.message)`n"
                    }
                }
            } else {
                $output += "  No activity in the last 12 hours`n"
            }
        } catch {
            $output += "Error reading git logs: $($_.Exception.Message)`n"
        }
    } else {
        $output += "Git log file not found`n"
    }
    $output += "`nOvernight build is scheduled for 2:00 AM`n"
    return $output
}

function Get-CronJobsList {
    $output = "ACTIVE CRON JOBS`n"
    $output += "=====================`n`n"
    $schedulePath = Join-Path $workspacePath "SCHEDULE.md"
    if (Test-Path $schedulePath) {
        $scheduleContent = Get-Content $schedulePath -Raw
        if ($scheduleContent -match "## Scheduled Cron Jobs") {
            $output += "Scheduled Builds:`n"
            $lines = $scheduleContent -split "`n"
            $inCrons = $false
            foreach ($line in $lines) {
                if ($line -match "## Scheduled Cron Jobs") {
                    $inCrons = $true
                    continue
                } elseif ($line -match "^## " -or $line -match "^---") {
                    if ($inCrons) { break }
                }
                if ($inCrons) {
                    if ($line -match "Time: (\d+:\d{2} (AM|PM))") {
                        $output += "`n  - $($matches[1])`n"
                    } elseif ($line -match "Task: (.+)") {
                        $output += "    $($matches[1])`n"
                    }
                }
            }
        }
    }
    $output += "`nInfrastructure Jobs:`n"
    $output += "  - Every Hour (00:00) - Gateway Health Check`n"
    $output += "  - 2:00 AM - Daily Backup`n"
    $output += "`nTip: Check SCHEDULE.md for full details"
    return $output
}

function Handle-TodoCommand {
    param($config, $action, $taskOrId)
    
    if ($action -eq "add") {
        if ([string]::IsNullOrWhiteSpace($taskOrId)) {
            return "Usage: /todo add <task>"
        }
        $newTodo = @{
            id = $config.nextId
            task = $taskOrId
            status = "pending"
            created = (Get-Date).ToString("o")
            completed = $null
        }
        $config.todos += @($newTodo)
        $config.nextId++
        Save-TasksConfig -Config $config
        Write-Log "Added todo #{0}" -f $newTodo.id
        return "Added todo #{0}: {1}" -f $newTodo.id, $newTodo.task
    }
    elseif ($action -eq "list") {
        Write-Log "Command: /todo list"
        return Format-TodoList -Todos $config.todos
    }
    elseif ($action -eq "done") {
        if ([string]::IsNullOrWhiteSpace($taskOrId)) {
            return "Usage: /todo done <id>"
        }
        $todoId = $taskOrId -as [int]
        $todo = $config.todos | Where-Object { $_.id -eq $todoId } | Select-Object -First 1
        if ($todo) {
            if ($todo.status -eq "done") {
                return "Todo #{0} is already completed." -f $todoId
            } else {
                $todo.status = "done"
                $todo.completed = (Get-Date).ToString("o")
                Save-TasksConfig -Config $config
                Write-Log "Completed todo #{0}" -f $todoId
                return "Completed todo #{0}: {1}" -f $todoId, $todo.task
            }
        } else {
            return "Todo #{0} not found." -f $todoId
        }
    }
    elseif ($action -eq "delete") {
        if ([string]::IsNullOrWhiteSpace($taskOrId)) {
            return "Usage: /todo delete <id>"
        }
        $todoId = $taskOrId -as [int]
        $todo = $config.todos | Where-Object { $_.id -eq $todoId } | Select-Object -First 1
        if ($todo) {
            $config.todos = $config.todos | Where-Object { $_.id -ne $todoId }
            Save-TasksConfig -Config $config
            Write-Log "Deleted todo #{0}" -f $todoId
            return "Deleted todo #{0}: {1}" -f $todoId, $todo.task
        } else {
            return "Todo #{0} not found." -f $todoId
        }
    }
    else {
        return "Unknown todo command. Use: add, list, done, delete"
    }
}

$commandLower = $Command.ToLower()

if ($commandLower -eq "status") {
    Write-Log "Command: /status"
    $result = Get-StatusOverview
    Write-Output $result
}
elseif ($commandLower -eq "todo") {
    Write-Log "Command: /todo $Argument $Argument2"
    $config = Get-TasksConfig
    $action = $Argument.ToLower()
    $result = Handle-TodoCommand -config $config -action $action -taskOrId $Argument2
    Write-Output $result
}
elseif ($commandLower -eq "log") {
    Write-Log "Command: /log"
    $result = Get-OvernightLog
    Write-Output $result
}
elseif ($commandLower -eq "cron") {
    Write-Log "Command: /cron $Argument"
    if ($Argument.ToLower() -eq "list") {
        $result = Get-CronJobsList
        Write-Output $result
    } else {
        Write-Output "Unknown cron command. Use: list"
    }
}
else {
    Write-Log "Unknown command: $Command"
    Write-Output "Unknown command: $Command`n`nAvailable commands:`n  /status - Project overview`n  /todo add <task> - Add a todo`n  /todo list - Show todos`n  /todo done <id> - Mark complete`n  /todo delete <id> - Delete a todo`n  /log - Overnight activity`n  /cron list - Show cron jobs"
}

Write-Log "Command completed successfully"
# Git Auto-Committer Tool
# Automatically commits and pushes workspace changes to GitHub
# Sends daily summaries to Telegram

param(
    [switch]$OneTime,
    [switch]$DailySummary,
    [switch]$Test
)

# Load configuration
$configPath = "C:\Users\Karan\.openclaw\workspace\config\git-auto-commit.json"
if (-not (Test-Path $configPath)) {
    Write-Log "ERROR: Config file not found at $configPath"
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json

# Setup logging
$logPath = $config.logging.logFilePath
$logDir = Split-Path $logPath
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    if ($config.logging.enabled) {
        "$timestamp | $Message" | Out-File -FilePath $logPath -Append -Encoding UTF8
    }
    # Use Write-Host to avoid polluting function return values
    Write-Host "[$timestamp] $Message"
}

function Send-TelegramMessage {
    param([string]$Message)

    if ($config.telegram.enabled) {
        try {
            # Use OpenClaw CLI to send Telegram message
            $openclawPath = "$env:APPDATA\npm\openclaw.cmd"
            if (Test-Path $openclawPath) {
                $result = & $openclawPath message send --channel=telegram --target=$($config.telegram.chatId) --message="$Message" 2>&1
                Write-Log "Telegram message sent"
            } else {
                Write-Log "OpenClaw CLI not found at $openclawPath"
            }
        } catch {
            Write-Log "Failed to send Telegram: $($_.Exception.Message)"
        }
    }
}

function Get-ChangedFiles {
    param([string]$RepoPath)

    Set-Location $RepoPath
    # Get all changes including untracked files
    $status = git status --porcelain --untracked-files=all | Out-String
    $changedFiles = $status.Split([Environment]::Newline) | Where-Object { $_.Trim() -ne "" }

    # Filter excluded patterns
    $excludePatterns = $config.excludePatterns
    $filteredFiles = @()

    foreach ($file in $changedFiles) {
        # Extract just the filename part (remove status codes like ??, M, A, etc.)
        if ($file -match '^[AMD?\s]+\s+(.+)$') {
            $filePath = $matches[1].Trim()
        } else {
            continue
        }

        $shouldExclude = $false

        foreach ($pattern in $excludePatterns) {
            # Check if path matches any exclude pattern
            $matchPattern = "*" + $pattern + "*"
            if ($filePath -like $matchPattern) {
                $shouldExclude = $true
                Write-Log "Excluded: $filePath (matched pattern: $pattern)"
                break
            }
        }

        if (-not $shouldExclude) {
            # Just add status+path for filtering, will extract path later
            $filteredFiles += $filePath
        }
    }

    Write-Log "Found $($changedFiles.Count) total changes, $($filteredFiles.Count) after filtering"

    return $filteredFiles
}

function Get-GitBranch {
    param([string]$RepoPath)
    Set-Location $RepoPath
    # Just return current local branch name
    # git push will use the tracking branch if configured
    $branch = git rev-parse --abbrev-ref HEAD 2>$null
    if ($LASTEXITCODE -eq 0) {
        return $branch.Trim()
    }
    # Fallback
    return "main"
}

function New-CommitMessage {
    param([array]$ChangedFiles)

    $count = $ChangedFiles.Count

    if ($count -eq 1) {
        $file = $ChangedFiles[0].Trim()
        return "Auto-update: $file"
    } elseif ($count -le 5) {
        # Clean up file paths - they should already be clean now
        $files = $ChangedFiles | ForEach-Object { $_.Trim() }
        return "Auto-update: $($files -join ', ')"
    } else {
        return "Auto-update: $count files changed"
    }
}

function Resolve-Conflicts {
    param([string]$RepoPath)

    if (-not $config.features.autoResolveConflicts) {
        return $false
    }

    Set-Location $RepoPath
    $conflicts = git diff --name-only --diff-filter=U

    if ($conflicts) {
        Write-Log "Merge conflicts detected: $($conflicts -join ', ')"

        # Auto-accept ours for safety
        foreach ($conflict in $conflicts) {
            git checkout --ours $conflict 2>&1 | Out-Null
            git add $conflict 2>&1 | Out-Null
            Write-Log "Resolved conflict in $conflict (kept local version)"
        }

        return $true
    }

    return $false
}

function Invoke-AutoCommit {
    param([string]$RepoPath)

    # Use workspace path from config if RepoPath is default
    if (-not $RepoPath -or $RepoPath -eq "") {
        $RepoPath = $config.repositoryPath
    }

    $repoName = Split-Path $RepoPath -Leaf
    Write-Log "Checking $repoName at $RepoPath..."

    # Check if it's a git repo
    if (-not (Test-Path (Join-Path $RepoPath ".git"))) {
        Write-Log "Not a git repo, skipping: $RepoPath"
        return
    }

    # Get changed files
    $changedFiles = Get-ChangedFiles -RepoPath $RepoPath

    if ($changedFiles.Count -eq 0) {
        Write-Log "No changes in $repoName"
        return
    }

    # Check file limit
    if ($changedFiles.Count -gt $config.maxUncommittedFiles) {
        $msg = "Too many files changed ($($changedFiles.Count)), skipping auto-commit for $repoName"
        Write-Log $msg
        if ($config.telegram.sendOnError) {
            Send-TelegramMessage -Message "[ALERT] Git Auto-Commit: $msg"
        }
        return
    }

    Write-Log "Found $($changedFiles.Count) changed file(s)"

    # Add files
    Set-Location $RepoPath

    if ($config.features.onlyCommitChangedFiles) {
        foreach ($file in $changedFiles) {
            # File paths are already clean from Get-ChangedFiles
            Write-Log "Adding file: $file"
            git add $file 2>&1 | Out-Null
        }
    } else {
        git add . 2>&1 | Out-Null
        Write-Log "Added all changes"
    }

    # Commit
    $commitMessage = New-CommitMessage -ChangedFiles $changedFiles
    git config user.name $config.git.userName
    git config user.email $config.git.userEmail

    $commitResult = git commit -m $commitMessage 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Commit successful: $commitMessage"

        # Push if configured
        if ($config.pushAfterCommit) {
            $branch = Get-GitBranch -RepoPath $RepoPath
            Write-Log "Pushing to GitHub (branch: $branch)..."

            # Pull first to minimize conflicts
            Write-Log "Pulling latest changes..."
            git pull origin $branch 2>&1 | Out-Null

            # Check if there are conflicts
            $resolved = Resolve-Conflicts -RepoPath $RepoPath

            $pushResult = git push origin $branch 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Push successful"
            } else {
                Write-Log "Push failed: $pushResult"
                if ($config.telegram.sendOnError) {
                    Send-TelegramMessage -Message "[ERROR] Git push failed for $repoName ($branch)"
                }
            }
        }
    } else {
        Write-Log "Commit failed: $commitResult"
    }
}

function Invoke-DailySummary {
    Write-Log "Generating daily summary..."

    $repoPath = $config.repositoryPath
    $repoName = Split-Path $repoPath -Leaf

    $summary = "`n[GIT AUTO-COMMIT] Daily Summary - $repoName"
    $summary += "`n===================================="
    $summary += "`nGenerated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')`n"

    # Get recent commits
    Set-Location $repoPath
    $commits = git log --since="1 day ago" --pretty=format:"%h | %ad | %s" --date=format:"%H:%M" | Out-String

    if ($commits.Trim()) {
        $summary += "`nRecent Commits (24h):"
        $summary += $commits
    } else {
        $summary += "`nNo commits in the last 24 hours"
    }

    # Check for uncommitted changes
    $changedFiles = Get-ChangedFiles -RepoPath $repoPath
    if ($changedFiles.Count -gt 0) {
        $summary += "`n`nUncommitted changes: $($changedFiles.Count) file(s)"
        $summary += "`nFiles ready to commit:"
        foreach ($file in $changedFiles) {
            $filename = ($file -replace '^[AMD?\s]+\s+', '').Trim()
            $summary += "`n  - $filename"
        }
    } else {
        $summary += "`n`nNo uncommitted changes"
    }

    $summary += "`n===================================="

    Write-Log $summary

    if ($config.telegram.sendDailySummary) {
        Send-TelegramMessage -Message $summary
    }
}

# Main execution
Write-Log "=== Git Auto-Committer Started ==="

if ($OneTime) {
    Write-Log "Running one-time check..."
    Invoke-AutoCommit
    Write-Log "=== One-time check complete ==="
} elseif ($DailySummary) {
    Invoke-DailySummary
    Write-Log "=== Daily summary sent ==="
} elseif ($Test) {
    Write-Log "Test mode - checking configuration..."
    Write-Log "Config loaded from: $configPath"
    Write-Log "Repository: $($config.repositoryPath)"
    Write-Log "Commit interval: $($config.commitIntervalMinutes) minutes"
    Write-Log "Telegram enabled: $($config.telegram.enabled)"
    Write-Log "Daily summary time: $($config.dailySummaryTime)"
    Write-Log "=== Test complete ==="
} else {
    # Continuous mode
    $interval = $config.commitIntervalMinutes * 60

    while ($true) {
        Invoke-AutoCommit

        # Check if it's time for daily summary
        $currentTime = Get-Date -Format "HH:mm"
        $targetTime = $config.dailySummaryTime
        if ($currentTime -eq $targetTime) {
            Invoke-DailySummary
        }

        Write-Log "Next check in $interval seconds..."
        Start-Sleep -Seconds $interval
    }
}

Write-Log "=== Git Auto-Committer Stopped ==="
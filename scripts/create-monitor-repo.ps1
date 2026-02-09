require -Modules Microsoft.PowerShell.Utility

# Using GitHub CLI for authentication (requires: gh auth login)
try {
    $repo = gh repo create openclaw-monitor-dashboard --public --description "OpenClaw Monitor Dashboard - Real-time system monitoring"
    Write-Output "Repository created: https://github.com/karansethi121/openclaw-monitor-dashboard"
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
    Write-Output "Make sure to run 'gh auth login' first or repo may already exist."
}
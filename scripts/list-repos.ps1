require -Modules Microsoft.PowerShell.Utility

# Using GitHub CLI for authentication (requires: gh auth login)
try {
    $repos = gh repo list --limit 100 --json name,htmlUrl | ConvertFrom-Json
    $repos | ForEach-Object {
        Write-Output "$($_.name) - $($_.htmlUrl)"
    }
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
    Write-Output "Make sure to run 'gh auth login' first."
}
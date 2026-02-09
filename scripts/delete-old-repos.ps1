require -Modules Microsoft.PowerShell.Utility

# Using GitHub CLI for authentication (requires: gh auth login)
try {
    $repos = gh repo list --limit 100 --json name,htmlUrl | ConvertFrom-Json

    Write-Output "Repositories in karansethi121 account:"

    foreach ($repo in $repos) {
        Write-Output "$($repo.name) - $($repo.htmlUrl)"
    }
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
    Write-Output "Make sure to run 'gh auth login' first."
}
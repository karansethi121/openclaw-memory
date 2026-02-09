require -Modules Microsoft.PowerShell.Utility

# Using GitHub CLI for authentication (requires: gh auth login)
$body = @{
    name = 'one4health-website'
    description = 'One4Health wellness brand website'
    private = $false
} | ConvertTo-Json

try {
    $response = gh repo create one4health-website --public --description "One4Health wellness brand website"
    Write-Output "Repository created: https://github.com/karansethi121/one4health-website"
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
    Write-Output "Make sure to run 'gh auth login' first."
}
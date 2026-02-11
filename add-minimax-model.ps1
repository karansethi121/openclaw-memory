$json = Get-Content 'C:\Users\Karan\.openclaw\openclaw.json' | ConvertFrom-Json
$modelsHash = @{}
$json.agents.defaults.models.PSObject.Properties | ForEach-Object { $modelsHash[$_.Name] = $_.Value }
$modelsHash['minimax/MiniMax-M2.1'] = @{}
$json.agents.defaults.models = $modelsHash
$json | ConvertTo-Json -Depth 50 -Compress:$false | Set-Content 'C:\Users\Karan\.openclaw\openclaw.json'
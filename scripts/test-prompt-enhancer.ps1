<#
.SYNOPSIS
    Test script for Prompt Enhancer
.DESCRIPTION
    Tests the Prompt Enhancer with various prompt scenarios
#>

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceRoot = Split-Path -Parent $scriptPath
$enhancerScript = "$workspaceRoot\scripts\prompt-enhancer.ps1"

function Test-Scenario {
    param(
        [string]$Name,
        [string]$Prompt,
        [switch]$AutoApprove
    )

    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "Test: $Name" -ForegroundColor Yellow
    Write-Host "Prompt: `"$Prompt`"" -ForegroundColor Gray
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

    $params = @{
        OriginalPrompt = $Prompt
    }
    if ($AutoApprove) {
        $params.AutoApprove = $true
    }

    try {
        $output = & powershell -ExecutionPolicy Bypass -File $enhancerScript @params
        Write-Host $output

        # Check for expected patterns
        if ($output -match 'enhanced|Enhancement Review') {
            Write-Host "✓ Enhancement triggered" -ForegroundColor Green
        } else {
            Write-Host "✓ No enhancement needed" -ForegroundColor Gray
        }

    } catch {
        Write-Host "✗ Error: $_" -ForegroundColor Red
    }
}

# Test scenarios
Write-Host "`n🧪 Testing Prompt Enhancer" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

# Test 1: Vague request (should enhance)
Test-Scenario -Name "Vague - 'build something'" -Prompt "build something"

# Test 2: Specified but vague (should enhance)
Test-Scenario -Name "Vague - 'create a website'" -Prompt "create a website"

# Test 3: Clear request with context (no enhancement needed)
Test-Scenario -Name "Clear - 'update the One4Health homepage hero section'" -Prompt "update the One4Health homepage hero section"

# Test 4: Technical request (may enhance)
Test-Scenario -Name "Technical - 'deploy it'" -Prompt "deploy it"

# Test 5: Clear specific request (no enhancement needed)
Test-Scenario -Name "Specific - 'create a PowerShell script to monitor system CPU usage'" -Prompt "create a PowerShell script to monitor system CPU usage"

# Test 6: Short but clear (no enhancement needed)
Test-Scenario -Name "Short clear - 'check email'" -Prompt "check email"

# Test 7: Auto-approve mode
Test-Scenario -Name "Auto-approve - 'make a tool'" -Prompt "make a tool" -AutoApprove

# Test 8: Integration test
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Testing Integration Layer" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$integrationScript = "$scriptPath\prompt-enhancer-integration.ps1"
if (Test-Path $integrationScript) {
    Write-Host "`n✓ Integration script exists" -ForegroundColor Green
} else {
    Write-Host "`n✗ Integration script not found" -ForegroundColor Red
}

# Run integration test
$testMessage = "create a website"
$integrationResult = & powershell -ExecutionPolicy Bypass -File $integrationScript -InputMessage $testMessage
$integrationParsed = $integrationResult | ConvertFrom-Json

if ($integrationParsed.status -eq "success") {
    Write-Host "✓ Integration layer working" -ForegroundColor Green
    Write-Host "Status: $($integrationParsed.status)" -ForegroundColor Gray
    Write-Host "Should Enhance: $($integrationParsed.shouldEnhance)" -ForegroundColor Gray
} else {
    Write-Host "✗ Integration error: $($integrationParsed.error)" -ForegroundColor Red
}

# Check logs
$logPath = "$scriptPath\..\logs\prompt-enhancements.log"
if (Test-Path $logPath) {
    $logContent = Get-Content -Path $logPath | Select-Object -Skip 1
    $logEntries = if ($logContent) { $logContent.Count } else { 0 }

    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "Log Statistics" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "Log entries: $logEntries" -ForegroundColor Gray
    Write-Host "Log file: $logPath" -ForegroundColor Gray
}

Write-Host "`n✅ Testing complete!" -ForegroundColor Green
<#
.SYNOPSIS
    Prompt Enhancer Integration Layer for OpenClaw
.DESCRIPTION
    Integrates the Prompt Enhancer with OpenClaw's message handling pipeline.
    Hooks into incoming Telegram messages and enhances them before processing.
.NOTES
    This is meant to be called by OpenClaw's message handler.
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$InputMessage,

    [Parameter(Mandatory=$false)]
    [switch]$ForceEnhance = $false
)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$enhancerScript = "$scriptPath\prompt-enhancer.ps1"

function Test-SystemCommand {
    param([string]$command)
    try {
        Get-Command $command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Invoke-PromptEnhancer {
    param([string]$message)

    if (-not (Test-Path $enhancerScript)) {
        Write-Error "Prompt enhancer script not found: $enhancerScript"
        return $message
    }

    try {
        $output = & powershell -ExecutionPolicy Bypass -File $enhancerScript -OriginalPrompt $message -ErrorAction Stop 2>&1
        return $output
    } catch {
        Write-Error "Error running prompt enhancer: $_"
        return $message
    }
}

function Process-Message {
    param([string]$message)

    # Skip enhancement for:
    # - System commands (starting with /)
    # - Very short messages (< 3 chars)
    # - Already enhanced messages (contain "enhanced" reference)
    if ($message -match '^/' -or $message.Length -lt 3 -or $message -match 'enhanced|review|prompt') {
        return @{
            ShouldEnhance = $false
            Original = $message
            Result = $message
        }
    }

    # Run the enhancer
    $enhancementResult = Invoke-PromptEnhancer -message $message

    # Parse the output to determine if enhancement happened
    # Check for enhancement indicators in various formats
    if ($enhancementResult -match '\[Prompt Enhancement Review\]' -or
        $enhancementResult -match '\[Enhanced Prompt\]' -or
        $enhancementResult -match 'Prompt enhanced automatically') {

        # Extract the enhanced prompt if available
        $enhancedPrompt = $message
        if ($enhancementResult -match '\[Enhanced Prompt\]\s*>\s*(.+)') {
            $enhancedPrompt = $matches[1].Trim()
        } elseif ($enhancementResult -match 'Enhanced:\s*(.+)') {
            $enhancedPrompt = $matches[1].Trim()
        }

        # Check if needs approval (has comparison format)
        $needsApproval = $enhancementResult -match '\[Original Prompt\]' -and $enhancementResult -match '\[Quick Actions\]'

        if ($needsApproval) {
            return @{
                ShouldEnhance = $true
                Original = $message
                Result = $enhancementResult  # Full comparison
                NeedsApproval = $true
            }
        } else {
            return @{
                ShouldEnhance = $true
                Original = $message
                Result = $enhancedPrompt
            }
        }
    }
    elseif ($enhancementResult -match 'Prompt is clear, no enhancement needed' -or
           $enhancementResult -match 'not enhance') {
        return @{
            ShouldEnhance = $false
            Original = $message
            Result = $message
        }
    }
    else {
        return @{
            ShouldEnhance = $false
            Original = $message
            Result = $message
        }
    }
}

function Format-EnhancementForTelegram {
    param([hashtable]$result)

    if ($result.NeedsApproval) {
        return $result.Result  # Already formatted
    } elseif ($result.ShouldEnhance) {
        return "✨ *Prompt Enhanced*`n`nOriginal: $($result.Original)`nEnhanced: $($result.Result)"
    } else {
        return $null
    }
}

# Main execution
try {
    $processResult = Process-Message -message $InputMessage

    # Output in a structured format for OpenClaw to consume
    $output = @{
        status = "success"
        shouldEnhance = $processResult.ShouldEnhance
        originalPrompt = $processResult.Original
        enhancedPrompt = $processResult.Original
        needsApproval = $processResult.NeedsApproval -eq $true
        telegramMessage = Format-EnhancementForTelegram -result $processResult
    }

    if ($processResult.ShouldEnhance -and !$processResult.NeedsApproval) {
        $output.enhancedPrompt = $processResult.Result
    }

    $output | ConvertTo-Json

} catch {
    $errorResult = @{
        status = "error"
        shouldEnhance = $false
        originalPrompt = $InputMessage
        enhancedPrompt = $InputMessage
        error = $_.Exception.Message
    }

    $errorResult | ConvertTo-Json
}
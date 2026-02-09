<#
.SYNOPSIS
    Prompt Enhancer - Intelligent prompt enhancement for OpenClaw
.DESCRIPTION
    Analyzes and enhances incoming Telegram prompts to improve clarity,
    specificity, and context before agent processing.
.NOTES
    Version: 1.0.0
    Author: OpenClaw Automation
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$OriginalPrompt,

    [Parameter(Mandatory=$false)]
    [string]$ConfigPath = "",

    [Parameter(Mandatory=$false)]
    [string]$LogPath = "",

    [Parameter(Mandatory=$false)]
    [string]$MemoryPath = "",

    [Parameter(Mandatory=$false)]
    [string]$UserPath = "",

    [Parameter(Mandatory=$false)]
    [switch]$AutoApprove = $false
)

# Set default paths relative to script location
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceRoot = Split-Path -Parent $scriptDir

if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
    $ConfigPath = "$workspaceRoot\config\prompt-enhancer.json"
}
if ([string]::IsNullOrWhiteSpace($LogPath)) {
    $LogPath = "$workspaceRoot\logs\prompt-enhancements.log"
}
if ([string]::IsNullOrWhiteSpace($MemoryPath)) {
    $MemoryPath = "$workspaceRoot\MEMORY.md"
}
if ([string]::IsNullOrWhiteSpace($UserPath)) {
    $UserPath = "$workspaceRoot\USER.md"
}

# Import configuration
$config = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json

# Initialize enhancement result
$result = @{
    OriginalPrompt = $OriginalPrompt
    EnhancedPrompt = $OriginalPrompt
    NeedsEnhancement = $false
    Analysis = @{
        Clarity = 1.0
        Specificity = 1.0
        Context = 0.0
        Constraints = 0.0
        Score = 0.0
    }
    Enhancements = @()
    Suggestions = @()
    Modified = $false
    Timestamp = Get-Date -Format "o"
}

function Get-PromptQuality {
    param([string]$prompt)

    $analysis = @{
        Clarity = 1.0
        Specificity = 1.0
        Context = 0.0
        Constraints = 0.0
    }

    # Check clarity - is the goal clear?
    $vagueIndicators = $config.enhancementPatterns.vague_indicators
    $hasVagueWords = $vagueIndicators | Where-Object { $prompt -match [regex]::Escape($_) }
    if ($hasVagueWords) {
        $analysis.Clarity = 0.4
    }
    elseif ($prompt.Length -lt 15) {
        $analysis.Clarity = 0.6
    }

    # Check specificity - are specific details provided?
    $hasSpecificDetails = $prompt -match '\b(deploy|create|build|fix|update)\b' -and
                          $prompt -match '\b(to|for|on|with|using|in)\s+\w+'
    if ($hasSpecificDetails) {
        $analysis.Specificity = 0.8
    } elseif ($prompt.Length -gt 50) {
        $analysis.Specificity = 0.6
    }

    # Check context - does it reference known entities?
    if (Test-Path $MemoryPath) {
        $memoryContent = Get-Content -Path $MemoryPath -Raw -ErrorAction SilentlyContinue
        if ($memoryContent) {
            $projectKeywords = @("website", "app", "tool", "bot", "One4Health", "OpenClaw", "dashboard", "monitor")
            $hasContext = $projectKeywords | Where-Object { $prompt -like "*$_*" }
            $analysis.Context = if ($hasContext) { 0.8 } else { 0.2 }
        }
    }

    # Check constraints - time, format, tone, platform
    $constraintKeywords = $config.enhancementPatterns.constraint_keywords
    $hasConstraints = $constraintKeywords | Where-Object { $prompt -match [regex]::Escape($_) }
    $analysis.Constraints = if ($hasConstraints) { 0.7 } else { 0.3 }

    # Calculate overall score (weighted average)
    $analysis.Score = ($analysis.Clarity * 0.3) +
                      ($analysis.Specificity * 0.3) +
                      ($analysis.Context * 0.2) +
                      ($analysis.Constraints * 0.2)

    return $analysis
}

function Enhance-Prompt {
    param(
        [string]$prompt,
        [hashtable]$analysis
    )

    $enhanced = $prompt
    $enhancements = @()
    $suggesttions = @()

    # Rule 1: Add context from memory if relevant
    if ($analysis.Context -lt 0.5) {
        if ($prompt -match '\b(?:build|create|update|fix)\b.*\b(?:website|site|page)\b') {
            $enhanced = "$enhanced for the One4Health project (https://one4health.netlify.app/)"
            $enhancements += "Added One4Health project context"
        }
        elseif ($prompt -match '\b(?:build|create|make)\b.*\b(?:tool|script|automation|bot)\b') {
            $enhanced = "$enhanced for OpenClaw automation system"
            $enhancements += "Added OpenClaw system context"
        }
    }

    # Rule 2: Break down broad tasks
    if ($prompt -match '^(?:build|create|make|develop)\s+(?:a|an)?\s*(?:website|app|tool|system|bot)\b\s*$') {
        $enhancements += "Broad request detected - will break down into specific steps"
        $suggestions += "What specific features are needed?"
        $suggestions += "What's the primary goal?"
    }

    # Rule 3: Ask about missing constraints
    if ($analysis.Constraints -lt 0.4 -and $enhanced.Length -lt 100) {
        $suggestions += "Consider adding: deadline, format preference, target platform"
    }

    # Rule 4: Disambiguate technical terms
    if ($prompt -match '\b(deploy|host)\b.*\b(it|that|this)\b') {
        $suggestions += "Which platform to deploy to? (Netlify, Vercel, GitHub Pages, custom server)"
    }

    # Rule 5: Define success criteria
    if ($analysis.Clarity -lt 0.6) {
        $suggestions += "What does success look like? What's the expected outcome?"
    }

    return @{
        EnhancedPrompt = $enhanced
        Enhancements = $enhancements
        Suggestions = $suggestions
        Modified = $enhanced -ne $prompt -or $suggestions.Count -gt 0
    }
}

function Get-PromptComparison {
    param(
        [string]$original,
        [string]$enhanced,
        [array]$enhancements,
        [array]$suggestions
    )

    $comparison = @"

[Prompt Enhancement Review]

=====================================

[Original Prompt]
> $original

=====================================

[Enhanced Prompt]
> $enhanced

=====================================

"@

    if ($enhancements.Count -gt 0) {
        $comparison += "[Enhancements Made]`n"
        foreach ($e in $enhancements) {
            $comparison += "  - $e`n"
        }
        $comparison += "`n"
    }

    if ($suggestions.Count -gt 0) {
        $comparison += "[Suggestions for next time]`n"
        foreach ($s in $suggestions) {
            $comparison += "  - $s`n"
        }
        $comparison += "`n"
    }

    $comparison += "=====================================`n"
    $comparison += "[Quick Actions]`n"
    $comparison += "  [Check] Use enhanced prompt`n"
    $comparison += "  [Undo] Use original prompt`n"
    $comparison += "  [Edit] Edit prompt manually`n"
    $comparison += "====================================="

    return $comparison
}

function Log-Enhancement {
    param(
        [hashtable]$result,
        [string]$decision
    )

    $logEntry = @{
        timestamp = Get-Date -Format "o"
        original = $result.OriginalPrompt
        enhanced = $result.EnhancedPrompt
        qualityScore = $result.Analysis.Score
        enhancements = $result.Enhancements
        suggestions = $result.Suggestions
        modified = $result.Modified
        userDecision = $decision
    } | ConvertTo-Json -Compress

    Add-Content -Path $LogPath -Value $logEntry
}

function Get-EnhancementStats {
    $logContent = Get-Content -Path $LogPath -ErrorAction SilentlyContinue
    if ($logContent) {
        $entries = $logContent | ForEach-Object { $_ | ConvertFrom-Json }

        $total = $entries.Count
        $enhanced = ($entries | Where-Object { $_.modified -eq $true }).Count
        $accepted = ($entries | Where-Object { $_.userDecision -eq 'accepted' }).Count
        $rejected = ($entries | Where-Object { $_.userDecision -eq 'rejected' }).Count
        $edited = ($entries | Where-Object { $_.userDecision -eq 'edited' }).Count
        $avgScore = ($entries | Measure-Object -Property qualityScore -Average).Average

        if ($total -gt 0) {
            $acceptRate = [math]::Round(($accepted / $enhanced) * 100, 1)
        } else {
            $acceptRate = 0
        }

        return @{
            TotalAnalyzed = $total
            TotalEnhanced = $enhanced
            Accepted = $accepted
            Rejected = $rejected
            Edited = $edited
            AcceptRate = $acceptRate
            AverageQualityScore = [math]::Round($avgScore, 2)
        }
    }

    return @{
        TotalAnalyzed = 0
        TotalEnhanced = 0
        Accepted = 0
        Rejected = 0
        Edited = 0
        AcceptRate = 0
        AverageQualityScore = 0
    }
}

# Main workflow
try {
    # Step 1: Analyze prompt quality
    $result.Analysis = Get-PromptQuality -prompt $OriginalPrompt

    # Step 2: Determine if enhancement is needed
    $result.NeedsEnhancement = $result.Analysis.Score -lt $config.analysis.qualityThreshold

    if ($result.NeedsEnhancement -or $config.enhancementMode -eq 'always') {
        # Step 3: Generate enhancement
        $enhancement = Enhance-Prompt -prompt $OriginalPrompt -analysis $result.Analysis
        $result.EnhancedPrompt = $enhancement.EnhancedPrompt
        $result.Enhancements = $enhancement.Enhancements
        $result.Suggestions = $enhancement.Suggestions
        $result.Modified = $enhancement.Modified
    }

    # Step 4: Generate output based on mode
    if ($result.Modified -and $config.telegramIntegration.showComparison -and -not $AutoApprove) {
        # Interactive mode - show comparison
        $comparison = Get-PromptComparison `
            -original $result.OriginalPrompt `
            -enhanced $result.EnhancedPrompt `
            -enhancements $result.Enhancements `
            -suggestions $result.Suggestions

        Write-Output $comparison
    }
    elseif ($result.Modified -and $AutoApprove) {
        # Auto-approve mode - just use enhanced
        Write-Output "✅ Prompt enhanced automatically"
        Write-Output "Enhanced: $($result.EnhancedPrompt)"
        Log-Enhancement -result $result -decision 'auto-approved'
    }
    else {
        # No enhancement needed
        Write-Output "✅ Prompt is clear, no enhancement needed"
    }

    # Include stats if requested
    # $stats = Get-EnhancementStats
    # Write-Output "`n📊 Stats: $($stats.TotalAnalyzed) analyzed, $($stats.AcceptRate)% accept rate"

} catch {
    Write-Error "Error enhancing prompt: $_"
    exit 1
}
# File Utility Automation Script
# Performs batch file operations and conversions

param(
    [Parameter(Mandatory=$true)]
    [string]$Operation,

    [string]$SourcePath,

    [string]$TargetPath,

    [string]$Pattern = "*",

    [switch]$Recurse,

    [switch]$DryRun
)

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Function Write-Log {
    param([string]$Message)
    Write-Output "[$timestamp] $Message"
}

Write-Log "Starting operation: $Operation"

switch ($Operation) {
    "list" {
        if (-not $SourcePath) {
            Write-Log "ERROR: SourcePath required for list operation"
            exit 1
        }

        $files = Get-ChildItem -Path $SourcePath -Filter $Pattern -Recurse:$Recurse

        Write-Log "Found $($files.Count) files matching pattern '$Pattern'"
        foreach ($file in $files) {
            $size = [math]::Round($file.Length / 1KB, 2)
            Write-Log "  $($file.FullName) ($size KB)"
        }
    }

    "copy" {
        if (-not $SourcePath -or -not $TargetPath) {
            Write-Log "ERROR: SourcePath and TargetPath required for copy operation"
            exit 1
        }

        $files = Get-ChildItem -Path $SourcePath -Filter $Pattern -Recurse:$Recurse

        Write-Log "Found $($files.Count) files to copy"

        foreach ($file in $files) {
            $relativePath = $file.FullName.Substring($SourcePath.Length)
            $targetFile = Join-Path $TargetPath $relativePath.TrimStart('\')

            if (-not $DryRun) {
                $targetDir = Split-Path $targetFile
                if (-not (Test-Path $targetDir)) {
                    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
                }
                Copy-Item -Path $file.FullName -Destination $targetFile
                Write-Log "  Copied: $($file.Name) -> $targetFile"
            } else {
                Write-Log "  [DRY RUN] Would copy: $($file.FullName) -> $targetFile"
            }
        }
    }

    "delete" {
        if (-not $SourcePath) {
            Write-Log "ERROR: SourcePath required for delete operation"
            exit 1
        }

        $files = Get-ChildItem -Path $SourcePath -Filter $Pattern -Recurse:$Recurse

        Write-Log "Found $($files.Count) files to delete"
        Write-Log "WARNING: This operation cannot be undone!"

        foreach ($file in $files) {
            if (-not $DryRun) {
                Remove-Item -Path $file.FullName -Force
                Write-Log "  Deleted: $($file.FullName)"
            } else {
                Write-Log "  [DRY RUN] Would delete: $($file.FullName)"
            }
        }
    }

    "rename" {
        if (-not $SourcePath) {
            Write-Log "ERROR: SourcePath required for rename operation"
            exit 1
        }

        $files = Get-ChildItem -Path $SourcePath -Filter $Pattern

        Write-Log "Found $($files.Count) files to rename"

        foreach ($file in $files) {
            $oldName = $file.Name
            $newName = $oldName -replace $Pattern, $TargetPath

            if ($newName -ne $oldName) {
                if (-not $DryRun) {
                    Rename-Item -Path $file.FullName -NewName $newName
                    Write-Log "  Renamed: $oldName -> $newName"
                } else {
                    Write-Log "  [DRY RUN] Would rename: $oldName -> $newName"
                }
            }
        }
    }

    "archive" {
        if (-not $SourcePath -or -not $TargetPath) {
            Write-Log "ERROR: SourcePath and TargetPath required for archive operation"
            exit 1
        }

        $files = Get-ChildItem -Path $SourcePath -Filter $Pattern -Recurse:$Recurse

        Write-Log "Compressing $($files.Count) files to archive..."

        if (-not $DryRun) {
            Compress-Archive -Path $files.FullName -DestinationPath $TargetPath -Force
            Write-Log "  Created archive: $TargetPath"
        } else {
            Write-Log "  [DRY RUN] Would create archive: $TargetPath with $($files.Count) files"
        }
    }

    default {
        Write-Log "ERROR: Unknown operation '$Operation'"
        Write-Log "Valid operations: list, copy, delete, rename, archive"
        exit 1
    }
}

Write-Log "Operation complete!"
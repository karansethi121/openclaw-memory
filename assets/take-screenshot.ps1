$htmlFile = 'C:\Users\Karan\.openclaw\workspace\one4health-packaging-design.html'
$screenshotFile = 'C:\Users\Karan\.openclaw\workspace\one4health-packaging-screenshot.png'

$edgePath = Join-Path $env:LOCALAPPDATA 'Microsoft\Edge\Application\msedge.exe'
if (-not (Test-Path $edgePath)) {
    $edgePath = Join-Path $env:PROGRAMFILES 'Microsoft\Edge\Application\msedge.exe'
}

if (Test-Path $edgePath) {
    $args = @(
        '--headless',
        '--screenshot=' + $screenshotFile,
        '--window-size=1400,900',
        ('file:///' + $htmlFile.Replace('\','/'))
    )
    Start-Process -FilePath $edgePath -ArgumentList $args -Wait -NoNewWindow
    if (Test-Path $screenshotFile) {
        Write-Output 'Screenshot created successfully'
    } else {
        Write-Output 'Failed to create screenshot'
    }
} else {
    Write-Output 'Edge browser not found'
}
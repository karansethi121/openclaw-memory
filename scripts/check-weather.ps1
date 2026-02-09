# Weather Check Script
# Checks weather for key locations using wttr.in (no API key required)

param(
    [string]$Location = "Delhi"
)

# Try wttr.in first (human-friendly)
$url = "wttr.in/$([uri]::EscapeDataString($Location))?format=3"
try {
    $response = curl.exe -s $url 2>$null
    if ($response) {
        Write-Output "WEATHER | $response"
        exit 0
    }
} catch {
    # Fall through to Open-Meteo
}

# Fallback: Open-Meteo JSON API (coordinates for common cities)
$coords = @{
    "Delhi" = "28.6,77.2"
    "Mumbai" = "19.1,72.9"
    "Bangalore" = "12.9,77.6"
    "Chennai" = "13.1,80.3"
    "Kolkata" = "22.6,88.4"
    "Hyderabad" = "17.4,78.5"
    "London" = "51.5,-0.12"
}

$coord = $coords[$Location]
if ($coord) {
    $url = "https://api.open-meteo.com/v1/forecast?latitude=$($coord.Split(',')[0])&longitude=$($coord.Split(',')[1])&current_weather=true"
    try {
        $json = curl.exe -s $url 2>$null | ConvertFrom-Json
        if ($json.current_weather) {
            $temp = $json.current_weather.temperature
            $wind = $json.current_weather.windspeed
            Write-Output "WEATHER | $($Location): $temp°C (Wind: $wind km/h)"
            exit 0
        }
    } catch {
        # Give up
    }
}

Write-Output "WEATHER | Unable to fetch weather for $Location"
exit 1
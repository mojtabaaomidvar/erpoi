Write-Host "Building..."

$sw=[Diagnostics.Stopwatch]::StartNew()

$output=npm run build 2>&1

$sw.Stop()

@{

tool="build"

success=($LASTEXITCODE -eq 0)

duration_ms=$sw.ElapsedMilliseconds

output=$output

}|ConvertTo-Json -Depth 5 |
Out-File reports/json/build.json
Write-Host "Running TypeScript..."

New-Item -Force -ItemType Directory reports/json | Out-Null

$sw=[Diagnostics.Stopwatch]::StartNew()

$output=npx tsc --noEmit 2>&1

$sw.Stop()

$result=@{
    tool="tsc"
    success=($LASTEXITCODE -eq 0)
    duration_ms=$sw.ElapsedMilliseconds
    exitCode=$LASTEXITCODE
    output=$output
}

$result|ConvertTo-Json -Depth 10 | Out-File reports/json/tsc.json -Encoding utf8

Write-Host "Done."
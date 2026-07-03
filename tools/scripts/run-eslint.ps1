Write-Host "Running ESLint..."

New-Item -Force -ItemType Directory reports/json | Out-Null

$sw=[Diagnostics.Stopwatch]::StartNew()

$output=npx eslint src `
--format json `
-o reports/json/eslint-report.json

$sw.Stop()

$result=@{

tool="eslint"

success=($LASTEXITCODE -eq 0)

duration_ms=$sw.ElapsedMilliseconds

exitCode=$LASTEXITCODE

report="reports/json/eslint-report.json"

}

$result|ConvertTo-Json|Out-File reports/json/eslint.json
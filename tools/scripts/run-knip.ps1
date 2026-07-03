Write-Host "Running Knip..."

npx knip `
--reporter json `
> reports/json/knip-report.json

@{

tool="knip"

success=($LASTEXITCODE -eq 0)

}|ConvertTo-Json |
Out-File reports/json/knip.json
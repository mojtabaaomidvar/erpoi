Write-Host "Running Dependency Cruiser..."

npx depcruise src `
--config tools/config/dependency-cruiser.cjs `
--output-type json `
> reports/json/dependency.json

@{

tool="dependency-cruiser"

success=($LASTEXITCODE -eq 0)

}|ConvertTo-Json |
Out-File reports/json/dependency-meta.json
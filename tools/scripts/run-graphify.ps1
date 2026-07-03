Write-Host "Running Graphify..."

graphify src `
--mode deep `
--code-only `
--json `
> reports/json/graphify.json
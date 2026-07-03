Clear-Host

Write-Host ""
Write-Host "ERP DEVKIT"
Write-Host ""

$steps=@(

"run-tsc.ps1",

"run-eslint.ps1",

"run-build.ps1",

"run-knip.ps1",

"run-depcruise.ps1",

"run-madge.ps1",

"run-graphify.ps1",

"run-bundle.ps1",

"run-metrics.ps1",

"run-dashboard.ps1"

"run-ai.ps1"
)

foreach($s in $steps){

Write-Host ""
Write-Host "=================================="
Write-Host $s
Write-Host "=================================="

& ".\tools\scripts\$s"

}

powershell tools/scripts/run-feature-analysis.ps1
powershell tools/scripts/run-dependency-graph.ps1
powershell tools/scripts/run-graph-intelligence.ps1
Write-Host ""
Write-Host "Analysis Finished"
Write-Host "Bundle..."

npm run build

Get-ChildItem dist -Recurse |
Sort Length -Descending |
Select Name,Length |
ConvertTo-Json |
Out-File reports/json/bundle.json
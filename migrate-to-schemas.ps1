# migrate-to-schemas.ps1
# Usage: 
#   .\migrate-to-schemas.ps1          # Dry-run (report only)
#   .\migrate-to-schemas.ps1 -Apply   # Apply actual changes

param(
    [switch]$Apply
)

$tableMapping = @{
    "users"                  = "core.users"
    "roles"                  = "core.roles"
    "departments"            = "core.departments"
    "permission_mappings"    = "core.permission_mappings"
    "notifications"          = "core.notifications"
    "clients"                = "crm.clients"
    "client_contacts"        = "crm.client_contacts"
    "contracts"              = "contracts.contracts"
    "contract_amendments"    = "contracts.contract_amendments"
    "tariff_lines"           = "contracts.tariff_lines"
    "amendment_tariff_adjustments" = "contracts.amendment_tariff_adjustments"
    "projects"               = "projects.projects"
    "project_members"        = "projects.project_members"
    "site_representatives"   = "projects.site_representatives"
    "inspection_requests"    = "inspection.inspection_requests"
    "inspections"            = "inspection.inspections"
    "inspectors"             = "inspection.inspectors"
    "checklists"             = "inspection.checklists"
    "non_conformities"       = "inspection.non_conformities"
    "document_reviews"       = "inspection.document_reviews"
    "inspection_reports"     = "inspection.inspection_reports"
    "certificates"           = "inspection.certificates"
    "vendors"                = "inspection.vendors"
}

$srcPath = "src"
$files = Get-ChildItem -Path $srcPath -Recurse -Include "*.ts", "*.tsx"

$totalChanges = 0
$affectedFiles = @()

Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host "  Schema Migration Tool - Database Table Refactoring" -ForegroundColor Cyan
Write-Host "=========================================================`n" -ForegroundColor Cyan

if ($Apply) {
    Write-Host "[!] MODE: APPLY (Actual changes will be saved to files)" -ForegroundColor Yellow
} else {
    Write-Host "[*] MODE: DRY-RUN (Report only - no files will be modified)" -ForegroundColor Green
    Write-Host "    To apply changes, run: .\migrate-to-schemas.ps1 -Apply`n" -ForegroundColor Gray
}

Write-Host "---------------------------------------------------------" -ForegroundColor DarkGray

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $fileChanges = 0
    $changeDetails = @()
    
    foreach ($oldName in $tableMapping.Keys) {
        $newName = $tableMapping[$oldName]
        
        # Pattern 1: from('tableName')
        $simplePattern = "from\(\s*['""]$([regex]::Escape($oldName))['""]\s*\)"
        $matches = [regex]::Matches($content, $simplePattern)
        
        if ($matches.Count -gt 0) {
            $alreadyMigratedPattern = "from\(\s*['""]$([regex]::Escape($newName))['""]\s*\)"
            $alreadyMigrated = [regex]::Matches($content, $alreadyMigratedPattern)
            
            if ($alreadyMigrated.Count -eq 0 -and $matches.Count -gt 0) {
                $replacement = "from('$newName')"
                $content = [regex]::Replace($content, $simplePattern, $replacement)
                $fileChanges += $matches.Count
                $changeDetails += "  [TABLE] '$oldName' -> '$newName' ($($matches.Count) times)"
            }
        }
        
        # Pattern 2: relations like user:users(...)
        $relationPattern = ":\s*$([regex]::Escape($oldName))\("
        $relationMatches = [regex]::Matches($content, $relationPattern)
        
        if ($relationMatches.Count -gt 0) {
            $relationReplacement = ":$newName("
            $content = [regex]::Replace($content, $relationPattern, $relationReplacement)
            $fileChanges += $relationMatches.Count
            $changeDetails += "  [RELATION] '$oldName' -> '$newName' ($($relationMatches.Count) times)"
        }
    }
    
    if ($fileChanges -gt 0) {
        $totalChanges += $fileChanges
        $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
        $affectedFiles += [PSCustomObject]@{
            File = $relativePath
            Changes = $fileChanges
            Details = $changeDetails
        }
        
        if ($Apply) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "[OK] $relativePath" -ForegroundColor Green
        } else {
            Write-Host "[FILE] $relativePath ($fileChanges changes)" -ForegroundColor Yellow
        }
        
        foreach ($detail in $changeDetails) {
            Write-Host "       $detail" -ForegroundColor DarkGray
        }
    }
}

Write-Host "`n---------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "FINAL REPORT:" -ForegroundColor Cyan
Write-Host "   Files scanned      : $($files.Count)" -ForegroundColor White
Write-Host "   Files affected     : $($affectedFiles.Count)" -ForegroundColor White
Write-Host "   Total replacements : $totalChanges" -ForegroundColor White

if ($Apply) {
    Write-Host "`n[SUCCESS] Migration applied successfully!" -ForegroundColor Green
    Write-Host "          Now run: npm run check" -ForegroundColor Gray
} else {
    Write-Host "`n[INFO] This was a DRY-RUN. No files were changed." -ForegroundColor Yellow
    Write-Host "       To apply changes, run: .\migrate-to-schemas.ps1 -Apply" -ForegroundColor Gray
}

Write-Host "`n=========================================================`n" -ForegroundColor Cyan
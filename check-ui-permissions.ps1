# check-ui-permissions.ps1
$base = "D:\App\Backup\New folder\Prototype Inspection\src"

Write-Host "=== Checking UI Components ===" -ForegroundColor Cyan

# Check contract pages
Write-Host "`n[1] Contract Pages..." -ForegroundColor Yellow
$contractFiles = Get-ChildItem "$base\features\contract-management" -Recurse -Include "*.tsx" -File -ErrorAction SilentlyContinue
if ($contractFiles) {
    Write-Host "  Found $($contractFiles.Count) files"
    $contractFiles | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        $usesCan = $content -match "\bcan\("
        $usesGuard = $content -match "PermissionGuard"
        $usesRole = $content -match "user\.role|role ==="
        
        $rel = $_.FullName.Replace($base, "src")
        $status = ""
        if ($usesCan) { $status += "✅can " }
        if ($usesGuard) { $status += "✅Guard " }
        if ($usesRole) { $status += "⚠️role " }
        if (!$usesCan -and !$usesGuard -and !$usesRole) { $status = "❌ No permission check" }
        
        Write-Host "    $rel : $status" -ForegroundColor $(if ($usesCan -or $usesGuard) { "Green" } else { "Yellow" })
    }
} else {
    Write-Host "  [!!] No contract pages found!" -ForegroundColor Red
}

# Check client pages
Write-Host "`n[2] Client Pages..." -ForegroundColor Yellow
$clientFiles = Get-ChildItem "$base\features\client-management" -Recurse -Include "*.tsx" -File -ErrorAction SilentlyContinue
if ($clientFiles) {
    Write-Host "  Found $($clientFiles.Count) files"
    $clientFiles | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        $usesCan = $content -match "\bcan\("
        $usesGuard = $content -match "PermissionGuard"
        $usesRole = $content -match "user\.role|role ==="
        
        $rel = $_.FullName.Replace($base, "src")
        $status = ""
        if ($usesCan) { $status += "✅can " }
        if ($usesGuard) { $status += "✅Guard " }
        if ($usesRole) { $status += "⚠️role " }
        if (!$usesCan -and !$usesGuard -and !$usesRole) { $status = "❌ No permission check" }
        
        Write-Host "    $rel : $status" -ForegroundColor $(if ($usesCan -or $usesGuard) { "Green" } else { "Yellow" })
    }
} else {
    Write-Host "  [!!] No client pages found!" -ForegroundColor Red
}

# Check PermissionGuard implementation
Write-Host "`n[3] PermissionGuard.tsx..." -ForegroundColor Yellow
$guardFile = "$base\shared\authorization\ui\guards\PermissionGuard.tsx"
if (Test-Path $guardFile) {
    $content = Get-Content $guardFile -Raw
    if ($content -match "usePermission") {
        Write-Host "  [OK] Uses usePermission" -ForegroundColor Green
    } else {
        Write-Host "  [!!] Does NOT use usePermission!" -ForegroundColor Red
    }
} else {
    Write-Host "  [!!] File not found!" -ForegroundColor Red
}

Write-Host "`n=== Check Complete ===" -ForegroundColor Green
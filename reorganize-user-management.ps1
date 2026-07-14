# reorganize-user-management.ps1
# بازسازری ساختار user-management بر اساس تب‌ها

$ErrorActionPreference = "Stop"
$base = "D:\App\Backup\New folder\Prototype Inspection\src\shared\authorization"

Write-Host "=== Reorganizing User Management ===" -ForegroundColor Cyan

# Backup
$backup = "$base`_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item -Path "$base\ui\user-management" -Destination $backup -Recurse -Force
Write-Host "[OK] Backup: $backup" -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════════
# Step 1: Create new structure
# ═══════════════════════════════════════════════════════════════════

Write-Host "`n[Step 1] Creating new folders..." -ForegroundColor Yellow

$newDirs = @(
    "$base\ui\user-management\users\components",
    "$base\ui\user-management\users\modals",
    "$base\ui\user-management\users\skeletons",
    "$base\ui\user-management\departments\components",
    "$base\ui\user-management\departments\modals",
    "$base\ui\user-management\departments\skeletons",
    "$base\ui\user-management\permissions"
)

foreach ($dir in $newDirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  + $dir" -ForegroundColor Green
    }
}

# ═══════════════════════════════════════════════════════════════════
# Step 2: Move Users files
# ═══════════════════════════════════════════════════════════════════

Write-Host "`n[Step 2] Moving Users files..." -ForegroundColor Yellow

# Components
@("UserRow.tsx", "UserTable.tsx", "UsersTab.tsx") | ForEach-Object {
    $src = "$base\ui\user-management\components\$_"
    $dst = "$base\ui\user-management\users\components\$_"
    if (Test-Path $src) {
        Move-Item $src $dst -Force
        Write-Host "  > $_ -> users/components/" -ForegroundColor Green
    }
}

# Modals
@("UserModal.tsx", "UserPermissionsModal.tsx") | ForEach-Object {
    $src = "$base\ui\user-management\modals\$_"
    $dst = "$base\ui\user-management\users\modals\$_"
    if (Test-Path $src) {
        Move-Item $src $dst -Force
        Write-Host "  > $_ -> users/modals/" -ForegroundColor Green
    }
}

# Skeletons
$src = "$base\ui\user-management\components\skeletons\TableSkeleton.tsx"
$dst = "$base\ui\user-management\users\skeletons\TableSkeleton.tsx"
if (Test-Path $src) {
    Move-Item $src $dst -Force
    Write-Host "  > TableSkeleton.tsx -> users/skeletons/" -ForegroundColor Green
}

# ═══════════════════════════════════════════════════════════════════
# Step 3: Move Departments files
# ═══════════════════════════════════════════════════════════════════

Write-Host "`n[Step 3] Moving Departments files..." -ForegroundColor Yellow

# Components
@("DepartmentCard.tsx", "DepartmentsTab.tsx", "DepartmentSelect.tsx") | ForEach-Object {
    $src = "$base\ui\user-management\components\$_"
    $dst = "$base\ui\user-management\departments\components\$_"
    if (Test-Path $src) {
        Move-Item $src $dst -Force
        Write-Host "  > $_ -> departments/components/" -ForegroundColor Green
    }
}

# Modals
@("DepartmentModal.tsx", "DepartmentUsersModal.tsx") | ForEach-Object {
    $src = "$base\ui\user-management\modals\$_"
    $dst = "$base\ui\user-management\departments\modals\$_"
    if (Test-Path $src) {
        Move-Item $src $dst -Force
        Write-Host "  > $_ -> departments/modals/" -ForegroundColor Green
    }
}

# Skeletons
$src = "$base\ui\user-management\components\skeletons\DepartmentCardSkeleton.tsx"
$dst = "$base\ui\user-management\departments\skeletons\DepartmentCardSkeleton.tsx"
if (Test-Path $src) {
    Move-Item $src $dst -Force
    Write-Host "  > DepartmentCardSkeleton.tsx -> departments/skeletons/" -ForegroundColor Green
}

# ═══════════════════════════════════════════════════════════════════
# Step 4: Move Permissions (permission-manager)
# ═══════════════════════════════════════════════════════════════════

Write-Host "`n[Step 4] Moving Permissions..." -ForegroundColor Yellow

# Move entire permission-manager folder
$src = "$base\ui\permission-manager"
$dst = "$base\ui\user-management\permissions"

if (Test-Path $src) {
    # Copy contents
    Get-ChildItem $src -Recurse | ForEach-Object {
        $rel = $_.FullName.Replace($src, "")
        $newPath = "$dst$rel"
        if ($_.PSIsContainer) {
            if (!(Test-Path $newPath)) {
                New-Item -ItemType Directory -Path $newPath -Force | Out-Null
            }
        } else {
            Move-Item $_.FullName $newPath -Force
        }
    }
    
    # Remove old folder
    Remove-Item $src -Force -Recurse
    Write-Host "  [OK] permission-manager -> permissions/" -ForegroundColor Green
}

# ═══════════════════════════════════════════════════════════════════
# Step 5: Move UserManagementTabs to shared components
# ═══════════════════════════════════════════════════════════════════

Write-Host "`n[Step 5] Moving shared components..." -ForegroundColor Yellow

$src = "$base\ui\user-management\components\UserManagementTabs.tsx"
$dst = "$base\ui\user-management\components\UserManagementTabs.tsx"

if (Test-Path $src) {
    # Already in right place, just ensure components folder exists
    if (!(Test-Path "$base\ui\user-management\components")) {
        New-Item -ItemType Directory -Path "$base\ui\user-management\components" -Force | Out-Null
    }
    Write-Host "  [OK] UserManagementTabs.tsx in place" -ForegroundColor Green
}

# ═══════════════════════════════════════════════════════════════════
# Step 6: Cleanup empty folders
# ═══════════════════════════════════════════════════════════════════

Write-Host "`n[Step 6] Cleanup..." -ForegroundColor Yellow

# Remove empty modals folder
$modalsDir = "$base\ui\user-management\modals"
if (Test-Path $modalsDir) {
    $files = Get-ChildItem $modalsDir -File -ErrorAction SilentlyContinue
    if (!$files -or $files.Count -eq 0) {
        Remove-Item $modalsDir -Force -Recurse
        Write-Host "  - Removed empty modals/" -ForegroundColor DarkGray
    }
}

# Remove empty skeletons folder
$skeletonsDir = "$base\ui\user-management\components\skeletons"
if (Test-Path $skeletonsDir) {
    $files = Get-ChildItem $skeletonsDir -File -ErrorAction SilentlyContinue
    if (!$files -or $files.Count -eq 0) {
        Remove-Item $skeletonsDir -Force -Recurse
        Write-Host "  - Removed empty components/skeletons/" -ForegroundColor DarkGray
    }
}

# ═══════════════════════════════════════════════════════════════════
# Step 7: Update imports
# ═══════════════════════════════════════════════════════════════════

Write-Host "`n[Step 7] Updating imports..." -ForegroundColor Yellow

$allFiles = Get-ChildItem "$base\.." -Recurse -Include "*.ts","*.tsx" -File |
    Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*_backup_*" }

$updated = 0

foreach ($file in $allFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if (!$content) { continue }
    
    $original = $content
    $changed = $false
    
    # Fix relative imports in moved files
    if ($file.FullName -like "*user-management\users\components\*") {
        $content = $content -replace "from '\.\./\.\./config/RoleConfig'", "from '../../../../config/RoleConfig'"
        $content = $content -replace 'from "\.\./\.\./config/RoleConfig"', 'from "../../../../config/RoleConfig"'
        $changed = $true
    }
    
    if ($file.FullName -like "*user-management\users\modals\*") {
        $content = $content -replace "from '\.\./\.\./\.\./services/", "from '../../../../services/"
        $content = $content -replace 'from "\.\./\.\./\.\./services/', 'from "../../../../services/'
        $content = $content -replace "from '\.\./\.\./\.\./config/", "from '../../../../config/"
        $content = $content -replace 'from "\.\./\.\./\.\./config/', 'from "../../../../config/'
        $content = $content -replace "from '\.\./\.\./\.\./hooks/", "from '../../../../hooks/"
        $content = $content -replace 'from "\.\./\.\./\.\./hooks/', 'from "../../../../hooks/'
        $content = $content -replace "from '\.\./\.\./\.\./utils/", "from '../../../../utils/"
        $content = $content -replace 'from "\.\./\.\./\.\./utils/', 'from "../../../../utils/'
        $content = $content -replace "from '\.\./\.\./\.\./types'", "from '../../../../types'"
        $content = $content -replace 'from "\.\./\.\./\.\./types"', 'from "../../../../types"'
        $changed = $true
    }
    
    if ($file.FullName -like "*user-management\departments\components\*") {
        $content = $content -replace "from '\.\./\.\./config/RoleConfig'", "from '../../../../config/RoleConfig'"
        $content = $content -replace 'from "\.\./\.\./config/RoleConfig"', 'from "../../../../config/RoleConfig"'
        $changed = $true
    }
    
    if ($file.FullName -like "*user-management\departments\modals\*") {
        $content = $content -replace "from '\.\./\.\./\.\./services/", "from '../../../../services/"
        $content = $content -replace 'from "\.\./\.\./\.\./services/', 'from "../../../../services/'
        $content = $content -replace "from '\.\./\.\./\.\./config/", "from '../../../../config/"
        $content = $content -replace 'from "\.\./\.\./\.\./config/', 'from "../../../../config/'
        $content = $content -replace "from '\.\./\.\./\.\./hooks/", "from '../../../../hooks/"
        $content = $content -replace 'from "\.\./\.\./\.\./hooks/', 'from "../../../../hooks/'
        $changed = $true
    }
    
    if ($file.FullName -like "*user-management\permissions\components\*") {
        $content = $content -replace "from '\.\./\.\./\.\./\.\./services/", "from '../../../../services/"
        $content = $content -replace 'from "\.\./\.\./\.\./\.\./services/', 'from "../../../../services/'
        $content = $content -replace "from '\.\./\.\./\.\./\.\./ui-elements", "from '../../ui-elements"
        $content = $content -replace 'from "\.\./\.\./\.\./\.\./ui-elements', 'from "../../ui-elements'
        $changed = $true
    }
    
    # Update UserManagement.tsx imports
    if ($file.FullName -like "*ui\UserManagement.tsx") {
        $content = $content -replace 'from "\./user-management/modals/UserModal"', 'from "./user-management/users/modals/UserModal"'
        $content = $content -replace 'from "\./user-management/modals/DepartmentModal"', 'from "./user-management/departments/modals/DepartmentModal"'
        $content = $content -replace 'from "\./user-management/modals/UserPermissionsModal"', 'from "./user-management/users/modals/UserPermissionsModal"'
        $content = $content -replace 'from "\./user-management/modals/DepartmentUsersModal"', 'from "./user-management/departments/modals/DepartmentUsersModal"'
        $changed = $true
    }
    
    if ($changed -and $content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        $rel = $file.FullName.Replace("D:\App\Backup\New folder\Prototype Inspection\src\", "")
        Write-Host "  > $rel" -ForegroundColor Green
        $updated++
    }
}

# ═══════════════════════════════════════════════════════════════════
# Step 8: Update index.ts
# ═══════════════════════════════════════════════════════════════════

Write-Host "`n[Step 8] Updating index.ts..." -ForegroundColor Yellow

$indexFile = "$base\ui\user-management\index.ts"
if (Test-Path $indexFile) {
    $content = @"
// src/shared/authorization/ui/user-management/index.ts

export * from './types';

// Users
export { UserRow } from './users/components/UserRow';
export { UserTable } from './users/components/UserTable';
export { UsersTab } from './users/components/UsersTab';

// Departments
export { DepartmentCard } from './departments/components/DepartmentCard';
export { DepartmentsTab } from './departments/components/DepartmentsTab';
export { DepartmentSelect } from './departments/components/DepartmentSelect';

// Shared
export { UserManagementTabs } from './components/UserManagementTabs';

// Skeletons
export { TableSkeleton } from './users/skeletons/TableSkeleton';
export { DepartmentCardSkeleton } from './departments/skeletons/DepartmentCardSkeleton';
"@
    [System.IO.File]::WriteAllText($indexFile, $content, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] Updated index.ts" -ForegroundColor Green
}

Write-Host "`n=== Reorganization Complete ===" -ForegroundColor Green
Write-Host "Updated: $updated files" -ForegroundColor Cyan
Write-Host "Next: Run npm run check" -ForegroundColor Cyan
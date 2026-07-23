# setup-enterprise-structure.ps1
# فقط فولدر می‌سازد، هیچ فایلی ایجاد یا بازنویسی نمی‌کند

param(
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

$modules = @(
    "client-management",
    "contract-management",
    "inspector-managment"
)

$subFolders = @(
    "application",
    "application/dto",
    "domain",
    "domain/models",
    "hooks",
    "repositories",
    "services",
    "ui",
    "ui/details",
    "utils"
)

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host ">> $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "   [OK] $Message" -ForegroundColor Green
}

function Write-Skip {
    param([string]$Message)
    Write-Host "   [--] $Message (exists)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Magenta
Write-Host "  Enterprise Folder Structure Setup" -ForegroundColor Magenta
Write-Host "===========================================================" -ForegroundColor Magenta

if ($DryRun) {
    Write-Host ""
    Write-Host "DRY RUN MODE - No folders will be created" -ForegroundColor Yellow
    Write-Host ""
}

$totalCreated = 0
$totalSkipped = 0

foreach ($module in $modules) {
    $modulePath = Join-Path "src/features" $module
    
    Write-Step "Module: $module"
    
    if (-not (Test-Path $modulePath)) {
        if (-not $DryRun) {
            New-Item -ItemType Directory -Path $modulePath -Force | Out-Null
        }
        Write-Success "Created: $modulePath"
        $totalCreated++
    } else {
        Write-Skip "$modulePath"
        $totalSkipped++
    }
    
    foreach ($sub in $subFolders) {
        $folderPath = Join-Path $modulePath $sub
        
        if (-not (Test-Path $folderPath)) {
            if (-not $DryRun) {
                New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
            }
            Write-Success "Created: $sub"
            $totalCreated++
        } else {
            Write-Skip "$sub"
            $totalSkipped++
        }
    }
}

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green
Write-Host "  Created: $totalCreated folder(s)" -ForegroundColor Green
Write-Host "  Skipped: $totalSkipped folder(s) (already exist)" -ForegroundColor DarkGray

Write-Host ""
Write-Host "Final structure for each module:" -ForegroundColor Cyan
Write-Host "  +-- application/" -ForegroundColor White
Write-Host "  |   +-- dto/" -ForegroundColor White
Write-Host "  +-- domain/" -ForegroundColor White
Write-Host "  |   +-- models/" -ForegroundColor White
Write-Host "  +-- hooks/" -ForegroundColor White
Write-Host "  +-- repositories/" -ForegroundColor White
Write-Host "  +-- services/" -ForegroundColor White
Write-Host "  +-- ui/" -ForegroundColor White
Write-Host "  |   +-- details/" -ForegroundColor White
Write-Host "  +-- utils/" -ForegroundColor White
Write-Host ""
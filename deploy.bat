@echo off
cd /d "%~dp0"
title ERP Smart Deploy

echo ======================================
echo          ERP SMART DEPLOY
echo ======================================
echo.

:: Check for changes
git status --porcelain > temp.txt
for %%A in (temp.txt) do (
    if %%~zA==0 (
        del temp.txt
        echo No changes detected.
        pause
        exit /b
    )
)
del temp.txt

echo [1/6] Running TypeScript checks...
call npm run typecheck
if errorlevel 1 (
    echo.
    echo TypeScript errors found.
    pause
    exit /b
)

echo.
echo [2/6] Running ESLint...
call npm run lint
if errorlevel 1 (
    echo.
    echo ESLint errors found.
    pause
    exit /b
)

echo.
echo [3/6] Building project...
call npm run build
if errorlevel 1 (
    echo.
    echo Build failed.
    pause
    exit /b
)

echo.
git status

echo.
set /p msg=Commit message:

if "%msg%"=="" (
    for /f "tokens=1-3 delims=/.- " %%a in ("%date%") do set d=%%c-%%a-%%b
    for /f "tokens=1-2 delims=:." %%a in ("%time%") do set t=%%a-%%b
    set msg=Auto deploy %d% %t%
)

echo.
echo [4/6] Adding files...
git add .

echo.
echo [5/6] Creating commit...
git commit -m "%msg%"
if errorlevel 1 (
    echo.
    echo Nothing to commit.
    pause
    exit /b
)

echo.
echo [6/6] Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo.
    echo Push failed.
    pause
    exit /b
)

echo.
echo ======================================
echo GitHub Push Successful
echo Vercel deployment has started...
echo ======================================

start https://github.com/mojtabaaomidvar/erpoi
start https://vercel.com/dashboard

pause
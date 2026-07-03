@echo off
setlocal EnableDelayedExpansion

title ERP Architecture Intelligence
color 0B

echo.
echo ==============================================
echo        ERP ARCHITECTURE INTELLIGENCE
echo ==============================================
echo.

set ROOT=%~dp0..
set REPORTS=%ROOT%\reports

if not exist "%REPORTS%" mkdir "%REPORTS%"
if not exist "%REPORTS%\dependency" mkdir "%REPORTS%\dependency"
if not exist "%REPORTS%\graphify" mkdir "%REPORTS%\graphify"
if not exist "%REPORTS%\metrics" mkdir "%REPORTS%\metrics"
if not exist "%REPORTS%\history" mkdir "%REPORTS%\history"
if not exist "%REPORTS%\bundle" mkdir "%REPORTS%\bundle"
if not exist "%REPORTS%\json" mkdir "%REPORTS%\json"
if not exist "%REPORTS%\html" mkdir "%REPORTS%\html"

echo.
echo ==============================================
echo [1/8] TypeScript
echo ==============================================

call powershell -ExecutionPolicy Bypass -File "%ROOT%\scripts\run-tsc.ps1"

if errorlevel 1 goto failed

echo.
echo ==============================================
echo [2/8] ESLint
echo ==============================================

call powershell -ExecutionPolicy Bypass -File "%ROOT%\scripts\run-eslint.ps1"

if errorlevel 1 goto failed

echo.
echo ==============================================
echo [3/8] Build
echo ==============================================

call powershell -ExecutionPolicy Bypass -File "%ROOT%\scripts\run-build.ps1"

if errorlevel 1 goto failed

echo.
echo ==============================================
echo [4/8] Dependency Cruiser
echo ==============================================

call powershell -ExecutionPolicy Bypass -File "%ROOT%\scripts\run-depcruise.ps1"

echo.
echo ==============================================
echo [5/8] Knip
echo ==============================================

call powershell -ExecutionPolicy Bypass -File "%ROOT%\scripts\run-knip.ps1"

echo.
echo ==============================================
echo [6/8] Madge
echo ==============================================

call powershell -ExecutionPolicy Bypass -File "%ROOT%\scripts\run-madge.ps1"

echo.
echo ==============================================
echo [7/8] Graphify
echo ==============================================

call powershell -ExecutionPolicy Bypass -File "%ROOT%\scripts\run-graphify.ps1"

echo.
echo ==============================================
echo [8/8] Metrics Engine
echo ==============================================

call powershell -ExecutionPolicy Bypass -File "%ROOT%\scripts\run-metrics.ps1"

echo.
echo ==============================================
echo           ANALYSIS FINISHED
echo ==============================================

echo.
echo Reports saved to:
echo.
echo %REPORTS%
echo.

pause
exit /b 0

:failed

echo.
echo ==============================================
echo ANALYSIS FAILED
echo ==============================================

pause
exit /b 1
@echo off
title ERP Architecture Analyzer
color 0B

echo.
echo ==========================================
echo        ERP PROJECT ANALYZER
echo ==========================================
echo.

if not exist reports mkdir reports
if not exist reports\graphify mkdir reports\graphify
if not exist reports\dependency-cruiser mkdir reports\dependency-cruiser

:: ---------------------------------------------------
:: TypeScript
:: ---------------------------------------------------

echo.
echo [1/6] TypeScript
echo ----------------------------

call npm run typecheck

if errorlevel 1 (
    echo.
    echo TypeScript FAILED
    pause
    exit /b
)

:: ---------------------------------------------------
:: ESLint
:: ---------------------------------------------------

echo.
echo [2/6] ESLint
echo ----------------------------

call npm run lint

if errorlevel 1 (
    echo.
    echo ESLint FAILED
    pause
    exit /b
)

:: ---------------------------------------------------
:: Production Build
:: ---------------------------------------------------

echo.
echo [3/6] Production Build
echo ----------------------------

call npm run build

if errorlevel 1 (
    echo.
    echo Build FAILED
    pause
    exit /b
)

:: ---------------------------------------------------
:: Graphify
:: ---------------------------------------------------

echo.
echo [4/6] Graphify
echo ----------------------------

graphify . --mode code --wiki --output reports\graphify

:: ---------------------------------------------------
:: Dependency Cruiser
:: ---------------------------------------------------

echo.
echo [5/6] Dependency Cruiser
echo ----------------------------

call npx depcruise src ^
 --config .dependency-cruiser.cjs ^
 --include-only "^src" ^
 --output-type err ^
 > reports\dependency-cruiser\dependency-report.txt

call npx depcruise src ^
 --config .dependency-cruiser.cjs ^
 --include-only "^src" ^
 --output-type json ^
 > reports\dependency-cruiser\architecture.json

call npx depcruise src ^
 --config .dependency-cruiser.cjs ^
 --include-only "^src" ^
 --output-type dot ^
 > reports\dependency-cruiser\architecture.dot

:: ---------------------------------------------------
:: Finish
:: ---------------------------------------------------

echo.
echo [6/6] Finished
echo ----------------------------

echo.
echo ==========================================
echo          ANALYSIS COMPLETED
echo ==========================================
echo.

echo Reports Folder:
echo.
echo reports\
echo    graphify\
echo    dependency-cruiser\
echo.

pause
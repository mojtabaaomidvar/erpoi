@echo off
echo ========================================
echo    Deploying to GitHub and Vercel
echo ========================================
echo.

echo [1/4] Adding files...
git add .

echo [2/4] Committing changes...
git commit -m "Auto deploy: %date% %time%"

echo [3/4] Pushing to GitHub...
git push origin main

echo [4/4] Deploying to Vercel...
vercel --prod --yes

echo.
echo ========================================
echo    Deployment Complete!
echo ========================================
pause
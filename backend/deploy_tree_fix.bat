@echo off
echo ====================================
echo Deploying Binary Tree Fix
echo ====================================
echo.

echo Uploading referral_tree.py...
scp "c:\Techneysoft apps\Avenza\backend\app\routes\referral_tree.py" root@148.135.138.145:/var/www/avenza/backend/app/routes/
if errorlevel 1 (
    echo ERROR: Failed to upload file
    pause
    exit /b 1
)

echo.
echo Restarting backend service...
ssh root@148.135.138.145 "sudo systemctl restart avenza && sudo systemctl status avenza --no-pager -l"

echo.
echo ====================================
echo Deployment Complete!
echo ====================================
echo.
echo Changes:
echo - Binary tree now loads ALL levels recursively
echo - Extreme left and right positions will now show
echo - No more "Loading..." for existing nodes
echo.
pause

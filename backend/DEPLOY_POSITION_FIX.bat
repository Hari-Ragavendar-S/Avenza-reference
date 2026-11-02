@echo off
echo ============================================
echo Deploying Position Placement Fix
echo ============================================
echo.

echo Uploading auth.py...
scp "c:\Techneysoft apps\Avenza\backend\app\routes\auth.py" root@148.135.138.145:/var/www/avenza/backend/app/routes/
if errorlevel 1 (
    echo ERROR: Failed to upload file
    pause
    exit /b 1
)

echo.
echo Restarting backend service...
ssh root@148.135.138.145 "sudo systemctl restart avenza && sudo systemctl status avenza --no-pager -l"

echo.
echo ============================================
echo ✅ DEPLOYMENT COMPLETE!
echo ============================================
echo.
echo FIX APPLIED:
echo - RIGHT link members now go ONLY in RIGHT positions
echo - LEFT link members now go ONLY in LEFT positions  
echo - No more cross-placement (right-left-right pattern)
echo - Creates straight vertical lines in each leg
echo.
echo EXAMPLE:
echo - 5 people using RIGHT link = all go straight down right leg
echo - 5 people using LEFT link = all go straight down left leg
echo.
pause

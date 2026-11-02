# Deploy Wallet Auth Fix to VPS

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          DEPLOYING WALLET AUTH FIX TO VPS                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$vpsHost = "root@148.135.138.145"
$backendPath = "/var/www/avenza/backend"

# Upload wallet_auth schema
Write-Host "📤 Uploading wallet_auth.py schema..." -ForegroundColor Yellow
scp "app\schemas\wallet_auth.py" "${vpsHost}:${backendPath}/app/schemas/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to upload schema" -ForegroundColor Red
    exit 1
}

# Upload wallet_auth route
Write-Host "📤 Uploading wallet_auth.py route..." -ForegroundColor Yellow
scp "app\routes\wallet_auth.py" "${vpsHost}:${backendPath}/app/routes/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Route uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to upload route" -ForegroundColor Red
    exit 1
}

# Restart service
Write-Host "🔄 Restarting backend service..." -ForegroundColor Yellow
ssh $vpsHost "systemctl restart avenza"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Service restarted" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to restart service" -ForegroundColor Red
    exit 1
}

# Check service status
Write-Host ""
Write-Host "📊 Checking service status..." -ForegroundColor Yellow
ssh $vpsHost "systemctl status avenza --no-pager -l | head -20"

Write-Host ""
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Test the API endpoints:" -ForegroundColor Cyan
Write-Host "   POST https://avenza.live/api/auth/wallet-nonce" -ForegroundColor Gray
Write-Host "   POST https://avenza.live/api/auth/wallet-login" -ForegroundColor Gray
Write-Host ""

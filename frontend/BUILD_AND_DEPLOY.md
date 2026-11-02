# 🚀 Build & Deploy Frontend - Quick Guide

## Step 1: Build Frontend

Open command prompt and run:

```bash
cd "c:\Techneysoft apps\Avenza\frontend"
npm run build
```

**Expected Output:**
```
✓ 884 modules transformed.
dist/index.html                     0.62 kB
dist/assets/index-XXXXX.css        XX.XX kB
dist/assets/index-XXXXX.js         XXX.XX kB
✓ built in X.XXs
```

---

## Step 2: Upload to VPS

### Using FileZilla or WinSCP:

1. Connect to: `148.135.138.145`
2. Navigate to: `/var/www/avenza/frontend/`
3. Delete old `dist` folder
4. Upload new `dist` folder from:
   ```
   c:\Techneysoft apps\Avenza\frontend\dist
   ```

---

## Step 3: Test on Live Site

### Open in Browser:
```
https://avenza.live
```

### Test User Flow:
1. Login as user
2. Navigate to "Investment Plans" (sidebar)
3. View 6 packages (Bronze, Silver, Gold, Diamond, Platinum, Elite)
4. Tap a package
5. Check balance validation
6. Invest (if balance available)
7. View "My Packages"
8. Check progress bar

### Test Admin Flow:
1. Login as admin: `admin@avenza.live` / `avenza`
2. Navigate to "Investment Plans"
3. View packages with user counts
4. Click "EDIT PACKAGE"
5. Update details
6. Confirm changes
7. Verify changes visible to users

---

## 🧪 Quick Tests

### Test 1: View Plans (User)
```
URL: https://avenza.live/plans
Expected: 6 package cards visible
```

### Test 2: Investment Enrollment
```
URL: https://avenza.live/invest
Expected: Payment page with balance check
```

### Test 3: My Packages
```
URL: https://avenza.live/my-packages
Expected: Active investments with progress bars
```

### Test 4: Admin Plans
```
URL: https://avenza.live/admin/plans
Expected: Packages with statistics
```

---

## 🔍 Troubleshooting

### Issue: Blank page after build
**Solution:**
- Check browser console for errors
- Verify API endpoints are accessible
- Check nginx configuration

### Issue: API calls failing
**Solution:**
- Verify backend is running: `sudo systemctl status avenza`
- Check backend logs: `sudo journalctl -u avenza -f`
- Test API directly: `curl https://avenza.live/api/packages`

### Issue: 404 errors
**Solution:**
- Verify nginx configuration for SPA routing
- Check dist folder uploaded correctly

---

## ✅ Deployment Checklist

- [ ] Frontend built successfully
- [ ] Dist folder uploaded to VPS
- [ ] Old dist folder replaced
- [ ] Site loads at avenza.live
- [ ] User login works
- [ ] Investment Plans page loads
- [ ] Package cards visible
- [ ] Investment enrollment works
- [ ] My Packages shows data
- [ ] Admin login works
- [ ] Admin Plans page loads
- [ ] Edit package works
- [ ] Mobile responsive

---

## 🎉 Success!

If all tests pass, the Investment Package System is **fully deployed and operational**!

**Features Live:**
- ✅ 6 Investment Packages
- ✅ Mobile-friendly UI
- ✅ Investment Enrollment
- ✅ Progress Tracking
- ✅ Admin Management
- ✅ Daily Profit Cron Job
- ✅ 2x Profit Cap

**Next:** Monitor cron job execution tomorrow at 12:01 AM IST to verify daily profits are credited!

---

## 📊 Monitor Cron Job

Check cron logs:
```bash
ssh root@148.135.138.145
tail -f /var/www/avenza/backend/logs/cron_daily_profit.log
```

The cron will show output like:
```
🚀 Starting daily profit calculation - 2026-09-09 12:01:00 AM IST
📊 Found X active investments to process
💰 Investment #1 (User: username, Package: Bronze) - Credited $0.25
✨ Daily profit calculation completed!
```

---

**Deployment Complete!** 🎊

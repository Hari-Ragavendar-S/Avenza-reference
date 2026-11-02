# Investment System Deployment Instructions

## 📦 Files to Upload to VPS

Upload these files to VPS at `/var/www/avenza/backend/`:

1. **Migration Script:**
   - `migrations/investment_setup.py`

2. **Schema Files:**
   - `app/schemas/investment.py`

3. **Route Files:**
   - `app/routes/investment.py`

4. **Updated Main File:**
   - `app/main.py` (updated with investment routes)

5. **Cron Job Script:**
   - `cron_daily_profit.py`

---

## 🚀 Deployment Steps

### Step 1: Upload Files to VPS

Using FileZilla or SCP, upload the above files to the VPS.

### Step 2: SSH into VPS

```bash
ssh root@148.135.138.145
```

### Step 3: Navigate to Backend Directory

```bash
cd /var/www/avenza/backend
```

### Step 4: Activate Virtual Environment

```bash
source venv/bin/activate
```

### Step 5: Run Database Migration

```bash
python migrations/investment_setup.py
```

**Expected Output:**
```
🚀 Starting investment package system setup...

Creating investment_packages table...
✅ Investment packages table created

Inserting default investment packages...
✅ Default packages inserted

Creating user_investments table...
✅ User investments table created

Creating investment_transactions table...
✅ Investment transactions table created

Creating indexes...
✅ Indexes created

Creating IST timestamp triggers...
✅ IST timestamp triggers created

Creating IST created_at default function...
✅ IST created_at defaults set

✨ Investment package system setup complete!

📋 Summary:
- Created investment_packages table with 6 default packages
- Created user_investments table
- Created investment_transactions table
- Created indexes for performance
- Created IST timestamp triggers

📦 Default Packages:
  - Bronze: $50.0 | 0.5% daily | active
  - Silver: $100.0 | 0.6% daily | active
  - Gold: $300.0 | 0.7% daily | active
  - Diamond: $1000.0 | 0.8% daily | active
  - Platinum: $3000.0 | 0.9% daily | active
  - Elite: $5000.0 | 1.0% daily | active
```

### Step 6: Restart Backend Service

```bash
sudo systemctl restart avenza
```

### Step 7: Check Backend Status

```bash
sudo systemctl status avenza
```

### Step 8: View Backend Logs

```bash
sudo journalctl -u avenza -f
```

**Look for:**
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8028
```

### Step 9: Test API Endpoints

Test if investment routes are working:

```bash
# Get active packages
curl https://avenza.live/api/packages

# Health check
curl https://avenza.live/api/health
```

### Step 10: Set Up Cron Job

```bash
# Make cron script executable
chmod +x /var/www/avenza/backend/cron_daily_profit.py

# Create logs directory
mkdir -p /var/www/avenza/backend/logs

# Test cron script manually
python cron_daily_profit.py

# Open crontab
crontab -e

# Add this line (runs daily at 12:01 AM IST):
1 0 * * * cd /var/www/avenza/backend && /var/www/avenza/backend/venv/bin/python /var/www/avenza/backend/cron_daily_profit.py >> /var/www/avenza/backend/logs/cron_daily_profit.log 2>&1

# Verify cron is set
crontab -l
```

---

## 🧪 Testing

### Test 1: Get Active Packages
```bash
curl https://avenza.live/api/packages
```

**Expected Response:**
```json
{
  "success": true,
  "packages": [
    {
      "id": 1,
      "name": "Bronze",
      "amount": 50.0,
      "daily_profit_percentage": 0.5,
      "status": "active"
    },
    ...
  ]
}
```

### Test 2: Check Admin Packages (requires admin token)
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://avenza.live/api/admin/packages
```

### Test 3: Manual Cron Test
```bash
cd /var/www/avenza/backend
source venv/bin/activate
python cron_daily_profit.py
```

---

## 📊 Database Verification

Check if tables are created:

```bash
psql -U avenzauser -d avenzaweb
```

```sql
-- Check investment_packages table
SELECT * FROM investment_packages;

-- Check user_investments table structure
\d user_investments

-- Check investment_transactions table structure
\d investment_transactions

-- Exit
\q
```

---

## 🔍 Monitoring

### Monitor Backend Logs:
```bash
sudo journalctl -u avenza -f
```

### Monitor Cron Logs:
```bash
tail -f /var/www/avenza/backend/logs/cron_daily_profit.log
```

### Check Cron Status:
```bash
sudo systemctl status cron
```

---

## 🆘 Troubleshooting

### Backend Not Starting:

```bash
# Check for errors
sudo journalctl -u avenza -n 50

# Check if port is in use
sudo netstat -tulpn | grep 8028

# Restart backend
sudo systemctl restart avenza
```

### Database Connection Errors:

```bash
# Check .env file
cat /var/www/avenza/backend/.env

# Test database connection
psql -U avenzauser -d avenzaweb -c "SELECT 1"
```

### Cron Not Running:

```bash
# Check cron service
sudo systemctl status cron

# Start cron
sudo systemctl start cron

# View cron logs
sudo grep CRON /var/log/syslog
```

---

## ✅ Deployment Checklist

- [ ] Upload all files to VPS
- [ ] Run database migration script
- [ ] Verify tables created in database
- [ ] Restart backend service
- [ ] Check backend logs for errors
- [ ] Test API endpoints
- [ ] Set up cron job
- [ ] Test cron script manually
- [ ] Verify cron is scheduled
- [ ] Monitor cron logs

---

## 🎉 Success Indicators

✅ Migration script runs without errors  
✅ 6 packages inserted into database  
✅ Backend starts successfully  
✅ API endpoints return data  
✅ Cron job scheduled in crontab  
✅ Cron script runs manually without errors  
✅ All tables visible in database  

---

## 📝 Next Steps

After deployment is successful:

1. Update frontend to integrate with new API endpoints
2. Test investment enrollment flow
3. Test package display in user panel
4. Test admin package management
5. Monitor cron job execution for first few days
6. Verify profits are credited correctly

---

## 🔗 API Endpoints Reference

### User Endpoints:
- `GET /api/packages` - Get active packages
- `POST /api/investment/enroll` - Enroll in package
- `GET /api/investment/my-packages` - Get user's investments
- `GET /api/investment/{id}/transactions` - Get investment transactions

### Admin Endpoints:
- `GET /api/admin/packages` - Get all packages with stats
- `PUT /api/admin/package/{id}` - Update package
- `POST /api/admin/package` - Create new package

---

**Deployment Time:** ~15-20 minutes  
**Difficulty:** Medium  
**Risk Level:** Low (all changes are additive)

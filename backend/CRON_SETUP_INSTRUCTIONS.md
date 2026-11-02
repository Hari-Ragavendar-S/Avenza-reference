# Cron Job Setup Instructions

## Daily Profit Calculation Cron Job

This cron job runs daily to calculate and credit investment profits to users' INCOME WALLET.

### Step 1: Make the script executable

```bash
chmod +x /var/www/avenza/backend/cron_daily_profit.py
```

### Step 2: Test the cron script manually

```bash
cd /var/www/avenza/backend
source venv/bin/activate
python cron_daily_profit.py
```

### Step 3: Set up the cron job

Open crontab editor:
```bash
crontab -e
```

Add this line to run daily at 12:01 AM IST:
```
1 0 * * * cd /var/www/avenza/backend && /var/www/avenza/backend/venv/bin/python /var/www/avenza/backend/cron_daily_profit.py >> /var/www/avenza/backend/logs/cron_daily_profit.log 2>&1
```

**Explanation:**
- `1 0 * * *` - Runs at 12:01 AM every day
- `cd /var/www/avenza/backend` - Change to backend directory
- `/var/www/avenza/backend/venv/bin/python` - Use virtual environment Python
- `/var/www/avenza/backend/cron_daily_profit.py` - Run the script
- `>> /var/www/avenza/backend/logs/cron_daily_profit.log 2>&1` - Log output

### Step 4: Create logs directory

```bash
mkdir -p /var/www/avenza/backend/logs
```

### Step 5: Verify cron is set up

```bash
crontab -l
```

### Step 6: Monitor cron logs

```bash
tail -f /var/www/avenza/backend/logs/cron_daily_profit.log
```

---

## Alternative: Run at Different Times

**Run at 1:00 AM IST:**
```
0 1 * * * cd /var/www/avenza/backend && /var/www/avenza/backend/venv/bin/python /var/www/avenza/backend/cron_daily_profit.py >> /var/www/avenza/backend/logs/cron_daily_profit.log 2>&1
```

**Run at 6:00 AM IST:**
```
0 6 * * * cd /var/www/avenza/backend && /var/www/avenza/backend/venv/bin/python /var/www/avenza/backend/cron_daily_profit.py >> /var/www/avenza/backend/logs/cron_daily_profit.log 2>&1
```

**Run twice a day (12:01 AM and 12:01 PM):**
```
1 0,12 * * * cd /var/www/avenza/backend && /var/www/avenza/backend/venv/bin/python /var/www/avenza/backend/cron_daily_profit.py >> /var/www/avenza/backend/logs/cron_daily_profit.log 2>&1
```

---

## What the Cron Job Does

1. ✅ Finds all active investments that haven't reached 2x profit
2. ✅ Skips investments already processed today
3. ✅ Calculates daily profit based on package percentage
4. ✅ Credits profit to user's INCOME WALLET
5. ✅ Records transaction in investment_transactions table
6. ✅ Records transaction in main transactions table
7. ✅ Updates last_profit_date to today
8. ✅ Marks investment as 'completed' when 2x profit reached
9. ✅ Logs all operations with detailed summary

---

## Troubleshooting

### Check if cron is running:
```bash
sudo systemctl status cron
```

### Start cron if stopped:
```bash
sudo systemctl start cron
```

### View system cron logs:
```bash
sudo grep CRON /var/log/syslog
```

### Test cron manually:
```bash
cd /var/www/avenza/backend
source venv/bin/activate
python cron_daily_profit.py
```

---

## Important Notes

⚠️ **The cron job will:**
- Run every day at the scheduled time
- Process ALL active investments
- Credit profits to INCOME WALLET only
- Stop processing when 2x profit limit is reached
- Log all operations for audit trail

⚠️ **Make sure:**
- Virtual environment has all required packages
- Database credentials are in .env file
- Backend directory permissions are correct
- Logs directory exists and is writable

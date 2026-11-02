# 🔧 FIX WITHDRAWAL 500 ERROR

## 📋 ERROR:
```
POST /api/withdraw HTTP/1.1" 500 Internal Server Error
```

## 🎯 ROOT CAUSE:
The `system_settings` table or required columns in `withdrawals` table are missing on the VPS database.

---

## ✅ SOLUTION - Run These Commands on VPS:

### **Option 1: Automatic Fix (Recommended)**

```bash
# SSH into VPS
ssh root@148.135.138.145

# Navigate to backend
cd /var/www/avenza/backend

# Upload fix files (run this from local machine first):
scp backend/fix_withdrawal_error.sql root@148.135.138.145:/var/www/avenza/backend/
scp backend/fix_withdrawal_500.sh root@148.135.138.145:/var/www/avenza/backend/

# Make script executable
chmod +x fix_withdrawal_500.sh

# Run the fix
./fix_withdrawal_500.sh
```

### **Option 2: Manual Fix**

```bash
# SSH into VPS
ssh root@148.135.138.145

# Run SQL directly
PGPASSWORD=123456 psql -h localhost -U avenzauser -d avenzaweb << 'EOF'

-- Create system_settings table if not exists
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default withdrawal mode
INSERT INTO system_settings (setting_key, setting_value, description, updated_at)
VALUES ('withdrawal_mode', 'automatic', 'Withdrawal processing mode', CURRENT_TIMESTAMP)
ON CONFLICT (setting_key) DO NOTHING;

-- Add missing columns to withdrawals table
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS withdrawal_mode VARCHAR(20) DEFAULT 'automatic';
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS destination_address VARCHAR(255);
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS destination_wallet_type VARCHAR(50);
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS processed_by INTEGER;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS admin_note TEXT;

EOF

# Restart backend
systemctl restart avenza

# Check status
systemctl status avenza --no-pager
```

---

## 🔍 VERIFY THE FIX:

```bash
# Check if system_settings table exists
PGPASSWORD=123456 psql -h localhost -U avenzauser -d avenzaweb -c "SELECT * FROM system_settings WHERE setting_key = 'withdrawal_mode';"

# Check if columns exist
PGPASSWORD=123456 psql -h localhost -U avenzauser -d avenzaweb -c "\d withdrawals"

# Test withdrawal API
curl -X POST https://avenza.live/api/withdraw \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 10, "wallet_type": "avenza"}'
```

---

## 📝 WHAT THE FIX DOES:

1. ✅ Creates `system_settings` table if missing
2. ✅ Inserts default `withdrawal_mode = automatic`
3. ✅ Adds missing columns to `withdrawals` table:
   - `withdrawal_mode` - automatic or manual
   - `destination_address` - user's wallet address
   - `destination_wallet_type` - metamask, trust, safepal, etc
   - `processed_by` - admin user ID (for manual mode)
   - `processed_at` - timestamp of approval
   - `admin_note` - admin's rejection reason
4. ✅ Restarts backend service

---

## 🚨 IF STILL FAILING:

Check backend logs:
```bash
journalctl -u avenza -n 100 --no-pager | grep -i error
```

Common issues:
- Table doesn't exist → Run migration: `python migrations/withdrawal_mode_setup.py`
- Permission denied → Check database user permissions
- Connection refused → Check if PostgreSQL is running

---

## ✅ SUCCESS INDICATORS:

After fix, you should see:
- ✅ `POST /api/withdraw` returns 200 OK
- ✅ Withdrawal record created in database
- ✅ User balance deducted
- ✅ Transaction recorded

---

## 📂 FILES CREATED:

1. `fix_withdrawal_error.sql` - SQL script to create missing tables/columns
2. `fix_withdrawal_500.sh` - Bash script to run fix automatically
3. `FIX_WITHDRAWAL_500_ERROR.md` - This documentation

---

**Run the fix on VPS and test again!** 🚀

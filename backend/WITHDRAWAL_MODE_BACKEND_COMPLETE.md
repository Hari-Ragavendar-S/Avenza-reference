# ✅ Withdrawal Mode System - Backend Implementation Complete

## Overview
Added manual/automatic withdrawal mode toggle system with admin approval workflow.

---

## What Was Added

### 1. **Database Migration** (`migrations/withdrawal_mode_setup.py`)
Creates:
- `system_settings` table for storing configuration
- Default withdrawal mode set to 'automatic'
- New columns in `withdrawals` table:
  - `withdrawal_mode` - tracks if withdrawal is automatic or manual
  - `destination_address` - user's wallet address
  - `destination_wallet_type` - wallet type (SafePal, MetaMask, etc)
  - `admin_note` - admin's note when approving/rejecting
  - `processed_by` - which admin processed the request
  - `processed_at` - timestamp of processing

### 2. **Schemas** (`app/schemas/admin.py`)
Added:
- `WithdrawalModeRequest` - for changing mode
- `WithdrawalModeResponse` - mode change response
- `WithdrawalApproveRequest` - for approving withdrawals
- `WithdrawalRejectRequest` - for rejecting withdrawals
- `WithdrawalActionResponse` - approval/rejection response

### 3. **Admin Endpoints** (`app/routes/admin.py`)

#### GET `/admin/settings/withdrawal-mode`
- Get current withdrawal mode
- Requires admin token
- Returns: `{ success, message, mode }`

#### PUT `/admin/settings/withdrawal-mode`
- Change withdrawal mode between 'automatic' and 'manual'
- Requires admin token
- Body: `{ mode: "automatic" | "manual" }`
- Returns: `{ success, message, mode }`

#### PUT `/admin/withdrawal/{withdrawal_id}/approve`
- Approve a pending manual withdrawal
- Requires admin token
- Body: `{ admin_note?: string }`
- Returns: `{ success, message, withdrawal_id, status }`

#### PUT `/admin/withdrawal/{withdrawal_id}/reject`
- Reject a pending manual withdrawal
- Automatically refunds amount to user's AVENZA wallet
- Requires admin token
- Body: `{ reason?: string }`
- Returns: `{ success, message, withdrawal_id, status }`

### 4. **Public Endpoint** (`app/main.py`)

#### GET `/api/settings/withdrawal-mode` (Public)
- No authentication required
- Used by frontend to determine withdrawal UI
- Returns: `{ success, mode, is_automatic }`
- Defaults to 'automatic' on error

---

## How It Works

### Automatic Mode (Default):
1. User creates withdrawal from AVENZA wallet
2. System processes instantly
3. Status: `pending` → `completed`
4. No admin approval needed

### Manual Mode:
1. User creates withdrawal from AVENZA wallet
2. System copies user's wallet address from profile
3. Amount deducted, status set to `pending`
4. Admin sees request with wallet address
5. Admin approves:
   - Status → `approved`
   - Admin must manually send funds to wallet
6. Admin rejects:
   - Amount refunded to user's AVENZA wallet
   - Refund transaction created
   - Status → `rejected`

---

## Database Schema

### `system_settings` Table
```sql
id                SERIAL PRIMARY KEY
setting_key       VARCHAR(100) UNIQUE
setting_value     TEXT
description       TEXT
created_at        TIMESTAMP
updated_at        TIMESTAMP
updated_by        INTEGER REFERENCES admins(id)
```

### `withdrawals` Table (New Columns)
```sql
withdrawal_mode          VARCHAR(20) DEFAULT 'automatic'
destination_address      VARCHAR(255)
destination_wallet_type  VARCHAR(50)
admin_note               TEXT
processed_by             INTEGER REFERENCES admins(id)
processed_at             TIMESTAMP
```

---

## API Testing Commands

### 1. Run Migration
```bash
cd /var/www/avenza/backend
source venv/bin/activate
python3 migrations/withdrawal_mode_setup.py
```

### 2. Check Current Mode (Public)
```bash
curl https://avenza.live/api/settings/withdrawal-mode
```

### 3. Get Mode (Admin)
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  https://avenza.live/api/admin/settings/withdrawal-mode
```

### 4. Change to Manual Mode (Admin)
```bash
curl -X PUT https://avenza.live/api/admin/settings/withdrawal-mode \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "manual"}'
```

### 5. Approve Withdrawal (Admin)
```bash
curl -X PUT https://avenza.live/api/admin/withdrawal/123/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"admin_note": "Funds sent to wallet"}'
```

### 6. Reject Withdrawal (Admin)
```bash
curl -X PUT https://avenza.live/api/admin/withdrawal/123/reject \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Invalid wallet address"}'
```

---

## Deployment Steps

### 1. Upload Files
```bash
# Upload migration
scp "c:\Techneysoft apps\Avenza\backend\migrations\withdrawal_mode_setup.py" \
  root@148.135.138.145:/var/www/avenza/backend/migrations/

# Upload updated schemas
scp "c:\Techneysoft apps\Avenza\backend\app\schemas\admin.py" \
  root@148.135.138.145:/var/www/avenza/backend/app/schemas/

# Upload updated admin routes
scp "c:\Techneysoft apps\Avenza\backend\app\routes\admin.py" \
  root@148.135.138.145:/var/www/avenza/backend/app/routes/

# Upload updated main.py
scp "c:\Techneysoft apps\Avenza\backend\app\main.py" \
  root@148.135.138.145:/var/www/avenza/backend/app/
```

### 2. Run Migration on Server
```bash
ssh root@148.135.138.145
cd /var/www/avenza/backend
source venv/bin/activate
python3 migrations/withdrawal_mode_setup.py
```

### 3. Restart Service
```bash
systemctl restart avenza
```

### 4. Verify
```bash
# Check service status
systemctl status avenza

# Check logs
journalctl -u avenza -n 50 --no-pager

# Test public endpoint
curl https://avenza.live/api/settings/withdrawal-mode
```

---

## Security Features

1. ✅ **Admin Authentication** - All admin endpoints require valid admin token
2. ✅ **Audit Trail** - Tracks which admin processed each withdrawal
3. ✅ **Automatic Refund** - Rejected withdrawals automatically refunded
4. ✅ **Wallet Validation** - Uses existing wallet address from user profile
5. ✅ **Status Validation** - Cannot approve/reject non-pending withdrawals
6. ✅ **Transaction Logging** - All refunds recorded in transactions table

---

## Status Flow

### Automatic Mode:
```
pending → completed
```

### Manual Mode:
```
pending → approved (by admin)
       → rejected (by admin) → refunded
```

---

## Next Steps

Frontend implementation needed:
1. Admin Settings page - withdrawal mode toggle
2. User Withdraw page - detect mode and show appropriate UI
3. Admin Withdrawals page - approve/reject buttons for manual withdrawals
4. User withdrawal history - show mode badges and status

---

**Backend is ready for testing and deployment!** 🚀

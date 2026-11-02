# ✅ Withdrawal Endpoint Implementation Complete

## Overview
Created a simple, functional withdrawal endpoint that supports both automatic and manual modes.

---

## Endpoint Details

### POST `/withdraw`
Creates a withdrawal request based on the current system mode.

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "amount": 100.00,
  "wallet_type": "avenza"
}
```

**Parameters:**
- `amount` (number, required): Withdrawal amount, must be > 0
- `wallet_type` (string, required): One of "avenza", "income", or "gaming"

**Response (Success):**
```json
{
  "success": true,
  "message": "Withdrawal request submitted",
  "withdrawal_id": 123,
  "amount": 100.00,
  "status": "pending",
  "mode": "manual"
}
```

**Response (Automatic Mode):**
```json
{
  "success": true,
  "message": "Withdrawal processed",
  "withdrawal_id": 123,
  "amount": 100.00,
  "status": "completed",
  "mode": "automatic"
}
```

---

## How It Works

### Flow:
1. **Verify Authentication** - Check user token
2. **Validate Request** - Check amount and wallet type
3. **Get Withdrawal Mode** - Check system_settings table
4. **Verify User** - Get user info and check wallet connected
5. **Check Balance** - Ensure sufficient funds
6. **Deduct Amount** - Immediately deduct from user's balance
7. **Set Status**:
   - Manual mode → `pending` (wait for admin approval)
   - Automatic mode → `completed` (instant)
8. **Create Records**:
   - Insert into `withdrawals` table
   - Insert into `transactions` table
9. **Return Response** - Success with withdrawal ID and status

---

## Database Operations

### Tables Updated:
1. **users** - Deduct amount from balance (avenza_balance, income_balance, or gaming_balance)
2. **withdrawals** - Create withdrawal record with mode and status
3. **transactions** - Log transaction

### Withdrawal Record Fields:
- `user_id` - User ID
- `username` - Username
- `amount` - Withdrawal amount
- `currency` - USD
- `status` - 'pending' or 'completed'
- `wallet_type` - avenza/income/gaming
- `withdrawal_mode` - automatic/manual
- `destination_address` - User's wallet address
- `destination_wallet_type` - SafePal/MetaMask/etc
- `created_at` - Timestamp (IST)

---

## Validation & Security

### Validations:
✅ User authentication required
✅ Amount must be > 0
✅ Wallet type must be valid (avenza/income/gaming)
✅ User must have connected wallet
✅ Sufficient balance check
✅ Immediate balance deduction (prevents double-spending)

### Error Responses:
- `401` - Authentication required / Invalid token
- `400` - Invalid amount
- `400` - Invalid wallet type  
- `400` - Wallet not connected
- `400` - Insufficient balance
- `404` - User not found
- `500` - Server error

---

## Mode Behavior

### Automatic Mode (Default):
- Status: `completed`
- User gets money instantly
- No admin approval needed
- Transaction logged as completed

### Manual Mode:
- Status: `pending`
- Amount deducted but held
- Admin must approve/reject
- On approval: Status → `approved`
- On rejection: Amount refunded, Status → `rejected`

---

## Integration with Existing System

### Uses Existing:
- `system_settings` table (withdrawal_mode)
- `users` table (balance fields, wallet_address)
- `withdrawals` table (existing structure + new columns)
- `transactions` table (existing structure)
- `verify_token()` utility
- `get_ist_time()` utility

### Adds:
- Simple `/withdraw` POST endpoint
- Automatic mode detection
- Balance deduction logic
- Transaction logging

---

## Testing

### Test Automatic Mode:
```bash
# 1. Ensure mode is automatic
curl https://avenza.live/api/settings/withdrawal-mode

# 2. Create withdrawal
curl -X POST https://avenza.live/api/withdraw \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50, "wallet_type": "avenza"}'

# Expected: status "completed", immediate processing
```

### Test Manual Mode:
```bash
# 1. Admin changes to manual mode
curl -X PUT https://avenza.live/api/admin/settings/withdrawal-mode \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "manual"}'

# 2. User creates withdrawal
curl -X POST https://avenza.live/api/withdraw \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50, "wallet_type": "avenza"}'

# Expected: status "pending", wait for admin approval
```

### Test Validations:
```bash
# No wallet connected
# Expected: 400 "Please connect your wallet in Profile first"

# Insufficient balance
# Expected: 400 "Insufficient balance"

# Invalid amount (0 or negative)
# Expected: 400 "Invalid amount"
```

---

## Deployment

### Upload File:
```bash
scp "c:\Techneysoft apps\Avenza\backend\app\routes\wallet.py" \
  root@148.135.138.145:/var/www/avenza/backend/app/routes/wallet.py
```

### Restart Service:
```bash
ssh root@148.135.138.145 "systemctl restart avenza"
```

### Verify:
```bash
# Check service
systemctl status avenza

# Check logs
journalctl -u avenza -n 50 --no-pager

# Test endpoint
curl -X POST https://avenza.live/api/withdraw \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10, "wallet_type": "avenza"}'
```

---

## Complete System Flow

```
User Requests Withdrawal
        ↓
Check System Mode (automatic/manual)
        ↓
Validate (amount, balance, wallet)
        ↓
Deduct from Balance
        ↓
Create Withdrawal Record
        ├─ Automatic → Status: completed
        └─ Manual → Status: pending
        ↓
Log Transaction
        ↓
Return Response to User
        ↓
[If Manual] Admin Sees in Withdrawals Page
        ├─ Approve → Status: approved (funds sent manually)
        └─ Reject → Refund amount, Status: rejected
```

---

## Next Steps

Still needed for complete system:
1. ✅ Backend endpoint - DONE
2. ⏳ Admin Withdrawals page - View/approve/reject pending requests
3. ⏳ User Withdrawal History page - Show status and badges

---

**Withdrawal Endpoint Ready for Deployment!** 🚀

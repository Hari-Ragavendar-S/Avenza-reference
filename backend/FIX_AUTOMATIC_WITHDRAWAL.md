# Fix Automatic Withdrawal - Missing Database Columns

## Problem
Automatic withdrawal showed success in UI but:
- No amount debited from user wallet
- No USDT sent to external wallet
- Database INSERT was failing silently

## Root Cause
The `/wallet/withdraw` endpoint (automatic Web3 withdrawal) was missing required columns in the INSERT statement:
- `withdrawal_mode` (required, default 'automatic')
- `destination_address` (required)
- `destination_wallet_type` (required)

## Solution Applied
Updated the INSERT statement at line ~848 in `app/routes/wallet.py` to include all required columns.

## Deploy Steps

### 1. Upload Fixed File
```bash
scp "c:\Techneysoft apps\Avenza\backend\app\routes\wallet.py" root@148.135.138.145:/var/www/avenza/backend/app/routes/wallet.py
```

### 2. SSH to VPS and Restart
```bash
ssh root@148.135.138.145
systemctl restart avenza
journalctl -u avenza -f
```

### 3. Test Automatic Withdrawal
- Go to https://avenza.live
- Login as test user
- Navigate to Withdraw page
- Connect wallet (MetaMask/Trust/SafePal/WalletConnect)
- Enter 1 USDT
- Withdraw mode: Automatic
- Click Withdraw

### 4. Verify Success
Check that:
1. ✅ Amount debited from Avenza wallet
2. ✅ Transaction appears in history
3. ✅ USDT sent to external wallet (check BSCScan)
4. ✅ Success modal shows correct amount

## Important Notes

### Backend Wallet Requirements
For automatic withdrawals to work, the backend needs:

1. **Private Key Set**
   ```bash
   # Check if set
   grep WITHDRAWAL_WALLET_PRIVATE_KEY /var/www/avenza/backend/.env
   ```

2. **Wallet Must Have:**
   - BNB for gas fees (~0.001 BNB per transaction)
   - USDT balance to send

3. **If Not Configured**
   - Create a new BSC wallet
   - Fund it with BNB and USDT
   - Add private key to `.env`:
     ```
     WITHDRAWAL_WALLET_PRIVATE_KEY=your_private_key_here
     ```
   - Restart service: `systemctl restart avenza`

### Alternative: Use Manual Mode
If you don't want to configure backend wallet:
- Set withdrawal mode to "Manual" in admin settings
- Admin approves withdrawals manually
- Admin sends USDT from their own wallet

## Files Changed
- `backend/app/routes/wallet.py` (line ~848-860)

## Database Columns Now Included
```sql
INSERT INTO withdrawals (
    user_id, username, amount, fee, fee_percentage, net_amount,
    currency, network, to_address, from_address, status,
    wallet_type, withdrawal_mode, destination_address, 
    destination_wallet_type, ist_processed_at
) VALUES (...)
```

All NOT NULL columns are now provided! ✅

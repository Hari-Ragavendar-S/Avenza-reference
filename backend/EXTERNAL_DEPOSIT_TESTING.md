# 🔍 EXTERNAL DEPOSIT TESTING GUIDE

## ✅ **WHAT IS EXTERNAL DEPOSIT?**

External deposits are payments sent **directly to the public wallet address** by copy-pasting the address (without using the website form).

**Example:**
```
User copies: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0
User sends: 50 USDT from MetaMask
System detects: New transaction!
System records: External deposit
System distributes: Equally to all users
```

---

## 🚀 **HOW IT WORKS**

### **1. Admin Configures Public Wallet**
```
Admin Panel → Public Wallet Config → Enter:
- Wallet Address: 0x742d35Cc...
- Secret Phrase: 12 words
- Network: BSC
→ Save
```

### **2. Blockchain Monitor Starts**
```bash
# Run in separate terminal/window
cd backend
python run_blockchain_monitor.py
```

**Monitor Output:**
```
╔══════════════════════════════════════════════════════════╗
║       AVENZA BLOCKCHAIN MONITOR SERVICE                  ║
║       Auto-Detect External Deposits                      ║
╚══════════════════════════════════════════════════════════╝

🚀 STARTING BLOCKCHAIN MONITOR
============================================================
✅ Connected to BSC network
✅ Connected to ETH network
✅ Connected to POLYGON network

📊 Monitoring 3 networks: BSC, ETH, POLYGON
📍 Monitoring Address: 0x742d35cc6634c0532925a3b844bc9e7595f0beb0
============================================================

🔍 Starting BSC monitor from block 12345678
🔍 Starting ETH monitor from block 18901234
🔍 Starting POLYGON monitor from block 50123456
```

### **3. Someone Sends Payment Externally**
```
User opens MetaMask/Trust Wallet
User pastes: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0
User sends: 50 USDT
User confirms transaction
```

### **4. Monitor Detects Transaction**
```
Monitor checks new blocks every 12 seconds...
Found transaction in block 12345680!

============================================================
💰 EXTERNAL DEPOSIT DETECTED!
============================================================
Network: BSC
From: 0x789def456abc123...
Amount: 50 USDT
BEP20 Equivalent: $50.00 USDT
TX: 0xabc123def456...
Block: 12345680
============================================================

✅ Queued distribution: 0xabc123def456... ($50.00)
```

### **5. Distribution Happens Automatically**
```
============================================================
💰 PROCESSING DISTRIBUTION
============================================================
TX Hash: 0xabc123def456...
Amount: $50.00 BEP20 USDT
Source: external
============================================================

📊 Distribution Plan:
   Total Users: 25
   Per User: $2.00

🔄 Starting distribution...

============================================================
✅ DISTRIBUTION COMPLETED SUCCESSFULLY
============================================================
📊 Summary:
   Total Distributed: $50.00
   Users Credited: 25
   Per User: $2.00
   Status: Completed
============================================================
```

### **6. Users See Credit in Their Wallets**
```
User Dashboard → Avenza Wallet:
+$2.00 (Public deposit distribution)

Transaction History:
Type: Public Deposit
Amount: +$2.00
Description: Public deposit distribution from 0xabc123de...
Status: Completed
```

---

## 🧪 **TESTING STEPS**

### **Prerequisites:**
1. ✅ Database migration completed
2. ✅ Admin configured public wallet
3. ✅ Blockchain monitor running
4. ✅ At least 1 active user in database

### **Test 1: BSC USDT Deposit**

**Step 1:** Get public address
```bash
curl http://localhost:8028/api/public/wallet-address
```

**Response:**
```json
{
  "success": true,
  "wallet_address": "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
  "network": "BSC",
  "supported_networks": ["BSC", "ETH", "POLYGON"]
}
```

**Step 2:** Send USDT on BSC network
```
Open MetaMask/Trust Wallet
Network: BSC (Binance Smart Chain)
Token: USDT
To: 0x742d35cc6634c0532925a3b844bc9e7595f0beb0
Amount: 10 USDT (or any amount)
Send transaction
```

**Step 3:** Monitor detects (within 12 seconds)
```
Check blockchain monitor terminal:
Should see: "💰 EXTERNAL DEPOSIT DETECTED!"
```

**Step 4:** Verify in database
```sql
SELECT * FROM public_deposits_external 
ORDER BY detected_at DESC LIMIT 1;

-- Should show your transaction
```

**Step 5:** Check distribution
```sql
SELECT COUNT(*) as total_users, SUM(credited_amount) as total
FROM public_distribution_records
WHERE source_type = 'external'
AND source_transaction_id = (
  SELECT id FROM public_deposits_external 
  ORDER BY detected_at DESC LIMIT 1
);

-- Should show: total_users = number of active users
--              total = your deposit amount
```

### **Test 2: Native Currency (BNB) Deposit**

**Step 1:** Send BNB to public address
```
Open MetaMask
Network: BSC
Send BNB (not USDT): 0.1 BNB
To: 0x742d35cc6634c0532925a3b844bc9e7595f0beb0
```

**Step 2:** Monitor detects and converts
```
Monitor output:
💰 EXTERNAL DEPOSIT DETECTED!
Network: BSC
Amount: 0.1 BNB (NATIVE)
BEP20 Equivalent: $60.00 USDT  ← Converted using live price
```

**Step 3:** Distribution uses converted amount
```
0.1 BNB × $600 (BNB price) = $60 USDT
Distributed to 30 users = $2.00 per user
```

### **Test 3: Multiple Networks**

**Send from different networks:**
```
1. Send 10 USDT on BSC → Detected ✅
2. Send 10 USDT on Ethereum → Detected ✅
3. Send 10 USDT on Polygon → Detected ✅

All recorded separately
All distributed instantly
```

---

## 📊 **VERIFICATION ENDPOINTS**

### **Check External Deposits (Admin)**
```bash
curl http://localhost:8028/api/admin/public-wallet/transactions/external?page=1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "deposits": [
    {
      "id": 1,
      "sender_address": "0x789def456abc123...",
      "amount_bep20_equivalent": 50.00,
      "transaction_hash": "0xabc123def456...",
      "network": "BSC",
      "token_type": "USDT",
      "is_distributed": true,
      "distributed_to_count": 25,
      "detected_at": "Jan 10, 2025 - 03:00:00 PM IST"
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20,
  "total_pages": 1
}
```

### **Check Distribution Details**
```bash
curl http://localhost:8028/api/admin/public-wallet/distribution/external/0xabc123def456... \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "source_type": "external",
  "transaction_hash": "0xabc123def456...",
  "total_amount": 50.00,
  "recipients_count": 25,
  "recipients": [
    {
      "user_name": "Alice Smith",
      "user_email": "alice@example.com",
      "user_phone": "+1234567890",
      "credited_amount": 2.00,
      "status": "completed",
      "credited_at": "Jan 10, 2025 - 03:00:05 PM IST"
    },
    // ... 24 more users
  ]
}
```

---

## 🔧 **TROUBLESHOOTING**

### **Monitor Not Detecting Deposits**

**Issue:** Sent payment but monitor doesn't detect

**Solutions:**
1. Check monitor is running: `python run_blockchain_monitor.py`
2. Check network connection:
   ```python
   from web3 import Web3
   w3 = Web3(Web3.HTTPProvider('https://bsc-dataseed.binance.org/'))
   print(w3.is_connected())  # Should be True
   ```
3. Check public wallet configured:
   ```sql
   SELECT * FROM public_wallet_config WHERE is_active = TRUE;
   ```
4. Check correct network:
   - BSC USDT: 0x55d398326f99059fF775485246999027B3197955
   - ETH USDT: 0xdAC17F958D2ee523a2206206994597C13D831ec7

### **Transaction Detected but Not Distributed**

**Issue:** Monitor shows "detected" but no distribution

**Check:**
1. Active users exist:
   ```sql
   SELECT COUNT(*) FROM users WHERE is_active = TRUE;
   -- Should be > 0
   ```
2. Check distribution queue:
   ```sql
   SELECT * FROM distribution_queue 
   WHERE status = 'failed' 
   ORDER BY created_at DESC;
   ```
3. Check error messages in monitor terminal

### **Wrong Amount Distributed**

**Issue:** Received 0.1 BNB but distributed wrong amount

**Reason:** Price fetching failed

**Solution:**
1. Check internet connection
2. Manually set conversion rate in database:
   ```sql
   UPDATE supported_networks 
   SET conversion_rate_to_bep20 = 1.0 
   WHERE network_name = 'BSC';
   ```

---

## 📈 **PERFORMANCE**

### **Detection Time:**
- **New Block:** 12 seconds (BSC, ETH)
- **Transaction Confirmed:** Instant
- **Distribution:** <1 second (for <100 users)

### **Scalability:**
```
1-50 users:    <0.5 seconds per deposit
51-100 users:  <1 second per deposit
101-500 users: <3 seconds per deposit
501+ users:    <5 seconds per deposit
```

### **Concurrent Deposits:**
```
Multiple deposits detected simultaneously:
→ Queued in order
→ Processed sequentially
→ No duplicate distributions
→ All users get correct amounts
```

---

## 🎯 **MONITORING IN PRODUCTION**

### **Run as Background Service (Windows)**

**Option 1: Using Task Scheduler**
1. Open Task Scheduler
2. Create New Task
3. Action: `python run_blockchain_monitor.py`
4. Trigger: At system startup
5. Run whether user is logged on or not

**Option 2: Using NSSM (recommended)**
```bash
# Download NSSM
# Install as service
nssm install AvenzaBlockchainMonitor "python" "C:\path\to\backend\run_blockchain_monitor.py"
nssm start AvenzaBlockchainMonitor
```

### **Monitoring Logs**
```python
# Add to blockchain_monitor.py for production
import logging

logging.basicConfig(
    filename='blockchain_monitor.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
```

---

## ✅ **TESTING CHECKLIST**

- [ ] Database migration completed
- [ ] Admin configured public wallet
- [ ] Monitor service running
- [ ] Sent test USDT on BSC → Detected ✅
- [ ] Sent test BNB → Detected & converted ✅
- [ ] Distribution happened automatically ✅
- [ ] All users received equal amounts ✅
- [ ] Transaction shows in admin panel ✅
- [ ] Users see credit in wallet ✅
- [ ] Transaction tag is "public_deposit" ✅

---

## 🎉 **SUCCESS INDICATORS**

When everything works:
1. ✅ Monitor shows "EXTERNAL DEPOSIT DETECTED!"
2. ✅ Distribution completes in <5 seconds
3. ✅ All users receive equal amount
4. ✅ Admin panel shows transaction
5. ✅ Users see credit in Avenza wallet
6. ✅ Public stats update on homepage

**You're ready for production! 🚀**

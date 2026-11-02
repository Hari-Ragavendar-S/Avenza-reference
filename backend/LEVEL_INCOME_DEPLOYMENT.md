# 🚀 LEVEL INCOME & REFERRAL BONUS DEPLOYMENT GUIDE

## ✅ **BACKEND COMPLETE!**

All backend components are ready:
- ✅ Database migrations (2 files)
- ✅ Schemas (2 files)
- ✅ API Routes (2 files)
- ✅ Automation helper script
- ✅ Registered in main.py

---

## 📋 **DEPLOYMENT STEPS:**

### **1. Upload Backend Files to VPS**

Upload these new files to `/var/www/avenza/backend/`:

```
migrations/
├── level_income_setup.py
└── referral_bonus_setup.py

app/schemas/
├── level_income.py
└── referral_bonus.py

app/routes/
├── level_income.py
└── referral_bonus.py

app/main.py (updated)
distribute_level_income.py
```

### **2. Run Database Migrations**

SSH into VPS and run:

```bash
cd /var/www/avenza/backend
source venv/bin/activate

# Run migrations
python migrations/level_income_setup.py
python migrations/referral_bonus_setup.py
```

### **3. Restart Backend Service**

```bash
sudo systemctl restart avenza
sudo systemctl status avenza
```

### **4. Verify API Endpoints**

Test endpoints are live:

```bash
# Check API docs
curl https://avenza.live/docs

# Test level income endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" https://avenza.live/api/level-income/stats

# Test referral bonus endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" https://avenza.live/api/referral-bonus/overview
```

---

## 🔧 **INTEGRATE WITH EXISTING CRON JOB**

### **Modify Daily Profit Cron:**

Edit `/var/www/avenza/backend/cron_daily_profit.py`

Add these imports at the top:

```python
from distribute_level_income import distribute_level_income_for_user, create_referral_bonus_on_investment
```

After distributing ROI to a user, add:

```python
# After updating investment profit
# ... existing code ...

# Distribute level income
distribute_level_income_for_user(
    user_id=investment['user_id'],
    roi_amount=daily_profit,
    investment_id=investment['id']
)
```

### **Modify Investment Enrollment:**

Edit `/var/www/avenza/backend/app/routes/investment.py`

In the `enroll_in_package` function, after creating investment, add:

```python
# After investment enrollment
# ... existing code ...

# Check if user has a sponsor and create referral bonus
cursor.execute("SELECT sponsor_id FROM users WHERE id = %s", (user_id,))
sponsor = cursor.fetchone()
if sponsor and sponsor['sponsor_id']:
    from distribute_level_income import create_referral_bonus_on_investment
    create_referral_bonus_on_investment(
        referrer_id=sponsor['sponsor_id'],
        referral_id=user_id,
        investment_id=investment_id,
        investment_amount=package_amount
    )
```

---

## 📊 **API ENDPOINTS SUMMARY**

### **USER ENDPOINTS:**

#### Level Income:
- `GET /api/level-income/stats` - Get stats and breakdown
- `GET /api/level-income/history` - Get transaction history
- `GET /api/level-income/team-tree` - Get team tree

#### Referral Bonus:
- `GET /api/referral-bonus/overview` - Get overview with pending/claimed
- `POST /api/referral-bonus/claim` - Claim a bonus
  - Body: `{"bonus_id": 123}`

### **ADMIN ENDPOINTS:**

- `GET /admin/level-income` - Platform stats and tracking
- `GET /admin/referral-bonus` - Platform bonus tracking

All endpoints require:
- Header: `Authorization: Bearer {token}`
- User endpoints use `token` from localStorage
- Admin endpoints use `adminToken` from localStorage

---

## 🎯 **HOW IT WORKS:**

### **Level Income (ROI to ROI):**

1. User receives daily ROI ($100)
2. System automatically distributes to 20 upline levels:
   - Level 1: 10% ($10)
   - Level 2-3: 5% ($5 each)
   - Level 4-6: 3% ($3 each)
   - Level 7-10: 2% ($2 each)
   - Level 11-20: 1% ($1 each)
3. Income credited to INCOME WALLET
4. Transaction recorded in history

### **Referral Bonus (One-Time):**

1. User makes first investment ($500)
2. System creates pending bonus for referrer:
   - 1st referral: 5% ($25)
   - 2nd referral: 6% ($30)
   - 3rd referral: 7% ($35)
   - 4th referral: 8% ($40)
   - 5th referral: 9% ($45)
   - 6+ referrals: 10% ($50)
3. Referrer manually claims from UI
4. Amount credited to INCOME WALLET

---

## ✅ **TESTING CHECKLIST:**

After deployment, test:

- [ ] Database tables created successfully
- [ ] API endpoints accessible
- [ ] User can view level income stats
- [ ] User can view pending bonuses
- [ ] User can claim bonus successfully
- [ ] Income wallet updates correctly
- [ ] Transaction history records properly
- [ ] Admin can view platform stats
- [ ] Cron job distributes level income
- [ ] Bonus creates on new investment

---

## 🚨 **ROLLBACK PLAN:**

If issues occur:

```bash
# Restore previous main.py
cd /var/www/avenza/backend
git checkout app/main.py

# Restart service
sudo systemctl restart avenza
```

Database tables can remain - they won't affect existing functionality.

---

## 📞 **NEXT STEP:**

After backend deployment is complete and tested, we'll build the **FRONTEND** with:
- Mobile-responsive pages
- No content breaking
- Beautiful UI/UX
- Success animations
- Real-time updates

Ready to deploy backend? 🚀

# Add User Investments Endpoint to Admin

## Changes Made

Added new API endpoint to show user's active investment plans in admin user detail page.

### Backend File Changed:
- `app/routes/admin.py` - Added new endpoint

### New Endpoint:
```
GET /api/admin/user/{user_id}/investments
```

**Returns:**
- User's investment plans with package details
- Progress percentage to 2x cap
- Status (active/completed)
- Daily profit and max profit
- Enrollment date

---

## Deployment Steps

### Step 1: Upload Updated File
Upload `app/routes/admin.py` to VPS at:
```
/var/www/avenza/backend/app/routes/admin.py
```

### Step 2: SSH into VPS
```bash
ssh root@148.135.138.145
```

### Step 3: Restart Backend
```bash
cd /var/www/avenza/backend
sudo systemctl restart avenza
```

### Step 4: Check Status
```bash
sudo systemctl status avenza
sudo journalctl -u avenza -f
```

### Step 5: Test Endpoint
```bash
# Replace {user_id} and {admin_token}
curl -H "Authorization: Bearer {admin_token}" https://avenza.live/api/admin/user/{user_id}/investments
```

---

## Frontend Changes

### File Changed:
- `src/admin/pages/UserDetail.jsx`

### What Was Added:
- New section "Active Investment Plans" 
- Shows user's investment packages with:
  - Package icon and name
  - Status badge (Active/Completed)
  - Invested amount & total earned
  - Progress bar to 2x cap
  - Daily profit & max profit
  - Enrollment date
- Grid layout (responsive - 3 columns desktop, 1 column mobile)
- Empty state when no investments

---

## Build & Deploy Frontend

```bash
cd "c:\Techneysoft apps\Avenza\frontend"
npm run build
```

Upload `dist` folder to VPS:
```
/var/www/avenza/frontend/dist
```

---

## Test on Live Site

1. Login as admin: https://avenza.live/admin/login
2. Navigate to Users page
3. Click any user who has invested
4. Scroll down to see "Active Investment Plans" section
5. Verify:
   - ✅ Shows investment cards
   - ✅ Progress bar displays correctly
   - ✅ Status badge shows (Active/Completed)
   - ✅ All amounts display correctly
   - ✅ Empty state shows when user has no investments

---

## Quick VPS Commands

```bash
# SSH
ssh root@148.135.138.145

# Navigate to backend
cd /var/www/avenza/backend

# Restart backend
sudo systemctl restart avenza

# Check logs
sudo journalctl -u avenza -f

# Test endpoint
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://avenza.live/api/admin/user/1/investments
```

---

**Done!** Admin can now see user's active investment plans in user detail page! 🎉

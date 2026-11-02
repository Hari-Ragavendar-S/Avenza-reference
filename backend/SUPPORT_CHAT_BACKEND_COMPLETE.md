# 💬 SUPPORT CHAT SYSTEM - BACKEND COMPLETE

## 📋 Overview
Complete WhatsApp-style support chat system allowing users to message admin support and admins to respond.

---

## 🗄️ Database Structure

### **support_messages** Table
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER, FK to users)
- message (TEXT, max 500 chars)
- sender_type (VARCHAR: 'user' or 'admin')
- admin_id (INTEGER, FK to admins, NULL if sender is user)
- is_read (BOOLEAN, default FALSE)
- created_at (TIMESTAMP, IST timezone)
```

### **Indexes**
- `idx_support_user_created` - For user chat history queries
- `idx_support_unread` - For unread message counts
- `idx_support_sender` - For filtering by sender type

### **View: support_conversations**
Aggregated view showing:
- User details (id, username, name, email, profile photo)
- Last message and timestamp
- Unread message count
- Total messages per user

---

## 🔌 API Endpoints

### **USER ENDPOINTS**

#### 1. Get My Chat History
```
GET /api/support/messages
Authorization: Bearer {token}

Response:
{
  "messages": [
    {
      "id": 1,
      "user_id": 3,
      "message": "How to withdraw?",
      "sender_type": "user",
      "admin_id": null,
      "is_read": true,
      "created_at": "08 Sep 2026, 10:30 AM",
      "is_mine": true
    },
    {
      "id": 2,
      "user_id": 3,
      "message": "Go to Withdraw page...",
      "sender_type": "admin",
      "admin_id": 1,
      "is_read": true,
      "created_at": "08 Sep 2026, 10:32 AM",
      "is_mine": false
    }
  ],
  "total": 2
}
```
- Auto-marks admin messages as read when fetched
- Returns all messages in chronological order

#### 2. Send Message to Admin
```
POST /api/support/message
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "message": "I need help with deposits"
}

Response:
{
  "success": true,
  "message": "Message sent to admin",
  "data": {
    "id": 3,
    "created_at": "08 Sep 2026, 11:00 AM"
  }
}
```
- Message max length: 500 characters
- Trims whitespace automatically

#### 3. Get Unread Count
```
GET /api/support/unread-count
Authorization: Bearer {token}

Response:
{
  "unread_count": 2
}
```
- Returns count of unread admin replies

---

### **ADMIN ENDPOINTS**

#### 1. Get Support Conversations List
```
GET /api/admin/support/users?page=1&per_page=20&search=john
Authorization: Bearer {adminToken}

Response:
{
  "conversations": [
    {
      "user_id": 3,
      "username": "john123",
      "name": "John Doe",
      "email": "john@example.com",
      "profile_photo_url": "https://...",
      "last_message": "Thank you!",
      "last_message_time": "08 Sep 2026, 11:15 AM",
      "unread_count": 2,
      "total_messages": 5
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20,
  "total_pages": 1
}
```
- Pagination: 20 per page
- Search by username, name, or email
- Ordered by last message time (DESC)
- Shows unread count per user

#### 2. Get Chat with Specific User
```
GET /api/admin/support/chat/{user_id}
Authorization: Bearer {adminToken}

Response:
{
  "user": {
    "id": 3,
    "username": "john123",
    "name": "John Doe",
    "email": "john@example.com",
    "profile_photo_url": "https://...",
    "avenza_balance": 150.50,
    "income_balance": 75.25,
    "gaming_balance": 0.00
  },
  "messages": [...],
  "total": 5
}
```
- Returns user wallet balances for admin context
- Auto-marks user messages as read when fetched
- All messages in chronological order

#### 3. Send Reply to User
```
POST /api/admin/support/reply
Authorization: Bearer {adminToken}
Content-Type: application/json

Body:
{
  "user_id": 3,
  "message": "Sure! Go to Withdraw page and..."
}

Response:
{
  "success": true,
  "message": "Reply sent to user",
  "data": {
    "id": 6,
    "created_at": "08 Sep 2026, 11:20 AM"
  }
}
```
- Message max length: 500 characters
- Verifies user exists before sending

#### 4. Mark User Messages as Read
```
PUT /api/admin/support/mark-read/{user_id}
Authorization: Bearer {adminToken}

Response:
{
  "success": true,
  "message": "Marked 3 messages as read"
}
```
- Marks all unread messages from specific user as read

#### 5. Get Support Statistics
```
GET /api/admin/support/stats
Authorization: Bearer {adminToken}

Response:
{
  "total_conversations": 15,
  "unread_conversations": 3,
  "total_messages": 87,
  "messages_today": 12
}
```
- Overview stats for admin dashboard

---

## 📁 Files Created

### Backend Files:
1. **migrations/support_setup.py** - Database migration script
2. **app/schemas/support.py** - Pydantic models for validation
3. **app/routes/support.py** - API route handlers
4. **app/main.py** - Updated to include support routes

---

## 🚀 Deployment Instructions

### 1. Upload Files to VPS
```bash
# From local machine
scp migrations/support_setup.py root@148.135.138.145:/var/www/avenza/backend/migrations/
scp app/schemas/support.py root@148.135.138.145:/var/www/avenza/backend/app/schemas/
scp app/routes/support.py root@148.135.138.145:/var/www/avenza/backend/app/routes/
scp app/main.py root@148.135.138.145:/var/www/avenza/backend/app/
```

### 2. Run Migration on VPS
```bash
ssh root@148.135.138.145
cd /var/www/avenza/backend
source venv/bin/activate
python migrations/support_setup.py
```

### 3. Restart Backend
```bash
sudo systemctl restart avenza
sudo systemctl status avenza
```

### 4. Verify
```bash
# Check API docs
curl https://avenza.live/api/docs
# Should show new Support Chat endpoints
```

---

## ✅ Features Implemented

### User Features:
- ✅ View chat history with admin
- ✅ Send messages to admin (max 500 chars)
- ✅ Get unread admin reply count
- ✅ Auto-mark admin messages as read when viewed
- ✅ IST timestamps

### Admin Features:
- ✅ View all user conversations
- ✅ Pagination (20 per page)
- ✅ Search users by username/name/email
- ✅ View chat with specific user
- ✅ See user wallet balances in chat
- ✅ Send replies to users
- ✅ Mark messages as read
- ✅ Support statistics dashboard
- ✅ Unread message counts per user

### Technical Features:
- ✅ Database indexes for performance
- ✅ Aggregated view for conversations
- ✅ Message validation (1-500 chars)
- ✅ JWT authentication (user/admin)
- ✅ Error handling with proper HTTP codes
- ✅ IST timezone for all timestamps
- ✅ Automatic whitespace trimming

---

## 🔜 Next Steps

1. ✅ Backend complete
2. ⏳ Frontend user support page
3. ⏳ Frontend admin support panel
4. ⏳ Update sidebar navigation
5. ⏳ Test end-to-end flow

---

## 📊 Message Flow

```
USER SIDE:
1. User clicks "Support" → Opens chat screen
2. User types message → POST /api/support/message
3. Admin replies → User refreshes → GET /api/support/messages
4. Admin messages auto-marked as read

ADMIN SIDE:
1. Admin clicks "Support" → GET /api/admin/support/users
2. Sees list with unread counts
3. Clicks user → GET /api/admin/support/chat/{user_id}
4. Types reply → POST /api/admin/support/reply
5. User messages auto-marked as read
```

---

## 🎯 Key Benefits

- **Simple**: One chat per user, no ticket complexity
- **Fast**: Indexed queries for performance
- **Real-time feel**: Instant message delivery
- **Mobile-friendly**: 500 char limit perfect for mobile
- **Admin context**: View user balances while chatting
- **Search**: Find users quickly
- **Stats**: Track support volume

---

**Status:** ✅ Backend Complete - Ready for Frontend
**Next:** Create frontend user support page

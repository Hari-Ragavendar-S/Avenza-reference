"""
Support Chat System Setup Migration
Creates support_messages table and indexes
"""

import psycopg2

DB_CONFIG = {
    'host': 'localhost',
    'port': '5432',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def setup_support_system():
    """Create support chat tables and indexes"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        print("🚀 Starting support chat system setup...")
        
        # Create support_messages table
        print("Creating support_messages table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS support_messages (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
                admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
            );
        """)
        print("✅ Support messages table created")
        
        # Create indexes for performance
        print("Creating indexes...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_support_user_created 
            ON support_messages(user_id, created_at DESC);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_support_unread 
            ON support_messages(is_read, user_id) WHERE is_read = FALSE;
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_support_sender 
            ON support_messages(sender_type, created_at DESC);
        """)
        print("✅ Indexes created")
        
        # Create view for user conversations summary
        print("Creating support conversations view...")
        cursor.execute("""
            CREATE OR REPLACE VIEW support_conversations AS
            SELECT 
                u.id AS user_id,
                u.username,
                u.name,
                u.email,
                u.profile_photo_url,
                (SELECT message FROM support_messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS last_message,
                (SELECT created_at FROM support_messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS last_message_time,
                (SELECT COUNT(*) FROM support_messages WHERE user_id = u.id AND sender_type = 'user' AND is_read = FALSE) AS unread_count,
                (SELECT COUNT(*) FROM support_messages WHERE user_id = u.id) AS total_messages
            FROM users u
            WHERE EXISTS (SELECT 1 FROM support_messages WHERE user_id = u.id)
            ORDER BY last_message_time DESC;
        """)
        print("✅ Support conversations view created")
        
        conn.commit()
        
        # Show statistics
        print("\n📊 Current Data:")
        cursor.execute("SELECT COUNT(*) FROM support_messages")
        total_messages = cursor.fetchone()[0]
        print(f"- Total support messages: {total_messages}")
        
        cursor.execute("SELECT COUNT(DISTINCT user_id) FROM support_messages")
        total_conversations = cursor.fetchone()[0]
        print(f"- Total user conversations: {total_conversations}")
        
        cursor.execute("SELECT COUNT(*) FROM support_messages WHERE is_read = FALSE AND sender_type = 'user'")
        unread_messages = cursor.fetchone()[0]
        print(f"- Unread user messages: {unread_messages}")
        
        print("\n✨ Support chat system setup complete!")
        print("\n⚠️  Next steps:")
        print("1. Upload schemas/support.py to VPS")
        print("2. Upload routes/support.py to VPS")
        print("3. Update main.py to include support routes")
        print("4. Restart backend: sudo systemctl restart avenza")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    setup_support_system()

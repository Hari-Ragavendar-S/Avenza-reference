"""
Check Recent Match Details
"""

import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'dbname': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456',
    'host': 'localhost',
    'port': 5432
}

def get_db():
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)

db = get_db()
cursor = db.cursor()

print("\n" + "="*60)
print("CHECKING RECENT MATCH DETAILS")
print("="*60)

# Check user 74's sponsor chain
print("\n👤 User 74 (azhagumutumanikandan) Details:")
cursor.execute("""
    SELECT id, username, sponsor_id, position
    FROM users WHERE id = 74
""")
user74 = cursor.fetchone()
print(f"   ID: {user74['id']}")
print(f"   Username: @{user74['username']}")
print(f"   Sponsor ID: {user74['sponsor_id']}")
print(f"   Position: {user74['position']}")

# Check sponsor details
if user74['sponsor_id']:
    cursor.execute("""
        SELECT id, username, sponsor_id
        FROM users WHERE id = %s
    """, (user74['sponsor_id'],))
    sponsor = cursor.fetchone()
    print(f"\n👤 Sponsor (ID {sponsor['id']}):")
    print(f"   Username: @{sponsor['username']}")
    print(f"   Sponsor's Sponsor ID: {sponsor['sponsor_id']}")

# Check recent binary matches by @avenza
print("\n💎 Recent Binary Matches by @avenza (user 3):")
cursor.execute("""
    SELECT id, matched_amount, left_volume, right_volume, 
           bonus_earned, created_at
    FROM binary_matching_history
    WHERE user_id = 3
    ORDER BY created_at DESC
    LIMIT 5
""")
matches = cursor.fetchall()
for match in matches:
    print(f"   • {match['created_at']}: Matched ${match['matched_amount']}, Bonus: ${match['bonus_earned']}")

# Check recent downline matching records for @avenza
print("\n💰 Recent Downline Matching Records FOR @avenza (user 3):")
cursor.execute("""
    SELECT dmh.*, u.username as downline_username
    FROM downline_matching_bonus_history dmh
    JOIN users u ON dmh.downline_user_id = u.id
    WHERE dmh.user_id = 3
    ORDER BY dmh.created_at DESC
    LIMIT 10
""")
downline_matches = cursor.fetchall()
if downline_matches:
    for dm in downline_matches:
        print(f"   • {dm['created_at']}: @{dm['downline_username']} matched ${dm['match_amount']}, You got: ${dm['user_received']}")
else:
    print("   (No records)")

# Check who is in @avenza's downline
print("\n🌳 @avenza's Direct Referrals:")
cursor.execute("""
    SELECT id, username, position
    FROM users 
    WHERE sponsor_id = 3
    ORDER BY id DESC
    LIMIT 10
""")
downline = cursor.fetchall()
for user in downline:
    print(f"   • @{user['username']} (ID: {user['id']}, Position: {user['position']})")

cursor.close()
db.close()

print("\n" + "="*60)

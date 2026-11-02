"""
Check Downline Structure and Missing Records
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

print("\n" + "="*80)
print("CHECKING @AVENZA'S DOWNLINE STRUCTURE")
print("="*80)

# Get @avenza's ID
cursor.execute("SELECT id FROM users WHERE username = 'avenza'")
avenza = cursor.fetchone()
avenza_id = avenza['id']

print(f"\n@avenza ID: {avenza_id}")

# Get all users in @avenza's downline (recursive)
cursor.execute("""
    WITH RECURSIVE downline AS (
        SELECT id, username, sponsor_id, 1 as level
        FROM users 
        WHERE sponsor_id = %s
        
        UNION ALL
        
        SELECT u.id, u.username, u.sponsor_id, d.level + 1
        FROM users u
        INNER JOIN downline d ON u.sponsor_id = d.id
        WHERE d.level < 10
    )
    SELECT * FROM downline ORDER BY level, username
""", (avenza_id,))

downline_users = cursor.fetchall()

print(f"\n📊 Total users in @avenza's downline: {len(downline_users)}")
print("\nDownline structure:")
for user in downline_users[:20]:  # Show first 20
    print(f"   Level {user['level']}: @{user['username']} (ID: {user['id']})")

# Get all binary matches by downline users
print("\n" + "="*80)
print("BINARY MATCHES BY DOWNLINE USERS (Last 30 days)")
print("="*80)

downline_ids = [u['id'] for u in downline_users]

if downline_ids:
    cursor.execute("""
        SELECT 
            bmh.id, bmh.user_id, bmh.matched_amount, bmh.bonus_earned,
            bmh.created_at, u.username, u.sponsor_id
        FROM binary_matching_history bmh
        JOIN users u ON bmh.user_id = u.id
        WHERE bmh.user_id = ANY(%s)
        AND bmh.created_at >= NOW() - INTERVAL '30 days'
        ORDER BY bmh.created_at DESC
        LIMIT 20
    """, (downline_ids,))
    
    matches = cursor.fetchall()
    
    print(f"\nFound {len(matches)} matches in last 30 days:")
    
    for match in matches:
        # Check if downline matching record exists for @avenza
        cursor.execute("""
            SELECT id, user_received, calculated_bonus
            FROM downline_matching_bonus_history
            WHERE downline_user_id = %s
            AND match_amount = %s
            AND user_id = %s
        """, (match['user_id'], match['matched_amount'], avenza_id))
        
        dm_record = cursor.fetchone()
        
        status = "✅ RECORDED" if dm_record else "❌ MISSING"
        
        print(f"\n{match['created_at']}")
        print(f"   User: @{match['username']} (ID: {match['user_id']})")
        print(f"   Match: ${match['matched_amount']}")
        print(f"   Bonus: ${match['bonus_earned']}")
        print(f"   Status: {status}")
        
        if dm_record:
            print(f"   → @avenza received: ${dm_record['user_received']} (calculated: ${dm_record['calculated_bonus']})")

# Check existing downline matching records for @avenza
print("\n" + "="*80)
print("EXISTING DOWNLINE MATCHING RECORDS FOR @AVENZA")
print("="*80)

cursor.execute("""
    SELECT 
        dmh.id, dmh.downline_user_id, dmh.match_amount,
        dmh.calculated_bonus, dmh.user_received, dmh.created_at,
        u.username as downline_username
    FROM downline_matching_bonus_history dmh
    JOIN users u ON dmh.downline_user_id = u.id
    WHERE dmh.user_id = %s
    ORDER BY dmh.created_at DESC
""", (avenza_id,))

existing_records = cursor.fetchall()

print(f"\nTotal records: {len(existing_records)}")

for rec in existing_records:
    print(f"\n{rec['created_at']}")
    print(f"   From: @{rec['downline_username']} (ID: {rec['downline_user_id']})")
    print(f"   Match: ${rec['match_amount']}")
    print(f"   Calculated: ${rec['calculated_bonus']}")
    print(f"   Received: ${rec['user_received']}")

print("\n" + "="*80)
print("SUMMARY")
print("="*80)

print(f"\n• Total downline users: {len(downline_users)}")
print(f"• Matches by downline (30d): {len(matches) if downline_ids else 0}")
print(f"• Records in @avenza's page: {len(existing_records)}")

if matches and len(matches) > len(existing_records):
    print(f"\n⚠️  MISSING RECORDS: {len(matches) - len(existing_records)} matches are not recorded!")
    print("   These matches should appear on @avenza's downline matching page")

cursor.close()
db.close()

print("\n" + "="*80)

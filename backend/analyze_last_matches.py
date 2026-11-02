"""
Analyze Last 2 Binary Matches
Shows complete details of matches, bonuses, and records
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from decimal import Decimal

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
print("ANALYSIS OF LAST 2 BINARY MATCHES")
print("="*80)

# Get last 2 binary matches
cursor.execute("""
    SELECT 
        bmh.id, bmh.user_id, bmh.matched_amount, bmh.left_volume, bmh.right_volume,
        bmh.bonus_earned, bmh.level_achieved, bmh.created_at,
        u.username, u.sponsor_id
    FROM binary_matching_history bmh
    JOIN users u ON bmh.user_id = u.id
    ORDER BY bmh.created_at DESC
    LIMIT 2
""")

matches = cursor.fetchall()

for idx, match in enumerate(matches, 1):
    print(f"\n{'='*80}")
    print(f"MATCH #{idx}: {match['created_at']}")
    print(f"{'='*80}")
    
    user_id = match['user_id']
    username = match['username']
    sponsor_id = match['sponsor_id']
    matched_amount = match['matched_amount']
    bonus_earned = match['bonus_earned']
    
    print(f"\n🎯 WHO MATCHED:")
    print(f"   User ID: {user_id}")
    print(f"   Username: @{username}")
    print(f"   Left Volume: ${match['left_volume']}")
    print(f"   Right Volume: ${match['right_volume']}")
    print(f"   Matched Amount: ${matched_amount}")
    print(f"   Sponsor ID: {sponsor_id if sponsor_id else 'NONE (Top of tree)'}")
    
    # Get sponsor info
    sponsor_username = None
    if sponsor_id:
        cursor.execute("""
            SELECT username FROM users WHERE id = %s
        """, (sponsor_id,))
        sponsor = cursor.fetchone()
        if sponsor:
            sponsor_username = sponsor['username']
            print(f"   Sponsor Username: @{sponsor_username}")
    
    print(f"\n💰 BINARY MATCHING BONUS (Tier Bonus):")
    print(f"   Who Receives: @{username} (the person who matched)")
    print(f"   Amount: ${bonus_earned}")
    if match['level_achieved']:
        print(f"   Tier Unlocked: Level {match['level_achieved']}")
    else:
        print(f"   Tier Unlocked: None (already claimed)")
    print(f"   ✅ Shows in: @{username}'s Binary Matching History page")
    
    print(f"\n💎 DOWNLINE MATCHING BONUS:")
    if sponsor_id:
        # Check if downline matching records were created
        cursor.execute("""
            SELECT 
                dmh.id, dmh.user_id, dmh.calculated_bonus, dmh.user_received, 
                dmh.admin_received, dmh.bonus_percentage,
                u.username as receiver_username
            FROM downline_matching_bonus_history dmh
            JOIN users u ON dmh.user_id = u.id
            WHERE dmh.downline_user_id = %s
            AND dmh.match_amount = %s
            ORDER BY dmh.created_at DESC
        """, (user_id, matched_amount))
        
        downline_records = cursor.fetchall()
        
        if downline_records:
            print(f"   ✅ {len(downline_records)} upline user(s) received bonuses:")
            for dr in downline_records:
                print(f"\n   📊 @{dr['receiver_username']} (ID: {dr['user_id']}):")
                print(f"      Bonus Rate: {dr['bonus_percentage']}%")
                print(f"      Calculated: ${dr['calculated_bonus']}")
                print(f"      User Received: ${dr['user_received']}")
                print(f"      Admin Received: ${dr['admin_received']}")
                if dr['user_received'] == 0:
                    print(f"      ⚠️  Daily cap hit ($220/day)")
                print(f"      ✅ Shows in: @{dr['receiver_username']}'s Downline Matching page")
        else:
            print(f"   ⚠️  NO downline matching records found!")
            print(f"   Expected: @{sponsor_username} (sponsor) should have received bonus")
            print(f"   Reason: Check if sponsor has active package or daily cap hit")
            
            # Check sponsor's package
            cursor.execute("""
                SELECT invested_amount 
                FROM user_investments
                WHERE user_id = %s AND status = 'active'
                ORDER BY invested_amount DESC
                LIMIT 1
            """, (sponsor_id,))
            pkg = cursor.fetchone()
            if pkg:
                print(f"   Sponsor Package: ${pkg['invested_amount']}")
            else:
                print(f"   Sponsor Package: NONE (no active package)")
            
            # Check sponsor's daily earnings
            cursor.execute("""
                SELECT COALESCE(SUM(user_received), 0) as daily_total
                FROM downline_matching_bonus_history
                WHERE user_id = %s 
                AND DATE(created_at AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE
            """, (sponsor_id,))
            daily = cursor.fetchone()
            print(f"   Sponsor Today's Earnings: ${daily['daily_total']}")
    else:
        print(f"   ❌ NO upline to receive bonus")
        print(f"   Reason: @{username} has no sponsor (top of tree)")
        print(f"   ✅ Shows in: NOBODY's Downline Matching page")
    
    # Show who contributed to this match
    print(f"\n👥 WHO CONTRIBUTED TO THIS MATCH:")
    print(f"   (Recent investments that built up @{username}'s volumes)")
    
    # Get recent investments on left side
    cursor.execute("""
        WITH RECURSIVE left_tree AS (
            SELECT id FROM users WHERE id = (SELECT left_child_id FROM users WHERE id = %s)
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN left_tree lt ON u.sponsor_id = lt.id OR u.id IN (
                SELECT left_child_id FROM users WHERE id = lt.id
                UNION
                SELECT right_child_id FROM users WHERE id = lt.id
            )
        )
        SELECT u.username, ui.invested_amount, ui.created_at
        FROM user_investments ui
        JOIN users u ON ui.user_id = u.id
        WHERE ui.user_id IN (SELECT id FROM left_tree)
        AND ui.status = 'active'
        ORDER BY ui.created_at DESC
        LIMIT 5
    """, (user_id,))
    left_contrib = cursor.fetchall()
    
    if left_contrib:
        print(f"\n   👈 LEFT SIDE:")
        for lc in left_contrib:
            print(f"      • @{lc['username']}: ${lc['invested_amount']} on {lc['created_at']}")
    else:
        print(f"\n   👈 LEFT SIDE: (no downline)")
    
    # Get recent investments on right side
    cursor.execute("""
        WITH RECURSIVE right_tree AS (
            SELECT id FROM users WHERE id = (SELECT right_child_id FROM users WHERE id = %s)
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN right_tree rt ON u.sponsor_id = rt.id OR u.id IN (
                SELECT left_child_id FROM users WHERE id = rt.id
                UNION
                SELECT right_child_id FROM users WHERE id = rt.id
            )
        )
        SELECT u.username, ui.invested_amount, ui.created_at
        FROM user_investments ui
        JOIN users u ON ui.user_id = u.id
        WHERE ui.user_id IN (SELECT id FROM right_tree)
        AND ui.status = 'active'
        ORDER BY ui.created_at DESC
        LIMIT 5
    """, (user_id,))
    right_contrib = cursor.fetchall()
    
    if right_contrib:
        print(f"\n   👉 RIGHT SIDE:")
        for rc in right_contrib:
            print(f"      • @{rc['username']}: ${rc['invested_amount']} on {rc['created_at']}")
    else:
        print(f"\n   👉 RIGHT SIDE: (no downline)")
    
    print(f"\n📱 WHERE THIS APPEARS:")
    print(f"   1. @{username}'s Binary Matching History")
    print(f"      - Shows match details, volumes, bonus earned")
    print(f"      - URL: /matching-history")
    
    if sponsor_id and sponsor_username:
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM downline_matching_bonus_history
            WHERE downline_user_id = %s AND match_amount = %s
        """, (user_id, matched_amount))
        dm_count = cursor.fetchone()['count']
        
        if dm_count > 0:
            print(f"   2. @{sponsor_username}'s Downline Matching Bonus page")
            print(f"      - Shows '@{username} matched ${matched_amount}'")
            print(f"      - URL: /downline-matching-bonus")
        else:
            print(f"   2. @{sponsor_username}'s Downline Matching Bonus page")
            print(f"      - ⚠️  NO RECORD (check why above)")

print(f"\n{'='*80}")
print("ANALYSIS COMPLETE")
print("="*80)

cursor.close()
db.close()

#!/usr/bin/env python3
"""
Check Referral Bonus Status for All Users
Shows direct referrals and referral bonus status
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from decimal import Decimal

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def generate_referral_bonus_report():
    """Generate comprehensive referral bonus report"""
    
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        print("=" * 100)
        print("📊 REFERRAL BONUS STATUS REPORT")
        print("=" * 100)
        
        # Get all users with their direct referral count
        cursor.execute("""
            SELECT 
                u.id,
                u.username,
                u.name,
                u.sponsor_id,
                (SELECT username FROM users WHERE id = u.sponsor_id) as sponsor_username,
                (SELECT COUNT(*) FROM users WHERE sponsor_id = u.id) as total_direct_refs,
                (
                    SELECT COUNT(DISTINCT ui.user_id)
                    FROM user_investments ui
                    WHERE ui.user_id IN (SELECT id FROM users WHERE sponsor_id = u.id)
                    AND ui.status = 'active'
                ) as refs_with_investment
            FROM users u
            WHERE u.id != 1  -- Exclude system/admin
            ORDER BY total_direct_refs DESC, u.username
        """)
        
        all_users = cursor.fetchall()
        
        print(f"\n📋 Total Users: {len(all_users)}")
        print("\n" + "=" * 100)
        
        # Group users by referral count
        users_with_refs = [u for u in all_users if u['total_direct_refs'] > 0]
        users_without_refs = [u for u in all_users if u['total_direct_refs'] == 0]
        
        print(f"\n👥 Users with Direct Referrals: {len(users_with_refs)}")
        print(f"👤 Users without Referrals: {len(users_without_refs)}")
        
        # Detailed report for users with referrals
        print("\n" + "=" * 100)
        print("USERS WITH DIRECT REFERRALS (Sorted by Most Refs)")
        print("=" * 100)
        
        for user in users_with_refs:
            user_id = user['id']
            username = user['username']
            total_refs = user['total_direct_refs']
            refs_invested = user['refs_with_investment']
            
            print(f"\n{'─' * 100}")
            print(f"👤 USER: @{username} (ID: {user_id})")
            print(f"   Sponsor: @{user['sponsor_username'] or 'None'}")
            print(f"   📊 Direct Referrals: {total_refs} total | {refs_invested} with active investment")
            
            # Get referral bonus stats
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_bonuses,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                    COUNT(CASE WHEN status = 'claimed' THEN 1 END) as claimed_count,
                    COALESCE(SUM(CASE WHEN status = 'pending' THEN bonus_amount ELSE 0 END), 0) as pending_amount,
                    COALESCE(SUM(CASE WHEN status = 'claimed' THEN bonus_amount ELSE 0 END), 0) as claimed_amount
                FROM referral_bonuses
                WHERE referrer_id = %s
            """, (user_id,))
            
            bonus_stats = cursor.fetchone()
            
            total_bonuses = bonus_stats['total_bonuses']
            pending_count = bonus_stats['pending_count']
            claimed_count = bonus_stats['claimed_count']
            pending_amount = float(bonus_stats['pending_amount'])
            claimed_amount = float(bonus_stats['claimed_amount'])
            
            print(f"\n   💰 REFERRAL BONUS STATUS:")
            print(f"      Total Bonuses Created: {total_bonuses}")
            print(f"      🔄 Pending: {pending_count} bonuses = ${pending_amount:.2f}")
            print(f"      ✅ Claimed: {claimed_count} bonuses = ${claimed_amount:.2f}")
            
            if total_bonuses == 0 and refs_invested > 0:
                print(f"      ⚠️  WARNING: {refs_invested} refs have investments but NO bonuses created!")
            
            # List their referrals
            cursor.execute("""
                SELECT 
                    u.id,
                    u.username,
                    u.name,
                    (
                        SELECT COUNT(*) 
                        FROM user_investments 
                        WHERE user_id = u.id AND status = 'active'
                    ) as active_investments,
                    (
                        SELECT SUM(invested_amount)
                        FROM user_investments
                        WHERE user_id = u.id
                    ) as total_invested
                FROM users u
                WHERE u.sponsor_id = %s
                ORDER BY u.username
            """, (user_id,))
            
            referrals = cursor.fetchall()
            
            print(f"\n   📋 REFERRALS LIST:")
            for i, ref in enumerate(referrals, 1):
                ref_username = ref['username']
                ref_active_inv = ref['active_investments']
                ref_total_invested = float(ref['total_invested'] or 0)
                
                # Check if bonus exists for this referral
                cursor.execute("""
                    SELECT 
                        id,
                        referral_number,
                        bonus_percentage,
                        bonus_amount,
                        status,
                        created_at
                    FROM referral_bonuses
                    WHERE referrer_id = %s AND referral_id = %s
                    ORDER BY created_at DESC
                    LIMIT 1
                """, (user_id, ref['id']))
                
                bonus = cursor.fetchone()
                
                if bonus:
                    bonus_status = "✅ CLAIMED" if bonus['status'] == 'claimed' else "🔄 PENDING"
                    print(f"      {i}. @{ref_username} - {ref_active_inv} investments (${ref_total_invested:.2f}) - "
                          f"Bonus: ${float(bonus['bonus_amount']):.2f} ({float(bonus['bonus_percentage'])}%) - {bonus_status}")
                else:
                    if ref_total_invested > 0:
                        print(f"      {i}. @{ref_username} - {ref_active_inv} investments (${ref_total_invested:.2f}) - "
                              f"❌ NO BONUS CREATED!")
                    else:
                        print(f"      {i}. @{ref_username} - NO investments yet")
        
        # Summary of issues
        print("\n" + "=" * 100)
        print("🔍 ISSUES DETECTED")
        print("=" * 100)
        
        cursor.execute("""
            SELECT 
                u1.username as referrer,
                u2.username as referral,
                u2.id as referral_id,
                u1.id as referrer_id,
                SUM(ui.invested_amount) as total_invested
            FROM users u1
            JOIN users u2 ON u2.sponsor_id = u1.id
            JOIN user_investments ui ON ui.user_id = u2.id
            LEFT JOIN referral_bonuses rb ON rb.referrer_id = u1.id AND rb.referral_id = u2.id
            WHERE rb.id IS NULL
            GROUP BY u1.username, u2.username, u2.id, u1.id
            HAVING SUM(ui.invested_amount) > 0
            ORDER BY u1.username, u2.username
        """)
        
        missing_bonuses = cursor.fetchall()
        
        if missing_bonuses:
            print(f"\n⚠️  MISSING BONUSES: {len(missing_bonuses)} referrals have investments but no bonus created!\n")
            for mb in missing_bonuses:
                print(f"   ❌ @{mb['referrer']} should get bonus for @{mb['referral']}'s ${float(mb['total_invested']):.2f} investment")
        else:
            print("\n✅ No missing bonuses detected - all referral investments have bonuses!")
        
        # Check for users with 4+ refs but no bonus access issue
        cursor.execute("""
            SELECT 
                u.id,
                u.username,
                COUNT(DISTINCT u2.id) as ref_count
            FROM users u
            JOIN users u2 ON u2.sponsor_id = u.id
            JOIN user_investments ui ON ui.user_id = u2.id
            WHERE ui.status = 'active'
            GROUP BY u.id, u.username
            HAVING COUNT(DISTINCT u2.id) >= 4
            ORDER BY ref_count DESC
        """)
        
        users_with_4plus = cursor.fetchall()
        
        if users_with_4plus:
            print(f"\n" + "=" * 100)
            print(f"👑 USERS WITH 4+ ACTIVE REFERRALS (Bonus Rate: 8%)")
            print("=" * 100)
            for u in users_with_4plus:
                print(f"   @{u['username']} - {u['ref_count']} active referrals")
                
                # Check their bonus status
                cursor.execute("""
                    SELECT COUNT(*) as total FROM referral_bonuses WHERE referrer_id = %s
                """, (u['id'],))
                bonus_count = cursor.fetchone()['total']
                
                if bonus_count == 0:
                    print(f"      ❌ WARNING: Has {u['ref_count']} refs but ZERO bonuses created!")
                else:
                    print(f"      ✅ Has {bonus_count} bonus records")
        
        print("\n" + "=" * 100)
        print("📊 SUMMARY STATISTICS")
        print("=" * 100)
        
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT referrer_id) as total_referrers,
                COUNT(*) as total_bonuses,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bonuses,
                COUNT(CASE WHEN status = 'claimed' THEN 1 END) as claimed_bonuses,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN bonus_amount ELSE 0 END), 0) as pending_total,
                COALESCE(SUM(CASE WHEN status = 'claimed' THEN bonus_amount ELSE 0 END), 0) as claimed_total,
                COALESCE(SUM(bonus_amount), 0) as all_time_total
            FROM referral_bonuses
        """)
        
        summary = cursor.fetchone()
        
        print(f"\n👥 Total Users with Bonuses: {summary['total_referrers']}")
        print(f"💰 Total Bonuses Created: {summary['total_bonuses']}")
        print(f"   🔄 Pending: {summary['pending_bonuses']} = ${float(summary['pending_total']):.2f}")
        print(f"   ✅ Claimed: {summary['claimed_bonuses']} = ${float(summary['claimed_total']):.2f}")
        print(f"   💎 All-Time Total: ${float(summary['all_time_total']):.2f}")
        
        print("\n" + "=" * 100)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    generate_referral_bonus_report()

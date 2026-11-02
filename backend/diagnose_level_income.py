#!/usr/bin/env python3
"""
Diagnostic Script for Level Income System
Checks why level income is not being credited to users
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from decimal import Decimal
from datetime import date, datetime

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def diagnose_level_income():
    """Run comprehensive diagnostics on level income system"""
    
    print("=" * 80)
    print("🔍 LEVEL INCOME SYSTEM DIAGNOSTICS")
    print("=" * 80)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        # CHECK 1: Does level_income_config table exist?
        print("\n✅ CHECK 1: Level Income Config Table")
        print("-" * 80)
        try:
            cursor.execute("""
                SELECT level, percentage, is_active 
                FROM level_income_config 
                ORDER BY level
            """)
            configs = cursor.fetchall()
            
            if not configs:
                print("❌ ERROR: level_income_config table is EMPTY!")
                print("   ⚠️  You need to run: python3 migrations/level_income_setup.py")
                return False
            else:
                print(f"✅ Table exists with {len(configs)} levels configured")
                print("\n📊 Level Configuration:")
                for cfg in configs[:5]:  # Show first 5
                    status = "✅ Active" if cfg['is_active'] else "❌ Inactive"
                    print(f"   Level {cfg['level']}: {cfg['percentage']}% - {status}")
                if len(configs) > 5:
                    print(f"   ... and {len(configs) - 5} more levels")
                    
        except Exception as e:
            print(f"❌ ERROR: level_income_config table does NOT exist!")
            print(f"   Error: {e}")
            print("   ⚠️  You need to run: python3 migrations/level_income_setup.py")
            return False
        
        # CHECK 2: Does level_income_transactions table exist?
        print("\n✅ CHECK 2: Level Income Transactions Table")
        print("-" * 80)
        try:
            cursor.execute("""
                SELECT COUNT(*) as count FROM level_income_transactions
            """)
            count = cursor.fetchone()['count']
            print(f"✅ Table exists with {count} total transactions")
            
            if count > 0:
                # Show recent transactions
                cursor.execute("""
                    SELECT 
                        lit.id,
                        lit.recipient_id,
                        u1.username as recipient,
                        lit.from_user_id,
                        u2.username as from_user,
                        lit.level,
                        lit.income_amount,
                        lit.created_at
                    FROM level_income_transactions lit
                    JOIN users u1 ON lit.recipient_id = u1.id
                    JOIN users u2 ON lit.from_user_id = u2.id
                    ORDER BY lit.created_at DESC
                    LIMIT 5
                """)
                recent = cursor.fetchall()
                print("\n📋 Recent Transactions (last 5):")
                for txn in recent:
                    print(f"   #{txn['id']}: @{txn['recipient']} earned ${txn['income_amount']} from @{txn['from_user']}'s ROI (L{txn['level']}) - {txn['created_at']}")
            else:
                print("⚠️  No transactions yet - this is normal if cron hasn't run")
                
        except Exception as e:
            print(f"❌ ERROR: level_income_transactions table does NOT exist!")
            print(f"   Error: {e}")
            print("   ⚠️  You need to run: python3 migrations/level_income_setup.py")
            return False
        
        # CHECK 3: Are there active investments with daily profits?
        print("\n✅ CHECK 3: Active Investments (Sample)")
        print("-" * 80)
        cursor.execute("""
            SELECT 
                ui.id,
                u.id as user_id,
                u.username,
                ui.invested_amount,
                ui.daily_profit,
                ui.total_earned,
                ui.max_profit,
                ui.last_profit_date,
                ui.status
            FROM user_investments ui
            JOIN users u ON ui.user_id = u.id
            WHERE ui.status = 'active'
            ORDER BY ui.id
            LIMIT 10
        """)
        investments = cursor.fetchall()
        
        if not investments:
            print("⚠️  No active investments found!")
            print("   Level income is only distributed when users receive daily profits")
        else:
            print(f"✅ Found {len(investments)} active investments (showing first 10)")
            today = date.today()
            for inv in investments:
                processed_today = "✅ YES" if inv['last_profit_date'] == today else "❌ NO"
                print(f"   Investment #{inv['id']}: @{inv['username']} - ${inv['daily_profit']}/day - Processed today: {processed_today}")
        
        # CHECK 4: User sponsor chains
        print("\n✅ CHECK 4: Sponsor Chain (Sample User)")
        print("-" * 80)
        if investments:
            sample_user_id = investments[0]['user_id']
            sample_username = investments[0]['username']
            
            print(f"Checking sponsor chain for user #{sample_user_id} (@{sample_username}):")
            
            current_id = sample_user_id
            level = 1
            chain = []
            
            while level <= 20 and current_id:
                cursor.execute("""
                    SELECT id, username, sponsor_id FROM users WHERE id = %s
                """, (current_id,))
                user = cursor.fetchone()
                
                if not user or not user['sponsor_id']:
                    break
                
                # Get sponsor info
                cursor.execute("""
                    SELECT id, username, sponsor_id FROM users WHERE id = %s
                """, (user['sponsor_id'],))
                sponsor = cursor.fetchone()
                
                if not sponsor:
                    break
                
                # Check direct referrals for level unlock
                cursor.execute("""
                    SELECT COUNT(*) as count FROM users WHERE sponsor_id = %s
                """, (sponsor['id'],))
                direct_refs = cursor.fetchone()['count']
                
                # Calculate unlocked levels
                if direct_refs == 0:
                    unlocked = 0
                elif direct_refs >= 10:
                    unlocked = 20
                else:
                    unlocked = direct_refs * 2
                
                is_unlocked = "✅ UNLOCKED" if level <= unlocked else "🔒 LOCKED"
                chain.append({
                    'level': level,
                    'sponsor_id': sponsor['id'],
                    'sponsor_username': sponsor['username'],
                    'direct_refs': direct_refs,
                    'unlocked_levels': unlocked,
                    'is_unlocked': is_unlocked
                })
                
                print(f"   L{level}: @{sponsor['username']} (ID: {sponsor['id']}) - {direct_refs} direct refs → {unlocked} levels unlocked - {is_unlocked}")
                
                current_id = sponsor['id']
                level += 1
            
            if not chain:
                print(f"   ⚠️  User @{sample_username} has NO sponsor chain!")
                print("      This means they won't distribute level income to anyone")
            else:
                print(f"\n   📊 Total upline levels found: {len(chain)}")
                unlocked_count = sum(1 for c in chain if 'UNLOCKED' in c['is_unlocked'])
                print(f"   ✅ Unlocked: {unlocked_count} levels")
                print(f"   🔒 Locked: {len(chain) - unlocked_count} levels")
        
        # CHECK 5: Test manual distribution
        print("\n✅ CHECK 5: Test Manual Distribution")
        print("-" * 80)
        
        if investments:
            test_user_id = investments[0]['user_id']
            test_username = investments[0]['username']
            test_roi = Decimal('10.00')
            
            print(f"Would you like to test level income distribution?")
            print(f"  User: @{test_username} (ID: {test_user_id})")
            print(f"  Test ROI Amount: ${test_roi}")
            print(f"\nThis will:")
            print(f"  1. Calculate level income for their upline")
            print(f"  2. Credit income to unlocked levels")
            print(f"  3. Create transaction records")
            print(f"\n⚠️  This is a REAL transaction - it will affect real balances!")
            
            response = input("\n🤔 Run test distribution? (yes/no): ").strip().lower()
            
            if response == 'yes':
                from distribute_level_income import distribute_level_income_for_user
                
                print(f"\n🚀 Running test distribution...")
                success = distribute_level_income_for_user(
                    user_id=test_user_id,
                    roi_amount=test_roi,
                    investment_id=investments[0]['id']
                )
                
                if success:
                    print("\n✅ Test distribution completed!")
                    print("   Check level_income_transactions table for new records")
                else:
                    print("\n❌ Test distribution FAILED!")
                    print("   Check the error messages above")
            else:
                print("\n⏭️  Skipping test distribution")
        
        # SUMMARY
        print("\n" + "=" * 80)
        print("📊 DIAGNOSTIC SUMMARY")
        print("=" * 80)
        
        cursor.execute("SELECT COUNT(*) as count FROM level_income_config WHERE is_active = TRUE")
        config_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM level_income_transactions")
        txn_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM user_investments WHERE status = 'active'")
        active_inv_count = cursor.fetchone()['count']
        
        print(f"✅ Level Config: {config_count} active levels")
        print(f"✅ Transactions: {txn_count} total level income transactions")
        print(f"✅ Active Investments: {active_inv_count} investments")
        
        if config_count == 0:
            print("\n❌ ISSUE: No level income configuration!")
            print("   👉 Run: python3 migrations/level_income_setup.py")
        elif txn_count == 0:
            print("\n⚠️  WARNING: No level income transactions yet!")
            print("   Possible reasons:")
            print("   1. Cron job hasn't run yet")
            print("   2. distribute_level_income_for_user() is not being called")
            print("   3. Users don't have sponsor chains")
            print("   4. Error in distribution logic")
            print("\n   👉 Next steps:")
            print("   1. Check cron job is running: crontab -l")
            print("   2. Manually run: python3 cron_daily_profit.py")
            print("   3. Check logs for errors")
        else:
            print("\n✅ System appears to be working!")
            print(f"   {txn_count} level income distributions have been made")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 80)
        
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    diagnose_level_income()

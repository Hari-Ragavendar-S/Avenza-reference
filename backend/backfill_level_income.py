#!/usr/bin/env python3
"""
Backfill Level Income for Past ROI Payments
This script finds all past investment_transactions (daily_profit type)
and distributes level income retroactively to eligible upline members
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from decimal import Decimal
from datetime import datetime
from distribute_level_income import distribute_level_income_for_user

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def calculate_unlocked_levels(direct_referrals):
    """Calculate how many levels are unlocked based on direct referrals"""
    if direct_referrals == 0:
        return 0
    if direct_referrals >= 10:
        return 20
    return direct_referrals * 2

def backfill_level_income():
    """Backfill level income for all past daily profit transactions"""
    
    print("=" * 80)
    print("🔄 BACKFILLING LEVEL INCOME FOR PAST ROI PAYMENTS")
    print("=" * 80)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        # Get all past daily profit transactions
        print("\n📊 Finding all past daily profit transactions...")
        cursor.execute("""
            SELECT 
                it.id as transaction_id,
                it.user_id,
                u.username,
                it.investment_id,
                it.amount as roi_amount,
                it.created_at,
                DATE(it.created_at) as profit_date
            FROM investment_transactions it
            JOIN users u ON it.user_id = u.id
            WHERE it.transaction_type = 'daily_profit'
            ORDER BY it.created_at ASC
        """)
        
        all_transactions = cursor.fetchall()
        
        if not all_transactions:
            print("⚠️  No daily profit transactions found!")
            cursor.close()
            conn.close()
            return
        
        print(f"✅ Found {len(all_transactions)} daily profit transactions")
        
        # Check which already have level income distributed
        transaction_ids = [t['transaction_id'] for t in all_transactions]
        
        print("\n🔍 Checking which transactions already have level income...")
        cursor.execute("""
            SELECT DISTINCT
                it.id as transaction_id
            FROM investment_transactions it
            JOIN level_income_transactions lit ON 
                lit.from_user_id = it.user_id 
                AND DATE(lit.created_at) = DATE(it.created_at)
                AND lit.roi_amount = it.amount
            WHERE it.transaction_type = 'daily_profit'
        """)
        
        existing_transactions = {row['transaction_id'] for row in cursor.fetchall()}
        
        # Filter to only transactions that need backfill
        transactions_to_backfill = [
            t for t in all_transactions 
            if t['transaction_id'] not in existing_transactions
        ]
        
        print(f"✅ Already processed: {len(existing_transactions)} transactions")
        print(f"📝 Need to backfill: {len(transactions_to_backfill)} transactions")
        
        if not transactions_to_backfill:
            print("\n✨ All transactions already have level income distributed!")
            cursor.close()
            conn.close()
            return
        
        # Show summary by date
        from collections import defaultdict
        by_date = defaultdict(lambda: {'count': 0, 'total_roi': Decimal('0')})
        
        for txn in transactions_to_backfill:
            profit_date = txn['profit_date']
            by_date[profit_date]['count'] += 1
            by_date[profit_date]['total_roi'] += Decimal(str(txn['roi_amount']))
        
        print("\n📅 Backfill Summary by Date:")
        for profit_date in sorted(by_date.keys()):
            data = by_date[profit_date]
            print(f"   {profit_date}: {data['count']} transactions, ${data['total_roi']} total ROI")
        
        # Confirm before proceeding
        print("\n" + "=" * 80)
        print("⚠️  WARNING: This will create level income transactions and credit balances!")
        print("=" * 80)
        response = input("\n🤔 Do you want to proceed with backfill? (yes/no): ").strip().lower()
        
        if response != 'yes':
            print("\n❌ Backfill cancelled")
            cursor.close()
            conn.close()
            return
        
        # Process backfill
        print("\n🚀 Starting backfill process...\n")
        
        total_processed = 0
        total_level_income_distributed = Decimal('0')
        total_recipients = set()
        errors = []
        
        for txn in transactions_to_backfill:
            user_id = txn['user_id']
            username = txn['username']
            roi_amount = Decimal(str(txn['roi_amount']))
            investment_id = txn['investment_id']
            profit_date = txn['profit_date']
            
            print(f"📊 Processing: @{username} - ${roi_amount} ROI on {profit_date}")
            
            try:
                # Get current sponsor chain and check eligibility
                cursor.execute("""
                    SELECT sponsor_id FROM users WHERE id = %s
                """, (user_id,))
                
                result = cursor.fetchone()
                
                if not result or not result['sponsor_id']:
                    print(f"   ⚠️  Skipped - No sponsor")
                    continue
                
                # Track distribution before calling function
                cursor.execute("""
                    SELECT COUNT(*) as count FROM level_income_transactions
                """)
                before_count = cursor.fetchone()['count']
                
                # Call distribution function
                success = distribute_level_income_for_user(
                    user_id=user_id,
                    roi_amount=roi_amount,
                    investment_id=investment_id
                )
                
                if success:
                    # Check how many were created
                    cursor.execute("""
                        SELECT COUNT(*) as count FROM level_income_transactions
                    """)
                    after_count = cursor.fetchone()['count']
                    
                    new_transactions = after_count - before_count
                    
                    # Get total distributed
                    cursor.execute("""
                        SELECT 
                            COALESCE(SUM(income_amount), 0) as total,
                            COUNT(DISTINCT recipient_id) as recipients
                        FROM (
                            SELECT income_amount, recipient_id
                            FROM level_income_transactions
                            WHERE from_user_id = %s 
                            AND roi_amount = %s
                            ORDER BY id DESC
                            LIMIT %s
                        ) subquery
                    """, (user_id, roi_amount, new_transactions))
                    
                    dist_result = cursor.fetchone()
                    distributed = Decimal(str(dist_result['total']))
                    recipients = dist_result['recipients']
                    
                    total_level_income_distributed += distributed
                    total_processed += 1
                    
                    if recipients > 0:
                        print(f"   ✅ Distributed ${distributed} to {recipients} upline members ({new_transactions} levels)")
                        # Track unique recipients
                        cursor.execute("""
                            SELECT DISTINCT recipient_id
                            FROM (
                                SELECT recipient_id, id
                                FROM level_income_transactions
                                WHERE from_user_id = %s 
                                AND roi_amount = %s
                                ORDER BY id DESC
                                LIMIT %s
                            ) subquery
                        """, (user_id, roi_amount, new_transactions))
                        for row in cursor.fetchall():
                            total_recipients.add(row['recipient_id'])
                    else:
                        print(f"   ⚠️  No upline members eligible (levels locked)")
                else:
                    print(f"   ❌ Distribution failed")
                    errors.append((username, "Distribution function returned False"))
                    
            except Exception as e:
                print(f"   ❌ Error: {e}")
                errors.append((username, str(e)))
                continue
        
        # Final Summary
        print("\n" + "=" * 80)
        print("📊 BACKFILL COMPLETE")
        print("=" * 80)
        print(f"✅ Transactions processed: {total_processed} / {len(transactions_to_backfill)}")
        print(f"💰 Total level income distributed: ${total_level_income_distributed}")
        print(f"👥 Unique recipients who received income: {len(total_recipients)}")
        
        if errors:
            print(f"\n⚠️  Errors encountered: {len(errors)}")
            print("\nError Details:")
            for username, error in errors[:10]:  # Show first 10
                print(f"   @{username}: {error}")
            if len(errors) > 10:
                print(f"   ... and {len(errors) - 10} more errors")
        
        # Show top recipients
        print("\n🏆 Top 10 Recipients:")
        cursor.execute("""
            SELECT 
                u.username,
                lit.recipient_id,
                COUNT(*) as transaction_count,
                SUM(lit.income_amount) as total_earned
            FROM level_income_transactions lit
            JOIN users u ON lit.recipient_id = u.id
            GROUP BY u.username, lit.recipient_id
            ORDER BY total_earned DESC
            LIMIT 10
        """)
        
        rank = 1
        for row in cursor.fetchall():
            print(f"   {rank}. @{row['username']}: ${row['total_earned']} ({row['transaction_count']} transactions)")
            rank += 1
        
        # Verify balances
        print("\n💰 Verifying Income Balances...")
        cursor.execute("""
            SELECT 
                u.username,
                u.income_balance,
                COALESCE(SUM(lit.income_amount), 0) as total_level_income
            FROM users u
            LEFT JOIN level_income_transactions lit ON u.id = lit.recipient_id
            WHERE u.id IN (
                SELECT DISTINCT recipient_id FROM level_income_transactions
            )
            GROUP BY u.id, u.username, u.income_balance
            ORDER BY total_level_income DESC
            LIMIT 5
        """)
        
        print("Top 5 users by level income:")
        for row in cursor.fetchall():
            print(f"   @{row['username']}: Income Balance = ${row['income_balance']}, Level Income = ${row['total_level_income']}")
        
        print("\n✅ Backfill process completed successfully!")
        print("=" * 80)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.close()

if __name__ == "__main__":
    backfill_level_income()

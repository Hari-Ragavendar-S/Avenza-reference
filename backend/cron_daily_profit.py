#!/usr/bin/env python3
"""
Daily Profit Calculation Cron Job
Runs daily to calculate and credit profit to INCOME WALLET + Level Income
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
from datetime import date, datetime
from decimal import Decimal
import pytz

# Import level income distribution
from distribute_level_income import distribute_level_income_for_user

load_dotenv()

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        cursor_factory=RealDictCursor
    )

def get_ist_time():
    """Get current time in IST"""
    ist = pytz.timezone('Asia/Kolkata')
    return datetime.now(ist)

def calculate_daily_profits():
    """Calculate and credit daily profits to users"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    today = date.today()
    ist_now = get_ist_time()
    
    print(f"\n🚀 Starting daily profit calculation - {ist_now.strftime('%Y-%m-%d %I:%M:%S %p IST')}")
    
    try:
        # Get all active investments that haven't reached 2x profit limit
        cursor.execute("""
            SELECT 
                ui.id, ui.user_id, ui.package_id, ui.invested_amount,
                ui.total_earned, ui.daily_profit, ui.max_profit,
                ui.last_profit_date,
                ip.name as package_name,
                u.username
            FROM user_investments ui
            JOIN investment_packages ip ON ui.package_id = ip.id
            JOIN users u ON ui.user_id = u.id
            WHERE ui.status = 'active'
                AND ui.total_earned < ui.max_profit
        """)
        
        investments = cursor.fetchall()
        
        print(f"📊 Found {len(investments)} active investments to process")
        
        processed = 0
        completed = 0
        skipped = 0
        
        for inv in investments:
            investment_id = inv['id']
            user_id = inv['user_id']
            daily_profit = float(inv['daily_profit'])
            total_earned = float(inv['total_earned'])
            max_profit = float(inv['max_profit'])
            last_profit_date = inv['last_profit_date']
            
            # Skip if already processed today
            if last_profit_date and last_profit_date == today:
                skipped += 1
                continue
            
            # Calculate profit (don't exceed 2x limit)
            remaining_profit = max_profit - total_earned
            actual_profit = min(daily_profit, remaining_profit)
            
            if actual_profit <= 0:
                # Mark as completed if 2x reached
                cursor.execute("""
                    UPDATE user_investments
                    SET status = 'completed'
                    WHERE id = %s
                """, (investment_id,))
                completed += 1
                print(f"  ✅ Investment #{investment_id} (User: {inv['username']}) - COMPLETED (2x reached)")
                continue
            
            # Credit profit to INCOME WALLET
            cursor.execute("""
                UPDATE users
                SET income_balance = income_balance + %s
                WHERE id = %s
            """, (actual_profit, user_id))
            
            # Update investment record
            new_total_earned = total_earned + actual_profit
            new_status = 'completed' if new_total_earned >= max_profit else 'active'
            
            cursor.execute("""
                UPDATE user_investments
                SET total_earned = %s,
                    last_profit_date = %s,
                    status = %s
                WHERE id = %s
            """, (new_total_earned, today, new_status, investment_id))
            
            # Record investment transaction
            cursor.execute("""
                INSERT INTO investment_transactions (
                    user_id, investment_id, amount, transaction_type,
                    wallet_type, description
                ) VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                user_id, investment_id, actual_profit, 'daily_profit',
                'income', f'Daily profit from {inv["package_name"]} package'
            ))
            
            # Record in main transactions table
            cursor.execute("""
                INSERT INTO transactions (
                    user_id, type, amount, currency, description,
                    reference_id, reference_type, status, wallet_type
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id, 'investment_profit', actual_profit, 'USD',
                f'Daily profit: ${actual_profit:.2f} from {inv["package_name"]} package',
                investment_id, 'investment', 'completed', 'income'
            ))
            
            processed += 1
            status_emoji = "🎉" if new_status == 'completed' else "💰"
            print(f"  {status_emoji} Investment #{investment_id} (User: {inv['username']}, Package: {inv['package_name']}) - Credited ${actual_profit:.2f} | Total: ${new_total_earned:.2f}/${max_profit:.2f}")
            
            # 🌟 DISTRIBUTE LEVEL INCOME TO UPLINE
            try:
                print(f"  📊 Distributing level income for user {user_id}...")
                distribute_level_income_for_user(
                    user_id=user_id,
                    roi_amount=Decimal(str(actual_profit)),
                    investment_id=investment_id
                )
            except Exception as level_error:
                print(f"  ⚠️ Level income distribution failed: {level_error}")
                # Don't rollback main transaction, just log the error
        
        conn.commit()
        
        print(f"\n✨ Daily profit calculation completed!")
        print(f"📈 Summary:")
        print(f"  - Processed: {processed} investments")
        print(f"  - Completed (2x reached): {completed} investments")
        print(f"  - Skipped (already processed today): {skipped} investments")
        print(f"  - Total: {len(investments)} active investments\n")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error during profit calculation: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    calculate_daily_profits()

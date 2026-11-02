"""
Distribution Engine - Optimized for Concurrent Deposits
Handles equal distribution of public deposits to all active users
Uses database-level locking to prevent race conditions
"""

import asyncio
from decimal import Decimal
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import pytz

class DistributionEngine:
    """
    Handles distribution of public deposits to all users
    Optimized for concurrent processing with database locks
    """
    
    def __init__(self, db_connection):
        self.db = db_connection
        self.ist = pytz.timezone('Asia/Kolkata')
    
    def get_ist_time(self):
        """Get current time in IST"""
        return datetime.now(self.ist)
    
    async def queue_distribution(
        self, 
        transaction_hash: str, 
        amount_bep20: Decimal, 
        source_type: str
    ) -> int:
        """
        Add distribution to queue for processing
        
        Args:
            transaction_hash: Transaction hash
            amount_bep20: Amount in BEP20 USDT
            source_type: 'website' or 'external'
            
        Returns:
            Queue ID
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute("""
                INSERT INTO distribution_queue 
                (source_type, transaction_hash, amount_bep20, status, created_at)
                VALUES (%s, %s, %s, 'pending', %s)
                RETURNING id
            """, (source_type, transaction_hash, amount_bep20, self.get_ist_time()))
            
            queue_id = cursor.fetchone()['id']
            self.db.commit()
            
            print(f"✅ Queued distribution: {transaction_hash} (${amount_bep20})")
            return queue_id
            
        except psycopg2.IntegrityError:
            self.db.rollback()
            # Already queued
            print(f"⚠️  Distribution already queued: {transaction_hash}")
            cursor.execute("""
                SELECT id FROM distribution_queue WHERE transaction_hash = %s
            """, (transaction_hash,))
            return cursor.fetchone()['id']
        finally:
            cursor.close()
    
    async def process_distribution(
        self, 
        transaction_hash: str, 
        amount_bep20: Decimal, 
        source_type: str
    ) -> dict:
        """
        Process distribution with database-level locking
        Prevents duplicate distributions for concurrent deposits
        
        Args:
            transaction_hash: Unique transaction hash
            amount_bep20: Amount to distribute in BEP20 USDT
            source_type: 'website' or 'external'
            
        Returns:
            Distribution result dict
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        
        try:
            # Step 1: Update queue status to processing with row lock
            cursor.execute("""
                UPDATE distribution_queue 
                SET status = 'processing'
                WHERE transaction_hash = %s AND status = 'pending'
                RETURNING id
            """, (transaction_hash,))
            
            queue_record = cursor.fetchone()
            if not queue_record:
                # Already processed or being processed
                print(f"⚠️  Distribution already processed: {transaction_hash}")
                return {
                    'success': False,
                    'message': 'Already processed',
                    'transaction_hash': transaction_hash
                }
            
            self.db.commit()
            
            print(f"\n{'='*60}")
            print(f"💰 PROCESSING DISTRIBUTION")
            print(f"{'='*60}")
            print(f"TX Hash: {transaction_hash}")
            print(f"Amount: ${amount_bep20} BEP20 USDT")
            print(f"Source: {source_type}")
            print(f"{'='*60}\n")
            
            # Step 2: Get all active users with SELECT FOR UPDATE to lock rows
            cursor.execute("""
                SELECT id, name, email 
                FROM users 
                WHERE is_active = TRUE
                ORDER BY id
                FOR UPDATE
            """)
            
            users = cursor.fetchall()
            
            if not users or len(users) == 0:
                raise Exception("No active users found for distribution")
            
            total_users = len(users)
            per_user_amount = amount_bep20 / Decimal(total_users)
            
            print(f"📊 Distribution Plan:")
            print(f"   Total Users: {total_users}")
            print(f"   Per User: ${per_user_amount}")
            print(f"\n🔄 Starting distribution...\n")
            
            # Step 3: Get source transaction ID
            table_name = f'public_deposits_{source_type}'
            cursor.execute(f"""
                SELECT id FROM {table_name} 
                WHERE transaction_hash = %s
            """, (transaction_hash,))
            
            source_record = cursor.fetchone()
            if not source_record:
                raise Exception(f"Source transaction not found: {transaction_hash}")
            
            source_id = source_record['id']
            
            # Step 4: Distribute to all users (batch operation)
            ist_now = self.get_ist_time()
            distribution_records = []
            transaction_records = []
            
            for user in users:
                # Prepare distribution record
                distribution_records.append((
                    source_type,
                    source_id,
                    user['id'],
                    user['name'],
                    user['email'],
                    '',  # phone - not available in users table
                    per_user_amount,
                    'completed',
                    ist_now
                ))
                
                # Prepare transaction record
                transaction_records.append((
                    user['id'],
                    'deposit',
                    per_user_amount,
                    'USDT',
                    f'Public deposit distribution from {transaction_hash[:10]}...',
                    source_id,
                    source_type,
                    'completed',
                    'avenza',
                    'public_deposit',
                    ist_now
                ))
            
            # Batch insert distribution records
            cursor.executemany("""
                INSERT INTO public_distribution_records 
                (source_type, source_transaction_id, user_id, user_name, 
                 user_email, user_phone, credited_amount, status, credited_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, distribution_records)
            
            # Batch insert transaction records
            cursor.executemany("""
                INSERT INTO transactions 
                (user_id, type, amount, currency, description, reference_id, 
                 reference_type, status, wallet_type, tag, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, transaction_records)
            
            # Batch update user balances (more efficient than individual updates)
            cursor.execute("""
                UPDATE users 
                SET avenza_balance = avenza_balance + %s
                WHERE id = ANY(%s)
            """, (per_user_amount, [u['id'] for u in users]))
            
            # Step 5: Update source deposit record
            cursor.execute(f"""
                UPDATE {table_name}
                SET is_distributed = TRUE,
                    distributed_to_count = %s,
                    processed_at = %s
                WHERE id = %s
            """, (total_users, ist_now, source_id))
            
            # Step 6: Update public stats
            cursor.execute("""
                UPDATE public_stats
                SET total_deposits_count = total_deposits_count + 1,
                    total_{}_deposits = total_{}_deposits + 1,
                    total_amount_received = total_amount_received + %s,
                    total_distributed = total_distributed + %s,
                    total_participants = (SELECT COUNT(DISTINCT user_id) FROM public_distribution_records),
                    last_deposit_at = %s,
                    updated_at = %s
                WHERE id = 1
            """.format(source_type, source_type), 
            (amount_bep20, amount_bep20, ist_now, ist_now))
            
            # Step 7: Mark queue item as completed
            cursor.execute("""
                UPDATE distribution_queue
                SET status = 'completed',
                    processed_at = %s
                WHERE transaction_hash = %s
            """, (ist_now, transaction_hash))
            
            # Commit all changes
            self.db.commit()
            
            print(f"\n{'='*60}")
            print(f"✅ DISTRIBUTION COMPLETED SUCCESSFULLY")
            print(f"{'='*60}")
            print(f"📊 Summary:")
            print(f"   Total Distributed: ${amount_bep20}")
            print(f"   Users Credited: {total_users}")
            print(f"   Per User: ${per_user_amount}")
            print(f"   Status: Completed")
            print(f"{'='*60}\n")
            
            return {
                'success': True,
                'message': 'Distribution completed successfully',
                'transaction_hash': transaction_hash,
                'total_amount': float(amount_bep20),
                'users_count': total_users,
                'per_user_amount': float(per_user_amount),
                'processed_at': ist_now.isoformat()
            }
            
        except Exception as e:
            self.db.rollback()
            
            # Update queue with error
            cursor.execute("""
                UPDATE distribution_queue
                SET status = 'failed',
                    error_message = %s,
                    retry_count = retry_count + 1,
                    processed_at = %s
                WHERE transaction_hash = %s
            """, (str(e), self.get_ist_time(), transaction_hash))
            
            self.db.commit()
            
            print(f"\n{'='*60}")
            print(f"❌ DISTRIBUTION FAILED")
            print(f"{'='*60}")
            print(f"TX Hash: {transaction_hash}")
            print(f"Error: {str(e)}")
            print(f"{'='*60}\n")
            
            return {
                'success': False,
                'message': f'Distribution failed: {str(e)}',
                'transaction_hash': transaction_hash,
                'error': str(e)
            }
        finally:
            cursor.close()
    
    async def retry_failed_distributions(self, max_retries: int = 3) -> list:
        """
        Retry failed distributions
        
        Args:
            max_retries: Maximum retry count
            
        Returns:
            List of retry results
        """
        cursor = self.db.cursor(cursor_factory=RealDictCursor)
        
        try:
            # Get failed distributions with retry count < max_retries
            cursor.execute("""
                SELECT transaction_hash, amount_bep20, source_type
                FROM distribution_queue
                WHERE status = 'failed' AND retry_count < %s
                ORDER BY created_at
            """, (max_retries,))
            
            failed = cursor.fetchall()
            
            results = []
            for item in failed:
                print(f"🔄 Retrying distribution: {item['transaction_hash']}")
                result = await self.process_distribution(
                    item['transaction_hash'],
                    item['amount_bep20'],
                    item['source_type']
                )
                results.append(result)
            
            return results
            
        finally:
            cursor.close()


def get_distribution_engine(db_connection) -> DistributionEngine:
    """Factory function to create distribution engine"""
    return DistributionEngine(db_connection)

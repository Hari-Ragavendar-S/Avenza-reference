#!/usr/bin/env python3
"""
Check and fix database locks
Run this if migration script gets stuck
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        database=os.getenv('DB_NAME', 'avenzaweb'),
        user=os.getenv('DB_USER', 'avenzauser'),
        password=os.getenv('DB_PASSWORD', '123456')
    )

conn = get_db_connection()
conn.autocommit = True
cursor = conn.cursor()

print("🔍 Checking for database locks...")

# Check for locks
cursor.execute("""
    SELECT pid, usename, application_name, state, query
    FROM pg_stat_activity
    WHERE state != 'idle'
    AND pid != pg_backend_pid()
    ORDER BY query_start;
""")

locks = cursor.fetchall()

if locks:
    print(f"\n⚠️  Found {len(locks)} active connections:")
    for lock in locks:
        print(f"   PID: {lock[0]}, User: {lock[1]}, State: {lock[3]}")
        print(f"   Query: {lock[4][:100]}...")
    
    print("\n🔧 Terminating stuck connections...")
    for lock in locks:
        try:
            cursor.execute(f"SELECT pg_terminate_backend({lock[0]})")
            print(f"   ✅ Terminated PID {lock[0]}")
        except Exception as e:
            print(f"   ⚠️  Could not terminate PID {lock[0]}: {e}")
else:
    print("   ✅ No locks found")

print("\n✅ Database is ready for migration")
cursor.close()
conn.close()

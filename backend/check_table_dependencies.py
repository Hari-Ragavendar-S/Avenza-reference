"""
Check table dependencies and foreign keys
"""
import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
cursor = conn.cursor()

# Get all foreign key constraints
cursor.execute("""
    SELECT
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name
""")

fks = cursor.fetchall()

print("=" * 80)
print("FOREIGN KEY CONSTRAINTS")
print("=" * 80)

for fk in fks:
    print(f"{fk['table_name']}.{fk['column_name']} -> {fk['foreign_table_name']}.{fk['foreign_column_name']}")

print("\n" + "=" * 80)
print("TABLES THAT REFERENCE USERS TABLE")
print("=" * 80)

user_refs = [fk for fk in fks if fk['foreign_table_name'] == 'users']
for fk in user_refs:
    print(f"  {fk['table_name']}.{fk['column_name']}")

print("\n" + "=" * 80)
print("USERS TABLE SELF-REFERENCES")
print("=" * 80)

self_refs = [fk for fk in fks if fk['table_name'] == 'users' and fk['foreign_table_name'] == 'users']
for fk in self_refs:
    print(f"  users.{fk['column_name']} -> users.{fk['foreign_column_name']}")

cursor.close()
conn.close()

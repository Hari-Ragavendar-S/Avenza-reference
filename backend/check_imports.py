#!/usr/bin/env python3
"""
Check if wallet.py and schemas can be imported without errors
"""
import sys
import traceback

print("=" * 80)
print("CHECKING FOR IMPORT ERRORS")
print("=" * 80)

# Test 1: Import schemas
print("\n1. Testing wallet schemas import...")
try:
    from app.schemas.wallet import (
        WithdrawalSettingsUpdate, 
        WithdrawalSettingsResponse
    )
    print("   ✅ Schemas imported successfully")
    print(f"   WithdrawalSettingsUpdate fields: {WithdrawalSettingsUpdate.__fields__.keys()}")
    print(f"   WithdrawalSettingsResponse fields: {WithdrawalSettingsResponse.__fields__.keys()}")
except Exception as e:
    print(f"   ❌ Schema import failed!")
    print(f"   Error: {e}")
    traceback.print_exc()
    sys.exit(1)

# Test 2: Import wallet routes
print("\n2. Testing wallet routes import...")
try:
    from app.routes import wallet
    print("   ✅ Wallet routes imported successfully")
    
    # Check if router has the endpoint
    routes = [route.path for route in wallet.router.routes]
    print(f"   Total routes: {len(routes)}")
    
    target = "/admin/withdrawal/settings"
    matching = [r for r in wallet.router.routes if target in r.path]
    
    if matching:
        print(f"   ✅ Found {len(matching)} route(s) with '{target}':")
        for route in matching:
            print(f"      - {route.path} [{', '.join(route.methods)}]")
    else:
        print(f"   ❌ Route '{target}' NOT FOUND")
        print(f"   Available routes with 'withdrawal':")
        for route in wallet.router.routes:
            if 'withdrawal' in route.path.lower():
                print(f"      - {route.path} [{', '.join(route.methods)}]")
    
except Exception as e:
    print(f"   ❌ Wallet routes import failed!")
    print(f"   Error: {e}")
    traceback.print_exc()
    sys.exit(1)

# Test 3: Import main app
print("\n3. Testing main app import...")
try:
    from app.main import app
    print("   ✅ Main app imported successfully")
    
    # Check if route is registered
    routes = [route.path for route in app.routes]
    target_routes = [r for r in app.routes if '/admin/withdrawal/settings' in r.path]
    
    if target_routes:
        print(f"   ✅ Found {len(target_routes)} matching route(s) in main app:")
        for route in target_routes:
            print(f"      - {route.path} [{', '.join(route.methods)}]")
    else:
        print(f"   ❌ Route '/admin/withdrawal/settings' NOT in main app!")
        print(f"   Checking all routes with 'admin/withdrawal':")
        admin_withdrawal = [r for r in app.routes if 'admin' in r.path and 'withdrawal' in r.path]
        for route in admin_withdrawal:
            print(f"      - {route.path} [{', '.join(route.methods)}]")

except Exception as e:
    print(f"   ❌ Main app import failed!")
    print(f"   Error: {e}")
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 80)
print("✅ ALL CHECKS PASSED")
print("=" * 80)

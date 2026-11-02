#!/usr/bin/env python3
"""
Test if the withdrawal settings endpoint is registered
"""
import requests

BASE_URL = "https://avenza.live"

print("=" * 80)
print("TESTING WITHDRAWAL SETTINGS ENDPOINT")
print("=" * 80)

# Test 1: Check if API is running
print("\n1. Testing API health...")
try:
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Check available routes (FastAPI docs)
print("\n2. Check API documentation...")
try:
    response = requests.get(f"{BASE_URL}/docs")
    if response.status_code == 200:
        print(f"   ✅ API docs available at {BASE_URL}/docs")
    else:
        print(f"   ❌ Status: {response.status_code}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Check OpenAPI schema
print("\n3. Checking OpenAPI schema for withdrawal endpoint...")
try:
    response = requests.get(f"{BASE_URL}/openapi.json")
    if response.status_code == 200:
        schema = response.json()
        paths = schema.get('paths', {})
        
        # Look for withdrawal settings endpoint
        endpoint = "/api/admin/withdrawal/settings"
        if endpoint in paths:
            print(f"   ✅ Endpoint {endpoint} is registered")
            methods = paths[endpoint].keys()
            print(f"   Methods: {list(methods)}")
        else:
            print(f"   ❌ Endpoint {endpoint} NOT FOUND")
            print(f"   Available endpoints with 'withdrawal':")
            for path in paths.keys():
                if 'withdrawal' in path.lower():
                    print(f"      - {path}: {list(paths[path].keys())}")
    else:
        print(f"   ❌ Status: {response.status_code}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "=" * 80)
print("If endpoint is NOT found, the wallet.py file wasn't uploaded or")
print("the backend service wasn't restarted properly.")
print("=" * 80)

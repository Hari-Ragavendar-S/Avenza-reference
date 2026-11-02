#!/usr/bin/env python3
"""
Deployment script for Web3 Wallet Integration
Run this on VPS to deploy wallet authentication feature
"""

import subprocess
import sys

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"\n{'='*60}")
    print(f"📋 {description}")
    print(f"{'='*60}")
    print(f"$ {cmd}\n")
    
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr)
    
    if result.returncode != 0:
        print(f"\n❌ Error: {description} failed!")
        return False
    
    print(f"✅ {description} completed successfully!")
    return True

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║          WEB3 WALLET INTEGRATION DEPLOYMENT                  ║
║          Avenza Backend - Production Deploy                  ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    print("\n🚀 Starting deployment...\n")
    
    # Step 1: Run database migration
    if not run_command(
        "python migrations/wallet_integration_setup.py",
        "Step 1: Running database migration"
    ):
        sys.exit(1)
    
    # Step 2: Install Python dependencies
    if not run_command(
        "venv/bin/pip install web3==6.15.1 eth-account==0.10.0",
        "Step 2: Installing Web3 dependencies"
    ):
        sys.exit(1)
    
    # Step 3: Restart backend service
    if not run_command(
        "sudo systemctl restart avenza",
        "Step 3: Restarting backend service"
    ):
        sys.exit(1)
    
    # Step 4: Check service status
    if not run_command(
        "sudo systemctl status avenza --no-pager -l",
        "Step 4: Checking service status"
    ):
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print("✅ DEPLOYMENT COMPLETED SUCCESSFULLY!")
    print(f"{'='*60}")
    print("\n📝 New API Endpoints Available:")
    print("   - POST /api/auth/wallet-nonce")
    print("   - POST /api/auth/wallet-login")
    print("   - POST /api/user/connect-wallet")
    print("   - POST /api/user/disconnect-wallet")
    print("   - GET  /api/user/wallet-status")
    print("\n🔧 What's New:")
    print("   - Users can connect MetaMask, Trust Wallet, SafePal, etc.")
    print("   - Login with wallet signature (no password needed)")
    print("   - Secure nonce-based authentication")
    print("   - Wallet connection logs for audit trail")
    print("\n🎯 Next Steps:")
    print("   1. Deploy frontend with wallet connection UI")
    print("   2. Test wallet connection flow")
    print("   3. Test wallet login flow")
    print(f"\n{'='*60}\n")

if __name__ == "__main__":
    main()

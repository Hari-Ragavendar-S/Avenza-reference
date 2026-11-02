"""
Add Redemption Endpoint to wallet.py

This endpoint allows users to redeem (transfer) their Income/ROI wallet balance
to their main AVENZA Wallet for withdrawal purposes.
"""

REDEMPTION_ENDPOINT = '''

# ==================== REDEMPTION ENDPOINT ====================

@router.post("/wallet/redeem")
def redeem_wallet_balance(
    request: dict,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """
    Redeem Income/ROI wallet balance to AVENZA Wallet for withdrawal
    
    Request body:
    {
        "from_wallet": "income" or "roi",
        "amount": 100.00
    }
    """
    try:
        # Verify token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        from_wallet = request.get('from_wallet')  # 'income' or 'roi'
        amount = Decimal(str(request.get('amount', 0)))
        
        # Validation
        if from_wallet not in ['income', 'roi']:
            raise HTTPException(status_code=400, detail="Invalid wallet type. Use 'income' or 'roi'")
        
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        
        cursor = db.cursor()
        
        # Get user's current balances
        cursor.execute("""
            SELECT balance, income_balance, roi_balance, username
            FROM users
            WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check sufficient balance
        if from_wallet == 'income':
            source_balance = Decimal(str(user['income_balance'] or 0))
            wallet_name = "Income Wallet"
        else:  # roi
            source_balance = Decimal(str(user['roi_balance'] or 0))
            wallet_name = "ROI Wallet"
        
        if source_balance < amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance in {wallet_name}. Available: ${source_balance}"
            )
        
        # Perform redemption (transfer)
        if from_wallet == 'income':
            cursor.execute("""
                UPDATE users
                SET income_balance = income_balance - %s,
                    balance = balance + %s
                WHERE id = %s
            """, (amount, amount, user_id))
        else:  # roi
            cursor.execute("""
                UPDATE users
                SET roi_balance = roi_balance - %s,
                    balance = balance + %s
                WHERE id = %s
            """, (amount, amount, user_id))
        
        # Record in transactions table
        cursor.execute("""
            INSERT INTO transactions (
                user_id, type, amount, currency, description,
                reference_type, status, wallet_type, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """, (
            user_id,
            'redemption',
            amount,
            'USD',
            f'Redeemed ${amount} from {wallet_name} to AVENZA Wallet',
            'redemption',
            'completed',
            'balance'
        ))
        
        # Record in internal_transfers table for admin visibility
        cursor.execute("""
            INSERT INTO internal_transfers (
                from_user_id, to_user_id, amount, status,
                description, created_at
            ) VALUES (%s, %s, %s, %s, %s, NOW())
        """, (
            user_id,
            user_id,  # Same user (self-redemption)
            amount,
            'completed',
            f'Redemption from {wallet_name} to AVENZA Wallet'
        ))
        
        db.commit()
        
        # Get updated balances
        cursor.execute("""
            SELECT balance, income_balance, roi_balance
            FROM users
            WHERE id = %s
        """, (user_id,))
        
        updated = cursor.fetchone()
        
        return {
            "success": True,
            "message": f"Successfully redeemed ${amount} from {wallet_name}",
            "redemption": {
                "amount": float(amount),
                "from_wallet": from_wallet,
                "wallet_name": wallet_name,
                "new_balances": {
                    "avenza_wallet": float(updated['balance']),
                    "income_wallet": float(updated['income_balance']),
                    "roi_wallet": float(updated['roi_balance'])
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error during redemption: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Redemption failed: {str(e)}")
    finally:
        cursor.close()
'''

print("=" * 80)
print("REDEMPTION ENDPOINT CODE")
print("=" * 80)
print()
print("Add this code to: backend/app/routes/wallet.py")
print()
print(REDEMPTION_ENDPOINT)
print()
print("=" * 80)
print("INSTRUCTIONS:")
print("=" * 80)
print()
print("1. Open: backend/app/routes/wallet.py")
print("2. Add the endpoint code at the end of the file (before final return)")
print("3. Restart backend: sudo systemctl restart avenza")
print()
print("API Endpoint: POST /api/wallet/redeem")
print()
print("Request Body:")
print('{')
print('  "from_wallet": "income",  // or "roi"')
print('  "amount": 100.00')
print('}')
print()
print("Response:")
print('{')
print('  "success": true,')
print('  "message": "Successfully redeemed $100.00 from Income Wallet",')
print('  "redemption": {')
print('    "amount": 100.00,')
print('    "from_wallet": "income",')
print('    "wallet_name": "Income Wallet",')
print('    "new_balances": {')
print('      "avenza_wallet": 1100.00,')
print('      "income_wallet": 900.00,')
print('      "roi_wallet": 500.00')
print('    }')
print('  }')
print('}')
print()

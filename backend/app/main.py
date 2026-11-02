from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, admin, wallet, investment, transfer, support, upload, level_income, referral_bonus, referral_tree, wallet_auth, binary_matching, downline_matching, admin_public_wallet, public_deposit, user_topup

app = FastAPI(
    title="Avenza API",
    description="Investment Platform with Binary MLM & Public Deposits",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers - both with and without /api prefix
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(auth.router, tags=["Authentication"])  # Without prefix for nginx
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(admin.router, tags=["Admin"])  # Without prefix for nginx
app.include_router(wallet.router, prefix="/api", tags=["Wallet"])
app.include_router(wallet.router, tags=["Wallet"])  # Without prefix for nginx
app.include_router(investment.router, prefix="/api", tags=["Investment"])
app.include_router(investment.router, tags=["Investment"])  # Without prefix for nginx
app.include_router(transfer.router, prefix="/api", tags=["Transfer & Profile"])
app.include_router(transfer.router, tags=["Transfer & Profile"])  # Without prefix for nginx
app.include_router(support.router, prefix="/api", tags=["Support Chat"])
app.include_router(support.router, tags=["Support Chat"])  # Without prefix for nginx
app.include_router(upload.router, prefix="/api", tags=["File Upload"])
app.include_router(upload.router, tags=["File Upload"])  # Without prefix for nginx
app.include_router(level_income.router, prefix="/api", tags=["Level Income"])
app.include_router(level_income.router, tags=["Level Income"])  # Without prefix for nginx
app.include_router(referral_bonus.router, prefix="/api", tags=["Referral Bonus"])
app.include_router(referral_bonus.router, tags=["Referral Bonus"])  # Without prefix for nginx
app.include_router(referral_tree.router, prefix="/api", tags=["Referral Tree"])
app.include_router(referral_tree.router, tags=["Referral Tree"])  # Without prefix for nginx
app.include_router(wallet_auth.router, prefix="/api", tags=["Wallet Authentication"])
app.include_router(wallet_auth.router, tags=["Wallet Authentication"])  # Without prefix for nginx
app.include_router(binary_matching.router, prefix="/api", tags=["Binary Matching"])
app.include_router(binary_matching.router, tags=["Binary Matching"])  # Without prefix for nginx

# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Avenza API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Health check
@app.get("/api/health")
@app.get("/health")
def health_check():
    """Check if API is healthy"""
    return {"status": "healthy", "service": "avenza-api"}

# Public withdrawal mode endpoint
@app.get("/api/settings/withdrawal-mode")
@app.get("/settings/withdrawal-mode")
def get_public_withdrawal_mode():
    """Get current withdrawal mode (public endpoint)"""
    from app.database.connection import get_db
    
    db_gen = get_db()
    db = next(db_gen)
    cursor = db.cursor()
    
    try:
        cursor.execute("""
            SELECT setting_value 
            FROM system_settings 
            WHERE setting_key = 'withdrawal_mode'
        """)
        
        result = cursor.fetchone()
        mode = result['setting_value'] if result else 'automatic'
        
        return {
            "success": True,
            "mode": mode,
            "is_automatic": mode == 'automatic'
        }
    except Exception as e:
        return {
            "success": True,
            "mode": "automatic",  # Default to automatic on error
            "is_automatic": True
        }
    finally:
        cursor.close()
        db.close()

# Downline Matching Bonus routes
app.include_router(downline_matching.router, prefix="/api", tags=["Downline Matching Bonus"])
app.include_router(downline_matching.router, tags=["Downline Matching Bonus"])  # Without prefix for nginx

# Public Deposit System routes
app.include_router(admin_public_wallet.router, prefix="/api", tags=["Admin Public Wallet"])
app.include_router(admin_public_wallet.router, tags=["Admin Public Wallet"])  # Without prefix for nginx
app.include_router(public_deposit.router, prefix="/api", tags=["Public Deposits"])
app.include_router(public_deposit.router, tags=["Public Deposits"])  # Without prefix for nginx

# User Top-Up routes
app.include_router(user_topup.router, prefix="/api", tags=["User Top-Up"])
app.include_router(user_topup.router, tags=["User Top-Up"])  # Without prefix for nginx

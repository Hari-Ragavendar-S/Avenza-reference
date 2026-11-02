from fastapi import APIRouter, HTTPException, Depends, Header
from app.schemas.investment import (
    PackageListResponse, PackageResponse,
    InvestmentEnrollRequest, InvestmentEnrollResponse,
    MyPackagesResponse, UserInvestmentDetail,
    InvestmentTransactionsResponse, InvestmentTransaction,
    AdminPackageListResponse, AdminPackageDetail,
    UpdatePackageRequest, UpdatePackageResponse,
    CreatePackageRequest, CreatePackageResponse
)
from app.database.connection import get_db
from app.utils.auth import verify_token
from decimal import Decimal
from datetime import datetime, date
import pytz

router = APIRouter()

def get_ist_time():
    """Get current time in IST"""
    ist = pytz.timezone('Asia/Kolkata')
    return datetime.now(ist)

def format_ist_time(dt):
    """Format datetime to IST string"""
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    ist = pytz.timezone('Asia/Kolkata')
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    ist_time = dt.astimezone(ist)
    return ist_time.strftime('%b %d, %Y - %I:%M:%S %p IST')

def format_ist_date(dt):
    """Format date to IST string"""
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    if isinstance(dt, date):
        return dt.strftime('%b %d, %Y')
    return dt.strftime('%b %d, %Y')

# ==================== USER ENDPOINTS ====================

@router.get("/packages", response_model=PackageListResponse)
def get_active_packages(db=Depends(get_db)):
    """Get all active investment packages"""
    try:
        cursor = db.cursor()
        cursor.execute("""
            SELECT id, name, amount, daily_profit_percentage, downline_matching_bonus, status
            FROM investment_packages
            WHERE status = 'active'
            ORDER BY amount ASC
        """)
        
        packages = cursor.fetchall()
        cursor.close()
        
        package_list = []
        for pkg in packages:
            package_list.append(PackageResponse(
                id=pkg['id'],
                name=pkg['name'],
                amount=Decimal(pkg['amount']),
                daily_profit_percentage=Decimal(pkg['daily_profit_percentage']),
                downline_matching_bonus=Decimal(pkg.get('downline_matching_bonus', 0)),
                status=pkg['status']
            ))
        
        return PackageListResponse(
            success=True,
            packages=package_list
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.post("/investment/enroll", response_model=InvestmentEnrollResponse)
def enroll_in_package(
    request: InvestmentEnrollRequest,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Enroll user in an investment package"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=403, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        ist_now = get_ist_time()
        
        # Get package details
        cursor.execute("""
            SELECT id, name, amount, daily_profit_percentage, status
            FROM investment_packages
            WHERE id = %s
        """, (request.package_id,))
        
        package = cursor.fetchone()
        if not package:
            raise HTTPException(status_code=404, detail="Package not found")
        
        if package['status'] != 'active':
            raise HTTPException(status_code=400, detail="Package is not active")
        
        package_amount = Decimal(package['amount'])
        daily_profit_percentage = Decimal(package['daily_profit_percentage'])
        
        # Check user's AVENZA wallet balance
        cursor.execute("""
            SELECT avenza_balance FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        avenza_balance = Decimal(user['avenza_balance'] or 0)
        
        if avenza_balance < package_amount:
            raise HTTPException(status_code=400, detail="Insufficient AVENZA wallet balance")
        
        # Calculate daily profit and max profit (3x)
        daily_profit = package_amount * (daily_profit_percentage / Decimal('100'))
        max_profit = package_amount * Decimal('3')
        
        # Deduct from AVENZA wallet
        cursor.execute("""
            UPDATE users
            SET avenza_balance = avenza_balance - %s
            WHERE id = %s
        """, (package_amount, user_id))
        
        # Create investment record
        cursor.execute("""
            INSERT INTO user_investments (
                user_id, package_id, invested_amount, total_earned,
                daily_profit, max_profit, enrollment_date, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, request.package_id, package_amount, Decimal('0'),
            daily_profit, max_profit, ist_now, 'active'
        ))
        
        investment_id = cursor.fetchone()['id']
        
        # Record enrollment transaction
        cursor.execute("""
            INSERT INTO investment_transactions (
                user_id, investment_id, amount, transaction_type,
                wallet_type, description
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            user_id, investment_id, package_amount, 'enrollment',
            'avenza', f'Enrolled in {package["name"]} package'
        ))
        
        # Record in main transactions table
        cursor.execute("""
            INSERT INTO transactions (
                user_id, type, amount, currency, description,
                reference_id, reference_type, status, wallet_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, 'investment_enrollment', package_amount, 'USD',
            f'Enrolled in {package["name"]} package - ${package_amount}',
            investment_id, 'investment', 'completed', 'avenza'
        ))
        
        # 🎁 CREATE REFERRAL BONUS FOR SPONSOR (FIRST INVESTMENT ONLY)
        cursor.execute("""
            SELECT sponsor_id FROM users WHERE id = %s
        """, (user_id,))
        
        sponsor_result = cursor.fetchone()
        if sponsor_result and sponsor_result['sponsor_id']:
            sponsor_id = sponsor_result['sponsor_id']
            
            # Check if this user has EVER received a referral bonus from this referral
            cursor.execute("""
                SELECT id FROM referral_bonuses
                WHERE referrer_id = %s AND referral_id = %s
            """, (sponsor_id, user_id))
            
            # Only create bonus if this is the referral's FIRST investment
            if not cursor.fetchone():
                # Count how many UNIQUE referrals have made their first investment
                cursor.execute("""
                    SELECT COUNT(DISTINCT referral_id) as count
                    FROM referral_bonuses
                    WHERE referrer_id = %s
                """, (sponsor_id,))
                
                existing_referrals = cursor.fetchone()['count']
                referral_number = existing_referrals + 1
                
                # Determine bonus percentage based on referral number
                if referral_number == 1:
                    bonus_percentage = Decimal('5.00')
                elif referral_number == 2:
                    bonus_percentage = Decimal('6.00')
                elif referral_number == 3:
                    bonus_percentage = Decimal('7.00')
                elif referral_number == 4:
                    bonus_percentage = Decimal('8.00')
                elif referral_number == 5:
                    bonus_percentage = Decimal('9.00')
                else:
                    bonus_percentage = Decimal('10.00')
                    referral_number = 6  # Store as 6 for 6+
                
                # Calculate bonus amount
                bonus_amount = (package_amount * bonus_percentage) / Decimal('100')
                
                # Create bonus record (pending status - requires manual claim)
                cursor.execute("""
                    INSERT INTO referral_bonuses (
                        referrer_id, referral_id, investment_id, referral_number,
                        investment_amount, bonus_percentage, bonus_amount, status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    sponsor_id, user_id, investment_id, referral_number,
                    package_amount, bonus_percentage, bonus_amount, 'pending'
                ))
                
                print(f"🎁 Referral bonus created: ${bonus_amount} ({bonus_percentage}%) for sponsor {sponsor_id}")
        
        # 🌳 TRIGGER BINARY MATCHING BONUS
        from app.utils.binary_matching import trigger_binary_matching_on_investment
        trigger_binary_matching_on_investment(db, user_id, package_amount)
        
        db.commit()
        cursor.close()
        
        return InvestmentEnrollResponse(
            success=True,
            message=f"Successfully enrolled in {package['name']} package",
            investment_id=investment_id,
            package_name=package['name'],
            invested_amount=package_amount,
            daily_profit=daily_profit,
            max_profit=max_profit,
            timestamp=format_ist_time(ist_now)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/investment/my-packages", response_model=MyPackagesResponse)
def get_my_packages(authorization: str = Header(None), db=Depends(get_db)):
    """Get user's active investment packages"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=403, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        today = date.today()
        
        # Get user's investments with package details
        cursor.execute("""
            SELECT 
                ui.id, ui.package_id, ui.invested_amount, ui.total_earned,
                ui.daily_profit, ui.max_profit, ui.enrollment_date,
                ui.last_profit_date, ui.status,
                ip.name as package_name
            FROM user_investments ui
            JOIN investment_packages ip ON ui.package_id = ip.id
            WHERE ui.user_id = %s
            ORDER BY ui.enrollment_date DESC
        """, (user_id,))
        
        investments = cursor.fetchall()
        
        investment_list = []
        total_invested = Decimal('0')
        total_earned = Decimal('0')
        
        for inv in investments:
            invested_amount = Decimal(inv['invested_amount'])
            total_earned_amount = Decimal(inv['total_earned'])
            max_profit = Decimal(inv['max_profit'])
            daily_profit = Decimal(inv['daily_profit'])
            
            # Calculate progress percentage
            progress = (total_earned_amount / max_profit * 100) if max_profit > 0 else 0
            
            # Calculate earned today (0 if already processed today)
            earned_today = Decimal('0')
            if inv['last_profit_date']:
                last_profit = inv['last_profit_date']
                if isinstance(last_profit, str):
                    last_profit = datetime.strptime(last_profit, '%Y-%m-%d').date()
                if last_profit == today:
                    earned_today = daily_profit
            
            investment_list.append(UserInvestmentDetail(
                id=inv['id'],
                package_id=inv['package_id'],
                package_name=inv['package_name'],
                invested_amount=invested_amount,
                total_earned=total_earned_amount,
                daily_profit=daily_profit,
                max_profit=max_profit,
                progress_percentage=float(progress),
                earned_today=earned_today,
                enrollment_date=format_ist_time(inv['enrollment_date']),
                last_profit_date=format_ist_date(inv['last_profit_date']),
                status=inv['status']
            ))
            
            total_invested += invested_amount
            total_earned += total_earned_amount
        
        cursor.close()
        
        return MyPackagesResponse(
            success=True,
            investments=investment_list,
            total_invested=total_invested,
            total_earned=total_earned
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/investment/{investment_id}/transactions", response_model=InvestmentTransactionsResponse)
def get_investment_transactions(
    investment_id: int,
    page: int = 1,
    per_page: int = 20,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get investment transaction history"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=403, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Verify investment belongs to user
        cursor.execute("""
            SELECT user_id FROM user_investments WHERE id = %s
        """, (investment_id,))
        
        investment = cursor.fetchone()
        if not investment or investment['user_id'] != user_id:
            raise HTTPException(status_code=404, detail="Investment not found")
        
        # Get total count
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM investment_transactions
            WHERE investment_id = %s
        """, (investment_id,))
        
        total = cursor.fetchone()['total']
        total_pages = (total + per_page - 1) // per_page
        offset = (page - 1) * per_page
        
        # Get transactions
        cursor.execute("""
            SELECT id, amount, transaction_type, wallet_type, description, created_at
            FROM investment_transactions
            WHERE investment_id = %s
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, (investment_id, per_page, offset))
        
        transactions = cursor.fetchall()
        cursor.close()
        
        transaction_list = []
        for trans in transactions:
            transaction_list.append(InvestmentTransaction(
                id=trans['id'],
                amount=Decimal(trans['amount']),
                transaction_type=trans['transaction_type'],
                wallet_type=trans['wallet_type'],
                description=trans['description'],
                created_at=format_ist_time(trans['created_at'])
            ))
        
        return InvestmentTransactionsResponse(
            success=True,
            transactions=transaction_list,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/packages", response_model=AdminPackageListResponse)
def get_all_packages_admin(authorization: str = Header(None), db=Depends(get_db)):
    """Get all investment packages with statistics (Admin)"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT 
                ip.id, ip.name, ip.amount, ip.daily_profit_percentage,
                ip.downline_matching_bonus, ip.status, ip.created_at, ip.updated_at,
                COUNT(DISTINCT ui.user_id) as total_users_enrolled,
                COALESCE(SUM(ui.invested_amount), 0) as total_investment_amount
            FROM investment_packages ip
            LEFT JOIN user_investments ui ON ip.id = ui.package_id
            GROUP BY ip.id, ip.name, ip.amount, ip.daily_profit_percentage,
                     ip.downline_matching_bonus, ip.status, ip.created_at, ip.updated_at
            ORDER BY ip.amount ASC
        """)
        
        packages = cursor.fetchall()
        cursor.close()
        
        package_list = []
        for pkg in packages:
            package_list.append(AdminPackageDetail(
                id=pkg['id'],
                name=pkg['name'],
                amount=Decimal(pkg['amount']),
                daily_profit_percentage=Decimal(pkg['daily_profit_percentage']),
                downline_matching_bonus=Decimal(pkg.get('downline_matching_bonus', 0)),
                status=pkg['status'],
                total_users_enrolled=pkg['total_users_enrolled'] or 0,
                total_investment_amount=Decimal(pkg['total_investment_amount'] or 0),
                created_at=format_ist_time(pkg['created_at']),
                updated_at=format_ist_time(pkg['updated_at'])
            ))
        
        return AdminPackageListResponse(
            success=True,
            packages=package_list
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.put("/admin/package/{package_id}", response_model=UpdatePackageResponse)
def update_package(
    package_id: int,
    request: UpdatePackageRequest,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Update investment package details (Admin)"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        
        # Check if package exists
        cursor.execute("SELECT * FROM investment_packages WHERE id = %s", (package_id,))
        package = cursor.fetchone()
        if not package:
            raise HTTPException(status_code=404, detail="Package not found")
        
        # Build update query
        update_fields = []
        update_values = []
        
        if request.name is not None:
            update_fields.append("name = %s")
            update_values.append(request.name)
        
        if request.amount is not None:
            update_fields.append("amount = %s")
            update_values.append(request.amount)
        
        if request.daily_profit_percentage is not None:
            update_fields.append("daily_profit_percentage = %s")
            update_values.append(request.daily_profit_percentage)
        
        if request.downline_matching_bonus is not None:
            update_fields.append("downline_matching_bonus = %s")
            update_values.append(request.downline_matching_bonus)
        
        if request.status is not None:
            update_fields.append("status = %s")
            update_values.append(request.status)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_values.append(package_id)
        
        cursor.execute(f"""
            UPDATE investment_packages
            SET {', '.join(update_fields)}
            WHERE id = %s
        """, update_values)
        
        # Get updated package with statistics
        cursor.execute("""
            SELECT 
                ip.id, ip.name, ip.amount, ip.daily_profit_percentage,
                ip.downline_matching_bonus, ip.status, ip.created_at, ip.updated_at,
                COUNT(DISTINCT ui.user_id) as total_users_enrolled,
                COALESCE(SUM(ui.invested_amount), 0) as total_investment_amount
            FROM investment_packages ip
            LEFT JOIN user_investments ui ON ip.id = ui.package_id
            WHERE ip.id = %s
            GROUP BY ip.id, ip.name, ip.amount, ip.daily_profit_percentage,
                     ip.downline_matching_bonus, ip.status, ip.created_at, ip.updated_at
        """, (package_id,))
        
        updated_package = cursor.fetchone()
        
        db.commit()
        cursor.close()
        
        return UpdatePackageResponse(
            success=True,
            message="Package updated successfully",
            package=AdminPackageDetail(
                id=updated_package['id'],
                name=updated_package['name'],
                amount=Decimal(updated_package['amount']),
                daily_profit_percentage=Decimal(updated_package['daily_profit_percentage']),
                downline_matching_bonus=Decimal(updated_package.get('downline_matching_bonus', 0)),
                status=updated_package['status'],
                total_users_enrolled=updated_package['total_users_enrolled'] or 0,
                total_investment_amount=Decimal(updated_package['total_investment_amount'] or 0),
                created_at=format_ist_time(updated_package['created_at']),
                updated_at=format_ist_time(updated_package['updated_at'])
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.post("/admin/package", response_model=CreatePackageResponse)
def create_package(
    request: CreatePackageRequest,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Create new investment package (Admin)"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        
        cursor.execute("""
            INSERT INTO investment_packages (name, amount, daily_profit_percentage, status)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (request.name, request.amount, request.daily_profit_percentage, request.status))
        
        package_id = cursor.fetchone()['id']
        
        db.commit()
        cursor.close()
        
        return CreatePackageResponse(
            success=True,
            message="Package created successfully",
            package_id=package_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

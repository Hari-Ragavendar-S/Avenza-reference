import random

def generate_referral_code():
    """Generate unique 4-digit referral code"""
    return str(random.randint(1000, 9999))

def get_referral_link(username: str, base_url: str = "https://avenza.live"):
    """Generate referral link from username"""
    return f"{base_url}/{username}"

"""
Encryption utilities for secure storage of sensitive data
Used for encrypting admin wallet secret phrases
"""

from cryptography.fernet import Fernet
import os
import base64
from dotenv import load_dotenv

load_dotenv()

class EncryptionService:
    """Service for encrypting and decrypting sensitive data"""
    
    def __init__(self):
        # Get encryption key from environment or generate one
        key = os.getenv('ENCRYPTION_KEY')
        
        if not key:
            # Generate a new key (should be stored in .env in production)
            key = Fernet.generate_key().decode()
            print(f"⚠️  WARNING: Generated new encryption key. Add this to your .env file:")
            print(f"ENCRYPTION_KEY={key}")
        
        if isinstance(key, str):
            key = key.encode()
        
        self.cipher = Fernet(key)
    
    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt plaintext string
        
        Args:
            plaintext: String to encrypt
            
        Returns:
            Base64 encoded encrypted string
        """
        if not plaintext:
            return ""
        
        encrypted_bytes = self.cipher.encrypt(plaintext.encode())
        return base64.b64encode(encrypted_bytes).decode()
    
    def decrypt(self, encrypted: str) -> str:
        """
        Decrypt encrypted string
        
        Args:
            encrypted: Base64 encoded encrypted string
            
        Returns:
            Decrypted plaintext string
        """
        if not encrypted:
            return ""
        
        encrypted_bytes = base64.b64decode(encrypted.encode())
        decrypted_bytes = self.cipher.decrypt(encrypted_bytes)
        return decrypted_bytes.decode()
    
    def validate_secret_phrase(self, phrase: str) -> tuple[bool, str]:
        """
        Validate 12-word secret phrase
        
        Args:
            phrase: Secret phrase to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not phrase:
            return False, "Secret phrase is required"
        
        words = phrase.strip().split()
        
        if len(words) != 12:
            return False, f"Secret phrase must be exactly 12 words (got {len(words)})"
        
        # Check for empty words
        if any(not word.strip() for word in words):
            return False, "Secret phrase contains empty words"
        
        # Basic validation - words should be alphanumeric
        if not all(word.replace('-', '').isalnum() for word in words):
            return False, "Secret phrase contains invalid characters"
        
        return True, ""

# Singleton instance
_encryption_service = None

def get_encryption_service() -> EncryptionService:
    """Get singleton encryption service instance"""
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service

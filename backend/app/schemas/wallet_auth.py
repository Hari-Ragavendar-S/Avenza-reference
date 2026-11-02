from pydantic import BaseModel
from typing import Optional

class WalletNonceRequest(BaseModel):
    wallet_address: str

class WalletNonceResponse(BaseModel):
    nonce: str
    message: str

class WalletLoginRequest(BaseModel):
    wallet_address: str
    signature: str

class WalletLoginResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    user: Optional[dict] = None
    wallet_connected: bool = False

class ConnectWalletRequest(BaseModel):
    wallet_address: str
    wallet_type: str  # metamask, trust, safePal, walletConnect, coinbase
    signature: str

class ConnectWalletResponse(BaseModel):
    success: bool
    message: str
    wallet_address: str
    wallet_type: str

class DisconnectWalletResponse(BaseModel):
    success: bool
    message: str

class WalletStatusResponse(BaseModel):
    wallet_connected: bool
    wallet_address: Optional[str] = None
    wallet_type: Optional[str] = None
    connected_at: Optional[str] = None

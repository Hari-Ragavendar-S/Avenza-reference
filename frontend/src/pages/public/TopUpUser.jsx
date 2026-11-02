import { useState } from 'react';
import { ethers } from 'ethers';

const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955'; // USDT BSC
const BSC_CHAIN_ID = '0x38';

const USDT_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)'
];

export default function TopUpUser() {
  // Step 1: Username lookup + sender info
  const [username, setUsername] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [userFound, setUserFound] = useState(null);
  const [lookupError, setLookupError] = useState('');
  
  // Step 2: Wallet connection
  const [connected, setConnected] = useState(false);
  const [walletAccount, setWalletAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [usdtBalance, setUsdtBalance] = useState(0);
  
  // Step 3: Top-up
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Success
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  
  // Public wallet address
  const [publicAddress, setPublicAddress] = useState('');

  // Fetch public wallet address
  const fetchPublicAddress = async () => {
    try {
      const response = await fetch('https://avenza.live/api/public/wallet-address');
      const data = await response.json();
      if (data.success) {
        setPublicAddress(data.wallet_address);
      }
    } catch (err) {
      console.error('Failed to fetch public address:', err);
    }
  };

  const handleLookup = async () => {
    if (!username.trim()) {
      setLookupError('Please enter a username');
      return;
    }

    if (!senderName.trim()) {
      setLookupError('Please enter your name');
      return;
    }

    if (!senderPhone.trim()) {
      setLookupError('Please enter your phone number');
      return;
    }

    setLookingUp(true);
    setLookupError('');

    try {
      const response = await fetch('https://avenza.live/api/public/user-topup/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setUserFound(data);
        fetchPublicAddress();
      } else {
        setLookupError(data.detail || 'User not found');
      }
    } catch (err) {
      setLookupError('Failed to connect to server');
    } finally {
      setLookingUp(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('Web3 wallet not installed');
        setTimeout(() => setError(''), 3000);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        setError('No wallet account found');
        return;
      }

      const account = accounts[0];
      const network = await provider.getNetwork();
      
      if (Number(network.chainId) !== 56) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BSC_CHAIN_ID }]
          });
        } catch (switchError) {
          setError('Please switch to BNB Smart Chain');
          return;
        }
      }

      setProvider(provider);
      setWalletAccount(account);
      setConnected(true);
      
      // Get USDT balance
      const usdtContract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, provider);
      const balance = await usdtContract.balanceOf(account);
      const decimals = await usdtContract.decimals();
      setUsdtBalance(parseFloat(ethers.formatUnits(balance, decimals)));
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleTopUp = async () => {
    const topupAmount = parseFloat(amount);
    
    if (!topupAmount || topupAmount <= 0) {
      setError('Please enter a valid amount');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (topupAmount < 0.01) {
      setError('Minimum top-up is $0.01');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (topupAmount > usdtBalance) {
      setError('Insufficient USDT balance');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const usdtContract = new ethers.Contract(
        USDT_CONTRACT,
        USDT_ABI,
        await provider.getSigner()
      );
      
      const amountInWei = ethers.parseUnits(amount, 18);
      const tx = await usdtContract.transfer(publicAddress, amountInWei);
      
      setSubmitting(true);
      setProcessing(false);
      
      const receipt = await tx.wait();
      
      // Submit to backend
      const response = await fetch('https://avenza.live/api/public/user-topup/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userFound.username,
          sender_name: senderName,
          sender_phone: senderPhone,
          sender_wallet_address: walletAccount,
          amount: topupAmount,
          network: 'BSC',
          token_type: 'USDT',
          transaction_hash: receipt.hash
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessData({
          amount: topupAmount,
          username: userFound.username,
          name: userFound.name,
          txHash: receipt.hash
        });
        setSuccess(true);
        setAmount('');
      } else {
        setError(data.detail || 'Failed to record top-up');
        setTimeout(() => setError(''), 5000);
      }
      
    } catch (error) {
      console.error('Top-up error:', error);
      if (error.code === 'ACTION_REJECTED') {
        setError('Transaction rejected');
      } else {
        setError(error.message || 'Top-up failed');
      }
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessing(false);
      setSubmitting(false);
    }
  };

  const reset = () => {
    setUsername('');
    setSenderName('');
    setSenderPhone('');
    setUserFound(null);
    setConnected(false);
    setWalletAccount(null);
    setProvider(null);
    setAmount('');
    setSuccess(false);
    setSuccessData(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
      padding: '40px 20px'
    }}>
      {/* Success Modal */}
      {success && successData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
              Top-Up Successful!
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              Successfully topped up @{successData.username}
            </p>
            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>
                Amount: <strong style={{ color: '#10b981', fontSize: '18px' }}>${successData.amount} USDT</strong>
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>
                Recipient: <strong style={{ color: '#4a90e2' }}>@{successData.username} ({successData.name})</strong>
              </p>
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(74, 144, 226, 0.2)' }}>
                <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>Transaction Hash:</p>
                <p style={{ color: '#4a90e2', fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all', margin: 0 }}>
                  {successData.txHash}
                </p>
              </div>
            </div>
            <a
              href={`https://bscscan.com/tx/${successData.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: 'rgba(74, 144, 226, 0.2)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '8px',
                padding: '10px 20px',
                color: '#4a90e2',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
                marginBottom: '12px'
              }}
            >
              🔍 View on BSCScan
            </a>
            <button
              onClick={reset}
              style={{
                display: 'block',
                width: '100%',
                background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 32px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '12px'
              }}
            >
              ✅ Top Up Another User
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(74,144,226,0.2), rgba(16,185,129,0.1))',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', margin: '0 0 8px 0' }}>
            💸 Top Up AVENZA User
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            Send USDT directly to any AVENZA user's wallet
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: '#ef4444',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Step 1: Username Lookup */}
        {!userFound && (
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(74,144,226,0.3)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              🔍 Step 1: Enter Details
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Your Name *
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => {
                  setSenderName(e.target.value);
                  setLookupError('');
                }}
                placeholder="Enter your full name"
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Your Phone Number *
              </label>
              <input
                type="tel"
                value={senderPhone}
                onChange={(e) => {
                  setSenderPhone(e.target.value);
                  setLookupError('');
                }}
                placeholder="Enter your phone number"
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                AVENZA Username *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setLookupError('');
                }}
                placeholder="Enter username (e.g., john123)"
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
              />
            </div>

            {lookupError && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#ef4444',
                fontSize: '13px'
              }}>
                {lookupError}
              </div>
            )}

            <button
              onClick={handleLookup}
              disabled={lookingUp || !username.trim() || !senderName.trim() || !senderPhone.trim()}
              style={{
                width: '100%',
                background: (lookingUp || !username.trim() || !senderName.trim() || !senderPhone.trim()) 
                  ? '#4b5563' 
                  : 'linear-gradient(135deg, #4a90e2, #357abd)',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (lookingUp || !username.trim() || !senderName.trim() || !senderPhone.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              {lookingUp ? '🔍 Searching...' : '🔍 Find User & Continue'}
            </button>
          </div>
        )}

        {/* Step 2: User Found - Show Details & Connect Wallet */}
        {userFound && !connected && (
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(74,144,226,0.3)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              ✅ User Found!
            </h3>
            <div style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>
                User ID: <strong style={{ color: '#4a90e2' }}>#{userFound.user_id}</strong>
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>
                Username: <strong style={{ color: '#10b981' }}>@{userFound.username}</strong>
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>
                Name: <strong style={{ color: '#fff' }}>{userFound.name}</strong>
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                Email: <strong style={{ color: '#fff' }}>{userFound.email}</strong>
              </p>
            </div>

            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              🔒 Step 2: Connect Wallet
            </h3>
            <button
              onClick={connectWallet}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '24px' }}>👛</span>
              Connect Wallet
            </button>

            <button
              onClick={() => setUserFound(null)}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '12px',
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '12px'
              }}
            >
              ← Find Different User
            </button>
          </div>
        )}

        {/* Step 3: Connected - Enter Amount & Top Up */}
        {userFound && connected && (
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(74,144,226,0.3)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              💸 Step 3: Enter Amount
            </h3>

            {/* User Info Summary */}
            <div style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                Topping up: <strong style={{ color: '#10b981' }}>@{userFound.username}</strong> ({userFound.name})
              </p>
            </div>

            {/* Wallet Info */}
            <div style={{
              background: 'rgba(74,144,226,0.1)',
              border: '1px solid rgba(74,144,226,0.3)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 4px 0' }}>
                Your Wallet: {walletAccount?.slice(0,6)}...{walletAccount?.slice(-4)}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                USDT Balance: <strong style={{ color: '#10b981' }}>{usdtBalance.toFixed(2)} USDT</strong>
              </p>
            </div>

            {/* Amount Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Top-Up Amount (USDT) *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  $
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount (min $0.01)"
                  min="0.01"
                  step="0.01"
                  disabled={processing || submitting}
                  style={{
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(74, 144, 226, 0.3)',
                    borderRadius: '8px',
                    padding: '14px 16px 14px 36px',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Top-Up Button */}
            <button
              onClick={handleTopUp}
              disabled={processing || submitting || !amount}
              style={{
                width: '100%',
                background: (processing || submitting || !amount)
                  ? '#4b5563'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (processing || submitting || !amount) ? 'not-allowed' : 'pointer',
                opacity: (processing || submitting || !amount) ? 0.6 : 1
              }}
            >
              {processing ? '⏳ Confirm in Wallet...' : 
               submitting ? '🔄 Processing Top-Up...' : 
               '🚀 TOP UP NOW'}
            </button>

            {(processing || submitting) && (
              <p style={{
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '13px',
                marginTop: '12px'
              }}>
                {processing ? 'Please approve the transaction in your wallet' : 'Processing top-up...'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

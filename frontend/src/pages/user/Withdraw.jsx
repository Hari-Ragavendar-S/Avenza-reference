import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955'; // USDT BSC
const BSC_CHAIN_ID = '0x38'; // 56 in hex

const USDT_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)'
];

export default function Withdraw() {
  // Mode state
  const [withdrawalMode, setWithdrawalMode] = useState('automatic');
  const [loadingMode, setLoadingMode] = useState(true);
  
  // User profile state
  const [userProfile, setUserProfile] = useState(null);
  const [walletBalances, setWalletBalances] = useState({
    avenza: 0,
    income: 0,
    gaming: 0
  });
  
  // Manual withdrawal state
  const [manualAmount, setManualAmount] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualMessage, setManualMessage] = useState('');
  const [showManualSuccess, setShowManualSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState(''); // Store amount for success modal
  
  // Automatic withdrawal state (Web3)
  const [withdrawConnected, setWithdrawConnected] = useState(false);
  const [withdrawWalletAccount, setWithdrawWalletAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [selectedWallet, setSelectedWallet] = useState('avenza');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawTxHash, setWithdrawTxHash] = useState('');
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawalSettings, setWithdrawalSettings] = useState(null);

  useEffect(() => {
    fetchWithdrawalMode();
    fetchUserProfile();
    fetchWalletBalances();
    fetchWithdrawalSettings();
  }, []);

  // Fetch withdrawal mode from admin settings
  const fetchWithdrawalMode = async () => {
    try {
      const response = await fetch('https://avenza.live/api/settings/withdrawal-mode');
      const data = await response.json();
      if (data.success) {
        setWithdrawalMode(data.mode);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal mode:', error);
    } finally {
      setLoadingMode(false);
    }
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch('https://avenza.live/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (!data.wallet_address && userData.wallet_address) {
          data.wallet_address = userData.wallet_address;
          data.wallet_type = userData.wallet_type;
        }
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  // Fetch wallet balances
  const fetchWalletBalances = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://avenza.live/api/wallet/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setWalletBalances({
          avenza: parseFloat(data.avenza_balance),
          income: parseFloat(data.income_balance),
          gaming: parseFloat(data.gaming_balance)
        });
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  };

  // Fetch withdrawal settings
  const fetchWithdrawalSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No token found, using default settings');
        setWithdrawalSettings({
          success: true,
          min_amount: 10,
          max_amount: 300,
          daily_limit_count: 1,
          fee_percentage: 10,
          enabled: true
        });
        return;
      }
      
      const response = await fetch('https://avenza.live/api/wallet/withdrawal-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('🔧 Withdrawal Settings Response:', data);
      
      if (response.ok && data.success) {
        setWithdrawalSettings(data);
        console.log('✅ Withdrawal settings loaded:', data);
      } else {
        console.error('❌ Failed to load withdrawal settings:', data);
        // If 401, token is invalid - redirect to login
        if (response.status === 401) {
          console.warn('⚠️ Token expired or invalid, redirecting to login...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else {
          // Use default settings on other errors
          setWithdrawalSettings({
            success: true,
            min_amount: 10,
            max_amount: 300,
            daily_limit_count: 1,
            fee_percentage: 10,
            enabled: true
          });
        }
      }
    } catch (err) {
      console.error('❌ Error fetching withdrawal settings:', err);
      // Use default settings on error
      setWithdrawalSettings({
        success: true,
        min_amount: 10,
        max_amount: 300,
        daily_limit_count: 1,
        fee_percentage: 10,
        enabled: true
      });
    }
  };

  // ============ MANUAL WITHDRAWAL FUNCTIONS ============
  
  const handleManualWithdraw = async (e) => {
    e.preventDefault();

    if (!manualAmount || parseFloat(manualAmount) <= 0) {
      setManualMessage('❌ Please enter a valid amount');
      setTimeout(() => setManualMessage(''), 3000);
      return;
    }

    if (!userProfile?.wallet_address) {
      setManualMessage('❌ Please connect your wallet in Profile page first');
      setTimeout(() => setManualMessage(''), 5000);
      return;
    }

    setManualLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://avenza.live/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(manualAmount),
          wallet_type: 'avenza'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessAmount(manualAmount); // Store amount before clearing
        setShowManualSuccess(true);
        setManualAmount('');
        fetchUserProfile();
        fetchWalletBalances();
      } else {
        setManualMessage(`❌ ${data.detail || data.message || 'Withdrawal failed'}`);
        setTimeout(() => setManualMessage(''), 3000);
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      setManualMessage('❌ Failed to process withdrawal');
      setTimeout(() => setManualMessage(''), 3000);
    } finally {
      setManualLoading(false);
    }
  };

  // ============ AUTOMATIC WITHDRAWAL FUNCTIONS (WEB3) ============
  
  const connectWithdrawWallet = async () => {
    try {
      if (!window.ethereum) {
        setWithdrawError('Please install MetaMask or another Web3 wallet');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        setWithdrawError('No wallet account found');
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
          setWithdrawError('Please switch to BSC network');
          return;
        }
      }

      setProvider(provider);
      setWithdrawWalletAccount(account);
      setWithdrawConnected(true);
      
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWithdrawWallet();
        } else {
          setWithdrawWalletAccount(accounts[0]);
        }
      });

    } catch (err) {
      setWithdrawError(err.message || 'Failed to connect wallet');
    }
  };

  const disconnectWithdrawWallet = () => {
    setWithdrawWalletAccount(null);
    setWithdrawConnected(false);
    setProvider(null);
    setWithdrawAmount('');
    setWithdrawError('');
  };

  const calculateWithdrawalFee = () => {
    const amount = parseFloat(withdrawAmount) || 0;
    const fee = amount * (withdrawalSettings?.fee_percentage || 5) / 100;
    const net = amount - fee;
    return { amount, fee, net };
  };

  const handleWithdrawClick = () => {
    if (!withdrawConnected || !withdrawWalletAccount) {
      setWithdrawError('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      setWithdrawError('Please enter a valid amount');
      return;
    }

    const balance = walletBalances[selectedWallet];
    if (amount > balance) {
      setWithdrawError(`Insufficient ${selectedWallet.toUpperCase()} balance`);
      return;
    }

    setShowWithdrawConfirm(true);
  };

  const handleWithdrawConfirm = async () => {
    setShowWithdrawConfirm(false);
    setWithdrawing(true);
    setWithdrawError('');
    setWithdrawSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Use the correct endpoint for automatic withdrawal with Web3
      const response = await fetch('https://avenza.live/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          wallet_type: selectedWallet,
          to_address: withdrawWalletAccount || userProfile?.wallet_address,
          destination_wallet_type: userProfile?.wallet_type || 'metamask'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setWithdrawSuccess(`✓ Withdrawal of $${withdrawAmount} processed successfully!`);
        setWithdrawTxHash(data.transaction_hash || '');
        setWithdrawAmount('');
        fetchWalletBalances();
        
        setTimeout(() => {
          setWithdrawSuccess('');
          setWithdrawTxHash('');
        }, 10000);
      } else {
        setWithdrawError(data.detail || 'Withdrawal failed');
      }
    } catch (err) {
      setWithdrawError(err.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  // ============ LOADING STATE ============
  
  if (loadingMode) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>Loading...</p>
      </div>
    );
  }

  // ============ RENDER MANUAL MODE ============
  
  if (withdrawalMode === 'manual') {
    // Check if wallet connected
    if (!userProfile?.wallet_address) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '20px'
        }}>
          <div style={{
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.05))',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '24px',
            padding: '60px 40px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#fff',
              margin: '0 0 16px 0'
            }}>
              Wallet Not Connected
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#94a3b8',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Please connect your wallet to enable withdrawals.
            </p>
            <button
              onClick={() => window.location.href = '/profile'}
              style={{
                background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 32px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Go to Profile
            </button>
          </div>
        </div>
      );
    }

    // Manual withdrawal form
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        {/* Manual Success Modal */}
        {showManualSuccess && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <h3 style={{
                color: '#fff',
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '12px'
              }}>
                Request Submitted
              </h3>
              <p style={{
                color: '#94a3b8',
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                Your withdrawal request has been submitted successfully.
              </p>
              <div style={{
                background: 'rgba(74, 144, 226, 0.1)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                marginTop: '16px'
              }}>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 4px 0' }}>
                  Amount: <strong style={{ color: '#10b981' }}>${successAmount || '0.00'}</strong>
                </p>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                  To: <strong style={{ color: '#4a90e2' }}>{userProfile?.wallet_address?.slice(0, 10) || 'N/A'}...</strong>
                </p>
              </div>
              <button
                onClick={() => setShowManualSuccess(false)}
                style={{
                  background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(74,144,226,0.2), rgba(147,51,234,0.1))',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '24px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#fff',
            margin: '0 0 8px 0'
          }}>
            💸 Withdraw Funds
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            Withdraw from your AVENZA wallet
          </p>
        </div>

        {manualMessage && (
          <div style={{
            background: manualMessage.includes('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${manualMessage.includes('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: manualMessage.includes('✅') ? '#10b981' : '#ef4444',
            fontSize: '14px'
          }}>
            {manualMessage}
          </div>
        )}

        {/* Withdrawal Form */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <form onSubmit={handleManualWithdraw}>
            {/* Balance */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: '600',
                display: 'block',
                marginBottom: '8px'
              }}>
                Available Balance
              </label>
              <div style={{
                background: 'rgba(74, 144, 226, 0.1)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                color: '#10b981',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                ${userProfile?.avenza_balance ? parseFloat(userProfile.avenza_balance).toFixed(2) : '0.00'}
              </div>
            </div>

            {/* Amount Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: '600',
                display: 'block',
                marginBottom: '8px'
              }}>
                Withdrawal Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="Enter amount"
                required
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '12px',
                  padding: '14px',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Wallet Info */}
            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{
                color: '#94a3b8',
                fontSize: '13px',
                margin: '0 0 8px 0',
                fontWeight: '600'
              }}>
                📍 Funds will be sent to:
              </p>
              <div style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <p style={{
                  color: '#fff',
                  fontSize: '14px',
                  margin: '0 0 4px 0',
                  fontWeight: '600'
                }}>
                  ✅ Your Connected Wallet
                </p>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '12px',
                  margin: '0 0 4px 0'
                }}>
                  Type: {userProfile?.wallet_type || 'Unknown'}
                </p>
                <p style={{
                  color: '#4a90e2',
                  fontSize: '12px',
                  margin: 0,
                  wordBreak: 'break-all'
                }}>
                  {userProfile?.wallet_address}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={manualLoading}
              style={{
                width: '100%',
                background: manualLoading ? 'rgba(74, 144, 226, 0.5)' : 'linear-gradient(135deg, #4a90e2, #357abd)',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: manualLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {manualLoading ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============ RENDER AUTOMATIC MODE (WEB3) ============
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.8))',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: '16px',
        padding: '32px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          WITHDRAW FUNDS
        </h2>
        <p style={{
          color: '#94a3b8',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          Connect wallet to withdraw USDT (BEP20)
        </p>

        {/* Step 1: Connect Wallet */}
        {!withdrawConnected ? (
          <div>
            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.2)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              textAlign: 'center',
              maxWidth: '400px',
              margin: '0 auto 24px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
              <h3 style={{ color: '#e5e7eb', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                Connect Your Wallet
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
                Connect your wallet to receive your withdrawal
              </p>
              <button
                onClick={connectWithdrawWallet}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(74,144,226,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '28px' }}>👛</span>
                Connect Wallet
              </button>
              <p style={{ color: '#64748b', fontSize: '12px', marginTop: '12px' }}>
                Supports MetaMask, Trust Wallet, SafePal & more
              </p>
            </div>

            {/* Withdrawal Settings Info */}
            <div style={{
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '13px',
              borderTop: '1px solid rgba(239, 68, 68, 0.2)',
              paddingTop: '20px',
              marginTop: '20px'
            }}>
              {withdrawalSettings ? (
                <div style={{
                  background: 'rgba(74, 144, 226, 0.05)',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid rgba(74, 144, 226, 0.2)'
                }}>
                  <p style={{ margin: '0 0 8px 0', color: '#4a90e2', fontWeight: '600' }}>
                    💡 Withdrawal Limits
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>
                    Minimum: ${withdrawalSettings.min_amount} | Maximum: ${withdrawalSettings.max_amount} per day
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>
                    Fee: {withdrawalSettings.fee_percentage}% | Daily Limit: {withdrawalSettings.daily_limit_count} transaction(s)
                  </p>
                </div>
              ) : (
                <p style={{ color: '#64748b', fontSize: '12px' }}>Loading withdrawal settings...</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Connected Wallet Info */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ color: '#10b981', fontSize: '12px', marginBottom: '8px' }}>
                Withdrawal Address (Connected)
              </div>
              <div style={{ 
                color: '#e5e7eb', 
                fontSize: '14px', 
                fontFamily: 'monospace',
                marginBottom: '12px',
                wordBreak: 'break-all'
              }}>
                {withdrawWalletAccount?.substring(0, 16)}...{withdrawWalletAccount?.substring(withdrawWalletAccount.length - 8)}
              </div>
              <button
                onClick={disconnectWithdrawWallet}
                disabled={withdrawing}
                style={{
                  width: '100%',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: withdrawing ? 'not-allowed' : 'pointer',
                  opacity: withdrawing ? 0.5 : 1
                }}
              >
                Disconnect Wallet
              </button>
            </div>

            {/* Wallet Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '12px'
              }}>
                Select Wallet to Withdraw From:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <button
                  onClick={() => {
                    setSelectedWallet('avenza');
                    setWithdrawError('');
                  }}
                  disabled={withdrawing}
                  style={{
                    background: selectedWallet === 'avenza' 
                      ? 'linear-gradient(135deg, #4a90e2, #357abd)' 
                      : 'rgba(74, 144, 226, 0.2)',
                    color: '#fff',
                    border: selectedWallet === 'avenza' ? '2px solid #4a90e2' : '1px solid rgba(74, 144, 226, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: withdrawing ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    opacity: withdrawing ? 0.5 : 1
                  }}
                >
                  AVENZA<br/>
                  <span style={{ fontSize: '16px' }}>${walletBalances.avenza.toFixed(2)}</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedWallet('income');
                    setWithdrawError('');
                  }}
                  disabled={withdrawing}
                  style={{
                    background: selectedWallet === 'income' 
                      ? 'linear-gradient(135deg, #10b981, #059669)' 
                      : 'rgba(16, 185, 129, 0.2)',
                    color: '#fff',
                    border: selectedWallet === 'income' ? '2px solid #10b981' : '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: withdrawing ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    opacity: withdrawing ? 0.5 : 1
                  }}
                >
                  INCOME<br/>
                  <span style={{ fontSize: '16px' }}>${walletBalances.income.toFixed(2)}</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedWallet('gaming');
                    setWithdrawError('');
                  }}
                  disabled={withdrawing}
                  style={{
                    background: selectedWallet === 'gaming' 
                      ? 'linear-gradient(135deg, #9333ea, #7e22ce)' 
                      : 'rgba(147, 51, 234, 0.2)',
                    color: '#fff',
                    border: selectedWallet === 'gaming' ? '2px solid #9333ea' : '1px solid rgba(147, 51, 234, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: withdrawing ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    opacity: withdrawing ? 0.5 : 1
                  }}
                >
                  GAMING<br/>
                  <span style={{ fontSize: '16px' }}>${walletBalances.gaming.toFixed(2)}</span>
                </button>
              </div>
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
                Withdrawal Amount (USD):
              </label>
              <input
                type="number"
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => {
                  setWithdrawAmount(e.target.value);
                  setWithdrawError('');
                }}
                disabled={withdrawing}
                placeholder="Enter amount"
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none',
                  opacity: withdrawing ? 0.5 : 1
                }}
              />
            </div>

            {/* Fee Calculation */}
            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <div style={{
                background: 'rgba(74, 144, 226, 0.1)',
                border: '1px solid rgba(74, 144, 226, 0.2)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Amount:</span>
                  <span style={{ color: '#e5e7eb' }}>${calculateWithdrawalFee().amount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Fee ({withdrawalSettings?.fee_percentage || 5}%):</span>
                  <span style={{ color: '#ef4444' }}>-${calculateWithdrawalFee().fee.toFixed(2)}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(100, 116, 139, 0.3)',
                  marginTop: '8px'
                }}>
                  <span style={{ color: '#e5e7eb', fontSize: '16px', fontWeight: '600' }}>You Receive:</span>
                  <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold' }}>
                    ${calculateWithdrawalFee().net.toFixed(2)} USDT
                  </span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {withdrawSuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'start',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0
                }}>
                  ✓
                </div>
                <div style={{ 
                  color: '#10b981', 
                  fontSize: '16px', 
                  fontWeight: '700',
                  flex: 1
                }}>
                  {withdrawSuccess}
                </div>
              </div>
            )}

            {/* Error Message */}
            {withdrawError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                color: '#ef4444',
                fontSize: '14px'
              }}>
                {withdrawError}
              </div>
            )}

            {/* Withdraw Button */}
            <button
              onClick={handleWithdrawClick}
              disabled={withdrawing || !withdrawAmount || !withdrawalSettings || !withdrawalSettings.enabled}
              style={{
                width: '100%',
                background: (withdrawing || !withdrawAmount || !withdrawalSettings || !withdrawalSettings.enabled)
                  ? '#4b5563'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (withdrawing || !withdrawAmount || !withdrawalSettings || !withdrawalSettings.enabled) 
                  ? 'not-allowed' 
                  : 'pointer',
                opacity: (withdrawing || !withdrawAmount || !withdrawalSettings || !withdrawalSettings.enabled) ? 0.5 : 1
              }}
            >
              {withdrawing ? 'PROCESSING...' : 'WITHDRAW USDT'}
              {!withdrawalSettings && ' (Loading...)'}
              {withdrawalSettings && !withdrawalSettings.enabled && ' (Withdrawals Disabled)'}
              {!withdrawAmount && withdrawalSettings && withdrawalSettings.enabled && ' (Enter amount)'}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showWithdrawConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '8px'
              }}>
                CONFIRM WITHDRAWAL
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Please review your withdrawal details
              </p>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>From:</div>
                <div style={{ color: '#e5e7eb', fontSize: '16px', fontWeight: '600', textTransform: 'uppercase' }}>
                  {selectedWallet} Wallet
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>To:</div>
                <div style={{ color: '#4a90e2', fontSize: '14px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {withdrawWalletAccount}
                </div>
              </div>
              <div style={{
                borderTop: '1px solid rgba(100, 116, 139, 0.3)',
                paddingTop: '16px',
                marginTop: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Amount:</span>
                  <span style={{ color: '#e5e7eb' }}>${calculateWithdrawalFee().amount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Fee:</span>
                  <span style={{ color: '#ef4444' }}>-${calculateWithdrawalFee().fee.toFixed(2)}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(100, 116, 139, 0.3)',
                  marginTop: '8px'
                }}>
                  <span style={{ color: '#e5e7eb', fontSize: '16px', fontWeight: '600' }}>You Receive:</span>
                  <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold' }}>
                    ${calculateWithdrawalFee().net.toFixed(2)} USDT
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px'
            }}>
              <p style={{ color: '#eab308', fontSize: '13px', margin: 0 }}>
                <strong>Important:</strong> Please verify the receiving address is correct. Withdrawals cannot be reversed.
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={handleWithdrawConfirm}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                YES, CONFIRM
              </button>
              <button
                onClick={() => setShowWithdrawConfirm(false)}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955'; // USDT BSC
const BSC_CHAIN_ID = '0x38'; // 56 in hex

const USDT_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)'
];

export default function PublicDeposit() {
  // Form data
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Public wallet
  const [publicAddress, setPublicAddress] = useState('');
  const [networkInfo, setNetworkInfo] = useState('');
  
  // Web3 connection state
  const [connected, setConnected] = useState(false);
  const [walletAccount, setWalletAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [walletType, setWalletType] = useState('');
  const [usdtBalance, setUsdtBalance] = useState(0);
  
  // Deposit flow state
  const [depositAmount, setDepositAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [depositing, setDepositing] = useState(false);
  
  // Success/Error state
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [successData, setSuccessData] = useState(null);
  
  // Stats
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchPublicAddress();
    fetchPublicStats();
  }, []);

  const fetchPublicAddress = async () => {
    try {
      const response = await fetch('https://avenza.live/api/public/wallet-address');
      const data = await response.json();
      if (data.success) {
        setPublicAddress(data.wallet_address);
        setNetworkInfo(data.network);
      }
    } catch (err) {
      console.error('Failed to fetch public address:', err);
    }
  };

  const fetchPublicStats = async () => {
    try {
      const response = await fetch('https://avenza.live/api/public/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setDepositError('Web3 wallet not installed. Please install MetaMask, Trust Wallet, or SafePal.');
        setTimeout(() => setDepositError(''), 5000);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        setDepositError('No wallet account found');
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
          setDepositError('Please switch to BNB Smart Chain (BSC)');
          return;
        }
      }

      // Detect wallet type
      let detectedWallet = 'Web3 Wallet';
      if (window.ethereum.isMetaMask) {
        detectedWallet = 'MetaMask';
      } else if (window.ethereum.isTrust) {
        detectedWallet = 'Trust Wallet';
      } else if (window.ethereum.isSafePal) {
        detectedWallet = 'SafePal';
      }

      setProvider(provider);
      setWalletAccount(account);
      setWalletType(detectedWallet);
      setConnected(true);
      
      // Get USDT balance
      await fetchUsdtBalance(provider, account);
      
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setWalletAccount(accounts[0]);
          fetchUsdtBalance(provider, accounts[0]);
        }
      });

    } catch (err) {
      setDepositError(err.message || 'Failed to connect wallet');
      setTimeout(() => setDepositError(''), 5000);
    }
  };

  const fetchUsdtBalance = async (provider, account) => {
    try {
      const usdtContract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, provider);
      const balance = await usdtContract.balanceOf(account);
      const decimals = await usdtContract.decimals();
      setUsdtBalance(parseFloat(ethers.formatUnits(balance, decimals)));
    } catch (err) {
      console.error('Failed to fetch USDT balance:', err);
    }
  };

  const disconnectWallet = () => {
    setWalletAccount(null);
    setConnected(false);
    setProvider(null);
    setWalletType('');
    setDepositAmount('');
    setDepositError('');
    setUsdtBalance(0);
  };

  const handleDeposit = async () => {
    // Validate form
    if (!name.trim()) {
      setDepositError('Please enter your name');
      setTimeout(() => setDepositError(''), 3000);
      return;
    }

    if (!phone.trim()) {
      setDepositError('Please enter your phone number');
      setTimeout(() => setDepositError(''), 3000);
      return;
    }

    if (!connected || !walletAccount) {
      setDepositError('Please connect your wallet first');
      setTimeout(() => setDepositError(''), 3000);
      return;
    }

    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      setDepositError('Please enter a valid amount');
      setTimeout(() => setDepositError(''), 3000);
      return;
    }

    if (amount < 1) {
      setDepositError('Minimum deposit is $1');
      setTimeout(() => setDepositError(''), 3000);
      return;
    }

    if (amount > usdtBalance) {
      setDepositError('Insufficient USDT balance in your wallet');
      setTimeout(() => setDepositError(''), 3000);
      return;
    }

    if (!publicAddress) {
      setDepositError('Public wallet address not configured. Please try again later.');
      setTimeout(() => setDepositError(''), 5000);
      return;
    }

    setProcessing(true);
    setDepositError('');

    try {
      // Get USDT contract
      const usdtContract = new ethers.Contract(
        USDT_CONTRACT,
        USDT_ABI,
        await provider.getSigner()
      );
      
      // Convert amount to wei (18 decimals for USDT)
      const amountInWei = ethers.parseUnits(depositAmount, 18);
      
      // Send transaction
      const tx = await usdtContract.transfer(publicAddress, amountInWei);
      setDepositing(true);
      setProcessing(false);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Record in backend
      const response = await fetch('https://avenza.live/api/public/deposit/website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          wallet_address: walletAccount,
          amount: parseFloat(depositAmount),
          network: 'BSC',
          token_type: 'USDT',
          amount_bep20_equivalent: parseFloat(depositAmount),
          transaction_hash: receipt.hash
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessData({
          amount: depositAmount,
          txHash: receipt.hash,
          distributedTo: data.distributed_to_count,
          perUser: data.per_user_amount
        });
        setDepositSuccess(true);
        setDepositAmount('');
        setName('');
        setPhone('');
        fetchUsdtBalance(provider, walletAccount);
        fetchPublicStats();
      } else {
        setDepositError(data.detail || 'Failed to record deposit');
        setTimeout(() => setDepositError(''), 5000);
      }
      
    } catch (error) {
      console.error('Deposit error:', error);
      if (error.code === 'ACTION_REJECTED') {
        setDepositError('Transaction rejected by user');
      } else if (error.message.includes('insufficient funds')) {
        setDepositError('Insufficient funds for gas fee');
      } else {
        setDepositError(error.message || 'Deposit failed');
      }
      setTimeout(() => setDepositError(''), 5000);
    } finally {
      setProcessing(false);
      setDepositing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
      padding: '20px'
    }}>
      {/* Success Modal */}
      {depositSuccess && successData && (
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
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h3 style={{
              color: '#fff',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '12px'
            }}>
              Deposit Successful!
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              Your deposit has been distributed to all AVENZA users
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
                Your Deposit: <strong style={{ color: '#10b981', fontSize: '18px' }}>{formatCurrency(successData.amount)}</strong>
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>
                Distributed To: <strong style={{ color: '#4a90e2' }}>{successData.distributedTo} Users</strong>
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>
                Per User: <strong style={{ color: '#a855f7' }}>{formatCurrency(successData.perUser)}</strong>
              </p>
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(74, 144, 226, 0.2)'
              }}>
                <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>
                  Transaction Hash:
                </p>
                <p style={{
                  color: '#4a90e2',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  margin: 0
                }}>
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
              onClick={() => {
                setDepositSuccess(false);
                setSuccessData(null);
              }}
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
              ✅ OK
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#fff',
            margin: '0 0 8px 0'
          }}>
            💰 Public Deposit
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            Deposit and distribute funds equally to all AVENZA users
          </p>
        </div>

        {/* Public Stats */}
        {stats && (
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '16px', textAlign: 'center' }}>
              📊 Community Statistics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Total Deposits</p>
                <p style={{ color: '#4a90e2', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                  {stats.total_deposits_count}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Participants</p>
                <p style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                  {stats.total_participants}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Total Received</p>
                <p style={{ color: '#eab308', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                  {formatCurrency(stats.total_amount_received)}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Total Distributed</p>
                <p style={{ color: '#a855f7', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                  {formatCurrency(stats.total_distributed)}
                </p>
              </div>
            </div>
          </div>
        )}

        {depositError && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: '#ef4444',
            fontSize: '14px'
          }}>
            ⚠️ {depositError}
          </div>
        )}

        {/* Main Form */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          {/* Personal Info */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
              📝 Your Information
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
            <div>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
          </div>

          {/* Wallet Connection */}
          {!connected ? (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                🔒 Connect Wallet
              </h3>
              <button
                onClick={connectWallet}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '28px' }}>👛</div>
                <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>
                  Connect Wallet
                </div>
              </button>
              <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', marginTop: '8px', margin: '8px 0 0 0' }}>
                Supports MetaMask, Trust Wallet, SafePal & more
              </p>
            </div>
          ) : (
            <>
              {/* Connected Wallet Info */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <p style={{ color: '#10b981', fontSize: '14px', fontWeight: '600', margin: 0 }}>
                    ✅ Connected: {walletType}
                  </p>
                  <button
                    onClick={disconnectWallet}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      color: '#ef4444',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Disconnect
                  </button>
                </div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  margin: '0 0 8px 0'
                }}>
                  {walletAccount?.slice(0, 10)}...{walletAccount?.slice(-8)}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                  USDT Balance: <strong style={{ color: '#10b981' }}>{usdtBalance.toFixed(2)} USDT</strong>
                </p>
              </div>

              {/* Deposit Amount */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#e5e7eb',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>
                  Deposit Amount (USDT) *
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
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount (min $1)"
                    min="1"
                    step="0.01"
                    disabled={processing || depositing}
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

              {/* Info Box */}
              <div style={{
                background: 'rgba(74, 144, 226, 0.05)',
                border: '1px solid rgba(74, 144, 226, 0.2)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
              }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>
                  Network: <strong style={{ color: '#4a90e2' }}>BNB Smart Chain (BEP20)</strong>
                </p>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>
                  Minimum Deposit: <strong style={{ color: '#4a90e2' }}>$1</strong>
                </p>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                  Distribution: <strong style={{ color: '#10b981' }}>Equal to all users</strong>
                </p>
              </div>

              {/* Deposit Button */}
              <button
                onClick={handleDeposit}
                disabled={processing || depositing || !name || !phone || !depositAmount}
                style={{
                  width: '100%',
                  background: (processing || depositing || !name || !phone || !depositAmount)
                    ? '#4b5563'
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: (processing || depositing || !name || !phone || !depositAmount) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  opacity: (processing || depositing || !name || !phone || !depositAmount) ? 0.6 : 1
                }}
              >
                {processing ? '⏳ Confirm in Wallet...' : 
                 depositing ? '🔄 Processing Distribution...' : 
                 '🚀 DEPOSIT & DISTRIBUTE'}
              </button>

              {(processing || depositing) && (
                <p style={{
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '13px',
                  marginTop: '12px'
                }}>
                  {processing ? 'Please approve the transaction in your wallet' : 'Distributing to all users...'}
                </p>
              )}
            </>
          )}
        </div>

        {/* How It Works */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            💡 How It Works
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ color: '#4a90e2', fontSize: '20px' }}>1️⃣</span>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                Enter your <strong style={{ color: '#fff' }}>name and phone number</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ color: '#10b981', fontSize: '20px' }}>2️⃣</span>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                Connect your <strong style={{ color: '#fff' }}>Web3 wallet</strong> (MetaMask, Trust, SafePal)
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ color: '#eab308', fontSize: '20px' }}>3️⃣</span>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                Enter amount and send <strong style={{ color: '#fff' }}>USDT (BEP20)</strong> payment
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ color: '#a855f7', fontSize: '20px' }}>4️⃣</span>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                Amount is <strong style={{ color: '#10b981' }}>instantly distributed equally</strong> to all AVENZA users!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

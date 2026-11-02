import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955'; // USDT BSC
const BSC_CHAIN_ID = '0x38'; // 56 in hex

const USDT_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)'
];

export default function Deposit() {
  // User state
  const [walletBalances, setWalletBalances] = useState({ avenza: 0, income: 0, gaming: 0 });
  const [loading, setLoading] = useState(true);
  
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
  const [txHash, setTxHash] = useState('');
  const [successAmount, setSuccessAmount] = useState('0'); // Store amount for success modal
  
  // Receiver address (hidden from user)
  const [receiverAddress, setReceiverAddress] = useState('');

  useEffect(() => {
    fetchWalletBalances();
    fetchReceiverAddress();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiverAddress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://avenza.live/api/wallet/receiver-address', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setReceiverAddress(data.receiver_address);
      }
    } catch (err) {
      console.error('Failed to fetch receiver address:', err);
    }
  };

  const connectMetaMask = async () => {
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

      // Detect which wallet is connected
      let detectedWallet = 'Web3 Wallet';
      if (window.ethereum.isMetaMask) {
        detectedWallet = 'MetaMask';
      } else if (window.ethereum.isTrust) {
        detectedWallet = 'Trust Wallet';
      } else if (window.ethereum.isSafePal) {
        detectedWallet = 'SafePal';
      } else if (window.ethereum.isCoinbaseWallet) {
        detectedWallet = 'Coinbase Wallet';
      } else if (window.ethereum.isBraveWallet) {
        detectedWallet = 'Brave Wallet';
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

  const connectTrustWallet = async () => {
    // Trust Wallet uses same interface as MetaMask
    await connectMetaMask();
  };

  const connectSafePal = async () => {
    // SafePal uses same interface
    await connectMetaMask();
  };

  const connectWalletConnect = async () => {
    // For now, fallback to MetaMask interface
    // In production, implement WalletConnect properly
    setDepositError('WalletConnect coming soon. Please use MetaMask, Trust, or SafePal.');
    setTimeout(() => setDepositError(''), 5000);
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

    if (!receiverAddress) {
      setDepositError('Receiver address not configured. Please contact support.');
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
      const tx = await usdtContract.transfer(receiverAddress, amountInWei);
      setDepositing(true);
      setProcessing(false);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Record in backend
      const token = localStorage.getItem('token');
      const response = await fetch('https://avenza.live/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(depositAmount),
          currency: 'USDT',
          network: 'BEP20',
          transaction_hash: receipt.hash,
          from_address: walletAccount,
          block_number: receipt.blockNumber
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessAmount(depositAmount); // Store amount before clearing
        setTxHash(receipt.hash);
        setDepositSuccess(true);
        setDepositAmount('');
        fetchWalletBalances();
        fetchUsdtBalance(provider, walletAccount);
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

  if (loading) {
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

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {/* Success Modal */}
      {depositSuccess && (
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
            maxWidth: '450px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
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
              Your deposit has been processed successfully
            </p>
            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>
                Amount: <strong style={{ color: '#10b981', fontSize: '18px' }}>${parseFloat(successAmount || 0).toFixed(2)} USDT</strong>
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>
                New Balance: <strong style={{ color: '#4a90e2' }}>${walletBalances.avenza.toFixed(2)}</strong>
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
                  {txHash}
                </p>
              </div>
            </div>
            <a
              href={`https://bscscan.com/tx/${txHash}`}
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
              onClick={() => setDepositSuccess(false)}
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
              OK
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))',
        border: '1px solid rgba(16,185,129,0.3)',
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
          💰 Deposit USDT (BEP20)
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
          Add funds to your AVENZA wallet instantly
        </p>
      </div>

      {/* Current Balance */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74, 144, 226, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>
          Current AVENZA Balance:
        </p>
        <p style={{
          color: '#4a90e2',
          fontSize: '32px',
          fontWeight: 'bold',
          margin: 0
        }}>
          ${walletBalances.avenza.toFixed(2)}
        </p>
      </div>

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
          {depositError}
        </div>
      )}

      {/* Wallet Connection */}
      {!connected ? (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '12px',
          padding: '20px',
          maxWidth: '100%',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{
              color: '#e5e7eb',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              🔒 Connect Wallet
            </p>
            <p style={{
              color: '#94a3b8',
              fontSize: '13px',
              margin: 0
            }}>
              Supports MetaMask, Trust Wallet, SafePal & more
            </p>
          </div>

          <button
            onClick={connectMetaMask}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #4a90e2, #357abd)',
              border: 'none',
              borderRadius: '10px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s',
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

          <div style={{
            background: 'rgba(74, 144, 226, 0.05)',
            border: '1px solid rgba(74, 144, 226, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '16px'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, textAlign: 'center', lineHeight: '1.4' }}>
              🔒 BNB Smart Chain (BEP20)<br/>Min: $1 | Fee: 0%
            </p>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
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
              Deposit Amount (USDT):
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
              Deposit Fee: <strong style={{ color: '#10b981' }}>0%</strong>
            </p>
          </div>

          {/* Deposit Button */}
          <button
            onClick={handleDeposit}
            disabled={processing || depositing || !depositAmount}
            style={{
              width: '100%',
              background: (processing || depositing || !depositAmount)
                ? '#4b5563'
                : 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (processing || depositing || !depositAmount) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              opacity: (processing || depositing || !depositAmount) ? 0.6 : 1
            }}
          >
            {processing ? '⏳ Confirm in Wallet...' : 
             depositing ? '🔄 Recording Deposit...' : 
             '🚀 DEPOSIT NOW'}
          </button>

          {(processing || depositing) && (
            <p style={{
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '13px',
              marginTop: '12px'
            }}>
              {processing ? 'Please approve the transaction in your wallet' : 'Processing your deposit...'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

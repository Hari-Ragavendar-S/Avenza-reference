import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Invest() {
  const location = useLocation();
  const navigate = useNavigate();
  const packageData = location.state?.package;

  const [avenzaBalance, setAvenzaBalance] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!packageData) {
      navigate('/plans');
      return;
    }
    fetchBalance();
  }, [packageData, navigate]);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://avenza.live/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvenzaBalance(data.avenza_balance || 0);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const getPackageIcon = (name) => {
    const icons = {
      'Bronze': '🥉',
      'Silver': '🥈',
      'Gold': '🥇',
      'Diamond': '💎',
      'Platinum': '⭐',
      'Elite': '👑'
    };
    return icons[name] || '📦';
  };

  const getPackageGradient = (name) => {
    const gradients = {
      'Bronze': 'linear-gradient(135deg, #CD7F32, #A0522D)',
      'Silver': 'linear-gradient(135deg, #C0C0C0, #808080)',
      'Gold': 'linear-gradient(135deg, #FFD700, #FFA500)',
      'Diamond': 'linear-gradient(135deg, #B9F2FF, #667EEA)',
      'Platinum': 'linear-gradient(135deg, #E0E0E0, #A0A0A0)',
      'Elite': 'linear-gradient(135deg, #FF6B6B, #FFD93D)'
    };
    return gradients[name] || 'linear-gradient(135deg, #4a90e2, #357abd)';
  };

  const handleInvestClick = () => {
    setError('');
    
    if (parseFloat(avenzaBalance) < parseFloat(packageData.amount)) {
      setError('Insufficient AVENZA wallet balance');
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmInvestment = async () => {
    setProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://avenza.live/api/investment/enroll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          package_id: packageData.id
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success - navigate to My Packages
        navigate('/my-packages', { 
          state: { 
            success: true, 
            message: data.message,
            packageName: data.package_name
          } 
        });
      } else {
        setError(data.detail || 'Failed to complete investment');
        setShowConfirm(false);
      }
    } catch (err) {
      setError('Failed to connect to server');
      setShowConfirm(false);
    } finally {
      setProcessing(false);
    }
  };

  if (!packageData) {
    return null;
  }

  const dailyProfit = (parseFloat(packageData.amount) * parseFloat(packageData.daily_profit_percentage) / 100).toFixed(2);
  const maxProfit = (parseFloat(packageData.amount) * 3).toFixed(2);
  const hasBalance = parseFloat(avenzaBalance) >= parseFloat(packageData.amount);

  return (
    <div style={{
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '8px'
        }}>
          Investment Enrollment
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          Review and confirm your investment
        </p>
      </div>

      {/* Package Details Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74, 144, 226, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Gradient Top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: getPackageGradient(packageData.name)
        }} />

        {/* Icon & Name */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '64px', marginBottom: '12px' }}>
            {getPackageIcon(packageData.name)}
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '8px'
          }}>
            {packageData.name} Package
          </h2>
        </div>

        {/* Investment Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: 'rgba(74, 144, 226, 0.1)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
              Investment Amount
            </div>
            <div style={{ color: '#4a90e2', fontSize: '20px', fontWeight: 'bold' }}>
              ${parseFloat(packageData.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
              Daily Profit
            </div>
            <div style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>
              ${dailyProfit}
            </div>
          </div>
        </div>

        {/* Profit Info */}
        <div style={{
          background: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
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
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Max Profit (3x):</span>
            <span style={{ color: '#a855f7', fontSize: '18px', fontWeight: 'bold' }}>
              ${maxProfit}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Daily ROI:</span>
            <span style={{ color: '#a855f7', fontSize: '18px', fontWeight: 'bold' }}>
              {parseFloat(packageData.daily_profit_percentage).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Balance Info */}
        <div style={{
          background: hasBalance ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: hasBalance ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Your AVENZA Balance:</span>
            <span style={{
              color: hasBalance ? '#10b981' : '#ef4444',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              ${parseFloat(avenzaBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {!hasBalance && (
            <div style={{
              marginTop: '12px',
              color: '#ef4444',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              ⚠️ Insufficient balance. Please top up your AVENZA wallet first.
            </div>
          )}
        </div>

        {/* Features */}
        <div style={{
          borderTop: '1px solid rgba(74, 144, 226, 0.2)',
          paddingTop: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
            color: '#e5e7eb',
            fontSize: '13px'
          }}>
            <span style={{ color: '#10b981', marginRight: '8px' }}>✓</span>
            Daily profit credited automatically
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
            color: '#e5e7eb',
            fontSize: '13px'
          }}>
            <span style={{ color: '#10b981', marginRight: '8px' }}>✓</span>
            Profits go to INCOME wallet
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: '#e5e7eb',
            fontSize: '13px'
          }}>
            <span style={{ color: '#10b981', marginRight: '8px' }}>✓</span>
            Track progress in My Packages
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          color: '#ef4444',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => navigate('/plans')}
          style={{
            flex: 1,
            background: 'rgba(74, 144, 226, 0.1)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            color: '#4a90e2',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          ← BACK
        </button>
        <button
          onClick={handleInvestClick}
          disabled={!hasBalance}
          style={{
            flex: 1,
            background: hasBalance ? getPackageGradient(packageData.name) : '#4b5563',
            border: 'none',
            borderRadius: '12px',
            padding: '16px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: hasBalance ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            opacity: hasBalance ? 1 : 0.5
          }}
        >
          INVEST NOW
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
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
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              CONFIRM INVESTMENT
            </h2>
            <p style={{
              color: '#94a3b8',
              textAlign: 'center',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              Please review and confirm your investment
            </p>

            {/* Confirmation Details */}
            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{ color: '#94a3b8' }}>Package:</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{packageData.name}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{ color: '#94a3b8' }}>Investment:</span>
                <span style={{ color: '#4a90e2', fontWeight: 'bold', fontSize: '18px' }}>
                  ${parseFloat(packageData.amount).toFixed(2)}
                </span>
              </div>
              
              {/* Income Breakdown */}
              <div style={{
                borderTop: '1px solid rgba(74, 144, 226, 0.2)',
                paddingTop: '12px',
                marginTop: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  color: '#4a90e2',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>
                  💰 YOUR INCOME SOURCES
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  padding: '6px 8px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '6px'
                }}>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>Daily Profit (2x):</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '13px' }}>
                    ${(parseFloat(packageData.amount) * 2).toFixed(2)}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  padding: '6px 8px',
                  background: 'rgba(234, 179, 8, 0.1)',
                  borderRadius: '6px'
                }}>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>Referral Bonus:</span>
                  <span style={{ color: '#eab308', fontWeight: 'bold', fontSize: '13px' }}>
                    5%-10% on direct refs
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  padding: '6px 8px',
                  background: 'rgba(168, 85, 247, 0.1)',
                  borderRadius: '6px'
                }}>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>Binary Matching (1x):</span>
                  <span style={{ color: '#a855f7', fontWeight: 'bold', fontSize: '13px' }}>
                    ${parseFloat(packageData.amount).toFixed(2)}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  borderRadius: '6px'
                }}>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>Downline Matching:</span>
                  <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '13px' }}>
                    {packageData.downline_matching_bonus || 0}% on downline
                  </span>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid rgba(74, 144, 226, 0.2)'
              }}>
                <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>Total Max (3x):</span>
                <span style={{ color: '#4a90e2', fontWeight: 'bold', fontSize: '18px' }}>
                  ${(parseFloat(packageData.amount) * 3).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Warning */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#ef4444', fontSize: '14px', margin: 0 }}>
                ${parseFloat(packageData.amount).toFixed(2)} will be deducted from your AVENZA wallet
              </p>
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleConfirmInvestment}
                disabled={processing}
                style={{
                  background: processing ? '#4b5563' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 32px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '140px'
                }}
              >
                {processing ? 'PROCESSING...' : 'YES, INVEST'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={processing}
                style={{
                  background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 32px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '140px'
                }}
              >
                NO, CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function MyPackages() {
  const location = useLocation();
  const navigate = useNavigate();
  const [investments, setInvestments] = useState([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  useEffect(() => {
    // Check for success message from enrollment
    if (location.state?.success) {
      setSuccessMessage(`✅ Successfully invested in ${location.state.packageName} package!`);
      setTimeout(() => setSuccessMessage(''), 5000);
      // Clear location state
      window.history.replaceState({}, document.title);
    }

    fetchMyPackages();
  }, [location.state]);

  const fetchMyPackages = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 HELLO FROM DB - Fetching MY PACKAGES (user investments)...');
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('https://avenza.live/api/investment/my-packages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ HELLO FROM DB - My packages data received:', data);
        console.log('📦 Number of investments:', data.investments?.length || 0);
        console.log('💰 Total invested:', data.total_invested);
        console.log('💵 Total earned:', data.total_earned);
        
        if (data.investments && data.investments.length > 0) {
          console.log('📦 First investment details:');
          console.log('   - Package:', data.investments[0].package_name);
          console.log('   - Invested:', data.investments[0].invested_amount);
          console.log('   - Max Profit (should be 3x):', data.investments[0].max_profit);
          console.log('   - Total Earned:', data.investments[0].total_earned);
          console.log('   - Daily Profit:', data.investments[0].daily_profit);
        }
        
        setInvestments(data.investments || []);
        setTotalInvested(data.total_invested || 0);
        setTotalEarned(data.total_earned || 0);
      } else {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
      }
    } catch (err) {
      console.error('❌ Error fetching packages:', err);
    } finally {
      setLoading(false);
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

  const handleViewTransactions = (investment) => {
    setSelectedInvestment(investment);
  };

  const closeTransactionModal = () => {
    setSelectedInvestment(null);
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        Loading your packages...
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
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
          My Packages
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          Track your active investments and daily profits
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          color: '#10b981',
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          {successMessage}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
            Total Invested
          </div>
          <div style={{ color: '#4a90e2', fontSize: '28px', fontWeight: 'bold' }}>
            ${parseFloat(totalInvested).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
            Total Earned
          </div>
          <div style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold' }}>
            ${parseFloat(totalEarned).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
            Active Packages
          </div>
          <div style={{ color: '#a855f7', fontSize: '28px', fontWeight: 'bold' }}>
            {investments.length}
          </div>
        </div>
      </div>

      {/* Investment Cards */}
      {investments.length === 0 ? (
        <div style={{
          background: 'rgba(74, 144, 226, 0.1)',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
          <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>
            No Active Packages
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
            Start investing to earn daily profits
          </p>
          <button
            onClick={() => navigate('/plans')}
            style={{
              background: 'linear-gradient(135deg, #4a90e2, #357abd)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            VIEW PLANS
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {investments.map((inv) => (
            <div
              key={inv.id}
              style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => handleViewTransactions(inv)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(74, 144, 226, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Gradient Top */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: getPackageGradient(inv.package_name)
              }} />

              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '32px' }}>
                    {getPackageIcon(inv.package_name)}
                  </div>
                  <div>
                    <h3 style={{
                      color: '#fff',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}>
                      {inv.package_name}
                    </h3>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                      ${parseFloat(inv.invested_amount).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div style={{
                  background: inv.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: inv.status === 'active' ? '#10b981' : '#ef4444',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {inv.status.toUpperCase()}
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>Progress</span>
                  <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>
                    {parseFloat(inv.progress_percentage).toFixed(1)}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(74, 144, 226, 0.2)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(inv.progress_percentage, 100)}%`,
                    height: '100%',
                    background: getPackageGradient(inv.package_name),
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Earnings Info */}
              <div style={{
                marginBottom: '16px'
              }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>
                    Total Earned
                  </div>
                  <div style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold' }}>
                    ${parseFloat(inv.total_earned).toFixed(2)}
                  </div>
                </div>
                
                {/* Max Profit Breakdown */}
                <div style={{
                  background: 'rgba(74, 144, 226, 0.1)',
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ color: '#4a90e2', fontSize: '11px', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
                    💰 MAX EARNINGS (3x)
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px' }}>
                    <span style={{ color: '#94a3b8' }}>Daily Profit (2x):</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                      ${(parseFloat(inv.invested_amount) * 2).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px' }}>
                    <span style={{ color: '#94a3b8' }}>Matching (1x):</span>
                    <span style={{ color: '#a855f7', fontWeight: 'bold' }}>
                      ${parseFloat(inv.invested_amount).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(74, 144, 226, 0.3)',
                    marginTop: '6px'
                  }}>
                    <span style={{ color: '#4a90e2', fontWeight: 'bold', fontSize: '12px' }}>Total Max:</span>
                    <span style={{ color: '#4a90e2', fontWeight: 'bold', fontSize: '14px' }}>
                      ${parseFloat(inv.max_profit).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Today's Profit */}
              <div style={{
                background: 'rgba(74, 144, 226, 0.1)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>Today's Profit:</span>
                  <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold' }}>
                    +${parseFloat(inv.earned_today || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Footer Info */}
              <div style={{
                borderTop: '1px solid rgba(74, 144, 226, 0.2)',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#94a3b8'
              }}>
                <span>Enrolled: {inv.enrollment_date}</span>
                <span style={{ color: '#4a90e2' }}>View Details →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View More Plans Button */}
      {investments.length > 0 && (
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/plans')}
            style={{
              background: 'rgba(74, 144, 226, 0.2)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '12px',
              padding: '14px 28px',
              color: '#4a90e2',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            VIEW MORE PLANS
          </button>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedInvestment && (
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
          padding: '20px',
          overflow: 'auto'
        }}
        onClick={closeTransactionModal}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {getPackageIcon(selectedInvestment.package_name)} {selectedInvestment.package_name} Package Details
            </h2>

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
                  Invested
                </div>
                <div style={{ color: '#4a90e2', fontSize: '20px', fontWeight: 'bold' }}>
                  ${parseFloat(selectedInvestment.invested_amount).toFixed(2)}
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
                  Total Earned
                </div>
                <div style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>
                  ${parseFloat(selectedInvestment.total_earned).toFixed(2)}
                </div>
              </div>

              <div style={{
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                  Daily Profit
                </div>
                <div style={{ color: '#a855f7', fontSize: '20px', fontWeight: 'bold' }}>
                  ${parseFloat(selectedInvestment.daily_profit).toFixed(2)}
                </div>
              </div>

              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                  Max Profit (3x)
                </div>
                <div style={{ color: '#ef4444', fontSize: '20px', fontWeight: 'bold' }}>
                  ${parseFloat(selectedInvestment.max_profit).toFixed(2)}
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Progress:</span>
                <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold' }}>
                  {parseFloat(selectedInvestment.progress_percentage).toFixed(1)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '10px',
                background: 'rgba(74, 144, 226, 0.2)',
                borderRadius: '5px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(selectedInvestment.progress_percentage, 100)}%`,
                  height: '100%',
                  background: getPackageGradient(selectedInvestment.package_name)
                }} />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <span style={{ color: '#94a3b8' }}>Status:</span>
              <span style={{
                color: selectedInvestment.status === 'active' ? '#10b981' : '#ef4444',
                fontWeight: 'bold'
              }}>
                {selectedInvestment.status.toUpperCase()}
              </span>
            </div>

            <button
              onClick={closeTransactionModal}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

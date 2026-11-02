import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Plans() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      console.log('🔍 HELLO FROM DB - Starting to fetch packages...');
      const response = await fetch('https://avenza.live/api/packages', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ HELLO FROM DB - Data received:', data);
        console.log('📦 Number of packages:', data.packages?.length || 0);
        
        if (data.packages && data.packages.length > 0) {
          console.log('📦 First package details:');
          console.log('   - Name:', data.packages[0].name);
          console.log('   - Amount:', data.packages[0].amount);
          console.log('   - Daily Profit %:', data.packages[0].daily_profit_percentage);
          console.log('   - Downline Bonus (FROM DB):', data.packages[0].downline_matching_bonus);
        }
        
        setPackages(data.packages || []);
      } else {
        console.error('❌ Response not OK:', response.status);
        const errorText = await response.text();
        console.error('❌ Error text:', errorText);
      }
    } catch (err) {
      console.error('❌ Error fetching packages:', err);
      console.error('❌ Error name:', err.name);
      console.error('❌ Error message:', err.message);
      
      // Try fallback to direct API call
      console.log('🔄 Trying fallback fetch...');
      try {
        const fallbackResponse = await fetch('https://avenza.live/api/packages', {
          mode: 'cors',
          credentials: 'omit'
        });
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          console.log('✅ Fallback succeeded!', data);
          setPackages(data.packages || []);
        }
      } catch (fallbackErr) {
        console.error('❌ Fallback also failed:', fallbackErr);
      }
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

  const handlePackageClick = (pkg) => {
    navigate('/invest', { state: { package: pkg } });
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        Loading investment plans...
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
          Investment Plans
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          Choose a plan and start earning daily profits
        </p>
      </div>

      {/* Package Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {packages.map((pkg) => {
          console.log('🎨 Rendering package:', pkg.name, 'Bonus:', pkg.downline_matching_bonus);
          return (
          <div
            key={pkg.id}
            onClick={() => handlePackageClick(pkg)}
            style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(74, 144, 226, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Gradient Background */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: getPackageGradient(pkg.name)
            }} />

            {/* Icon */}
            <div style={{
              fontSize: '48px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              {getPackageIcon(pkg.name)}
            </div>

            {/* Package Name */}
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#fff',
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              {pkg.name}
            </h3>

            {/* Investment Amount */}
            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                color: '#94a3b8',
                fontSize: '12px',
                marginBottom: '4px'
              }}>
                Investment Amount
              </div>
              <div style={{
                color: '#10b981',
                fontSize: '32px',
                fontWeight: 'bold'
              }}>
                ${parseFloat(pkg.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Daily Profit */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                color: '#94a3b8',
                fontSize: '12px',
                marginBottom: '4px'
              }}>
                Daily Profit
              </div>
              <div style={{
                color: '#10b981',
                fontSize: '20px',
                fontWeight: 'bold'
              }}>
                {parseFloat(pkg.daily_profit_percentage).toFixed(2)}%
              </div>
            </div>

            {/* Downline Matching Bonus */}
            <div style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                color: '#94a3b8',
                fontSize: '11px',
                marginBottom: '4px'
              }}>
                💎 DOWNLINE MATCHING BONUS
              </div>
              <div style={{
                color: '#a855f7',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                {parseFloat(pkg.downline_matching_bonus || 0).toFixed(1)}%
              </div>
              <div style={{
                color: '#94a3b8',
                fontSize: '10px',
                marginTop: '4px'
              }}>
                on all downline matches (max $220/day)
              </div>
            </div>

            {/* Max Profit Breakdown */}
            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                color: '#4a90e2',
                fontSize: '11px',
                fontWeight: '600',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                💰 MAXIMUM EARNINGS (3x)
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                padding: '6px 8px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '6px'
              }}>
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>Daily Profit (2x):</span>
                <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>
                  ${(parseFloat(pkg.amount) * 2).toFixed(2)}
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
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>Matching Bonus (1x):</span>
                <span style={{ color: '#a855f7', fontSize: '12px', fontWeight: 'bold' }}>
                  ${parseFloat(pkg.amount).toFixed(2)}
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
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                  Downline Bonus ({pkg.downline_matching_bonus || 0}%):
                </span>
                <span style={{ color: '#eab308', fontSize: '11px', fontWeight: '600' }}>
                  On all downline matches (max $220/day)
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px',
                background: 'rgba(74, 144, 226, 0.15)',
                borderRadius: '6px',
                borderTop: '1px solid rgba(74, 144, 226, 0.3)',
                marginTop: '6px'
              }}>
                <span style={{ color: '#4a90e2', fontSize: '12px', fontWeight: 'bold' }}>Total Max:</span>
                <span style={{ color: '#4a90e2', fontSize: '14px', fontWeight: 'bold' }}>
                  ${(parseFloat(pkg.amount) * 3).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Features */}
            <div style={{
              padding: '12px 0',
              borderTop: '1px solid rgba(74, 144, 226, 0.2)',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                color: '#e5e7eb',
                fontSize: '13px'
              }}>
                <span style={{ color: '#10b981', marginRight: '8px' }}>✓</span>
                Daily profit credited to INCOME wallet
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                color: '#e5e7eb',
                fontSize: '13px'
              }}>
                <span style={{ color: '#10b981', marginRight: '8px' }}>✓</span>
                Maximum return: 3x investment
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                color: '#e5e7eb',
                fontSize: '13px'
              }}>
                <span style={{ color: '#eab308', marginRight: '8px' }}>✓</span>
                Earn {pkg.downline_matching_bonus || 0}% on downline matches
              </div>
            </div>

            {/* Invest Button */}
            <button style={{
              width: '100%',
              background: getPackageGradient(pkg.name),
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}>
              INVEST NOW
            </button>
          </div>
        )})}
      </div>

      {/* Info Section */}
      <div style={{
        background: 'rgba(74, 144, 226, 0.1)',
        border: '1px solid rgba(74, 144, 226, 0.3)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{
          color: '#4a90e2',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '12px'
        }}>
          📊 How It Works
        </h3>
        <ul style={{
          color: '#e5e7eb',
          fontSize: '14px',
          lineHeight: '1.8',
          paddingLeft: '20px'
        }}>
          <li>Choose an investment plan and pay from your AVENZA wallet</li>
          <li>Receive daily profit automatically credited to your INCOME wallet</li>
          <li>Earn up to 3x your initial investment</li>
          <li>Track your progress in "My Packages" section</li>
          <li>Withdraw profits anytime from INCOME wallet</li>
        </ul>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ReferralBonus() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [rateProgress, setRateProgress] = useState([]);
  const [pendingBonuses, setPendingBonuses] = useState([]);
  const [claimedBonuses, setClaimedBonuses] = useState([]);
  const [claiming, setClaiming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    fetchBonusData();
  }, []);

  const fetchBonusData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch('https://avenza.live/api/referral-bonus/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRateProgress(data.rate_progress || []);
        setPendingBonuses(data.pending_bonuses || []);
        setClaimedBonuses(data.claimed_bonuses || []);
      }
    } catch (error) {
      console.error('Error fetching bonus data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimBonus = async (bonusId, bonusAmount, referralUsername) => {
    if (claiming) return;

    setClaiming(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://avenza.live/api/referral-bonus/claim', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bonus_id: bonusId })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessData({
          amount: bonusAmount,
          referralUsername: referralUsername,
          newBalance: data.new_income_balance
        });
        setShowSuccess(true);
        
        // Refresh data after 2 seconds
        setTimeout(() => {
          setShowSuccess(false);
          fetchBonusData();
        }, 3000);
      } else {
        const error = await res.json();
        alert(error.detail || 'Failed to claim bonus');
      }
    } catch (error) {
      alert('Error claiming bonus');
    } finally {
      setClaiming(false);
    }
  };

  const handleClaimAll = async () => {
    if (pendingBonuses.length === 0 || claiming) return;

    setClaiming(true);
    let successCount = 0;
    let totalAmount = 0;

    for (const bonus of pendingBonuses) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://avenza.live/api/referral-bonus/claim', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ bonus_id: bonus.id })
        });

        if (res.ok) {
          successCount++;
          totalAmount += parseFloat(bonus.bonus_amount);
        }
      } catch (error) {
        console.error('Error claiming bonus:', error);
      }
    }

    if (successCount > 0) {
      setSuccessData({
        amount: totalAmount,
        referralUsername: `${successCount} referral${successCount > 1 ? 's' : ''}`,
        newBalance: null
      });
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        fetchBonusData();
      }, 3000);
    }

    setClaiming(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ animation: 'pulse 2s infinite' }}>
          <div style={{ height: '150px', background: 'rgba(74,144,226,0.1)', borderRadius: '16px', marginBottom: '20px' }} />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>⚠️</span>
          <p style={{ color: '#ef4444', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
            Failed to Load Data
          </p>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            Unable to fetch referral bonus information. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0', position: 'relative' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(147,51,234,0.2), rgba(168,85,247,0.1))',
        border: '1px solid rgba(147,51,234,0.3)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9333ea',
              fontSize: '24px',
              cursor: 'pointer',
              padding: 0
            }}
          >
            ←
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
            🎁 Referral Bonus
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, paddingLeft: '36px' }}>
          One-time bonus when your referrals invest!
        </p>
      </div>

      {/* Direct Referrals Summary Card - Always Show When Not Empty State */}
      {(stats.unclaimed_count > 0 || stats.claimed_count > 0) && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(74,144,226,0.15), rgba(147,51,234,0.05))',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '32px', flexShrink: 0 }}>📊</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: '#4a90e2', fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
                Your Direct Referrals Summary
              </h3>
              
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '12px'
              }}>
                {/* Total Direct Referrals */}
                <div style={{
                  background: 'rgba(74,144,226,0.1)',
                  border: '1px solid rgba(74,144,226,0.3)',
                  borderRadius: '10px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 6px 0' }}>TOTAL REFERRALS</p>
                  <p style={{ color: '#4a90e2', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    {stats.direct_referrals}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '10px', margin: '4px 0 0 0' }}>
                    Used your link
                  </p>
                </div>

                {/* With Investment */}
                <div style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: '10px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 6px 0' }}>WITH INVESTMENT</p>
                  <p style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    {stats.claimed_count + stats.unclaimed_count}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '10px', margin: '4px 0 0 0' }}>
                    ✅ Earning bonuses
                  </p>
                </div>

                {/* Not Invested Yet */}
                {stats.direct_referrals > (stats.claimed_count + stats.unclaimed_count) && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'center'
                  }}>
                    <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 6px 0' }}>NOT INVESTED</p>
                    <p style={{ color: '#ef4444', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                      {stats.direct_referrals - (stats.claimed_count + stats.unclaimed_count)}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '10px', margin: '4px 0 0 0' }}>
                      ⚠️ No bonuses yet
                    </p>
                  </div>
                )}

                {/* Current Rate */}
                <div style={{
                  background: 'rgba(251,191,36,0.1)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  borderRadius: '10px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 6px 0' }}>CURRENT RATE</p>
                  <p style={{ color: '#fbbf24', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    {stats.current_rate}%
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '10px', margin: '4px 0 0 0' }}>
                    {stats.next_referral_rate ? `Next: ${stats.next_referral_rate}%` : 'MAX RATE!'}
                  </p>
                </div>
              </div>

              {/* Info Note */}
              <div style={{
                background: 'rgba(74,144,226,0.1)',
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid rgba(74,144,226,0.2)'
              }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                  💡 <strong style={{ color: '#4a90e2' }}>Direct Referrals</strong> = People who signed up using YOUR link. 
                  Only they earn you referral bonuses (not spillover members from your binary tree).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unclaimed Bonuses Card */}
      {stats.unclaimed_count > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
          border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', fontSize: '80px', opacity: 0.1 }}>💎</div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 8px 0' }}>UNCLAIMED BONUSES</p>
            <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#fbbf24', margin: '0 0 12px 0' }}>
              {formatCurrency(stats.total_unclaimed)}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>
              From {stats.unclaimed_count} referral{stats.unclaimed_count !== 1 ? 's' : ''}
            </p>
            <button
              onClick={handleClaimAll}
              disabled={claiming}
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                color: '#000',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: claiming ? 'not-allowed' : 'pointer',
                opacity: claiming ? 0.7 : 1,
                width: '100%',
                maxWidth: '300px'
              }}
            >
              {claiming ? '⏳ Claiming...' : '💰 CLAIM ALL TO INCOME WALLET'}
            </button>
          </div>
        </div>
      )}

      {/* Empty State - No Bonuses Yet */}
      {stats.unclaimed_count === 0 && stats.claimed_count === 0 && (
        <>
          {/* Direct Referrals Info Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))',
            border: '2px solid rgba(251,191,36,0.5)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <span style={{ fontSize: '40px', flexShrink: 0 }}>📊</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#fbbf24', fontSize: '18px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
                  Your Direct Referrals Status
                </h3>
                
                <div style={{ 
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: '1px solid rgba(251,191,36,0.3)'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 6px 0' }}>TOTAL DIRECT REFERRALS</p>
                    <p style={{ color: '#fff', fontSize: '36px', fontWeight: 'bold', margin: 0 }}>
                      {stats.direct_referrals}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: '6px 0 0 0' }}>
                      People who signed up using your link
                    </p>
                  </div>

                  {stats.direct_referrals > 0 && (
                    <div style={{
                      background: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '10px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <p style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
                        ⚠️ None have invested yet
                      </p>
                      <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                        Bonuses only appear when referrals make their first investment
                      </p>
                    </div>
                  )}
                </div>

                <div style={{
                  background: 'rgba(251,191,36,0.1)',
                  borderRadius: '10px',
                  padding: '12px'
                }}>
                  <p style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
                    💡 Important:
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                    <strong style={{ color: '#fff' }}>Direct Referrals</strong> = People who signed up with YOUR link<br/>
                    <strong style={{ color: '#fff' }}>Binary Tree</strong> = Your entire network (includes spillover members)<br/>
                    Only DIRECT referrals earn you referral bonuses!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(74,144,226,0.15), rgba(74,144,226,0.05))',
            border: '1px solid rgba(74,144,226,0.3)',
            borderRadius: '16px',
            padding: '32px 24px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>🎁</span>
            <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
              No Referral Bonuses Yet
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 8px 0' }}>
              You have <strong style={{ color: '#4a90e2' }}>{stats.direct_referrals} direct referral{stats.direct_referrals !== 1 ? 's' : ''}</strong>
            </p>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px 0' }}>
              Bonuses will appear here when your referrals make their first investment!
            </p>
            <div style={{
              background: 'rgba(251,191,36,0.1)',
              border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginTop: '20px'
            }}>
              <p style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
                💡 How to Earn Bonuses:
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, textAlign: 'left' }}>
                1️⃣ Share your referral link with friends<br />
                2️⃣ When they sign up and invest, you earn a bonus!<br />
                3️⃣ First referral = 5%, then 6%, 7%, 8%, 9%, max 10%<br />
                4️⃣ Claim bonuses to your INCOME wallet anytime
              </p>
            </div>
          </div>
        </>
      )}

      {/* Rate Progress */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          📊 Your Bonus Rate Progress
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
          Current Rate: <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '18px' }}>{stats.current_rate}%</span>
          {stats.next_referral_rate && (
            <span style={{ color: '#94a3b8' }}> → Next: <span style={{ color: '#fbbf24' }}>{stats.next_referral_rate}%</span></span>
          )}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {rateProgress.map(rate => (
            <div key={rate.referral_number} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: rate.is_unlocked ? 'rgba(16,185,129,0.1)' : 'rgba(74,144,226,0.05)',
              border: `1px solid ${rate.is_unlocked ? 'rgba(16,185,129,0.3)' : 'rgba(74,144,226,0.2)'}`,
              borderRadius: '10px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '24px' }}>{rate.is_unlocked ? '✅' : '🔒'}</span>
              <div style={{ flex: '1 1 150px' }}>
                <p style={{ color: rate.is_unlocked ? '#10b981' : '#94a3b8', fontSize: '14px', fontWeight: '600', margin: 0 }}>
                  {rate.referral_number === 6 ? '6+ Referrals' : `${rate.referral_number}${rate.referral_number === 1 ? 'st' : rate.referral_number === 2 ? 'nd' : rate.referral_number === 3 ? 'rd' : 'th'} Referral`}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                  {rate.percentage}% bonus
                </p>
              </div>
            </div>
          ))}
        </div>
        {stats.next_referral_rate && (
          <p style={{ color: '#fbbf24', fontSize: '13px', marginTop: '16px', textAlign: 'center', fontWeight: '600' }}>
            🚀 Invite 1 more friend to unlock {stats.next_referral_rate}% rate!
          </p>
        )}
      </div>

      {/* Pending Claims */}
      {pendingBonuses.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            🎯 Pending Claims
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingBonuses.map(bonus => (
              <div key={bonus.id} style={{
                background: 'rgba(251,191,36,0.05)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: '#fff', fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0' }}>
                    👤 {bonus.referral_username} {bonus.referral_name && `(${bonus.referral_name})`}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 8px 0' }}>
                    Your {bonus.referral_number === 6 ? '6+' : bonus.referral_number === 1 ? '1st' : bonus.referral_number === 2 ? '2nd' : bonus.referral_number === 3 ? '3rd' : `${bonus.referral_number}th`} Referral • {bonus.created_at}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                    Invested: {formatCurrency(bonus.investment_amount)} → Bonus: {formatCurrency(bonus.bonus_amount)} ({bonus.bonus_percentage}%)
                  </p>
                </div>
                <button
                  onClick={() => handleClaimBonus(bonus.id, bonus.bonus_amount, bonus.referral_username)}
                  disabled={claiming}
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    color: '#000',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: claiming ? 'not-allowed' : 'pointer',
                    opacity: claiming ? 0.7 : 1,
                    width: '100%'
                  }}
                >
                  💰 Claim {formatCurrency(bonus.bonus_amount)}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claimed History */}
      {claimedBonuses.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            ✅ Claimed History
          </h3>
          <p style={{ color: '#10b981', fontSize: '14px', fontWeight: '600', marginBottom: '20px' }}>
            Total Claimed: {formatCurrency(stats.total_claimed)}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {claimedBonuses.slice(0, 10).map(bonus => (
              <div key={bonus.id} style={{
                background: 'rgba(16,185,129,0.05)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: '1 1 180px' }}>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
                    {bonus.referral_username}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                    Investment: {formatCurrency(bonus.investment_amount)} • {bonus.claimed_at}
                  </p>
                </div>
                <p style={{ color: '#10b981', fontSize: '15px', fontWeight: 'bold', margin: 0 }}>
                  {formatCurrency(bonus.bonus_amount)} ({bonus.bonus_percentage}%)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div style={{
        background: 'rgba(74,144,226,0.05)',
        border: '1px solid rgba(74,144,226,0.2)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h4 style={{ color: '#4a90e2', fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0' }}>
          ℹ️ How It Works
        </h4>
        <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 8px 0' }}>ONE-TIME BONUS when your direct referral invests:</p>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>1st Referral: 5% of investment</li>
            <li>2nd Referral: 6% of investment</li>
            <li>3rd Referral: 7% of investment</li>
            <li>4th Referral: 8% of investment</li>
            <li>5th Referral: 9% of investment</li>
            <li>6+ Referrals: 10% of investment (MAX!)</li>
          </ul>
          <p style={{ margin: '8px 0 0 0' }}>
            ✅ Bonus available when referral makes investment<br />
            💰 Claim manually to INCOME WALLET<br />
            🎯 More referrals = Higher bonus rate forever!
          </p>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && successData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          animation: 'fadeIn 0.3s'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '2px solid rgba(16,185,129,0.5)',
            borderRadius: '20px',
            padding: '40px 30px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            animation: 'scaleIn 0.3s'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'bounce 0.6s' }}>✅</div>
            <h2 style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
              SUCCESS!
            </h2>
            <p style={{ color: '#fff', fontSize: '16px', margin: '0 0 8px 0' }}>
              Referral Bonus Claimed
            </p>
            <p style={{ color: '#fbbf24', fontSize: '32px', fontWeight: 'bold', margin: '16px 0' }}>
              {formatCurrency(successData.amount)}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 16px 0' }}>
              Credited to INCOME WALLET
            </p>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>
              From: {successData.referralUsername}
            </p>
            {successData.newBalance && (
              <p style={{ color: '#10b981', fontSize: '14px', fontWeight: '600', margin: '8px 0 0 0' }}>
                New Income Balance: {formatCurrency(successData.newBalance)}
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

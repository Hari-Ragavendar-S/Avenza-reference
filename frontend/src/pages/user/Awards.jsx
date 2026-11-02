import { useState, useEffect } from 'react'

export default function Awards() {
  const [tiers, setTiers] = useState([])
  const [userStats, setUserStats] = useState(null)
  const [claimedTiers, setClaimedTiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    fetchTiers()
    fetchUserStats()
    fetchClaims()
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchTiers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://avenza.live/api/binary/tiers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('🏆 Fetching tiers, status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🏆 Tiers response:', data)
        setTiers(data.tiers || [])
        console.log('🏆 Tiers set:', data.tiers?.length || 0, 'tiers')
      } else {
        console.error('❌ Failed to fetch tiers, status:', response.status)
      }
    } catch (error) {
      console.error('❌ Error fetching tiers:', error)
    }
  }

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://avenza.live/api/binary/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserStats(data.statistics)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClaims = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://avenza.live/api/binary/claims', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setClaimedTiers(data.claims?.map(c => c.tier_level) || [])
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
    }
  }

  const handleClaim = async (tierLevel) => {
    setClaiming(tierLevel)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://avenza.live/api/binary/claim/${tierLevel}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(`🎉 ${data.message}\n\nYou earned: $${data.bonus_earned}${data.prize_name ? '\nPrize: ' + data.prize_name : ''}`)
        fetchClaims()
        fetchUserStats()
      } else {
        alert(data.detail || 'Failed to claim reward')
      }
    } catch (error) {
      console.error('Error claiming reward:', error)
      alert('Failed to claim reward')
    } finally {
      setClaiming(null)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const currentMatched = userStats?.total_matched || 0

  // Find next tier to unlock
  const nextTier = tiers.find(t => currentMatched < t.required_match)
  const nextTierProgress = nextTier 
    ? Math.min(100, (currentMatched / nextTier.required_match) * 100)
    : 100

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
    )
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,146,60,0.1))',
        border: '1px solid rgba(251,191,36,0.3)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '48px' }}>🏆</span>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#fff',
              margin: '0 0 4px 0'
            }}>
              Awards & Rewards Tiers
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
              Unlock cash bonuses and exclusive prizes as your matched volume grows
            </p>
          </div>
        </div>

        {/* Current Progress */}
        <div style={{
          background: 'rgba(251,191,36,0.1)',
          border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginTop: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
              Current Matched
            </p>
            <p style={{ color: '#fbbf24', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              {formatCurrency(currentMatched)}
            </p>
          </div>

          {/* Progress to Next Tier */}
          {nextTier && (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                  Progress to Level {nextTier.level}
                </p>
                <p style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 'bold', margin: 0 }}>
                  {nextTierProgress.toFixed(1)}%
                </p>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(100,116,139,0.3)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${nextTierProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <p style={{ color: '#64748b', fontSize: '11px', margin: '8px 0 0 0' }}>
                {formatCurrency(nextTier.required_match - currentMatched)} more to unlock Level {nextTier.level}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(74,144,226,0.1), rgba(147,51,234,0.05))',
        border: '1px solid rgba(74,144,226,0.2)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{
          color: '#4a90e2',
          fontSize: '18px',
          fontWeight: '600',
          margin: '0 0 16px 0'
        }}>
          💡 How Matching Bonus Works
        </h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {[
            '1️⃣ Your team generates business volume on both LEFT and RIGHT legs',
            '2️⃣ System calculates matched volume (minimum of left and right)',
            '3️⃣ When matched volume crosses a tier threshold, you can claim the bonus',
            '4️⃣ Unmatched volume carries forward to help unlock future tiers'
          ].map((step, idx) => (
            <p key={idx} style={{
              color: '#94a3b8',
              fontSize: '14px',
              margin: 0,
              padding: '12px',
              background: 'rgba(74,144,226,0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(74,144,226,0.1)'
            }}>
              {step}
            </p>
          ))}
        </div>
      </div>

      {/* Tiers Table */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '16px',
        padding: '24px',
        overflow: 'hidden'
      }}>
        <h3 style={{
          color: '#fff',
          fontSize: '20px',
          fontWeight: '600',
          margin: '0 0 20px 0'
        }}>
          Reward Tiers
        </h3>

        {tiers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#94a3b8'
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🏆</p>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No reward tiers available</p>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Tiers will appear here once configured by admin
            </p>
          </div>
        ) : (
          <>
        {/* Desktop Table */}
        <div style={{
          display: isMobile ? 'none' : 'block',
          overflowX: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(74,144,226,0.3)' }}>
                <th style={{
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: '600',
                  textAlign: 'left',
                  padding: '12px 16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Tier
                </th>
                <th style={{
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: '600',
                  textAlign: 'left',
                  padding: '12px 16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Required Match
                </th>
                <th style={{
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: '600',
                  textAlign: 'left',
                  padding: '12px 16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Cash Bonus
                </th>
                <th style={{
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: '600',
                  textAlign: 'left',
                  padding: '12px 16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Prize
                </th>
                <th style={{
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: '600',
                  textAlign: 'center',
                  padding: '12px 16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => {
                const isUnlocked = currentMatched >= tier.required_match
                const isClaimed = claimedTiers.includes(tier.level)
                const canClaim = isUnlocked && !isClaimed
                
                return (
                  <tr key={tier.level} style={{
                    borderBottom: '1px solid rgba(74,144,226,0.1)',
                    background: isClaimed ? 'rgba(16,185,129,0.05)' : isUnlocked ? 'rgba(251,191,36,0.05)' : 'transparent'
                  }}>
                    <td style={{
                      padding: '16px',
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>
                      Level {tier.level}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#4a90e2',
                      fontSize: '15px',
                      fontWeight: '600'
                    }}>
                      {formatCurrency(tier.required_match)}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#10b981',
                      fontSize: '15px',
                      fontWeight: '600'
                    }}>
                      {formatCurrency(tier.bonus_amount)}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: tier.prize_name ? '#fbbf24' : '#64748b',
                      fontSize: '14px'
                    }}>
                      {tier.prize_name || '-'}
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      {isClaimed ? (
                        <span style={{
                          background: 'rgba(16,185,129,0.2)',
                          color: '#10b981',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          ✅ Claimed
                        </span>
                      ) : canClaim ? (
                        <button
                          onClick={() => handleClaim(tier.level)}
                          disabled={claiming === tier.level}
                          style={{
                            background: claiming === tier.level ? '#64748b' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '20px',
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: claiming === tier.level ? 'not-allowed' : 'pointer',
                            opacity: claiming === tier.level ? 0.6 : 1
                          }}
                        >
                          {claiming === tier.level ? 'Claiming...' : '🎁 Claim Now'}
                        </button>
                      ) : (
                        <span style={{
                          background: 'rgba(100,116,139,0.2)',
                          color: '#64748b',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          🔒 Locked
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div style={{
          display: isMobile ? 'flex' : 'none',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {tiers.map((tier) => {
            const isUnlocked = currentMatched >= tier.required_match
            const isClaimed = claimedTiers.includes(tier.level)
            const canClaim = isUnlocked && !isClaimed
            
            return (
              <div key={tier.level} style={{
                background: isClaimed ? 'rgba(16,185,129,0.05)' : isUnlocked ? 'rgba(251,191,36,0.05)' : 'rgba(74,144,226,0.05)',
                border: `1px solid ${isClaimed ? 'rgba(16,185,129,0.3)' : isUnlocked ? 'rgba(251,191,36,0.3)' : 'rgba(74,144,226,0.2)'}`,
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <p style={{
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    Level {tier.level}
                  </p>
                  {isClaimed ? (
                    <span style={{
                      background: 'rgba(16,185,129,0.2)',
                      color: '#10b981',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      ✅ Claimed
                    </span>
                  ) : canClaim ? (
                    <button
                      onClick={() => handleClaim(tier.level)}
                      disabled={claiming === tier.level}
                      style={{
                        background: claiming === tier.level ? '#64748b' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: claiming === tier.level ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {claiming === tier.level ? '⏳' : '🎁 Claim'}
                    </button>
                  ) : (
                    <span style={{
                      background: 'rgba(100,116,139,0.2)',
                      color: '#64748b',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      🔒 Locked
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>
                      Required Match
                    </p>
                    <p style={{ color: '#4a90e2', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                      {formatCurrency(tier.required_match)}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>
                      Cash Bonus
                    </p>
                    <p style={{ color: '#10b981', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                      {formatCurrency(tier.bonus_amount)}
                    </p>
                  </div>
                  {tier.prize_name && (
                    <div>
                      <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>
                        Prize
                      </p>
                      <p style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '600', margin: 0 }}>
                        {tier.prize_name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </>
        )}
      </div>
    </div>
  )
}

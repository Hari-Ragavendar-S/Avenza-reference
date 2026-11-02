import { useState, useEffect } from 'react'

export default function MatchingTiers() {
  const [loading, setLoading] = useState(true)
  const [tiersData, setTiersData] = useState(null)

  useEffect(() => {
    fetchTiers()
  }, [])

  const fetchTiers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://avenza.live/api/binary/tiers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setTiersData(data)
      }
    } catch (err) {
      console.error('Error fetching tiers:', err)
    } finally {
      setLoading(false)
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

  const getTierColor = (level) => {
    const colors = {
      1: { bg: 'rgba(120,119,198,0.1)', border: 'rgba(120,119,198,0.3)', text: '#7877c6' },
      2: { bg: 'rgba(192,192,192,0.1)', border: 'rgba(192,192,192,0.3)', text: '#c0c0c0' },
      3: { bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.3)', text: '#ffd700' },
      4: { bg: 'rgba(74,144,226,0.1)', border: 'rgba(74,144,226,0.3)', text: '#4a90e2' },
      5: { bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.3)', text: '#eab308' },
      6: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', text: '#a855f7' },
      7: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
      8: { bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.3)', text: '#f43f5e' },
      9: { bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.3)', text: '#fb923c' },
      10: { bg: 'rgba(234,88,12,0.1)', border: 'rgba(234,88,12,0.3)', text: '#ea580c' }
    }
    return colors[level] || colors[1]
  }

  const getTierIcon = (level) => {
    const icons = {
      1: '🥉', 2: '🥈', 3: '🥇', 4: '💎', 5: '👑',
      6: '🌟', 7: '⭐', 8: '✨', 9: '🔥', 10: '🏆'
    }
    return icons[level] || '🎯'
  }

  const getTierName = (level) => {
    const names = {
      1: 'Bronze', 2: 'Silver', 3: 'Gold', 4: 'Diamond', 5: 'Crown',
      6: 'Star', 7: 'Elite', 8: 'Master', 9: 'Legend', 10: 'Champion'
    }
    return names[level] || 'Tier'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>Loading matching tiers...</p>
      </div>
    )
  }

  if (!tiersData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '16px' }}>Failed to load tiers</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.1))',
        border: '1px solid rgba(234,179,8,0.3)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '24px'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: '0 0 8px 0' }}>
          🏆 Awards & Rewards Tiers
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 16px 0' }}>
          Unlock cash bonuses and exclusive prizes as your matched volume grows
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div style={{
            background: 'rgba(234,179,8,0.2)',
            border: '1px solid rgba(234,179,8,0.4)',
            borderRadius: '12px',
            padding: '12px 16px'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>Current Matched</p>
            <p style={{ color: '#eab308', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              {formatCurrency(tiersData.current_matched)}
            </p>
          </div>
          {tiersData.next_tier_level && (
            <div style={{
              background: 'rgba(74,144,226,0.2)',
              border: '1px solid rgba(74,144,226,0.4)',
              borderRadius: '12px',
              padding: '12px 16px'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>Next Tier Bonus</p>
              <p style={{ color: '#4a90e2', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                {formatCurrency(tiersData.next_tier_bonus)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tiers Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {tiersData.tiers.map(tier => {
          const colors = getTierColor(tier.level)
          const isUnlocked = tier.is_claimed
          const isInProgress = tier.progress_percentage > 0 && !tier.is_claimed
          
          return (
            <div key={tier.level} style={{
              background: `linear-gradient(135deg, ${colors.bg}, rgba(15,23,42,0.5))`,
              border: `2px solid ${isUnlocked ? colors.border : 'rgba(74,144,226,0.2)'}`,
              borderRadius: '16px',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              opacity: isUnlocked ? 0.7 : 1
            }}>
              {/* Background decoration */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                fontSize: '150px',
                opacity: 0.05
              }}>
                {getTierIcon(tier.level)}
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '48px' }}>{getTierIcon(tier.level)}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{ color: colors.text, fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                          Level {tier.level}
                        </h3>
                        {isUnlocked && (
                          <span style={{
                            background: 'rgba(16,185,129,0.2)',
                            color: '#10b981',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            ✓ UNLOCKED
                          </span>
                        )}
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0 }}>
                        {getTierName(tier.level)} Tier
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
                      {isUnlocked ? 'Claimed' : 'Reward'}
                    </p>
                    <p style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
                      +{formatCurrency(tier.bonus_amount)}
                    </p>
                  </div>
                </div>

                {/* Requirements */}
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Required Match</p>
                      <p style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                        {formatCurrency(tier.required_match)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
                        {isUnlocked ? 'Unlocked On' : 'Progress'}
                      </p>
                      {isUnlocked ? (
                        <p style={{ color: colors.text, fontSize: '14px', fontWeight: '600', margin: 0 }}>
                          {tier.claimed_at}
                        </p>
                      ) : (
                        <p style={{ color: colors.text, fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                          {tier.progress_percentage.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Physical Prize Display for Tier 11 (BMW) and Tier 12 (Villa) */}
                {tier.prize_type && tier.prize_type !== 'cash' && (
                  <div style={{
                    background: isUnlocked ? 'rgba(16,185,129,0.1)' : 'rgba(74,144,226,0.1)',
                    border: `2px solid ${isUnlocked ? 'rgba(16,185,129,0.3)' : 'rgba(74,144,226,0.3)'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    <p style={{ color: '#eab308', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                      🎁 EXCLUSIVE PRIZE
                    </p>
                    {tier.prize_image_url && (
                      <div style={{
                        width: '100%',
                        height: '200px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '12px',
                        filter: isUnlocked ? 'none' : 'grayscale(100%) blur(2px)',
                        opacity: isUnlocked ? 1 : 0.6
                      }}>
                        <img 
                          src={tier.prize_image_url} 
                          alt={tier.prize_name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '24px' }}>
                        {tier.prize_type === 'vehicle' ? '🚗' : '🏡'}
                      </span>
                      <p style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                        {tier.prize_name}
                      </p>
                    </div>
                    {tier.prize_description && (
                      <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 12px 0' }}>
                        {tier.prize_description}
                      </p>
                    )}
                    {isUnlocked && (
                      <button
                        style={{
                          width: '100%',
                          background: tier.prize_claimed 
                            ? 'rgba(16,185,129,0.2)' 
                            : 'linear-gradient(135deg, #eab308, #ca8a04)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px',
                          color: tier.prize_claimed ? '#10b981' : '#fff',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: tier.prize_claimed ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                        disabled={tier.prize_claimed}
                      >
                        {tier.prize_claimed ? (
                          <>✓ Prize Claimed {tier.prize_claim_date && `on ${tier.prize_claim_date}`}</>
                        ) : (
                          <>🎉 Claim Your {tier.prize_type === 'vehicle' ? 'BMW' : 'Villa'}</>
                        )}
                      </button>
                    )}
                    {!isUnlocked && (
                      <div style={{
                        padding: '8px 12px',
                        background: 'rgba(74,144,226,0.1)',
                        borderRadius: '6px'
                      }}>
                        <p style={{ color: '#4a90e2', fontSize: '12px', margin: 0 }}>
                          🔒 Unlock this tier to claim your {tier.prize_name}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Bar */}
                {!isUnlocked && (
                  <div>
                    <div style={{
                      width: '100%',
                      height: '12px',
                      background: 'rgba(74,144,226,0.1)',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        width: `${Math.min(tier.progress_percentage, 100)}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${colors.text}, #10b981)`,
                        borderRadius: '6px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                        {formatCurrency(tiersData.current_matched)} matched
                      </p>
                      <p style={{ color: colors.text, fontSize: '12px', fontWeight: '600', margin: 0 }}>
                        {formatCurrency(tier.required_match - tiersData.current_matched)} more needed
                      </p>
                    </div>
                  </div>
                )}

                {/* Info Box */}
                {isInProgress && !isUnlocked && tier.progress_percentage >= 50 && (
                  <div style={{
                    marginTop: '16px',
                    background: 'rgba(234,179,8,0.1)',
                    border: '1px solid rgba(234,179,8,0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '20px' }}>🔥</span>
                    <p style={{ color: '#eab308', fontSize: '13px', margin: 0 }}>
                      You're halfway there! Keep growing your team to unlock this tier.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Info Section */}
      <div style={{
        marginTop: '24px',
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '16px',
        padding: '24px'
      }}>
        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          💡 How Matching Bonus Works
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: '#4a90e2', fontSize: '20px' }}>1️⃣</span>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              Your team generates business volume on both <strong style={{ color: '#10b981' }}>LEFT</strong> and <strong style={{ color: '#4a90e2' }}>RIGHT</strong> legs
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: '#10b981', fontSize: '20px' }}>2️⃣</span>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              System calculates <strong style={{ color: '#fff' }}>matched volume</strong> (minimum of left and right)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: '#eab308', fontSize: '20px' }}>3️⃣</span>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              When matched volume crosses a tier threshold, you <strong style={{ color: '#10b981' }}>instantly earn the bonus</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: '#a855f7', fontSize: '20px' }}>4️⃣</span>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              Unmatched volume <strong style={{ color: '#fff' }}>carries forward</strong> to help unlock future tiers
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

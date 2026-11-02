import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function BinaryMatching() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const [copiedLink, setCopiedLink] = useState('')

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://avenza.live/api/binary/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setDashboard(data)
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(type)
    setShowCopySuccess(true)
    setTimeout(() => {
      setShowCopySuccess(false)
      setCopiedLink('')
    }, 2000)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  const getTierIcon = (level) => {
    const icons = {
      1: '🥉', 2: '🥈', 3: '🥇', 4: '💎', 5: '👑',
      6: '🌟', 7: '⭐', 8: '✨', 9: '🔥', 10: '🏆'
    }
    return icons[level] || '🎯'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>Loading binary matching data...</p>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '16px' }}>Failed to load dashboard</p>
      </div>
    )
  }

  const stats = dashboard.statistics
  const referralLinks = {
    left: `https://avenza.live/${JSON.parse(localStorage.getItem('user') || '{}').username}/left`,
    right: `https://avenza.live/${JSON.parse(localStorage.getItem('user') || '{}').username}/right`
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(74,144,226,0.2), rgba(147,51,234,0.1))',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '24px'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: '0 0 8px 0' }}>
          🏆 Awards & Rewards
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
          Earn cash bonuses and exclusive prizes when your left and right team volumes match
        </p>
      </div>

      {/* HOW MATCHING BONUS WORKS - Explanation Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.05))',
        border: '2px solid rgba(234,179,8,0.5)',
        borderRadius: '16px',
        padding: window.innerWidth < 768 ? '16px' : '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: window.innerWidth < 768 ? '12px' : '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: window.innerWidth < 768 ? '32px' : '40px', flexShrink: 0 }}>💡</span>
          <div style={{ flex: 1, minWidth: window.innerWidth < 768 ? '200px' : '300px' }}>
            <h3 style={{ color: '#eab308', fontSize: window.innerWidth < 768 ? '16px' : '18px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
              How Binary Matching Bonus Works
            </h3>
            
            {/* Visual Diagram */}
            <div style={{ 
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              padding: window.innerWidth < 768 ? '12px' : '20px',
              marginBottom: '16px',
              border: '1px solid rgba(234,179,8,0.3)',
              overflowX: 'auto'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr auto 1fr', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                {/* Left Leg */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    background: 'rgba(16,185,129,0.2)',
                    border: '2px solid rgba(16,185,129,0.5)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '8px'
                  }}>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 8px 0' }}>👈 LEFT LEG</p>
                    <p style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                      {formatCurrency(stats.total_left_business)}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                      {stats.total_left_team} members
                    </p>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                    Pending: {formatCurrency(stats.pending_left)}
                  </p>
                </div>

                {/* Match Arrow */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    background: 'rgba(234,179,8,0.2)',
                    border: '2px solid rgba(234,179,8,0.5)',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px'
                  }}>
                    <span style={{ fontSize: '28px' }}>⚖️</span>
                  </div>
                  <p style={{ color: '#eab308', fontSize: '11px', fontWeight: 'bold', margin: 0 }}>
                    MATCH
                  </p>
                </div>

                {/* Right Leg */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    background: 'rgba(74,144,226,0.2)',
                    border: '2px solid rgba(74,144,226,0.5)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '8px'
                  }}>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 8px 0' }}>RIGHT LEG 👉</p>
                    <p style={{ color: '#4a90e2', fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                      {formatCurrency(stats.total_right_business)}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                      {stats.total_right_team} members
                    </p>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                    Pending: {formatCurrency(stats.pending_right)}
                  </p>
                </div>
              </div>

              {/* Match Result */}
              <div style={{
                background: 'rgba(234,179,8,0.15)',
                border: '1px solid rgba(234,179,8,0.3)',
                borderRadius: '10px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 8px 0' }}>💎 TOTAL MATCHED SO FAR</p>
                <p style={{ color: '#eab308', fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                  {formatCurrency(stats.total_matched)}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                  Earning you: <strong style={{ color: '#10b981' }}>{formatCurrency(stats.matching_bonus_earned)}</strong> in bonuses
                </p>
              </div>
            </div>

            {/* Key Points */}
            <div style={{
              background: 'rgba(234,179,8,0.1)',
              borderRadius: '10px',
              padding: '16px'
            }}>
              <p style={{ color: '#eab308', fontSize: '13px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                🔑 HOW IT WORKS:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#eab308', fontSize: '16px' }}>1️⃣</span>
                  <p style={{ color: '#fff', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                    <strong>Build BOTH Legs:</strong> Recruit and help your team invest on both left and right sides
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#eab308', fontSize: '16px' }}>2️⃣</span>
                  <p style={{ color: '#fff', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                    <strong>Matching Calculation:</strong> The SMALLER leg determines your match (e.g., Left $1000 + Right $800 = $800 matched)
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#eab308', fontSize: '16px' }}>3️⃣</span>
                  <p style={{ color: '#fff', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                    <strong>Earn Bonus:</strong> When you reach tier milestones (e.g., $2000 matched → earn $200 bonus), cash is paid instantly!
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#eab308', fontSize: '16px' }}>4️⃣</span>
                  <p style={{ color: '#fff', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                    <strong>Balanced Growth:</strong> Focus on building BOTH legs equally - your weaker leg is always your bottleneck
                  </p>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth < 768 ? '1fr 1fr' : 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              marginTop: '16px'
            }}>
              <div style={{
                background: 'rgba(74,144,226,0.1)',
                border: '1px solid rgba(74,144,226,0.3)',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>WEAKER LEG</p>
                <p style={{ color: stats.total_left_business < stats.total_right_business ? '#10b981' : '#4a90e2', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                  {stats.total_left_business < stats.total_right_business ? 'Left' : 'Right'}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '10px', margin: '4px 0 0 0' }}>
                  Focus here!
                </p>
              </div>

              <div style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>BALANCE</p>
                <p style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                  {((Math.min(stats.total_left_business, stats.total_right_business) / Math.max(stats.total_left_business, stats.total_right_business)) * 100 || 0).toFixed(0)}%
                </p>
                <p style={{ color: '#94a3b8', fontSize: '10px', margin: '4px 0 0 0' }}>
                  Leg balance
                </p>
              </div>

              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>PENDING</p>
                <p style={{ color: '#ef4444', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                  {formatCurrency(stats.pending_left + stats.pending_right)}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '10px', margin: '4px 0 0 0' }}>
                  Not matched yet
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Left Business */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '32px' }}>👈</span>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>LEFT LEG</p>
              <p style={{ color: '#10b981', fontSize: '12px', margin: 0 }}>
                {stats.total_left_team} members ({stats.active_left_team} active)
              </p>
            </div>
          </div>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0' }}>
            {formatCurrency(stats.total_left_business)}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
            Pending: {formatCurrency(stats.pending_left)}
          </p>
        </div>

        {/* Right Business */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(74,144,226,0.15), rgba(74,144,226,0.05))',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '32px' }}>👉</span>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>RIGHT LEG</p>
              <p style={{ color: '#4a90e2', fontSize: '12px', margin: 0 }}>
                {stats.total_right_team} members ({stats.active_right_team} active)
              </p>
            </div>
          </div>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0' }}>
            {formatCurrency(stats.total_right_business)}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
            Pending: {formatCurrency(stats.pending_right)}
          </p>
        </div>

        {/* Total Matched */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '32px' }}>💎</span>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>TOTAL MATCHED</p>
              <p style={{ color: '#a855f7', fontSize: '12px', margin: 0 }}>Cumulative Volume</p>
            </div>
          </div>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
            {formatCurrency(stats.total_matched)}
          </p>
        </div>

        {/* Bonus Earned */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))',
          border: '1px solid rgba(234,179,8,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '32px' }}>🏆</span>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>BONUS EARNED</p>
              <p style={{ color: '#eab308', fontSize: '12px', margin: 0 }}>Total Matching Bonus</p>
            </div>
          </div>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#eab308', margin: 0 }}>
            {formatCurrency(stats.matching_bonus_earned)}
          </p>
        </div>
      </div>

      {/* Next Milestone */}
      {dashboard.next_milestone && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))',
          border: '1px solid rgba(234,179,8,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎯 Next Milestone
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Target Match</p>
              <p style={{ color: '#eab308', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                {formatCurrency(dashboard.next_milestone.required_match)}
              </p>
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Bonus Reward</p>
              <p style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                {formatCurrency(dashboard.next_milestone.bonus_amount)}
              </p>
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Remaining</p>
              <p style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                {formatCurrency(dashboard.next_milestone.remaining)}
              </p>
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Progress</p>
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  width: '100%',
                  height: '12px',
                  background: 'rgba(74,144,226,0.1)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  marginBottom: '4px'
                }}>
                  <div style={{
                    width: `${dashboard.next_milestone.progress_percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981, #eab308)',
                    borderRadius: '6px'
                  }} />
                </div>
                <p style={{ color: '#eab308', fontSize: '14px', fontWeight: '600', margin: 0 }}>
                  {dashboard.next_milestone.progress_percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/binary-tree')}
          style={{
            background: 'linear-gradient(135deg, #4a90e2, #357abd)',
            border: 'none',
            borderRadius: '12px',
            padding: '16px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>🌳</span>
          View Binary Tree
        </button>

        <button
          onClick={() => navigate('/matching-tiers')}
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            borderRadius: '12px',
            padding: '16px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>🏆</span>
          View All Tiers
        </button>

        <button
          onClick={() => navigate('/matching-history')}
          style={{
            background: 'linear-gradient(135deg, #a855f7, #9333ea)',
            border: 'none',
            borderRadius: '12px',
            padding: '16px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>📜</span>
          View History
        </button>
      </div>

      {/* Available Tiers Preview */}
      {dashboard.available_tiers && dashboard.available_tiers.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
            🎯 Available Tiers
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dashboard.available_tiers.slice(0, 3).map(tier => (
              <div key={tier.level} style={{
                background: 'rgba(74,144,226,0.05)',
                border: '1px solid rgba(74,144,226,0.2)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>{getTierIcon(tier.level)}</span>
                    <div>
                      <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                        Level {tier.level}
                      </p>
                      <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                        Match {formatCurrency(tier.required_match)} → Earn {formatCurrency(tier.bonus_amount)}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#4a90e2', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                      {tier.progress_percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(74,144,226,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${tier.progress_percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #4a90e2, #10b981)',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            ))}
          </div>
          {dashboard.available_tiers.length > 3 && (
            <button
              onClick={() => navigate('/matching-tiers')}
              style={{
                marginTop: '16px',
                width: '100%',
                background: 'transparent',
                border: '1px solid rgba(74,144,226,0.3)',
                borderRadius: '8px',
                padding: '12px',
                color: '#4a90e2',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              View All {dashboard.available_tiers.length} Tiers →
            </button>
          )}
        </div>
      )}

      {/* Recent Matches */}
      {dashboard.recent_matches && dashboard.recent_matches.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
            📊 Recent Matches
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(74,144,226,0.2)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>DATE</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>MATCHED</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>BONUS</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>LEVEL</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recent_matches.map(match => (
                  <tr key={match.id} style={{ borderBottom: '1px solid rgba(74,144,226,0.1)' }}>
                    <td style={{ padding: '12px', color: '#fff', fontSize: '14px' }}>{match.created_at}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#4a90e2', fontSize: '14px', fontWeight: '600' }}>
                      {formatCurrency(match.matched_amount)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                      +{formatCurrency(match.bonus_earned)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {match.level_achieved ? (
                        <span style={{
                          background: 'rgba(234,179,8,0.2)',
                          color: '#eab308',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          L{match.level_achieved}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => navigate('/matching-history')}
            style={{
              marginTop: '16px',
              width: '100%',
              background: 'transparent',
              border: '1px solid rgba(74,144,226,0.3)',
              borderRadius: '8px',
              padding: '12px',
              color: '#4a90e2',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            View Complete History →
          </button>
        </div>
      )}

      {/* Copy Success Toast */}
      {showCopySuccess && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease-out'
        }}>
          ✓ Link copied to clipboard!
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

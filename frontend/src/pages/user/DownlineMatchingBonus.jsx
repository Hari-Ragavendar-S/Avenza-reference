import { useState, useEffect } from 'react'

export default function DownlineMatchingBonus() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const perPage = 20

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (!loading) {
      fetchHistory()
    }
  }, [currentPage])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://avenza.live/api/downline-matching/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setHistory(data.recent_matches || [])
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://avenza.live/api/downline-matching/history?page=${currentPage}&per_page=${perPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setHistory(data.history)
        setTotalPages(data.total_pages)
      }
    } catch (err) {
      console.error('Error fetching history:', err)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  const getPackageName = (amount) => {
    const packages = {
      100: 'Bronze',
      300: 'Silver/Gold',
      1000: 'Platinum',
      3000: 'Diamond',
      5000: 'Elite'
    }
    return packages[parseFloat(amount)] || 'Package'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>Loading downline matching data...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '16px' }}>Failed to load data</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(147,51,234,0.1))',
        border: '1px solid rgba(168,85,247,0.3)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '24px'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: '0 0 8px 0' }}>
          💎 Downline Matching Bonus
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
          Earn bonuses when anyone in your downline makes a binary match
        </p>
      </div>

      {/* Your Package Info */}
      {stats.lowest_package_amount && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            📦 Your Highest Active Package
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Highest Package</p>
              <p style={{ color: '#a855f7', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                {formatCurrency(stats.lowest_package_amount)} {getPackageName(stats.lowest_package_amount)}
              </p>
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Your Bonus Rate</p>
              <p style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                {stats.bonus_percentage}%
              </p>
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Daily Limit</p>
              <p style={{ color: '#eab308', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                $220
              </p>
            </div>
          </div>
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(168,85,247,0.1)',
            borderRadius: '8px'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
              💡 You earn <strong style={{ color: '#a855f7' }}>{stats.bonus_percentage}%</strong> on every downline match, capped at <strong style={{ color: '#eab308' }}>$220 per day</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Total Earned</p>
          <p style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            {formatCurrency(stats.total_earned)}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(74,144,226,0.15), rgba(74,144,226,0.05))',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Total Matches</p>
          <p style={{ color: '#4a90e2', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            {stats.total_matches}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))',
          border: '1px solid rgba(234,179,8,0.3)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Average Per Match</p>
          <p style={{ color: '#eab308', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            {formatCurrency(stats.average_per_match)}
          </p>
        </div>
      </div>

      {/* Recent Matches */}
      {history.length > 0 ? (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
            📊 {currentPage === 1 ? 'Recent Matches' : 'Match History'}
          </h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(74,144,226,0.2)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>DATE</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>USER</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>MATCH</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>YOUR %</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>CALCULATED</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>YOU GOT</th>
                </tr>
              </thead>
              <tbody>
                {history.map(match => (
                  <tr key={match.id} style={{ borderBottom: '1px solid rgba(74,144,226,0.1)' }}>
                    <td style={{ padding: '12px', color: '#94a3b8', fontSize: '13px' }}>
                      {match.created_at}
                    </td>
                    <td style={{ padding: '12px', color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                      @{match.downline_username}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#4a90e2', fontSize: '14px', fontWeight: '600' }}>
                      {formatCurrency(match.match_amount)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        background: 'rgba(168,85,247,0.2)',
                        color: '#a855f7',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {match.bonus_percentage}%
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: '14px' }}>
                      {formatCurrency(match.calculated_bonus)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                      +{formatCurrency(match.user_received)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  background: currentPage === 1 ? 'rgba(74,144,226,0.1)' : 'rgba(74,144,226,0.2)',
                  border: '1px solid rgba(74,144,226,0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: currentPage === 1 ? '#64748b' : '#4a90e2',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Previous
              </button>

              <span style={{ color: '#94a3b8', fontSize: '14px', padding: '0 12px' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  background: currentPage === totalPages ? 'rgba(74,144,226,0.1)' : 'rgba(74,144,226,0.2)',
                  border: '1px solid rgba(74,144,226,0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: currentPage === totalPages ? '#64748b' : '#4a90e2',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>📊</span>
          <p style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No Downline Matches Yet
          </p>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            When your downline members make binary matches, you'll earn bonuses here
          </p>
        </div>
      )}

      {/* Info Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '16px',
        padding: '24px'
      }}>
        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          💡 How Downline Matching Bonus Works
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: '#4a90e2', fontSize: '20px' }}>1️⃣</span>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              Your bonus rate is based on your <strong style={{ color: '#fff' }}>highest active package</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: '#10b981', fontSize: '20px' }}>2️⃣</span>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              When <strong style={{ color: '#fff' }}>anyone in your downline</strong> makes a binary match, you earn a bonus
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: '#eab308', fontSize: '20px' }}>3️⃣</span>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              You receive maximum <strong style={{ color: '#eab308' }}>$220 per day</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: '#a855f7', fontSize: '20px' }}>4️⃣</span>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              Bonuses are <strong style={{ color: '#10b981' }}>instantly credited</strong> to your Income Wallet
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function MatchingHistory() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 20

  useEffect(() => {
    fetchHistory()
  }, [currentPage])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://avenza.live/api/binary/history?page=${currentPage}&per_page=${perPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (err) {
      console.error('Error fetching history:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  const getTierBadge = (level) => {
    if (!level) return null
    
    const colors = {
      1: '#7877c6', 2: '#c0c0c0', 3: '#ffd700', 4: '#4a90e2', 5: '#eab308',
      6: '#a855f7', 7: '#10b981', 8: '#f43f5e', 9: '#fb923c', 10: '#ea580c'
    }
    
    return (
      <span style={{
        background: `${colors[level]}20`,
        color: colors[level],
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        Level {level}
      </span>
    )
  }

  if (loading && !history) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>Loading history...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.1))',
        border: '1px solid rgba(168,85,247,0.3)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '24px'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: '0 0 8px 0' }}>
          📜 Awards & Rewards History
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
          Complete record of all your awards and bonuses earned
        </p>
      </div>

      {/* Statistics */}
      {history && history.total > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(74,144,226,0.15), rgba(74,144,226,0.05))',
            border: '1px solid rgba(74,144,226,0.3)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Total Records</p>
            <p style={{ color: '#4a90e2', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              {history.total}
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Total Bonuses</p>
            <p style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              {formatCurrency(history.history.reduce((sum, h) => sum + parseFloat(h.bonus_earned), 0))}
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))',
            border: '1px solid rgba(234,179,8,0.3)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Total Matched</p>
            <p style={{ color: '#eab308', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              {formatCurrency(history.history.reduce((sum, h) => sum + parseFloat(h.matched_amount), 0))}
            </p>
          </div>
        </div>
      )}

      {/* History Table */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        overflowX: 'auto'
      }}>
        {!history || history.history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>📊</span>
            <p style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              No Awards History Yet
            </p>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
              Start building your team to earn awards and bonuses
            </p>
            <button
              onClick={() => navigate('/binary-matching')}
              style={{
                background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div style={{ display: 'block' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(74,144,226,0.2)' }}>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>DATE</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>LEFT VOL.</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>RIGHT VOL.</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>MATCHED</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>BONUS</th>
                    <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>TIER</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>CARRY FWD</th>
                  </tr>
                </thead>
                <tbody>
                  {history.history.map(record => (
                    <tr key={record.id} style={{ borderBottom: '1px solid rgba(74,144,226,0.1)' }}>
                      <td style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>
                        {record.created_at}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                        {formatCurrency(record.left_volume)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', color: '#4a90e2', fontSize: '14px', fontWeight: '600' }}>
                        {formatCurrency(record.right_volume)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', color: '#a855f7', fontSize: '14px', fontWeight: '600' }}>
                        {formatCurrency(record.matched_amount)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', color: '#eab308', fontSize: '16px', fontWeight: 'bold' }}>
                        +{formatCurrency(record.bonus_earned)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {record.level_achieved ? getTierBadge(record.level_achieved) : (
                          <span style={{ color: '#64748b', fontSize: '12px' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ fontSize: '12px' }}>
                          <div style={{ color: '#10b981', marginBottom: '2px' }}>
                            L: {formatCurrency(record.carry_forward_left)}
                          </div>
                          <div style={{ color: '#4a90e2' }}>
                            R: {formatCurrency(record.carry_forward_right)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {history.total_pages > 1 && (
              <div style={{
                marginTop: '24px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap'
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
                  Page {currentPage} of {history.total_pages}
                </span>

                <button
                  onClick={() => setCurrentPage(Math.min(history.total_pages, currentPage + 1))}
                  disabled={currentPage === history.total_pages}
                  style={{
                    background: currentPage === history.total_pages ? 'rgba(74,144,226,0.1)' : 'rgba(74,144,226,0.2)',
                    border: '1px solid rgba(74,144,226,0.3)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: currentPage === history.total_pages ? '#64748b' : '#4a90e2',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: currentPage === history.total_pages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/binary-matching')}
        style={{
          width: '100%',
          background: 'transparent',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '12px',
          padding: '16px',
          color: '#4a90e2',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        ← Back to Awards & Rewards Dashboard
      </button>
    </div>
  )
}

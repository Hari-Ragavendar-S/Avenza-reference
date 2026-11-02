import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MatchingHistoryDetailed() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [matchDetails, setMatchDetails] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatches, setTotalMatches] = useState(0);
  const perPage = 20;

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [currentPage]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://avenza.live/api/binary/history?page=${currentPage}&per_page=${perPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
        setTotalPages(data.total_pages || 1);
        setTotalMatches(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://avenza.live/api/binary/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchMatchDetails = async (historyId) => {
    if (matchDetails[historyId]) {
      setExpandedId(expandedId === historyId ? null : historyId);
      return;
    }

    setDetailsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://avenza.live/api/binary/history/${historyId}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMatchDetails(prev => ({ ...prev, [historyId]: data }));
        setExpandedId(historyId);
      }
    } catch (error) {
      console.error('Error fetching match details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const calculateMonthlyStats = () => {
    const months = {};
    history.forEach(match => {
      const date = new Date(match.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      
      if (!months[monthKey]) {
        months[monthKey] = { name: monthName, total: 0, count: 0 };
      }
      months[monthKey].total += parseFloat(match.bonus_earned);
      months[monthKey].count += 1;
    });
    
    return Object.values(months).slice(0, 4);
  };

  if (loading && currentPage === 1) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>Loading matching history...</p>
      </div>
    );
  }

  const monthlyStats = calculateMonthlyStats();
  const totalEarned = history.reduce((sum, match) => sum + parseFloat(match.bonus_earned), 0);
  const avgPerMatch = totalMatches > 0 ? totalEarned / totalMatches : 0;
  const bestMatch = history.length > 0 ? Math.max(...history.map(m => parseFloat(m.bonus_earned))) : 0;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button
            onClick={() => navigate('/binary-matching')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#4a90e2',
              fontSize: '24px',
              cursor: 'pointer',
              padding: 0
            }}
          >
            ←
          </button>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
            📜 Matching History
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, paddingLeft: '36px' }}>
          Complete record of your income from balanced matches
        </p>
      </div>

      {/* Lifetime Summary */}
      {stats && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            📊 Lifetime Summary
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{
              background: 'rgba(74,144,226,0.1)',
              border: '1px solid rgba(74,144,226,0.3)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>TOTAL MATCHES</p>
              <p style={{ color: '#4a90e2', fontSize: '32px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                {totalMatches}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>All time</p>
            </div>

            <div style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>TOTAL INCOME</p>
              <p style={{ color: '#10b981', fontSize: '32px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                {formatCurrency(stats.matching_bonus_earned)}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>All bonuses</p>
            </div>

            <div style={{
              background: 'rgba(234,179,8,0.1)',
              border: '1px solid rgba(234,179,8,0.3)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>AVERAGE PER MATCH</p>
              <p style={{ color: '#eab308', fontSize: '32px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                {formatCurrency(avgPerMatch)}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Avg income</p>
            </div>

            <div style={{
              background: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>BEST MATCH</p>
              <p style={{ color: '#a855f7', fontSize: '32px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                {formatCurrency(bestMatch)}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Highest</p>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Breakdown */}
      {monthlyStats.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            📈 Monthly Breakdown
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            {monthlyStats.map((month, index) => (
              <div key={index} style={{
                background: 'rgba(74,144,226,0.05)',
                border: '1px solid rgba(74,144,226,0.2)',
                borderRadius: '10px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#4a90e2', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
                  {month.name}
                </p>
                <p style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                  {formatCurrency(month.total)}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                  {month.count} matches
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Table */}
      {history.length > 0 ? (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 }}>
              📋 Matching History
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
              Showing {((currentPage - 1) * perPage) + 1}-{Math.min(currentPage * perPage, totalMatches)} of {totalMatches}
            </p>
          </div>

          {/* Desktop Table */}
          <div style={{ overflowX: 'auto', display: window.innerWidth >= 768 ? 'block' : 'none' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(74,144,226,0.3)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>DATE/TIME</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>LEFT SIDE</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>RIGHT SIDE</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>MATCHED</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>CARRY FWD</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>YOUR INCOME</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {history.map((match) => (
                  <>
                    <tr key={match.id} style={{ borderBottom: '1px solid rgba(74,144,226,0.1)' }}>
                      <td style={{ padding: '16px', color: '#fff', fontSize: '14px' }}>
                        {match.created_at}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                        {formatCurrency(match.left_volume)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', color: '#4a90e2', fontSize: '14px', fontWeight: '600' }}>
                        {formatCurrency(match.right_volume)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', color: '#eab308', fontSize: '14px', fontWeight: '600' }}>
                        {formatCurrency(match.matched_amount)}
                        {match.tier_name && (
                          <span style={{
                            display: 'block',
                            color: '#a855f7',
                            fontSize: '11px',
                            marginTop: '4px'
                          }}>
                            {match.tier_name}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                          <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '600' }}>
                            L: {formatCurrency(match.carry_forward_left)}
                          </span>
                          <span style={{ color: '#4a90e2', fontSize: '12px', fontWeight: '600' }}>
                            R: {formatCurrency(match.carry_forward_right)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold' }}>
                          +{formatCurrency(match.bonus_earned)}
                        </span>
                        <span style={{
                          display: 'block',
                          background: 'rgba(16,185,129,0.2)',
                          color: '#10b981',
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          marginTop: '4px',
                          textAlign: 'center'
                        }}>
                          ✅ Paid
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button
                          onClick={() => fetchMatchDetails(match.id)}
                          disabled={detailsLoading}
                          style={{
                            background: expandedId === match.id ? 'rgba(239,68,68,0.2)' : 'rgba(74,144,226,0.2)',
                            border: `1px solid ${expandedId === match.id ? 'rgba(239,68,68,0.5)' : 'rgba(74,144,226,0.5)'}`,
                            borderRadius: '8px',
                            padding: '8px 16px',
                            color: expandedId === match.id ? '#ef4444' : '#4a90e2',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: detailsLoading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {expandedId === match.id ? '▲ Close' : '👥 View Who'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    {expandedId === match.id && matchDetails[match.id] && (
                      <tr>
                        <td colSpan="7" style={{ padding: 0 }}>
                          <div style={{
                            background: 'rgba(74,144,226,0.05)',
                            border: '1px solid rgba(74,144,226,0.2)',
                            padding: '24px',
                            animation: 'slideDown 0.3s ease-out'
                          }}>
                            <MatchDetailView details={matchDetails[match.id]} formatCurrency={formatCurrency} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div style={{ display: window.innerWidth < 768 ? 'block' : 'none' }}>
            {history.map((match) => (
              <div key={match.id} style={{
                background: 'rgba(74,144,226,0.05)',
                border: '1px solid rgba(74,144,226,0.2)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>{match.created_at}</p>
                  <p style={{ color: '#eab308', fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                    {formatCurrency(match.matched_amount)} matched
                  </p>
                  <p style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                    +{formatCurrency(match.bonus_earned)} income
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>Carry Forward</p>
                      <p style={{ color: '#10b981', fontSize: '13px', fontWeight: '600', margin: '0 0 2px 0' }}>
                        L: {formatCurrency(match.carry_forward_left)}
                      </p>
                      <p style={{ color: '#4a90e2', fontSize: '13px', fontWeight: '600', margin: 0 }}>
                        R: {formatCurrency(match.carry_forward_right)}
                      </p>
                    </div>
                    {match.tier_name && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>Tier</p>
                        <span style={{
                          background: 'rgba(168,85,247,0.2)',
                          color: '#a855f7',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {match.tier_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => fetchMatchDetails(match.id)}
                  disabled={detailsLoading}
                  style={{
                    width: '100%',
                    background: expandedId === match.id ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg, #4a90e2, #357abd)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: detailsLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {expandedId === match.id ? '▲ Close Details' : '👥 See Who Contributed'}
                </button>

                {/* Mobile Expanded Details */}
                {expandedId === match.id && matchDetails[match.id] && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '10px',
                    border: '1px solid rgba(74,144,226,0.2)'
                  }}>
                    <MobileMatchDetailView details={matchDetails[match.id]} formatCurrency={formatCurrency} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid rgba(74,144,226,0.2)'
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
                ← Prev
              </button>

              <span style={{ color: '#94a3b8', fontSize: '14px' }}>
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
          <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>📜</span>
          <p style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No Matching History Yet
          </p>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px 0' }}>
            When your left and right sides match, your history will appear here
          </p>
          <button
            onClick={() => navigate('/binary-matching')}
            style={{
              background: 'linear-gradient(135deg, #4a90e2, #357abd)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Build Your Binary Tree →
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// Desktop Detail View Component
function MatchDetailView({ details, formatCurrency }) {
  return (
    <div>
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>💰 YOUR INCOME FROM THIS MATCH</p>
        <p style={{ color: '#10b981', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
          {formatCurrency(details.your_income)}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Left Side */}
        <div style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <p style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
            👈 LEFT SIDE ({formatCurrency(details.left_total)})
          </p>
          {details.left_contributors.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {details.left_contributors.map((contrib, idx) => (
                <div key={idx} style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
                    👤 @{contrib.username}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>
                    📦 {contrib.package_name}
                  </p>
                  <p style={{ color: '#10b981', fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0' }}>
                    💵 {formatCurrency(contrib.amount)}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                    🕐 {contrib.invested_at}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>No recent investments</p>
          )}
        </div>

        {/* Right Side */}
        <div style={{
          background: 'rgba(74,144,226,0.1)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <p style={{ color: '#4a90e2', fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
            RIGHT SIDE 👉 ({formatCurrency(details.right_total)})
          </p>
          {details.right_contributors.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {details.right_contributors.map((contrib, idx) => (
                <div key={idx} style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
                    👤 @{contrib.username}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>
                    📦 {contrib.package_name}
                  </p>
                  <p style={{ color: '#4a90e2', fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0' }}>
                    💵 {formatCurrency(contrib.amount)}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                    🕐 {contrib.invested_at}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>No recent investments</p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div style={{
        background: 'rgba(234,179,8,0.1)',
        border: '1px solid rgba(234,179,8,0.3)',
        borderRadius: '10px',
        padding: '16px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#eab308', fontSize: '14px', margin: '0 0 8px 0' }}>
          ⚖️ BALANCED MATCH: {formatCurrency(details.matched_amount)}
        </p>
        <p style={{ color: '#10b981', fontSize: '14px', margin: '0 0 8px 0' }}>
          💰 Your Income: {formatCurrency(details.your_income)} ({details.bonus_rate}% bonus rate)
        </p>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
          ✅ Paid to your wallet on {details.created_at}
        </p>
      </div>
    </div>
  );
}

// Mobile Detail View Component
function MobileMatchDetailView({ details, formatCurrency }) {
  return (
    <div>
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 6px 0' }}>💰 YOUR INCOME</p>
        <p style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
          {formatCurrency(details.your_income)}
        </p>
      </div>

      {/* Left Side */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
          👈 LEFT SIDE ({formatCurrency(details.left_total)})
        </p>
        {details.left_contributors.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {details.left_contributors.map((contrib, idx) => (
              <div key={idx} style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0' }}>
                  👤 @{contrib.username}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                  📦 {contrib.package_name} | 💵 {formatCurrency(contrib.amount)}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '10px', margin: '4px 0 0 0' }}>
                  🕐 {contrib.invested_at}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>No recent investments</p>
        )}
      </div>

      {/* Right Side */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: '#4a90e2', fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
          RIGHT SIDE 👉 ({formatCurrency(details.right_total)})
        </p>
        {details.right_contributors.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {details.right_contributors.map((contrib, idx) => (
              <div key={idx} style={{
                background: 'rgba(74,144,226,0.1)',
                border: '1px solid rgba(74,144,226,0.3)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0' }}>
                  👤 @{contrib.username}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                  📦 {contrib.package_name} | 💵 {formatCurrency(contrib.amount)}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '10px', margin: '4px 0 0 0' }}>
                  🕐 {contrib.invested_at}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>No recent investments</p>
        )}
      </div>

      {/* Summary */}
      <div style={{
        background: 'rgba(234,179,8,0.1)',
        border: '1px solid rgba(234,179,8,0.3)',
        borderRadius: '8px',
        padding: '12px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#eab308', fontSize: '13px', margin: '0 0 6px 0' }}>
          ⚖️ Balanced: {formatCurrency(details.matched_amount)}
        </p>
        <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
          ✅ Paid to your wallet
        </p>
      </div>
    </div>
  );
}

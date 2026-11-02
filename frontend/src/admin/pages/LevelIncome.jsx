import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function LevelIncome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [topEarners, setTopEarners] = useState([]);
  const [levelBreakdown, setLevelBreakdown] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLevelIncomeData();
    const interval = setInterval(fetchLevelIncomeData, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [page, searchQuery]);

  const fetchLevelIncomeData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(`https://avenza.live/api/admin/level-income?page=${page}&per_page=20${searchParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setTransactions(data.transactions || []);
        setTopEarners(data.top_earners || []);
        setLevelBreakdown(data.level_breakdown || []);
        setTotalPages(data.total_pages || 1);
      }
    } catch (error) {
      console.error('Error fetching level income data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const getLevelLabel = (level) => {
    if (level === 1) return `L1 (10%)`;
    if (level >= 2 && level <= 3) return `L${level} (5%)`;
    if (level >= 4 && level <= 6) return `L${level} (3%)`;
    if (level >= 7 && level <= 10) return `L${level} (2%)`;
    return `L${level} (1%)`;
  };

  if (loading) {
    return (
      <div className="admin-page">
        <PageHeader title="Level Income System" subtitle="Platform-wide tracking" />
        <div style={{ padding: '20px' }}>
          <div style={{ animation: 'pulse 2s infinite' }}>
            <div style={{ height: '150px', background: 'rgba(74,144,226,0.1)', borderRadius: '16px', marginBottom: '20px' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PageHeader 
        title="📊 Level Income System" 
        subtitle="Platform-wide level income tracking and analytics"
      />

      {/* Platform Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(74,144,226,0.15), rgba(74,144,226,0.05))',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>Today's Total</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#4a90e2', margin: '0 0 4px 0' }}>
            {formatCurrency(stats?.today_total || 0)}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
            {stats?.today_recipients || 0} recipients
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>This Month</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', margin: '0 0 4px 0' }}>
            {formatCurrency(stats?.month_total || 0)}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Monthly payout</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>All Time</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#a855f7', margin: '0 0 4px 0' }}>
            {formatCurrency(stats?.all_time_total || 0)}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Total paid out</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
          border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>Total Transactions</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fbbf24', margin: '0 0 4px 0' }}>
            {(stats?.total_transactions || 0).toLocaleString()}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>All time count</p>
        </div>
      </div>

      {/* Top Earners */}
      {topEarners.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            🏆 Top Earners (Today)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(74,144,226,0.2)' }}>
                  <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'left' }}>Rank</th>
                  <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'left' }}>Username</th>
                  <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'right' }}>Team Size</th>
                  <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'right' }}>Earned Today</th>
                </tr>
              </thead>
              <tbody>
                {topEarners.map(earner => (
                  <tr
                    key={earner.user_id}
                    onClick={() => navigate(`/admin/user/${earner.user_id}`)}
                    style={{
                      borderBottom: '1px solid rgba(74,144,226,0.1)',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74,144,226,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px' }}>
                      <span style={{ fontSize: '20px' }}>
                        {earner.rank === 1 ? '🥇' : earner.rank === 2 ? '🥈' : earner.rank === 3 ? '🥉' : `#${earner.rank}`}
                      </span>
                    </td>
                    <td style={{ color: '#fff', fontSize: '14px', padding: '14px', fontWeight: '600' }}>
                      {earner.username}
                    </td>
                    <td style={{ color: '#4a90e2', fontSize: '14px', padding: '14px', textAlign: 'right' }}>
                      {earner.team_size}
                    </td>
                    <td style={{ color: '#10b981', fontSize: '15px', padding: '14px', textAlign: 'right', fontWeight: 'bold' }}>
                      {formatCurrency(earner.earned_today)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Level Breakdown */}
      {levelBreakdown.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            📊 Level Distribution (Platform-wide)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {levelBreakdown.map(level => (
              <div key={level.level} style={{
                background: 'rgba(74,144,226,0.05)',
                border: '1px solid rgba(74,144,226,0.2)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ color: '#4a90e2', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
                    {getLevelLabel(level.level)}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                    {level.member_count} transactions
                  </p>
                </div>
                <p style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                  {formatCurrency(level.today_earned)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: '1 1 200px',
              background: 'rgba(74,144,226,0.05)',
              border: '1px solid rgba(74,144,226,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={() => fetchLevelIncomeData()}
            style={{
              background: 'linear-gradient(135deg, #4a90e2, #357abd)',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🔍 Search
          </button>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              style={{
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.5)',
                borderRadius: '8px',
                padding: '10px 16px',
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
          📜 Level Income Distribution History
        </h3>
        {transactions.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
            No transactions found
          </p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(74,144,226,0.2)' }}>
                    <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'left' }}>Time</th>
                    <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'left' }}>Recipient</th>
                    <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'left' }}>From User</th>
                    <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'center' }}>Level</th>
                    <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'right' }}>ROI</th>
                    <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'right' }}>Income</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(trans => (
                    <tr
                      key={trans.id}
                      style={{
                        borderBottom: '1px solid rgba(74,144,226,0.1)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74,144,226,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ color: '#94a3b8', fontSize: '12px', padding: '14px' }}>
                        {trans.created_at}
                      </td>
                      <td 
                        onClick={() => navigate(`/admin/user/${trans.recipient_id}`)}
                        style={{ color: '#4a90e2', fontSize: '14px', padding: '14px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        {trans.recipient_username}
                      </td>
                      <td 
                        onClick={() => navigate(`/admin/user/${trans.from_user_id}`)}
                        style={{ color: '#fff', fontSize: '14px', padding: '14px', cursor: 'pointer' }}
                      >
                        {trans.from_username}
                      </td>
                      <td style={{ color: '#fbbf24', fontSize: '13px', padding: '14px', textAlign: 'center', fontWeight: '600' }}>
                        {getLevelLabel(trans.level)}
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '13px', padding: '14px', textAlign: 'right' }}>
                        {formatCurrency(trans.roi_amount)}
                      </td>
                      <td style={{ color: '#10b981', fontSize: '14px', padding: '14px', textAlign: 'right', fontWeight: 'bold' }}>
                        {formatCurrency(trans.income_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  style={{
                    background: page === 1 ? 'rgba(74,144,226,0.1)' : 'rgba(74,144,226,0.2)',
                    border: '1px solid rgba(74,144,226,0.3)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: page === 1 ? '#64748b' : '#4a90e2',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  style={{
                    background: page === totalPages ? 'rgba(74,144,226,0.1)' : 'rgba(74,144,226,0.2)',
                    border: '1px solid rgba(74,144,226,0.3)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: page === totalPages ? '#64748b' : '#4a90e2',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

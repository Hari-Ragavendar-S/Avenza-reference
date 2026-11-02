import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function ReferralBonus() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [topReferrers, setTopReferrers] = useState([]);
  const [rateDistribution, setRateDistribution] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBonusData();
    const interval = setInterval(fetchBonusData, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [page, statusFilter, searchQuery]);

  const fetchBonusData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const statusParam = statusFilter ? `&status=${statusFilter}` : '';
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(`https://avenza.live/api/admin/referral-bonus?page=${page}&per_page=20${statusParam}${searchParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setTransactions(data.transactions || []);
        setTopReferrers(data.top_referrers || []);
        setRateDistribution(data.rate_distribution || []);
        setTotalPages(data.total_pages || 1);
      }
    } catch (error) {
      console.error('Error fetching bonus data:', error);
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

  if (loading) {
    return (
      <div className="admin-page">
        <PageHeader title="Referral Bonus System" subtitle="Platform-wide tracking" />
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
        title="🎁 Referral Bonus System" 
        subtitle="Platform-wide referral bonus tracking and analytics"
      />

      {/* Platform Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
          border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>Unclaimed</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fbbf24', margin: '0 0 4px 0' }}>
            {formatCurrency(stats?.total_unclaimed || 0)}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
            {stats?.unclaimed_count || 0} pending
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>Claimed</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', margin: '0 0 4px 0' }}>
            {formatCurrency(stats?.total_claimed || 0)}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
            {stats?.claimed_count || 0} bonuses
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>Total Paid</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#a855f7', margin: '0 0 4px 0' }}>
            {formatCurrency(stats?.total_paid_all_time || 0)}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>All time</p>
        </div>
      </div>

      {/* Top Referrers */}
      {topReferrers.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            🏆 Top Referrers
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(74,144,226,0.2)' }}>
                  <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'left' }}>Rank</th>
                  <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'left' }}>Username</th>
                  <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'right' }}>Referrals</th>
                  <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'right' }}>Total Bonus</th>
                  <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'center' }}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {topReferrers.map(referrer => (
                  <tr
                    key={referrer.user_id}
                    onClick={() => navigate(`/admin/user/${referrer.user_id}`)}
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
                        {referrer.rank === 1 ? '🥇' : referrer.rank === 2 ? '🥈' : referrer.rank === 3 ? '🥉' : `#${referrer.rank}`}
                      </span>
                    </td>
                    <td style={{ color: '#fff', fontSize: '14px', padding: '14px', fontWeight: '600' }}>
                      {referrer.username}
                    </td>
                    <td style={{ color: '#4a90e2', fontSize: '14px', padding: '14px', textAlign: 'right' }}>
                      {referrer.direct_referrals}
                    </td>
                    <td style={{ color: '#10b981', fontSize: '15px', padding: '14px', textAlign: 'right', fontWeight: 'bold' }}>
                      {formatCurrency(referrer.total_bonus)}
                    </td>
                    <td style={{ color: '#fbbf24', fontSize: '13px', padding: '14px', textAlign: 'center', fontWeight: '600' }}>
                      {referrer.current_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rate Distribution */}
      {rateDistribution.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            📊 Rate Distribution
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {rateDistribution.map(dist => (
              <div key={dist.referral_number} style={{
                background: 'rgba(74,144,226,0.05)',
                border: '1px solid rgba(74,144,226,0.2)',
                borderRadius: '10px',
                padding: '14px'
              }}>
                <p style={{ color: '#fbbf24', fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                  {dist.rate}%
                </p>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 8px 0' }}>
                  {dist.referral_number === 6 ? '6+ Referrals' : `${dist.referral_number}${dist.referral_number === 1 ? 'st' : dist.referral_number === 2 ? 'nd' : dist.referral_number === 3 ? 'rd' : 'th'} Referral`}
                </p>
                <p style={{ color: '#10b981', fontSize: '14px', fontWeight: '600', margin: 0 }}>
                  {dist.bonus_count} bonuses • {formatCurrency(dist.total_amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              background: 'rgba(74,144,226,0.05)',
              border: '1px solid rgba(74,144,226,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="claimed">Claimed</option>
          </select>
          
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
            onClick={() => fetchBonusData()}
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
          
          {(statusFilter || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('');
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
          📜 Referral Bonus Transactions
        </h3>
        {transactions.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
            No transactions found
          </p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(74,144,226,0.2)' }}>
                    <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'left' }}>Date</th>
                    <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'left' }}>Referrer</th>
                    <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'left' }}>Referral</th>
                    <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'right' }}>Investment</th>
                    <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'center' }}>Rate</th>
                    <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'right' }}>Bonus</th>
                    <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'center' }}>Status</th>
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
                        onClick={() => navigate(`/admin/user/${trans.referrer_id}`)}
                        style={{ color: '#4a90e2', fontSize: '14px', padding: '14px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        {trans.referrer_username}
                      </td>
                      <td 
                        onClick={() => navigate(`/admin/user/${trans.referral_id}`)}
                        style={{ color: '#fff', fontSize: '14px', padding: '14px', cursor: 'pointer' }}
                      >
                        {trans.referral_username}
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '13px', padding: '14px', textAlign: 'right' }}>
                        {formatCurrency(trans.investment_amount)}
                      </td>
                      <td style={{ color: '#fbbf24', fontSize: '13px', padding: '14px', textAlign: 'center', fontWeight: '600' }}>
                        {trans.bonus_percentage}%
                      </td>
                      <td style={{ color: '#10b981', fontSize: '14px', padding: '14px', textAlign: 'right', fontWeight: 'bold' }}>
                        {formatCurrency(trans.bonus_amount)}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <span style={{
                          background: trans.status === 'claimed' ? 'rgba(16,185,129,0.2)' : 'rgba(251,191,36,0.2)',
                          color: trans.status === 'claimed' ? '#10b981' : '#fbbf24',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          {trans.status === 'claimed' ? '✅ Claimed' : '⏳ Pending'}
                        </span>
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

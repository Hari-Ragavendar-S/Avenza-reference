import { useState, useEffect } from 'react';

export default function PublicDepositHistory() {
  const [loading, setLoading] = useState(true);
  const [distributions, setDistributions] = useState([]);
  const [stats, setStats] = useState({
    total_received: 0,
    distribution_count: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 20;

  useEffect(() => {
    fetchDistributionHistory();
  }, [currentPage]);

  const fetchDistributionHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://avenza.live/api/wallet/public-distribution-history?page=${currentPage}&per_page=${perPage}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDistributions(data.distributions || []);
        setStats({
          total_received: data.total_received || 0,
          distribution_count: data.distribution_count || 0
        });
        setTotalPages(data.total_pages || 1);
      } else {
        // If endpoint doesn't exist yet, show empty state
        setDistributions([]);
      }
    } catch (err) {
      console.error('Error fetching distribution history:', err);
      setDistributions([]);
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

  const shortenHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>Loading distribution history...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(74,144,226,0.2), rgba(16,185,129,0.1))',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '24px'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: '0 0 8px 0' }}>
          💰 Public Deposit History
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
          Track your share from public deposits
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Total Received</p>
          <p style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            {formatCurrency(stats.total_received)}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(74,144,226,0.15), rgba(74,144,226,0.05))',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Distribution Count</p>
          <p style={{ color: '#4a90e2', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            {stats.distribution_count}
          </p>
        </div>
      </div>

      {/* Distribution History */}
      {distributions.length > 0 ? (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
            📊 Distribution History
          </h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(74,144,226,0.2)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>DATE & TIME</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>SOURCE</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>TRANSACTION</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>AMOUNT RECEIVED</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {distributions.map((dist) => (
                  <tr key={dist.id} style={{ borderBottom: '1px solid rgba(74,144,226,0.1)' }}>
                    <td style={{ padding: '12px', color: '#94a3b8', fontSize: '13px' }}>
                      {dist.credited_at}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: dist.source_type === 'website' 
                          ? 'rgba(74,144,226,0.2)' 
                          : 'rgba(16,185,129,0.2)',
                        color: dist.source_type === 'website' ? '#4a90e2' : '#10b981',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {dist.source_type === 'website' ? '📋 Website' : '💰 External'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ 
                        color: '#4a90e2', 
                        fontSize: '12px', 
                        fontFamily: 'monospace'
                      }}>
                        {shortenHash(dist.transaction_hash)}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontSize: '16px', fontWeight: '600' }}>
                      +{formatCurrency(dist.credited_amount)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        background: 'rgba(16,185,129,0.2)',
                        color: '#10b981',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        ✅ Completed
                      </span>
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
          <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>📭</span>
          <p style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No Distributions Yet
          </p>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            You'll receive your share when public deposits are made
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
          💡 How Public Deposits Work
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: '#4a90e2', fontSize: '20px' }}>1️⃣</span>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              When anyone deposits via the <strong style={{ color: '#fff' }}>public deposit page</strong>, the amount is shared equally
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: '#10b981', fontSize: '20px' }}>2️⃣</span>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              External payments sent to the public wallet are also <strong style={{ color: '#fff' }}>auto-detected and distributed</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: '#eab308', fontSize: '20px' }}>3️⃣</span>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              Your share is <strong style={{ color: '#10b981' }}>instantly credited</strong> to your AVENZA wallet
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: '#a855f7', fontSize: '20px' }}>4️⃣</span>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              All active users receive an <strong style={{ color: '#fff' }}>equal share</strong> from every deposit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

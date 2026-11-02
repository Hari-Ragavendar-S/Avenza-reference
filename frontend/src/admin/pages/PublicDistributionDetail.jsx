import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function PublicDistributionDetail() {
  const { sourceType, txHash } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDistributionDetails();
  }, [sourceType, txHash]);

  const fetchDistributionDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `https://avenza.live/api/admin/public-wallet/distribution/${sourceType}/${txHash}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        const errData = await response.json();
        setError(errData.detail || 'Failed to fetch distribution details');
      }
    } catch (err) {
      console.error('Failed to fetch distribution details:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const shortenHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 12)}...${hash.substring(hash.length - 10)}`;
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
      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
        Loading distribution details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <PageHeader 
          title="Distribution Details" 
          subtitle="View distribution recipients" 
        />
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#ef4444', fontSize: '16px', marginBottom: '16px' }}>
            ⚠️ {error}
          </p>
          <button
            onClick={() => navigate('/admin/public-transactions')}
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
            ← Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="admin-page">
      <PageHeader 
        title="Distribution Details" 
        subtitle="Recipients who received funds from this transaction" 
      />

      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/public-transactions')}
        style={{
          background: 'rgba(74, 144, 226, 0.1)',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          borderRadius: '8px',
          padding: '10px 20px',
          color: '#4a90e2',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '24px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        ← Back to Transactions
      </button>

      {/* Transaction Summary */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(16, 185, 129, 0.1))',
        border: '1px solid rgba(74, 144, 226, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          📊 Transaction Summary
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
              Source Type:
            </p>
            <p style={{ color: '#4a90e2', fontSize: '16px', fontWeight: '600', margin: 0, textTransform: 'capitalize' }}>
              {data.source_type === 'website' ? '📋 Website Deposit' : '💰 External Deposit'}
            </p>
          </div>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
              Total Amount:
            </p>
            <p style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              {formatCurrency(data.total_amount)}
            </p>
          </div>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
              Recipients Count:
            </p>
            <p style={{ color: '#eab308', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              {data.recipients_count}
            </p>
          </div>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
              Per Person:
            </p>
            <p style={{ color: '#a855f7', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              {formatCurrency(data.total_amount / data.recipients_count)}
            </p>
          </div>
        </div>
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(74, 144, 226, 0.2)' }}>
          <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
            Transaction Hash:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <p style={{
              color: '#4a90e2',
              fontSize: '13px',
              fontFamily: 'monospace',
              margin: 0,
              wordBreak: 'break-all'
            }}>
              {data.transaction_hash}
            </p>
            <a
              href={`https://bscscan.com/tx/${data.transaction_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(74, 144, 226, 0.2)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#4a90e2',
                fontSize: '12px',
                fontWeight: '600',
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              🔍 View on BSCScan
            </a>
          </div>
        </div>
      </div>

      {/* Recipients Table */}
      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">
            👥 Recipients ({data.recipients.length})
          </h3>
        </div>

        {data.recipients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
            <p style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              No Recipients Found
            </p>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
              Distribution might be pending or failed
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(74, 144, 226, 0.2)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                    #
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                    NAME
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                    EMAIL
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                    PHONE
                  </th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                    AMOUNT CREDITED
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                    STATUS
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                    DATE & TIME
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recipients.map((recipient, index) => (
                  <tr 
                    key={recipient.id}
                    style={{ 
                      borderBottom: '1px solid rgba(74, 144, 226, 0.1)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74, 144, 226, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: '16px', color: '#e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                      {recipient.user_name}
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>
                      {recipient.user_email}
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>
                      {recipient.user_phone}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ color: '#10b981', fontSize: '16px', fontWeight: '600' }}>
                        +{formatCurrency(recipient.credited_amount)}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{
                        background: recipient.status === 'completed' 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : 'rgba(234, 179, 8, 0.2)',
                        border: `1px solid ${recipient.status === 'completed' 
                          ? 'rgba(16, 185, 129, 0.3)' 
                          : 'rgba(234, 179, 8, 0.3)'}`,
                        borderRadius: '6px',
                        padding: '4px 12px',
                        color: recipient.status === 'completed' ? '#10b981' : '#eab308',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {recipient.status === 'completed' ? '✅ Completed' : '⏳ Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>
                      {recipient.credited_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Distribution Info */}
      <div style={{
        background: 'rgba(74, 144, 226, 0.05)',
        border: '1px solid rgba(74, 144, 226, 0.2)',
        borderRadius: '12px',
        padding: '16px',
        marginTop: '24px'
      }}>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
          💡 <strong style={{ color: '#fff' }}>Equal Distribution:</strong> The total amount of {formatCurrency(data.total_amount)} was divided equally among {data.recipients_count} active users. Each user received {formatCurrency(data.total_amount / data.recipients_count)} credited to their AVENZA wallet.
        </p>
      </div>
    </div>
  );
}

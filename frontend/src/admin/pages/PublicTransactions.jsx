import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import Badge from '../components/Badge';

export default function PublicTransactions() {
  const [activeTab, setActiveTab] = useState('website'); // 'website', 'external', or 'user_topups'
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const perPage = 20;

  useEffect(() => {
    fetchDeposits();
  }, [activeTab, page]);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      let endpoint;
      
      if (activeTab === 'website') {
        endpoint = 'transactions/website';
      } else if (activeTab === 'external') {
        endpoint = 'transactions/external';
      } else {
        endpoint = 'transactions/user-topups';
      }
      
      const response = await fetch(
        `https://avenza.live/api/admin/public-wallet/${endpoint}?page=${page}&per_page=${perPage}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDeposits(data.deposits || data.topups);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      }
    } catch (err) {
      console.error('Failed to fetch deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (deposit) => {
    // Navigate to distribution detail page
    navigate(`/admin/public-distribution/${activeTab}/${deposit.transaction_hash}`);
  };

  const shortenHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
  };

  const shortenAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="admin-page">
      <PageHeader 
        title="Public Transactions" 
        subtitle="View all website and external deposits" 
      />

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => {
            setActiveTab('website');
            setPage(1);
          }}
          style={{
            background: activeTab === 'website' 
              ? 'linear-gradient(135deg, #4a90e2, #357abd)' 
              : 'rgba(74, 144, 226, 0.1)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '8px',
            padding: '12px 24px',
            color: activeTab === 'website' ? '#fff' : '#94a3b8',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          📋 Website Deposits
        </button>
        <button
          onClick={() => {
            setActiveTab('external');
            setPage(1);
          }}
          style={{
            background: activeTab === 'external' 
              ? 'linear-gradient(135deg, #10b981, #059669)' 
              : 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '12px 24px',
            color: activeTab === 'external' ? '#fff' : '#94a3b8',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          💰 External Deposits
        </button>
        <button
          onClick={() => {
            setActiveTab('user_topups');
            setPage(1);
          }}
          style={{
            background: activeTab === 'user_topups' 
              ? 'linear-gradient(135deg, #a855f7, #7c3aed)' 
              : 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '8px',
            padding: '12px 24px',
            color: activeTab === 'user_topups' ? '#fff' : '#94a3b8',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          👤 User Top-Ups
        </button>
      </div>

      {/* Table */}
      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">
            {activeTab === 'website' && '📋 Website Deposits'}
            {activeTab === 'external' && '💰 External Deposits'}
            {activeTab === 'user_topups' && '👤 User Top-Ups'} - 
            Showing {deposits.length > 0 ? ((page - 1) * perPage + 1) : 0}-{Math.min(page * perPage, total)} of {total}
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            Loading {activeTab === 'user_topups' ? 'top-ups' : 'deposits'}...
          </div>
        ) : deposits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
            <p style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              No {activeTab === 'user_topups' ? 'user top-ups' : `${activeTab} deposits`} yet
            </p>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
              {activeTab === 'website' 
                ? 'Website deposits will appear here when users deposit via the public form'
                : activeTab === 'external'
                ? 'External deposits will appear here when payments are detected on blockchain'
                : 'User top-ups will appear here when anyone sends USDT to a specific AVENZA user'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(74, 144, 226, 0.2)' }}>
                    {activeTab === 'website' ? (
                      <>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                          NAME
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                          PHONE
                        </th>
                        <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                          AMOUNT (BEP20)
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                          TX HASH
                        </th>
                      </>
                    ) : activeTab === 'external' ? (
                      <>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                          SENDER ADDRESS
                        </th>
                        <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                          AMOUNT (BEP20)
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                          TX HASH
                        </th>
                      </>
                    ) : (
                      <>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                          SENDER INFO
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                          RECIPIENT USER
                        </th>
                        <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                          AMOUNT (BEP20)
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                          TX HASH
                        </th>
                      </>
                    )}
                    <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                      {activeTab === 'user_topups' ? 'STATUS' : 'DISTRIBUTED'}
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                      DATE & TIME
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((deposit) => (
                    <tr 
                      key={deposit.id} 
                      onClick={() => activeTab !== 'user_topups' && handleRowClick(deposit)}
                      style={{ 
                        borderBottom: '1px solid rgba(74, 144, 226, 0.1)',
                        cursor: activeTab !== 'user_topups' ? 'pointer' : 'default',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => activeTab !== 'user_topups' && (e.currentTarget.style.background = 'rgba(74, 144, 226, 0.05)')}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {activeTab === 'website' ? (
                        <>
                          <td style={{ padding: '16px', color: '#e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                            {deposit.name || 'N/A'}
                          </td>
                          <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                            {deposit.phone || 'N/A'}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <div style={{ color: '#10b981', fontSize: '16px', fontWeight: '600' }}>
                              ${(deposit.amount_bep20_equivalent || 0).toLocaleString('en-US', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ 
                              color: '#4a90e2', 
                              fontSize: '12px', 
                              fontFamily: 'monospace'
                            }}>
                              {shortenHash(deposit.transaction_hash)}
                            </div>
                          </td>
                        </>
                      ) : activeTab === 'external' ? (
                        <>
                          <td style={{ padding: '16px' }}>
                            <div style={{ 
                              color: '#e5e7eb', 
                              fontSize: '13px', 
                              fontFamily: 'monospace',
                              fontWeight: '600'
                            }}>
                              {shortenAddress(deposit.sender_address)}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>
                              {deposit.network} · {deposit.token_type}
                            </div>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <div style={{ color: '#10b981', fontSize: '16px', fontWeight: '600' }}>
                              ${(deposit.amount_bep20_equivalent || 0).toLocaleString('en-US', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ 
                              color: '#4a90e2', 
                              fontSize: '12px', 
                              fontFamily: 'monospace'
                            }}>
                              {shortenHash(deposit.transaction_hash)}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '16px' }}>
                            <div style={{ color: '#e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                              {deposit.sender_name || 'N/A'}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                              📞 {deposit.sender_phone || 'N/A'}
                            </div>
                            <div style={{ 
                              color: '#64748b', 
                              fontSize: '11px', 
                              fontFamily: 'monospace',
                              marginTop: '2px'
                            }}>
                              {shortenAddress(deposit.sender_address)}
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ 
                              display: 'inline-block',
                              background: 'rgba(234, 179, 8, 0.15)',
                              border: '1px solid rgba(234, 179, 8, 0.3)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              marginBottom: '4px'
                            }}>
                              <span style={{ color: '#eab308', fontSize: '11px', fontWeight: '600' }}>
                                👤 USER TOP-UP
                              </span>
                            </div>
                            <div style={{ color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                              @{deposit.recipient_username || 'N/A'}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                              {deposit.recipient_name || 'N/A'}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                              ID: {deposit.recipient_user_id || 'N/A'}
                            </div>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <div style={{ color: '#10b981', fontSize: '16px', fontWeight: '600' }}>
                              ${(deposit.amount_bep20 || 0).toLocaleString('en-US', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ 
                              color: '#4a90e2', 
                              fontSize: '12px', 
                              fontFamily: 'monospace'
                            }}>
                              {shortenHash(deposit.transaction_hash)}
                            </div>
                          </td>
                        </>
                      )}
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {activeTab === 'user_topups' ? (
                          <Badge status="Completed" />
                        ) : deposit.is_distributed ? (
                          <div>
                            <Badge status="Completed" />
                            <div style={{ 
                              color: '#10b981', 
                              fontSize: '12px', 
                              marginTop: '4px',
                              fontWeight: '600'
                            }}>
                              {deposit.distributed_to_count} users
                            </div>
                          </div>
                        ) : (
                          <Badge status="Pending" />
                        )}
                      </td>
                      <td style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>
                        {activeTab === 'website' 
                          ? deposit.deposited_at 
                          : activeTab === 'external'
                          ? deposit.detected_at
                          : deposit.topped_up_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ padding: '20px', borderTop: '1px solid rgba(74, 144, 226, 0.2)' }}>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

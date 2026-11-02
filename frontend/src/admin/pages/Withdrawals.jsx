import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import SearchFilter from '../components/SearchFilter';
import StatCard from '../components/StatCard';

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, completed: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    fetchWithdrawals();
  }, [currentPage, statusFilter]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('adminToken');
      let url = `https://avenza.live/api/admin/withdrawals?page=${currentPage}&per_page=${itemsPerPage}`;
      
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setWithdrawals(data.withdrawals);
        setStats(data.stats);
        setTotalPages(data.total_pages);
        setTotalCount(data.total);
      } else {
        setError(data.detail || 'Failed to load withdrawals');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleSearchSubmit = () => {
    fetchWithdrawals();
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const getStatusBadgeColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'Completed';
      case 'approved': return 'Completed';
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      case 'failed': return 'Rejected';
      case 'rejected': return 'Rejected';
      default: return 'Pending';
    }
  };

  const handleApproveClick = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setAdminNote('');
    setShowApproveModal(true);
  };

  const handleRejectClick = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedWithdrawal) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://avenza.live/api/admin/withdrawal/${selectedWithdrawal.id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          admin_note: adminNote || 'Approved and funds sent to wallet'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowApproveModal(false);
        setSelectedWithdrawal(null);
        setAdminNote('');
        fetchWithdrawals(); // Refresh list
        alert(`✅ Withdrawal #${selectedWithdrawal.id} approved successfully`);
      } else {
        alert(data.detail || 'Failed to approve withdrawal');
      }
    } catch (err) {
      alert('Failed to connect to server');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedWithdrawal) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://avenza.live/api/admin/withdrawal/${selectedWithdrawal.id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: rejectReason || 'Rejected by admin'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowRejectModal(false);
        setSelectedWithdrawal(null);
        setRejectReason('');
        fetchWithdrawals(); // Refresh list
        alert(`✅ Withdrawal #${selectedWithdrawal.id} rejected and refunded successfully`);
      } else {
        alert(data.detail || 'Failed to reject withdrawal');
      }
    } catch (err) {
      alert('Failed to connect to server');
    } finally {
      setActionLoading(false);
    }
  };

  const totalAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="admin-page">
      <PageHeader 
        title="Withdrawals" 
        subtitle={`Total withdrawals: $${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${totalCount} transactions)`} 
      />

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <StatCard
          title="Total"
          value={stats.total}
          icon="💰"
          color="#4a90e2"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon="⏳"
          color="#eab308"
        />
        <StatCard
          title="Processing"
          value={stats.processing}
          icon="⚙️"
          color="#f59e0b"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon="✓"
          color="#10b981"
        />
        <StatCard
          title="Failed"
          value={stats.failed}
          icon="✕"
          color="#ef4444"
        />
      </div>

      {/* Filters */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.8))',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          {/* Search Input */}
          <div>
            <label style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: '14px',
              marginBottom: '8px'
            }}>
              Search by Username:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
              placeholder="Enter username..."
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: '14px',
              marginBottom: '8px'
            }}>
              Filter by Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All Withdrawals</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearchSubmit}
            style={{
              background: 'linear-gradient(135deg, #4a90e2, #357abd)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              height: '42px'
            }}
          >
            Search
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">All Withdrawals</h3>
          <div className="card-header-info">
            Showing {withdrawals.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
          </div>
        </div>
        
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#94a3b8'
          }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              border: '4px solid rgba(74,144,226,0.3)',
              borderTop: '4px solid #4a90e2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}/>
            Loading withdrawals...
          </div>
        ) : withdrawals.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#94a3b8'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💸</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#e5e7eb' }}>
              No Withdrawals Found
            </div>
            <div style={{ fontSize: '14px' }}>
              {searchTerm || statusFilter ? 'Try adjusting your filters' : 'No withdrawal transactions yet'}
            </div>
          </div>
        ) : (
          <>
            <Table headers={['ID', 'Username', 'Amount', 'Fee', 'Net Amount', 'Wallet Address', 'Mode', 'Status', 'Date', 'Actions']}>
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id}>
                  <td className="table-cell-muted">#{withdrawal.id}</td>
                  <td className="table-cell-primary">{withdrawal.username}</td>
                  <td className="table-cell-danger">-${withdrawal.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="table-cell-muted">-${withdrawal.fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ color: '#10b981', fontWeight: '600' }}>${withdrawal.net_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="table-cell-mono">
                    {withdrawal.destination_address || withdrawal.to_address ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '12px' }}>
                            {(withdrawal.destination_address || withdrawal.to_address).slice(0, 10)}...
                            {(withdrawal.destination_address || withdrawal.to_address).slice(-8)}
                          </span>
                          {withdrawal.destination_wallet_type && (
                            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>
                              {withdrawal.destination_wallet_type}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(withdrawal.destination_address || withdrawal.to_address);
                            alert('Address copied to clipboard!');
                          }}
                          style={{
                            background: 'rgba(74, 144, 226, 0.2)',
                            border: '1px solid rgba(74, 144, 226, 0.5)',
                            color: '#4a90e2',
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                          title="Copy full address"
                        >
                          📋 Copy
                        </button>
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: withdrawal.withdrawal_mode === 'manual' 
                        ? 'rgba(168, 85, 247, 0.2)' 
                        : 'rgba(74, 144, 226, 0.2)',
                      color: withdrawal.withdrawal_mode === 'manual' ? '#a855f7' : '#4a90e2',
                      textTransform: 'uppercase',
                      fontWeight: '600'
                    }}>
                      {withdrawal.withdrawal_mode === 'manual' ? '👤 Manual' : '🤖 Auto'}
                    </span>
                  </td>
                  <td>
                    <Badge status={getStatusBadgeColor(withdrawal.status)} />
                  </td>
                  <td className="table-cell-muted">{withdrawal.ist_created_at || '-'}</td>
                  <td>
                    {withdrawal.status === 'pending' && withdrawal.withdrawal_mode === 'manual' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApproveClick(withdrawal)}
                          style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.5)',
                            color: '#10b981',
                            fontSize: '12px',
                            fontWeight: '600',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleRejectClick(withdrawal)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: '600',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '12px' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </Table>

            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedWithdrawal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '2px solid rgba(16, 185, 129, 0.5)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
              <h2 style={{
                color: '#fff',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                Approve Withdrawal
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Confirm that you have manually sent the funds to the user's wallet
              </p>
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontSize: '14px' }}>
                <span style={{ color: '#94a3b8' }}>Withdrawal ID:</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>#{selectedWithdrawal.id}</span>

                <span style={{ color: '#94a3b8' }}>Username:</span>
                <span style={{ color: '#4a90e2', fontWeight: '600' }}>@{selectedWithdrawal.username}</span>

                <span style={{ color: '#94a3b8' }}>Amount:</span>
                <span style={{ color: '#10b981', fontWeight: '600' }}>${selectedWithdrawal.net_amount.toFixed(2)}</span>

                <span style={{ color: '#94a3b8' }}>Wallet:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
                    {selectedWithdrawal.destination_address || selectedWithdrawal.to_address || 'N/A'}
                  </span>
                  {(selectedWithdrawal.destination_address || selectedWithdrawal.to_address) && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedWithdrawal.destination_address || selectedWithdrawal.to_address);
                        alert('Address copied!');
                      }}
                      style={{
                        background: 'rgba(74, 144, 226, 0.3)',
                        border: '1px solid rgba(74, 144, 226, 0.5)',
                        color: '#4a90e2',
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontWeight: '600'
                      }}
                    >
                      📋 Copy
                    </button>
                  )}
                </div>

                {selectedWithdrawal.destination_wallet_type && (
                  <>
                    <span style={{ color: '#94a3b8' }}>Wallet Type:</span>
                    <span style={{ color: '#a855f7', textTransform: 'capitalize' }}>
                      {selectedWithdrawal.destination_wallet_type}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                Admin Note (Optional)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="E.g., Funds sent via transaction 0x..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedWithdrawal(null);
                  setAdminNote('');
                }}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  background: 'rgba(100, 116, 139, 0.2)',
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  color: '#94a3b8',
                  fontSize: '14px',
                  fontWeight: '600',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.7 : 1
                }}
              >
                {actionLoading ? 'Approving...' : '✓ Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedWithdrawal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h2 style={{
                color: '#fff',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                Reject Withdrawal
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                The deducted amount will be refunded to user's AVENZA wallet
              </p>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontSize: '14px' }}>
                <span style={{ color: '#94a3b8' }}>Withdrawal ID:</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>#{selectedWithdrawal.id}</span>

                <span style={{ color: '#94a3b8' }}>Username:</span>
                <span style={{ color: '#4a90e2', fontWeight: '600' }}>@{selectedWithdrawal.username}</span>

                <span style={{ color: '#94a3b8' }}>Refund Amount:</span>
                <span style={{ color: '#ef4444', fontWeight: '600' }}>${selectedWithdrawal.amount.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                Reason for Rejection (Optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g., Invalid wallet address, suspicious activity..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedWithdrawal(null);
                  setRejectReason('');
                }}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  background: 'rgba(100, 116, 139, 0.2)',
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  color: '#94a3b8',
                  fontSize: '14px',
                  fontWeight: '600',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.7 : 1
                }}
              >
                {actionLoading ? 'Rejecting...' : '✕ Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const itemsPerPage = 20;

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://avenza.live/api/wallet/transactions?page=${currentPage}&per_page=${itemsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out admin_credit and admin_debit transactions from UI
        const filteredTransactions = (data.transactions || []).filter(
          t => t.type !== 'admin_credit' && t.type !== 'admin_debit'
        );
        setTransactions(filteredTransactions);
        setTotalPages(data.total_pages || 0);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionBadge = (type) => {
    const badges = {
      'deposit': { label: 'Deposit', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
      'withdrawal': { label: 'Withdrawal', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
      'investment_enrollment': { label: 'Investment', color: '#4a90e2', bg: 'rgba(74, 144, 226, 0.2)' },
      'investment_profit': { label: 'Profit', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
      'daily_profit': { label: 'Daily Profit', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
      'admin_credit': { label: 'Admin Credit', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.2)' },
      'admin_debit': { label: 'Admin Debit', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
      'level_income': { label: 'Level Income', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
      'binary_income': { label: 'Binary Income', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.2)' },
      'matching_bonus': { label: 'Awards & Rewards', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.2)' },
      'downline_matching_bonus': { label: 'Matching Bonus', color: '#4a90e2', bg: 'rgba(74, 144, 226, 0.2)' },
      'referral_bonus': { label: 'Referral Bonus', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.2)' },
      'transfer_in': { label: 'Transfer In', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
      'transfer_out': { label: 'Transfer Out', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
      'p2p_transfer_in': { label: 'Received', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
      'p2p_transfer_out': { label: 'Sent', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' }
    };

    return badges[type] || { label: type, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.2)' };
  };

  const getStatusBadge = (status) => {
    const badges = {
      'completed': { label: 'Completed', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
      'pending': { label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
      'failed': { label: 'Failed', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
      'processing': { label: 'Processing', color: '#4a90e2', bg: 'rgba(74, 144, 226, 0.2)' }
    };

    return badges[status] || { label: status, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.2)' };
  };

  const getWalletBadge = (wallet) => {
    const badges = {
      'avenza': { label: 'AVENZA', color: '#4a90e2' },
      'income': { label: 'INCOME', color: '#10b981' },
      'gaming': { label: 'GAMING', color: '#a855f7' }
    };

    return badges[wallet] || { label: wallet?.toUpperCase() || 'N/A', color: '#94a3b8' };
  };

  const isCredit = (type) => {
    return ['deposit', 'investment_profit', 'daily_profit', 'admin_credit', 'level_income', 'binary_income', 'matching_bonus', 'downline_matching_bonus', 'referral_bonus', 'transfer_in', 'p2p_transfer_in'].includes(type);
  };

  const handleTransactionClick = (transactionId) => {
    navigate(`/transaction/${transactionId}`);
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        Loading transactions...
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '8px'
        }}>
          Transaction History
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          View all your transactions and activities
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74, 144, 226, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {[
          { value: 'all', label: 'All' },
          { value: 'deposit', label: 'Deposits' },
          { value: 'withdrawal', label: 'Withdrawals' },
          { value: 'investment_profit', label: 'Profits' },
          { value: 'level_income', label: 'Level Income' },
          { value: 'binary_income', label: 'Binary Income' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            style={{
              background: filter === tab.value 
                ? 'linear-gradient(135deg, #4a90e2, #357abd)' 
                : 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: filter === tab.value ? '#fff' : '#94a3b8',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div style={{
          background: 'rgba(74, 144, 226, 0.1)',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          borderRadius: '16px',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>
            No Transactions Found
          </h3>
          <p style={{ color: '#94a3b8' }}>
            {filter === 'all' ? 'Your transactions will appear here' : `No ${filter} transactions yet`}
          </p>
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          {/* Desktop Table */}
          <div style={{ display: 'none', '@media (min-width: 768px)': { display: 'block' } }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(74, 144, 226, 0.2)' }}>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#94a3b8',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      ID
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#94a3b8',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      Type
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#94a3b8',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      Amount
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#94a3b8',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      Wallet
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#94a3b8',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      Description
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#94a3b8',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      Status
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#94a3b8',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      Date
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      Tag
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((trans) => {
                    const typeBadge = getTransactionBadge(trans.type);
                    const statusBadge = getStatusBadge(trans.status);
                    const walletBadge = getWalletBadge(trans.wallet_type);
                    const credit = isCredit(trans.type);

                    return (
                      <tr
                        key={trans.id}
                        onClick={() => handleTransactionClick(trans.id)}
                        style={{
                          borderBottom: '1px solid rgba(74, 144, 226, 0.1)',
                          transition: 'background 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74, 144, 226, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                          #{trans.id}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            background: typeBadge.bg,
                            color: typeBadge.color,
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}>
                            {typeBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            color: credit ? '#10b981' : '#ef4444',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}>
                            {credit ? '+' : '-'}${parseFloat(trans.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            color: walletBadge.color,
                            fontSize: '13px',
                            fontWeight: '600'
                          }}>
                            {walletBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#e5e7eb', fontSize: '14px' }}>
                          {trans.description || 'N/A'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            background: statusBadge.bg,
                            color: statusBadge.color,
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>
                          {trans.created_at}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          {trans.tag === 'user_topup' && (
                            <div style={{
                              display: 'inline-block',
                              background: 'rgba(234, 179, 8, 0.15)',
                              border: '1px solid rgba(234, 179, 8, 0.3)',
                              borderRadius: '6px',
                              padding: '4px 10px'
                            }}>
                              <span style={{ color: '#eab308', fontSize: '11px', fontWeight: '600' }}>
                                👤 USER TOP-UP
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div style={{ display: 'block', '@media (min-width: 768px)': { display: 'none' } }}>
            {filteredTransactions.map((trans) => {
              const typeBadge = getTransactionBadge(trans.type);
              const statusBadge = getStatusBadge(trans.status);
              const walletBadge = getWalletBadge(trans.wallet_type);
              const credit = isCredit(trans.type);

              return (
                <div
                  key={trans.id}
                  onClick={() => handleTransactionClick(trans.id)}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid rgba(74, 144, 226, 0.1)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <span style={{
                        background: typeBadge.bg,
                        color: typeBadge.color,
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {typeBadge.label}
                      </span>
                    </div>
                    <span style={{
                      color: credit ? '#10b981' : '#ef4444',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      {credit ? '+' : '-'}${parseFloat(trans.amount).toFixed(2)}
                    </span>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Wallet: </span>
                    <span style={{
                      color: walletBadge.color,
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      {walletBadge.label}
                    </span>
                  </div>

                  <div style={{
                    color: '#e5e7eb',
                    fontSize: '13px',
                    marginBottom: '8px'
                  }}>
                    {trans.description}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      background: statusBadge.bg,
                      color: statusBadge.color,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {statusBadge.label}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                      {trans.created_at}
                    </span>
                  </div>

                  {trans.tag === 'user_topup' && (
                    <div style={{ marginTop: '8px', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-block',
                        background: 'rgba(234, 179, 8, 0.15)',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                        borderRadius: '6px',
                        padding: '4px 10px'
                      }}>
                        <span style={{ color: '#eab308', fontSize: '11px', fontWeight: '600' }}>
                          👤 USER TOP-UP
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              borderTop: '1px solid rgba(74, 144, 226, 0.2)'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  background: currentPage === 1 ? 'rgba(74, 144, 226, 0.1)' : 'rgba(74, 144, 226, 0.2)',
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  color: currentPage === 1 ? '#4b5563' : '#4a90e2',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                Previous
              </button>

              <div style={{ color: '#e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  background: currentPage === totalPages ? 'rgba(74, 144, 226, 0.1)' : 'rgba(74, 144, 226, 0.2)',
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  color: currentPage === totalPages ? '#4b5563' : '#4a90e2',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

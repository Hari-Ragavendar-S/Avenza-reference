import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function TransactionDetail() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactionDetail();
  }, [transactionId]);

  const fetchTransactionDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://avenza.live/api/transaction/${transactionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTransaction(data);
      } else {
        alert('Transaction not found');
        navigate('/transactions');
      }
    } catch (err) {
      console.error('Error fetching transaction:', err);
      alert('Error loading transaction');
      navigate('/transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    const icons = {
      'deposit': '💰',
      'withdrawal': '💸',
      'investment_enrollment': '📊',
      'investment_profit': '💹',
      'daily_profit': '💵',
      'admin_credit': '🎁',
      'admin_debit': '⚠️',
      'level_income': '🎯',
      'binary_income': '🌳',
      'p2p_transfer_out': '↗️',
      'p2p_transfer_in': '↙️'
    };
    return icons[type] || '💳';
  };

  const getTransactionColor = (type) => {
    const colors = {
      'deposit': '#10b981',
      'withdrawal': '#ef4444',
      'investment_enrollment': '#4a90e2',
      'investment_profit': '#10b981',
      'daily_profit': '#10b981',
      'admin_credit': '#a855f7',
      'admin_debit': '#ef4444',
      'level_income': '#f59e0b',
      'binary_income': '#8b5cf6',
      'p2p_transfer_out': '#ef4444',
      'p2p_transfer_in': '#10b981'
    };
    return colors[type] || '#94a3b8';
  };

  const getTransactionLabel = (type) => {
    const labels = {
      'deposit': 'Deposit',
      'withdrawal': 'Withdrawal',
      'investment_enrollment': 'Investment',
      'investment_profit': 'Profit',
      'daily_profit': 'Daily Profit',
      'admin_credit': 'Admin Credit',
      'admin_debit': 'Admin Debit',
      'level_income': 'Level Income',
      'binary_income': 'Binary Income',
      'p2p_transfer_out': 'Sent',
      'p2p_transfer_in': 'Received'
    };
    return labels[type] || type;
  };

  const isCredit = (type) => {
    return ['deposit', 'investment_profit', 'daily_profit', 'admin_credit', 'level_income', 'binary_income', 'p2p_transfer_in'].includes(type);
  };

  const getStatusColor = (status) => {
    const colors = {
      'completed': '#10b981',
      'pending': '#f59e0b',
      'failed': '#ef4444',
      'processing': '#4a90e2'
    };
    return colors[status] || '#94a3b8';
  };

  const getWalletColor = (wallet) => {
    const colors = {
      'avenza': '#4a90e2',
      'income': '#10b981',
      'gaming': '#a855f7'
    };
    return colors[wallet] || '#94a3b8';
  };

  const getUserAvatar = () => {
    if (transaction?.other_party_photo) {
      return (
        <img 
          src={transaction.other_party_photo} 
          alt={transaction.other_party_name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      );
    }
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #4a90e2, #357abd)',
        color: '#fff',
        fontSize: '32px',
        fontWeight: 'bold'
      }}>
        {transaction?.other_party_username?.charAt(0).toUpperCase()}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        Loading transaction...
      </div>
    );
  }

  if (!transaction) {
    return null;
  }

  const credit = isCredit(transaction.type);
  const color = getTransactionColor(transaction.type);

  return (
    <div style={{
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '30px',
        gap: '12px'
      }}>
        <button
          onClick={() => navigate('/transactions')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#4a90e2',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ←
        </button>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '4px'
          }}>
            Transaction Details
          </h1>
          <p style={{
            color: '#94a3b8',
            fontSize: '13px'
          }}>
            ID: #{transaction.id}
          </p>
        </div>
      </div>

      {/* Transaction Icon & Amount */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '2px solid rgba(74, 144, 226, 0.5)',
        borderRadius: '20px',
        padding: '40px 30px',
        textAlign: 'center',
        marginBottom: '24px'
      }}>
        <div style={{
          fontSize: '64px',
          marginBottom: '16px'
        }}>
          {getTransactionIcon(transaction.type)}
        </div>
        <div style={{
          color: color,
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          {credit ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
        </div>
        <div style={{
          display: 'inline-block',
          background: `${color}20`,
          border: `1px solid ${color}50`,
          borderRadius: '20px',
          padding: '6px 16px',
          color: color,
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {getTransactionLabel(transaction.type)}
        </div>
      </div>

      {/* P2P Transfer User Info */}
      {(transaction.type === 'p2p_transfer_out' || transaction.type === 'p2p_transfer_in') && transaction.other_party_username && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {getUserAvatar()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              color: '#94a3b8',
              fontSize: '12px',
              marginBottom: '4px'
            }}>
              {transaction.type === 'p2p_transfer_out' ? 'SENT TO' : 'RECEIVED FROM'}
            </div>
            <div style={{
              color: '#fff',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '4px'
            }}>
              {transaction.other_party_name}
            </div>
            <div style={{
              color: '#4a90e2',
              fontSize: '14px'
            }}>
              @{transaction.other_party_username}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74, 144, 226, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{
          color: '#fff',
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '16px'
        }}>
          Details
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Status */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Status</span>
            <span style={{
              background: `${getStatusColor(transaction.status)}20`,
              border: `1px solid ${getStatusColor(transaction.status)}50`,
              borderRadius: '12px',
              padding: '4px 12px',
              color: getStatusColor(transaction.status),
              fontSize: '13px',
              fontWeight: '600',
              textTransform: 'capitalize'
            }}>
              {transaction.status}
            </span>
          </div>

          {/* Wallet Type */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Wallet</span>
            <span style={{
              color: getWalletColor(transaction.wallet_type),
              fontSize: '14px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {transaction.wallet_type}
            </span>
          </div>

          {/* Currency */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Currency</span>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
              {transaction.currency}
            </span>
          </div>

          {/* Date */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Date & Time</span>
            <span style={{ color: '#fff', fontSize: '14px' }}>
              {transaction.created_at}
            </span>
          </div>

          {/* Reference */}
          {transaction.reference_id && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>Reference</span>
              <span style={{ color: '#4a90e2', fontSize: '13px', fontFamily: 'monospace' }}>
                {transaction.reference_type}#{transaction.reference_id}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {transaction.description && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '12px'
          }}>
            Description
          </h3>
          <p style={{
            color: '#e5e7eb',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            {transaction.description}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px'
      }}>
        <button
          onClick={() => navigate('/transactions')}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #4a90e2, #357abd)',
            border: 'none',
            borderRadius: '12px',
            padding: '14px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Back to Transactions
        </button>
      </div>
    </div>
  );
}

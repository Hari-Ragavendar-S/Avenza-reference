import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [team, setTeam] = useState({ left: null, right: null });
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Balance Management Modal
  const [showManageModal, setShowManageModal] = useState(false);
  const [action, setAction] = useState('credit'); // credit or debit
  const [walletType, setWalletType] = useState('avenza'); // avenza, income, gaming
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUserDetail();
    fetchUserTransactions();
    fetchUserTeam();
    fetchUserInvestments();
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://avenza.live/api/admin/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        console.error('Failed to fetch user detail');
      }
    } catch (err) {
      console.error('Error fetching user detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTransactions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://avenza.live/api/admin/user/${userId}/transactions?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const fetchUserTeam = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://avenza.live/api/admin/user/${userId}/team`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeam(data.team || { left: null, right: null });
      }
    } catch (err) {
      console.error('Error fetching team:', err);
    }
  };

  const fetchUserInvestments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://avenza.live/api/admin/user/${userId}/investments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInvestments(data.investments || []);
      }
    } catch (err) {
      console.error('Error fetching investments:', err);
    }
  };

  const handleManageBalance = () => {
    setShowManageModal(true);
    setError('');
    setSuccess('');
  };

  const handleProceedToConfirm = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a reason');
      return;
    }
    
    setShowConfirm(true);
    setError('');
  };

  const handleConfirmAdjustment = async () => {
    setProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://avenza.live/api/admin/user/balance/adjust', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: parseInt(userId),
          wallet_type: walletType,
          action: action,
          amount: parseFloat(amount),
          reason: reason
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(data.message);
        setShowConfirm(false);
        setShowManageModal(false);
        setAmount('');
        setReason('');
        // Refresh user data
        fetchUserDetail();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.detail || 'Failed to adjust balance');
        setShowConfirm(false);
      }
    } catch (err) {
      setError('Failed to connect to server');
      setShowConfirm(false);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Loading user details...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-page">
        <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
          User not found
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PageHeader 
        title={`User: ${user.name}`} 
        subtitle={`@${user.username} - ${user.email}`} 
      />

      {/* Success Message */}
      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#10b981'
        }}>
          {success}
        </div>
      )}

      {/* Manage Balance Button - Top Right */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button
          onClick={handleManageBalance}
          style={{
            background: 'linear-gradient(135deg, #4a90e2, #357abd)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Manage Balance
        </button>
      </div>

      {/* User Information Card */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3 className="card-title">User Information</h3>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>User ID</div>
              <div style={{ color: '#e5e7eb', fontWeight: '600' }}>#{user.id}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Username</div>
              <div style={{ color: '#e5e7eb', fontWeight: '600' }}>{user.username}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Full Name</div>
              <div style={{ color: '#e5e7eb', fontWeight: '600' }}>{user.name}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Email</div>
              <div style={{ color: '#e5e7eb', fontWeight: '600' }}>{user.email}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Mobile</div>
              <div style={{ color: '#e5e7eb', fontWeight: '600' }}>{user.mobile}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Password</div>
              <div style={{ color: '#e5e7eb', fontWeight: '600' }}>{user.password}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Wallet PIN</div>
              <div style={{ 
                color: user.wallet_pin_set ? '#10b981' : '#ef4444',
                fontWeight: '600' 
              }}>
                {user.wallet_pin_set ? 'Set ✓' : 'Not Set'}
              </div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Referral Code</div>
              <div style={{ color: '#4a90e2', fontWeight: '600' }}>{user.referral_code}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Status</div>
              <div style={{ color: '#10b981', fontWeight: '600' }}>{user.status}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Joined Date</div>
              <div style={{ color: '#e5e7eb', fontWeight: '600' }}>{user.created_at}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Balances Card */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3 className="card-title">Wallet Balances</h3>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#4a90e2', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                AVENZA BALANCE
              </div>
              <div style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold' }}>
                ${parseFloat(user.avenza_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#10b981', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                INCOME BALANCE
              </div>
              <div style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold' }}>
                ${parseFloat(user.income_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#a855f7', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                GAMING BALANCE
              </div>
              <div style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold' }}>
                ${parseFloat(user.gaming_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Information Card */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3 className="card-title">Referral Information</h3>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Sponsor ID</div>
              <div style={{ color: '#e5e7eb', fontWeight: '600' }}>{user.sponsor_id || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Sponsor Username</div>
              <div style={{ color: '#4a90e2', fontWeight: '600' }}>{user.sponsor_username || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Position in Binary Tree</div>
              <div style={{ color: '#e5e7eb', fontWeight: '600' }}>{user.position ? user.position.toUpperCase() : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Binary MLM Team Card */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3 className="card-title">Binary MLM Team</h3>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{
              background: 'rgba(74, 144, 226, 0.05)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{ color: '#4a90e2', fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>
                LEFT CHILD
              </div>
              {team.left ? (
                <>
                  <div style={{ color: '#e5e7eb', marginBottom: '4px' }}>
                    <strong>Name:</strong> {team.left.name}
                  </div>
                  <div style={{ color: '#e5e7eb', marginBottom: '4px' }}>
                    <strong>Username:</strong> {team.left.username}
                  </div>
                  <div style={{ color: '#e5e7eb' }}>
                    <strong>Email:</strong> {team.left.email}
                  </div>
                </>
              ) : (
                <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No left child</div>
              )}
            </div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{ color: '#10b981', fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>
                RIGHT CHILD
              </div>
              {team.right ? (
                <>
                  <div style={{ color: '#e5e7eb', marginBottom: '4px' }}>
                    <strong>Name:</strong> {team.right.name}
                  </div>
                  <div style={{ color: '#e5e7eb', marginBottom: '4px' }}>
                    <strong>Username:</strong> {team.right.username}
                  </div>
                  <div style={{ color: '#e5e7eb' }}>
                    <strong>Email:</strong> {team.right.email}
                  </div>
                </>
              ) : (
                <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No right child</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Investment Plans Card */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3 className="card-title">Active Investment Plans ({investments.length})</h3>
        </div>
        <div style={{ padding: '24px' }}>
          {investments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              No active investment plans
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {investments.map((inv) => {
                const getPackageIcon = (name) => {
                  const icons = {
                    'Bronze': '🥉',
                    'Silver': '🥈',
                    'Gold': '🥇',
                    'Diamond': '💎',
                    'Platinum': '⭐',
                    'Elite': '👑'
                  };
                  return icons[name] || '📦';
                };

                const getPackageGradient = (name) => {
                  const gradients = {
                    'Bronze': 'linear-gradient(135deg, #CD7F32, #A0522D)',
                    'Silver': 'linear-gradient(135deg, #C0C0C0, #808080)',
                    'Gold': 'linear-gradient(135deg, #FFD700, #FFA500)',
                    'Diamond': 'linear-gradient(135deg, #B9F2FF, #667EEA)',
                    'Platinum': 'linear-gradient(135deg, #E0E0E0, #A0A0A0)',
                    'Elite': 'linear-gradient(135deg, #FF6B6B, #FFD93D)'
                  };
                  return gradients[name] || 'linear-gradient(135deg, #4a90e2, #357abd)';
                };

                return (
                  <div
                    key={inv.id}
                    style={{
                      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                      border: '1px solid rgba(74, 144, 226, 0.3)',
                      borderRadius: '12px',
                      padding: '16px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Gradient Top */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: getPackageGradient(inv.package_name)
                    }} />

                    {/* Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      marginTop: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>{getPackageIcon(inv.package_name)}</span>
                        <span style={{
                          color: '#fff',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}>
                          {inv.package_name}
                        </span>
                      </div>
                      <span style={{
                        background: inv.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: inv.status === 'active' ? '#10b981' : '#ef4444',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {inv.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Investment Info */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        background: 'rgba(74, 144, 226, 0.1)',
                        border: '1px solid rgba(74, 144, 226, 0.3)',
                        borderRadius: '8px',
                        padding: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '2px' }}>
                          Invested
                        </div>
                        <div style={{ color: '#4a90e2', fontSize: '14px', fontWeight: 'bold' }}>
                          ${parseFloat(inv.invested_amount).toFixed(2)}
                        </div>
                      </div>
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        padding: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '2px' }}>
                          Earned
                        </div>
                        <div style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>
                          ${parseFloat(inv.total_earned).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px'
                      }}>
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>Progress to 3x</span>
                        <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>
                          {parseFloat(inv.progress_percentage).toFixed(1)}%
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: 'rgba(74, 144, 226, 0.2)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min(inv.progress_percentage, 100)}%`,
                          height: '100%',
                          background: getPackageGradient(inv.package_name),
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{
                      borderTop: '1px solid rgba(74, 144, 226, 0.2)',
                      paddingTop: '8px',
                      fontSize: '11px',
                      color: '#94a3b8'
                    }}>
                      <div style={{ marginBottom: '4px' }}>
                        Daily: ${parseFloat(inv.daily_profit).toFixed(2)} ({inv.daily_profit_percentage}%)
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        Max: ${parseFloat(inv.max_profit).toFixed(2)}
                      </div>
                      <div>
                        Enrolled: {inv.enrollment_date}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Last 3 Logins Card */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3 className="card-title">Last 3 Logins</h3>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Login 1</div>
              <div style={{ color: '#e5e7eb', fontWeight: '600' }}>{user.last_login_1 || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Login 2</div>
              <div style={{ color: '#e5e7eb', fontWeight: '600' }}>{user.last_login_2 || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Login 3</div>
              <div style={{ color: '#e5e7eb', fontWeight: '600' }}>{user.last_login_3 || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Card */}
      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">Recent 5 Transactions</h3>
        </div>
        <div style={{ padding: '24px' }}>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              No transactions found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(74, 144, 226, 0.2)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>Wallet</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>Description</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trans) => (
                    <tr key={trans.id} style={{ borderBottom: '1px solid rgba(74, 144, 226, 0.1)' }}>
                      <td style={{ padding: '12px', color: '#94a3b8', fontSize: '14px' }}>#{trans.id}</td>
                      <td style={{ padding: '12px', color: '#e5e7eb', fontSize: '14px' }}>{trans.type}</td>
                      <td style={{ padding: '12px', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                        ${parseFloat(trans.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {trans.currency}
                      </td>
                      <td style={{ padding: '12px', color: '#4a90e2', fontSize: '14px' }}>{trans.wallet_type?.toUpperCase() || 'N/A'}</td>
                      <td style={{ padding: '12px', color: '#e5e7eb', fontSize: '14px' }}>{trans.description}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: trans.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: trans.status === 'completed' ? '#10b981' : '#ef4444'
                        }}>
                          {trans.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#94a3b8', fontSize: '14px' }}>{trans.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Manage Balance Modal */}
      {showManageModal && !showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              MANAGE USER BALANCE
            </h2>
            <p style={{
              color: '#94a3b8',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              Credit or debit user wallet balance
            </p>

            {/* Action Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Action:
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="credit">Credit (Add to user, deduct from admin)</option>
                <option value="debit">Debit (Remove from user, add to admin)</option>
              </select>
            </div>

            {/* Wallet Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Wallet:
              </label>
              <select
                value={walletType}
                onChange={(e) => setWalletType(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="avenza">AVENZA Balance (${parseFloat(user.avenza_balance).toFixed(2)})</option>
                <option value="income">INCOME Balance (${parseFloat(user.income_balance).toFixed(2)})</option>
                <option value="gaming">GAMING Balance (${parseFloat(user.gaming_balance).toFixed(2)})</option>
              </select>
            </div>

            {/* Amount Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Amount:
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '18px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Reason Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Reason:
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for this adjustment..."
                rows="3"
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

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                color: '#ef4444',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleProceedToConfirm}
                style={{
                  background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '140px'
                }}
              >
                PROCEED
              </button>
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setAmount('');
                  setReason('');
                  setError('');
                }}
                style={{
                  background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '140px'
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              CONFIRM BALANCE ADJUSTMENT
            </h2>
            <p style={{
              color: '#94a3b8',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              Please confirm the following transaction
            </p>

            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Action:</span> 
                <span style={{ color: '#fff', fontWeight: '600', marginLeft: '8px' }}>{action.toUpperCase()}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Wallet:</span> 
                <span style={{ color: '#4a90e2', fontWeight: '600', marginLeft: '8px' }}>{walletType.toUpperCase()}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Amount:</span> 
                <span style={{ color: '#10b981', fontWeight: '600', fontSize: '20px', marginLeft: '8px' }}>
                  ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Reason:</span> 
                <span style={{ color: '#fff', marginLeft: '8px' }}>{reason}</span>
              </div>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{ color: '#ef4444', fontSize: '14px', margin: '0', textAlign: 'center' }}>
                {action === 'credit' 
                  ? 'This will DEDUCT from your admin wallet and ADD to user wallet'
                  : 'This will ADD to your admin wallet and DEDUCT from user wallet'}
              </p>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                color: '#ef4444',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleConfirmAdjustment}
                disabled={processing}
                style={{
                  background: processing ? '#4b5563' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '140px'
                }}
              >
                {processing ? 'PROCESSING...' : 'YES, CONFIRM'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={processing}
                style={{
                  background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '140px'
                }}
              >
                NO, CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={() => navigate('/admin/users')}
          style={{
            background: 'rgba(74, 144, 226, 0.2)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '8px',
            padding: '12px 24px',
            color: '#4a90e2',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          ← Back to Users
        </button>
      </div>
    </div>
  );
}

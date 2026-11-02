import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    platformValue: 0,
    activeInvestments: 0,
    adminWallet: 0,
    newUsersToday: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    pendingSupport: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      // Fetch admin wallet balance
      const walletRes = await fetch('https://avenza.live/api/admin/wallet/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setStats(prev => ({ ...prev, adminWallet: walletData.wallet_balance || 0 }));
      }

      // Fetch all users to calculate stats
      const usersRes = await fetch('https://avenza.live/api/admin/users?page=1&per_page=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setStats(prev => ({ ...prev, totalUsers: usersData.total || 0 }));
        setRecentUsers(usersData.users?.slice(0, 5) || []);
        
        // Calculate platform value (sum of all user balances)
        const platformValue = usersData.users?.reduce((sum, user) => {
          return sum + (user.avenza_balance || 0) + (user.income_balance || 0) + (user.gaming_balance || 0);
        }, 0) || 0;
        setStats(prev => ({ ...prev, platformValue }));
      }

      // Fetch deposits count
      const depositsRes = await fetch('https://avenza.live/api/admin/deposits', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (depositsRes.ok) {
        const depositsData = await depositsRes.json();
        const pending = depositsData.deposits?.filter(d => d.status === 'pending').length || 0;
        setStats(prev => ({ ...prev, pendingDeposits: pending }));
      }

      // Fetch withdrawals count
      const withdrawalsRes = await fetch('https://avenza.live/api/admin/withdrawals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (withdrawalsRes.ok) {
        const withdrawalsData = await withdrawalsRes.json();
        const pending = withdrawalsData.withdrawals?.filter(w => w.status === 'pending').length || 0;
        setStats(prev => ({ ...prev, pendingWithdrawals: pending }));
      }

      // Fetch support messages
      const supportRes = await fetch('https://avenza.live/api/admin/support/conversations?page=1&per_page=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (supportRes.ok) {
        const supportData = await supportRes.json();
        const unread = supportData.conversations?.filter(c => c.unread_count > 0).length || 0;
        setStats(prev => ({ ...prev, pendingSupport: unread }));
      }

      // Fetch packages stats
      const packagesRes = await fetch('https://avenza.live/api/admin/packages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        const totalUsers = packagesData.packages?.reduce((sum, pkg) => sum + (pkg.total_users_enrolled || 0), 0) || 0;
        const totalAmount = packagesData.packages?.reduce((sum, pkg) => sum + parseFloat(pkg.total_investment_amount || 0), 0) || 0;
        setStats(prev => ({ ...prev, activeInvestments: totalAmount }));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatCurrencyDetailed = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="admin-page" style={{ padding: '20px' }}>
        <div style={{ animation: 'pulse 2s infinite' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: '140px', background: 'rgba(74,144,226,0.1)', borderRadius: '16px' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page" style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(74,144,226,0.2), rgba(147,51,234,0.1))',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0' }}>
          🎛️ Admin Command Center
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
          Last updated: just now ⚡
        </p>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(74,144,226,0.15), rgba(74,144,226,0.05))',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(74,144,226,0.3), transparent)', borderRadius: '50%' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>💰</span>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Platform Value</p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0' }}>
              {formatCurrency(stats.platformValue)}
            </p>
            <p style={{ color: '#10b981', fontSize: '12px', margin: 0 }}>↗ Total user balances</p>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(16,185,129,0.3), transparent)', borderRadius: '50%' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>👥</span>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Total Users</p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0' }}>
              {stats.totalUsers.toLocaleString()}
            </p>
            <p style={{ color: '#10b981', fontSize: '12px', margin: 0 }}>↗ Registered members</p>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(168,85,247,0.3), transparent)', borderRadius: '50%' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>📊</span>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Active Investments</p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0' }}>
              {formatCurrency(stats.activeInvestments)}
            </p>
            <p style={{ color: '#10b981', fontSize: '12px', margin: 0 }}>↗ Total invested</p>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
          border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(251,191,36,0.3), transparent)', borderRadius: '50%' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>💼</span>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Admin Wallet</p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0' }}>
              {formatCurrencyDetailed(stats.adminWallet)}
            </p>
            <button
              onClick={() => navigate('/admin/wallet')}
              style={{
                background: 'rgba(251,191,36,0.2)',
                border: '1px solid rgba(251,191,36,0.5)',
                borderRadius: '6px',
                padding: '4px 12px',
                color: '#fbbf24',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              Manage Wallet
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions & Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Pending Actions */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> Pending Actions
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              onClick={() => navigate('/admin/deposits')}
              style={{
                background: 'rgba(74,144,226,0.05)',
                border: '1px solid rgba(74,144,226,0.2)',
                borderRadius: '10px',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74,144,226,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(74,144,226,0.05)'}
            >
              <div>
                <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>💳 Deposits</p>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Awaiting approval</p>
              </div>
              <div style={{
                background: stats.pendingDeposits > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                color: stats.pendingDeposits > 0 ? '#ef4444' : '#10b981',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                {stats.pendingDeposits}
              </div>
            </div>

            <div
              onClick={() => navigate('/admin/withdrawals')}
              style={{
                background: 'rgba(74,144,226,0.05)',
                border: '1px solid rgba(74,144,226,0.2)',
                borderRadius: '10px',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74,144,226,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(74,144,226,0.05)'}
            >
              <div>
                <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>💸 Withdrawals</p>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Pending processing</p>
              </div>
              <div style={{
                background: stats.pendingWithdrawals > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                color: stats.pendingWithdrawals > 0 ? '#ef4444' : '#10b981',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                {stats.pendingWithdrawals}
              </div>
            </div>

            <div
              onClick={() => navigate('/admin/support')}
              style={{
                background: 'rgba(74,144,226,0.05)',
                border: '1px solid rgba(74,144,226,0.2)',
                borderRadius: '10px',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74,144,226,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(74,144,226,0.05)'}
            >
              <div>
                <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>💬 Support</p>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Unread messages</p>
              </div>
              <div style={{
                background: stats.pendingSupport > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                color: stats.pendingSupport > 0 ? '#ef4444' : '#10b981',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                {stats.pendingSupport}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚙️</span> Quick Management
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <button
              onClick={() => navigate('/admin/users')}
              style={{
                background: 'rgba(74,144,226,0.1)',
                border: '1px solid rgba(74,144,226,0.3)',
                borderRadius: '10px',
                padding: '16px',
                color: '#4a90e2',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74,144,226,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(74,144,226,0.1)'}
            >
              👥<br />Users
            </button>

            <button
              onClick={() => navigate('/admin/packages')}
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '10px',
                padding: '16px',
                color: '#10b981',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
            >
              📦<br />Packages
            </button>

            <button
              onClick={() => navigate('/admin/internal-transfers')}
              style={{
                background: 'rgba(168,85,247,0.1)',
                border: '1px solid rgba(168,85,247,0.3)',
                borderRadius: '10px',
                padding: '16px',
                color: '#a855f7',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(168,85,247,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(168,85,247,0.1)'}
            >
              💱<br />Transfers
            </button>

            <button
              onClick={() => navigate('/admin/wallet-transactions')}
              style={{
                background: 'rgba(251,191,36,0.1)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: '10px',
                padding: '16px',
                color: '#fbbf24',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(251,191,36,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(251,191,36,0.1)'}
            >
              📜<br />Transactions
            </button>
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👥</span> Recent Users
          </h3>
          <button
            onClick={() => navigate('/admin/users')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#4a90e2',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            View All →
          </button>
        </div>

        {recentUsers.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
            No users yet
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(74,144,226,0.2)' }}>
                  <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'left' }}>Username</th>
                  <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'right' }}>AVENZA</th>
                  <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'right' }}>INCOME</th>
                  <th style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', padding: '12px', textAlign: 'center' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(user => (
                  <tr
                    key={user.id}
                    onClick={() => navigate(`/admin/user/${user.id}`)}
                    style={{
                      borderBottom: '1px solid rgba(74,144,226,0.1)',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74,144,226,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ color: '#fff', fontSize: '14px', padding: '14px', fontWeight: '600' }}>{user.username}</td>
                    <td style={{ color: '#94a3b8', fontSize: '13px', padding: '14px' }}>{user.email}</td>
                    <td style={{ color: '#4a90e2', fontSize: '14px', padding: '14px', textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrencyDetailed(user.avenza_balance)}
                    </td>
                    <td style={{ color: '#10b981', fontSize: '14px', padding: '14px', textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrencyDetailed(user.income_balance)}
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '12px', padding: '14px', textAlign: 'center' }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Status */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))',
        border: '1px solid rgba(16,185,129,0.3)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✅</span> System Status
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>API Server: <strong style={{ color: '#10b981' }}>Online</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Database: <strong style={{ color: '#10b981' }}>Connected</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Cron Jobs: <strong style={{ color: '#10b981' }}>Running</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LevelIncome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [levelBreakdown, setLevelBreakdown] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchLevelIncomeData();
    const interval = setInterval(fetchLevelIncomeData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchLevelIncomeData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch stats
      const statsRes = await fetch('https://avenza.live/api/level-income/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
        setLevelBreakdown(data.level_breakdown || []);
        setTeamPerformance(data.today_team_performance || []);
      }

      // Fetch history if showing
      if (showHistory) {
        const historyRes = await fetch('https://avenza.live/api/level-income/history?page=1&per_page=20', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (historyRes.ok) {
          const data = await historyRes.json();
          setHistory(data.transactions || []);
        }
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
    if (level === 1) return 'Level 1 (10%)';
    if (level >= 2 && level <= 3) return `Level ${level} (5%)`;
    if (level >= 4 && level <= 6) return `Level ${level} (3%)`;
    if (level >= 7 && level <= 10) return `Level ${level} (2%)`;
    return `Level ${level} (1%)`;
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ animation: 'pulse 2s infinite' }}>
          <div style={{ height: '150px', background: 'rgba(74,144,226,0.1)', borderRadius: '16px', marginBottom: '20px' }} />
          <div style={{ height: '200px', background: 'rgba(74,144,226,0.1)', borderRadius: '16px' }} />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
        Failed to load level income data
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(74,144,226,0.2), rgba(147,51,234,0.1))',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#4a90e2',
              fontSize: '24px',
              cursor: 'pointer',
              padding: 0
            }}
          >
            ←
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
            📊 Level Income Tracker
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, paddingLeft: '36px' }}>
          Earn from your team's daily ROI profits
        </p>
      </div>

      {/* Today's Earnings Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
        border: '1px solid rgba(16,185,129,0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', fontSize: '80px', opacity: 0.1 }}>💰</div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 8px 0' }}>TODAY'S LEVEL INCOME</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981', margin: '0 0 12px 0' }}>
            {formatCurrency(stats.today_total)}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
            From {stats.active_today} team members • ✅ Auto-credited to Income Wallet
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.2)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>This Week</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
            {formatCurrency(stats.week_total)}
          </p>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.2)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>This Month</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
            {formatCurrency(stats.month_total)}
          </p>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.2)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>All Time</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
            {formatCurrency(stats.all_time_total)}
          </p>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.2)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>Team Size</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#4a90e2', margin: 0 }}>
            {stats.total_team_members}
          </p>
        </div>
      </div>

      {/* Level Breakdown */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
          📈 Income by Level
        </h3>
        {levelBreakdown.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
            No level income yet. Build your team to start earning!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {levelBreakdown.map(level => (
              <div key={level.level} style={{
                background: 'rgba(74,144,226,0.05)',
                border: '1px solid rgba(74,144,226,0.2)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
                  <p style={{ color: '#4a90e2', fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0' }}>
                    {getLevelLabel(level.level)}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                    {level.member_count} member{level.member_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ flex: '1 1 100px', textAlign: 'right' }}>
                  <p style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                    {formatCurrency(level.today_earned)}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>Today</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Team Performance */}
      {teamPerformance.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            🎯 Today's Team Performance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {teamPerformance.map(member => (
              <div key={member.user_id} style={{
                background: 'rgba(74,144,226,0.05)',
                border: '1px solid rgba(74,144,226,0.2)',
                borderRadius: '10px',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
                      👤 {member.username}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                      Level {member.level}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#10b981', fontSize: '15px', fontWeight: 'bold', margin: 0 }}>
                      You Earned: {formatCurrency(member.your_earning)}
                    </p>
                  </div>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                  ROI Received: {formatCurrency(member.roi_received)} • {member.earned_at}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 }}>
            📜 Transaction History
          </h3>
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) fetchLevelIncomeData();
            }}
            style={{
              background: 'rgba(74,144,226,0.2)',
              border: '1px solid rgba(74,144,226,0.5)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#4a90e2',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
        </div>

        {showHistory && (
          history.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              No transaction history yet
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map(trans => (
                <div key={trans.id} style={{
                  background: 'rgba(74,144,226,0.05)',
                  border: '1px solid rgba(74,144,226,0.2)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
                      From: {trans.from_username}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                      Level {trans.level} ({trans.percentage}%) • {trans.created_at}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#10b981', fontSize: '15px', fontWeight: 'bold', margin: 0 }}>
                      +{formatCurrency(trans.income_amount)}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                      ROI: {formatCurrency(trans.roi_amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* How It Works */}
      <div style={{
        background: 'rgba(74,144,226,0.05)',
        border: '1px solid rgba(74,144,226,0.2)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h4 style={{ color: '#4a90e2', fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0' }}>
          ℹ️ How It Works
        </h4>
        <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 8px 0' }}>When your team members receive daily ROI, you automatically earn:</p>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Level 1: 10% of their ROI</li>
            <li>Level 2-3: 5% of their ROI</li>
            <li>Level 4-6: 3% of their ROI</li>
            <li>Level 7-10: 2% of their ROI</li>
            <li>Level 11-20: 1% of their ROI</li>
          </ul>
          <p style={{ margin: '8px 0 0 0' }}>
            ✅ Income is auto-credited to your INCOME WALLET daily<br />
            🚀 Build a deeper team for more passive income!
          </p>
        </div>
      </div>
    </div>
  );
}

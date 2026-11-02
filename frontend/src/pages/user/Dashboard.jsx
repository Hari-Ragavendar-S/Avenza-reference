import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [investments, setInvestments] = useState([])
  const [transactions, setTransactions] = useState([])
  const [binaryStats, setBinaryStats] = useState(null)
  const [showTooltip, setShowTooltip] = useState(null)
  
  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      // Fetch profile
      const profileRes = await fetch('https://avenza.live/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setProfile(profileData)
      }

      // Fetch investments
      const investRes = await fetch('https://avenza.live/api/investment/my-packages', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (investRes.ok) {
        const investData = await investRes.json()
        setInvestments(investData.investments || [])
      }

      // Fetch recent transactions
      const transRes = await fetch('https://avenza.live/api/transactions?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (transRes.ok) {
        const transData = await transRes.json()
        setTransactions(transData.transactions || [])
      }

      // Fetch binary matching dashboard
      const binaryRes = await fetch('https://avenza.live/api/binary/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (binaryRes.ok) {
        const binaryData = await binaryRes.json()
        setBinaryStats(binaryData)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  const getTransactionIcon = (type) => {
    const icons = {
      deposit: '📥',
      withdrawal: '📤',
      investment_enrollment: '💼',
      daily_profit: '💰',
      transfer_sent: '↗️',
      transfer_received: '↙️',
      admin_credit: '🎁',
      admin_debit: '📉'
    }
    return icons[type] || '💳'
  }

  const InfoTooltip = ({ id, title, content, learnMoreLink }) => {
    const isActive = showTooltip === id
    
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowTooltip(isActive ? null : id)
          }}
          style={{
            background: 'rgba(74,144,226,0.2)',
            border: '1px solid rgba(74,144,226,0.4)',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#4a90e2',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: 0,
            flexShrink: 0
          }}
        >
          ℹ️
        </button>
        
        {isActive && (
          <>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999
              }}
              onClick={() => setShowTooltip(null)}
            />
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              border: '2px solid rgba(74,144,226,0.5)',
              borderRadius: '16px',
              padding: '20px',
              width: '90%',
              maxWidth: '400px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              zIndex: 1000,
              animation: 'slideIn 0.3s ease-out'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h4 style={{ color: '#4a90e2', fontSize: '16px', fontWeight: '600', margin: 0, flex: 1 }}>
                  {title}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowTooltip(null)
                  }}
                  style={{
                    background: 'rgba(239,68,68,0.2)',
                    border: '1px solid rgba(239,68,68,0.4)',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ef4444',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    padding: 0,
                    flexShrink: 0,
                    marginLeft: '12px'
                  }}
                >
                  ×
                </button>
              </div>
              
              <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.8', margin: '0 0 16px 0', whiteSpace: 'pre-wrap' }}>
                {content}
              </p>
              
              {learnMoreLink && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(learnMoreLink)
                    setShowTooltip(null)
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Learn More →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ animation: 'pulse 2s infinite' }}>
          <div style={{ height: '200px', background: 'rgba(74,144,226,0.1)', borderRadius: '16px', marginBottom: '20px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '120px', background: 'rgba(74,144,226,0.1)', borderRadius: '16px' }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return <div style={{ padding: '20px', color: '#94a3b8', textAlign: 'center' }}>Failed to load dashboard</div>
  }

  const totalPortfolio = parseFloat(profile.avenza_balance || 0) + parseFloat(profile.income_balance || 0) + parseFloat(profile.gaming_balance || 0)
  const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.invested_amount || 0), 0)
  const totalEarned = investments.reduce((sum, inv) => sum + parseFloat(inv.total_earned || 0), 0)
  const activePackages = investments.filter(inv => inv.status === 'active').length
  const todayProfit = investments.reduce((sum, inv) => sum + parseFloat(inv.earned_today || 0), 0)

  return (
    <div style={{ padding: '0' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(74,144,226,0.2), rgba(147,51,234,0.1))',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(74,144,226,0.3), transparent)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: '0 0 8px 0' }}>
            Welcome back, {profile.name || profile.username}! 👋
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 24px 0' }}>
            Your investment journey at a glance
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Total Portfolio Value</p>
                <InfoTooltip
                  id="portfolio"
                  title="💰 Total Portfolio Value"
                  content="This is the sum of all your wallets: Avenza Wallet (deposits) + Income Wallet (earnings from packages, matching, level income, referrals) + Gaming Wallet (for trading/AI bot). This shows your complete balance across all accounts."
                  learnMoreLink="/transactions"
                />
              </div>
              <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff', margin: 0 }}>{formatCurrency(totalPortfolio)}</p>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Total ROI</p>
                <InfoTooltip
                  id="roi"
                  title="📈 Return on Investment (ROI)"
                  content="Shows how much profit you've made from your investments as a percentage. Formula: (Total Earned ÷ Total Invested) × 100. Higher percentage means better returns on your money."
                  learnMoreLink="/my-packages"
                />
              </div>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                {totalInvested > 0 ? `+${((totalEarned / totalInvested) * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Active Plans</p>
                <InfoTooltip
                  id="active-plans"
                  title="📦 Active Investment Plans"
                  content="Number of investment packages currently earning profits. Each package pays daily returns until reaching maximum profit (3x). Click 'Learn More' to see all your active packages."
                  learnMoreLink="/my-packages"
                />
              </div>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4a90e2', margin: 0 }}>{activePackages}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(74,144,226,0.15), rgba(74,144,226,0.05))',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/deposit')}
        >
          <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '32px', opacity: 0.3 }}>💎</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <p style={{ color: '#4a90e2', fontSize: '14px', fontWeight: '600', margin: 0 }}>AVENZA WALLET</p>
            <InfoTooltip
              id="avenza-wallet"
              title="💎 Avenza Wallet"
              content="This is your main wallet for deposits. Use it to buy investment packages. Money deposited here is available for investing but cannot be withdrawn directly. Transfer to Income Wallet first to withdraw."
              learnMoreLink="/deposit"
            />
          </div>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', margin: '0 0 16px 0' }}>
            {formatCurrency(profile.avenza_balance)}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/deposit'); }}
            style={{
              background: 'rgba(74,144,226,0.2)',
              border: '1px solid rgba(74,144,226,0.5)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#4a90e2',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            Deposit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/investments'); }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(74,144,226,0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Invest
          </button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/withdraw')}
        >
          <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '32px', opacity: 0.3 }}>💵</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <p style={{ color: '#10b981', fontSize: '14px', fontWeight: '600', margin: 0 }}>INCOME WALLET</p>
            <InfoTooltip
              id="income-wallet"
              title="💵 Income Wallet"
              content="All your earnings land here: Daily package profits (2x), Binary matching bonuses (1x), Level income, Referral bonuses, and Downline matching. You can withdraw funds from this wallet to your bank/crypto."
              learnMoreLink="/transactions"
            />
          </div>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', margin: '0 0 16px 0' }}>
            {formatCurrency(profile.income_balance)}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/withdraw'); }}
            style={{
              background: 'rgba(16,185,129,0.2)',
              border: '1px solid rgba(16,185,129,0.5)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#10b981',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            Withdraw
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/internal-transfer'); }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Transfer
          </button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/market')}
        >
          <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '32px', opacity: 0.3 }}>🎮</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <p style={{ color: '#a855f7', fontSize: '14px', fontWeight: '600', margin: 0 }}>GAMING WALLET</p>
            <InfoTooltip
              id="gaming-wallet"
              title="🎮 Gaming Wallet"
              content="Separate wallet for trading and AI bot activities. Keep your gaming/trading funds separate from main investments. Transfer from Income or Avenza wallet to start trading."
              learnMoreLink="/market"
            />
          </div>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', margin: '0 0 16px 0' }}>
            {formatCurrency(profile.gaming_balance)}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/market'); }}
            style={{
              background: 'rgba(168,85,247,0.2)',
              border: '1px solid rgba(168,85,247,0.5)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#a855f7',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            Trade
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/ai-bot'); }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            AI Bot
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.2)',
          borderRadius: '12px',
          padding: '20px',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/my-packages')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>💸</span>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Today's Profit</p>
            <InfoTooltip
              id="today-profit"
              title="💸 Today's Profit"
              content="Daily earnings from your active investment packages. Each package earns a fixed daily percentage until reaching maximum profit (3x = 2x daily + 1x matching bonus)."
              learnMoreLink="/my-packages"
            />
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
            {formatCurrency(todayProfit)}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.2)',
          borderRadius: '12px',
          padding: '20px',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/investments')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>📦</span>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Total Invested</p>
            <InfoTooltip
              id="total-invested"
              title="📦 Total Invested"
              content="Total amount you've invested in all packages (active, completed, cancelled). This is your initial capital across all investment plans purchased from Avenza Wallet."
              learnMoreLink="/my-packages"
            />
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
            {formatCurrency(totalInvested)}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.2)',
          borderRadius: '12px',
          padding: '20px',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/transactions')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>💰</span>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Total Earned</p>
            <InfoTooltip
              id="total-earned"
              title="💰 Total Earned"
              content="Lifetime earnings from all packages' daily profits. This is the 2x portion of your 3x maximum profit. Does NOT include matching bonuses, level income, or referral bonuses (those are shown separately)."
              learnMoreLink="/transactions"
            />
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
            {formatCurrency(totalEarned)}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.2)',
          borderRadius: '12px',
          padding: '20px',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/my-packages')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>🎯</span>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Active Packages</p>
            <InfoTooltip
              id="active-packages"
              title="🎯 Active Packages"
              content="Number of packages currently earning. Packages stay active until they reach maximum profit (3x). Bronze, Silver, Gold, Platinum, Diamond, and Elite plans available."
              learnMoreLink="/my-packages"
            />
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4a90e2', margin: 0 }}>
            {activePackages}
          </p>
        </div>
      </div>

      {/* Binary Matching Section */}
      {binaryStats && binaryStats.statistics && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚖️</span> Binary Matching
              </h3>
              <InfoTooltip
                id="binary-matching"
                title="⚖️ Binary Matching Bonus"
                content="Earn cash bonuses when your left and right team investments match. The SMALLER leg determines your match. This is the 1x portion of your 3x maximum profit. Build both legs equally to maximize earnings!"
                learnMoreLink="/binary-matching"
              />
            </div>
            <button
              onClick={() => navigate('/binary-matching')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#4a90e2',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              View Details →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Left Business */}
            <div style={{
              background: 'rgba(74,144,226,0.05)',
              border: '1px solid rgba(74,144,226,0.2)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/binary-tree')}
            >
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>⬅️</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Left Business</p>
                <div onClick={(e) => e.stopPropagation()}>
                  <InfoTooltip
                    id="left-business"
                    title="⬅️ Left Business Volume"
                    content="Total investment volume from all members placed on your left side of the binary tree (including spillover from upline). Click to view your complete binary tree structure."
                    learnMoreLink="/binary-tree"
                  />
                </div>
              </div>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#4a90e2', margin: 0 }}>
                {formatCurrency(binaryStats.statistics.total_left_business || 0)}
              </p>
            </div>

            {/* Right Business */}
            <div style={{
              background: 'rgba(168,85,247,0.05)',
              border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/binary-tree')}
            >
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>➡️</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Right Business</p>
                <div onClick={(e) => e.stopPropagation()}>
                  <InfoTooltip
                    id="right-business"
                    title="➡️ Right Business Volume"
                    content="Total investment volume from all members placed on your right side of the binary tree (including spillover from upline). Click to view your complete binary tree structure."
                    learnMoreLink="/binary-tree"
                  />
                </div>
              </div>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#a855f7', margin: 0 }}>
                {formatCurrency(binaryStats.statistics.total_right_business || 0)}
              </p>
            </div>

            {/* Total Matching */}
            <div style={{
              background: 'rgba(16,185,129,0.05)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/matching-history')}
            >
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>💰</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Total Matching Income</p>
                <div onClick={(e) => e.stopPropagation()}>
                  <InfoTooltip
                    id="matching-income"
                    title="💰 Binary Matching Income"
                    content="Total cash bonuses earned from binary matching. When your legs match, you unlock tier rewards ($35 at Level 2, up to $25,000 at Level 10). This is real cash paid to your Income Wallet!"
                    learnMoreLink="/matching-history"
                  />
                </div>
              </div>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                {formatCurrency(binaryStats.statistics.matching_bonus_earned || 0)}
              </p>
            </div>
          </div>

          {/* Matching History */}
          {binaryStats.recent_matches && binaryStats.recent_matches.length > 0 && (
            <>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 12px 0', fontWeight: '600' }}>Recent Matching History</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {binaryStats.recent_matches.map(match => (
                  <div key={match.id} style={{
                    background: 'rgba(74,144,226,0.03)',
                    border: '1px solid rgba(74,144,226,0.15)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ color: '#fff', fontSize: '13px', margin: '0 0 4px 0' }}>
                        L: {formatCurrency(match.carry_forward_left || 0)} | R: {formatCurrency(match.carry_forward_right || 0)}
                      </p>
                      <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                        {match.created_at || 'N/A'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#10b981', fontSize: '16px', fontWeight: '600', margin: '0 0 2px 0' }}>
                        +{formatCurrency(match.bonus_earned || 0)}
                      </p>
                      <p style={{ color: '#94a3b8', fontSize: '10px', margin: 0 }}>
                        Tier: {match.tier_name || 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Investment Overview & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Investments */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '20px',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 }}>📊 Active Investments</h3>
            <button
              onClick={() => navigate('/my-packages')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#4a90e2',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              View All →
            </button>
          </div>

          {investments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>No active investments</p>
              <button
                onClick={() => navigate('/investments')}
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
                Start Investing
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {investments.slice(0, 3).map(inv => (
                <div key={inv.id} style={{
                  background: 'rgba(74,144,226,0.05)',
                  border: '1px solid rgba(74,144,226,0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <p style={{ color: '#fff', fontSize: '15px', fontWeight: '600', margin: 0 }}>{inv.package_name}</p>
                    <span style={{
                      background: inv.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                      color: inv.status === 'active' ? '#10b981' : '#ef4444',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {inv.status}
                    </span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 12px 0' }}>
                    Invested: {formatCurrency(inv.invested_amount)} | Earned: {formatCurrency(inv.total_earned)}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      flex: 1,
                      height: '6px',
                      background: 'rgba(74,144,226,0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${inv.progress_percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #4a90e2, #10b981)',
                        borderRadius: '3px'
                      }} />
                    </div>
                    <span style={{ color: '#4a90e2', fontSize: '12px', fontWeight: '600' }}>
                      {inv.progress_percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '16px',
          padding: '20px',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 }}>🕐 Recent Activity</h3>
            <button
              onClick={() => navigate('/transactions')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#4a90e2',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              View All →
            </button>
          </div>

          {transactions.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '40px 20px' }}>
              No recent transactions
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {transactions.map(trans => (
                <div key={trans.id} style={{
                  background: 'rgba(74,144,226,0.05)',
                  border: '1px solid rgba(74,144,226,0.2)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  overflow: 'hidden'
                }}>
                  <span style={{ fontSize: '24px' }}>{getTransactionIcon(trans.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {trans.description}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                      {trans.created_at}
                    </p>
                  </div>
                  <p style={{
                    color: trans.type.includes('withdrawal') || trans.type.includes('sent') ? '#ef4444' : '#10b981',
                    fontSize: '15px',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    {trans.type.includes('withdrawal') || trans.type.includes('sent') ? '-' : '+'}{formatCurrency(trans.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Referral Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(147,51,234,0.15), rgba(147,51,234,0.05))',
        border: '1px solid rgba(147,51,234,0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '32px' }}>🎁</span>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 }}>Invite & Earn</h3>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
          Share your referral code and earn commissions from your team's investments
        </p>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(147,51,234,0.1)',
            border: '1px solid rgba(147,51,234,0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            flex: 1,
            minWidth: '200px'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>Your Referral Code</p>
            <p style={{ color: '#9333ea', fontSize: '18px', fontWeight: '600', margin: 0, fontFamily: 'monospace' }}>
              {profile.username}
            </p>
          </div>
          <button
            onClick={() => navigate('/referral')}
            style={{
              background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            View Team →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}

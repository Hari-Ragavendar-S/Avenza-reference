import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import RedemptionModal from '../../components/RedemptionModal'

export default function Wallet() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [showRedeemModal, setShowRedeemModal] = useState(false)

  useEffect(() => {
    fetchWalletData()
    fetchTransactions()
  }, [])

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://avenza.live/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Wallet data received:', data) // Debug log
        // Ensure all fields are numbers
        setWallet({
          avenza_balance: parseFloat(data.avenza_balance || 0),
          income_balance: parseFloat(data.income_balance || 0),
          gaming_balance: parseFloat(data.gaming_balance || 0),
          total_balance: parseFloat(data.total_balance || 0)
        })
      }
    } catch (error) {
      console.error('Error fetching wallet:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://avenza.live/api/wallet/transactions?page=1&per_page=10', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>Loading wallet...</p>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#ef4444', fontSize: '16px' }}>Failed to load wallet data</p>
      </div>
    )
  }

  const txTypes = {
    deposit: { label: 'Deposit', color: '#10b981' },
    roi: { label: 'Profit', color: '#4a90e2' },
    commission: { label: 'Commission', color: '#06b6d4' },
    withdrawal: { label: 'Withdrawal', color: '#ef4444' },
    redemption: { label: 'Redemption', color: '#f59e0b' },
    transfer_sent: { label: 'Transfer Out', color: '#ef4444' },
    transfer_received: { label: 'Transfer In', color: '#10b981' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0' }}>AVENZA Wallet</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Manage your wallet and transactions</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/deposit')} style={{ backgroundColor: '#10b981', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '10px 16px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>Deposit</button>
          <button onClick={() => navigate('/withdraw')} style={{ backgroundColor: '#4a90e2', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '10px 16px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>Withdraw</button>
          <button onClick={() => setShowRedeemModal(true)} style={{ backgroundColor: '#f59e0b', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '10px 16px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>💰 Redeem</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #1e2942' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['overview', 'transactions'].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 0', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #4a90e2' : '2px solid transparent', color: tab === t ? '#4a90e2' : '#94a3b8', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {[
            { name: 'AVENZA Wallet', balance: wallet.avenza_balance || 0, color: '#4a90e2', icon: '💰', desc: 'Main balance' },
            { name: 'Income Wallet', balance: wallet.income_balance || 0, color: '#10b981', icon: '📈', desc: 'ROI & commissions', tappable: true },
            { name: 'Gaming Wallet', balance: wallet.gaming_balance || 0, color: '#f59e0b', icon: '🎮', desc: 'Gaming rewards', tappable: true },
          ].map((w, i) => (
            <div 
              key={i} 
              onClick={() => w.tappable && setShowRedeemModal(true)}
              style={{ 
                backgroundColor: '#0f1629', 
                border: `1px solid ${w.color}20`, 
                borderRadius: '16px', 
                padding: '20px',
                cursor: w.tappable ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                ...(w.tappable && { ':hover': { transform: 'translateY(-4px)' } })
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: `${w.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{w.icon}</div>
                <p style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 500, margin: 0 }}>{w.name}</p>
              </div>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>${(w.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                {w.desc}
                {w.tappable && <span style={{ color: w.color, marginLeft: '8px', fontWeight: 'bold' }}>→ Tap to redeem</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Transactions Tab */}
      {tab === 'transactions' && (
        <div style={{ backgroundColor: '#0f1629', border: '1px solid #1e2942', borderRadius: '16px', padding: '20px' }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Transaction History</h2>
          
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>No transactions yet</p>
              <p style={{ color: '#64748b', fontSize: '13px' }}>Your transaction history will appear here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {transactions.map((tx) => {
                const txType = txTypes[tx.type] || { label: tx.type || 'Transaction', color: '#94a3b8' };
                return (
                  <div key={tx.id} style={{ backgroundColor: '#1a2035', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '6px', backgroundColor: `${txType.color}20`, color: txType.color }}>{txType.label}</span>
                      <p style={{ color: '#e2e8f0', fontSize: '14px', margin: '8px 0 4px 0' }}>{tx.description || 'Transaction'}</p>
                      <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>{tx.created_at || 'N/A'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: (tx.amount || 0) >= 0 ? '#10b981' : '#ef4444', fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                        {(tx.amount || 0) >= 0 ? '+' : ''}${Math.abs(tx.amount || 0).toFixed(2)}
                      </p>
                      {tx.balance_after !== undefined && (
                        <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Balance: ${(tx.balance_after || 0).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Redemption Modal */}
      <RedemptionModal
        isOpen={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
        wallet={wallet}
        onSuccess={(data) => {
          alert(data.message)
          fetchWalletData() // Refresh balances
          fetchTransactions() // Refresh transactions
        }}
      />
    </div>
  )
}

import { useState } from 'react'

export default function RedemptionModal({ isOpen, onClose, wallet, onSuccess }) {
  const [step, setStep] = useState(1) // 1: Enter amount, 2: Confirm
  const [fromWallet, setFromWallet] = useState('income')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const availableBalance = fromWallet === 'income' 
    ? (wallet?.income_balance || 0) 
    : (wallet?.gaming_balance || 0)

  const walletName = fromWallet === 'income' ? 'Income Wallet' : 'Gaming Wallet'

  const handleRedeem = async () => {
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://avenza.live/api/wallet/redeem', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from_wallet: fromWallet,
          amount: parseFloat(amount)
        })
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess(data)
        onClose()
        setStep(1)
        setAmount('')
      } else {
        setError(data.detail || 'Redemption failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '2px solid rgba(74,144,226,0.3)',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            color: '#fff',
            fontSize: '24px',
            fontWeight: 'bold',
            margin: 0
          }}>
            {step === 1 ? '💰 Redeem Balance' : '✅ Confirm Redemption'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239,68,68,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#ef4444',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Step 1: Enter Amount */}
        {step === 1 && (
          <>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              marginBottom: '24px'
            }}>
              Transfer balance to your AVENZA Wallet for withdrawal
            </p>

            {/* Select Wallet */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                color: '#e5e7eb',
                fontSize: '14px',
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                From Wallet
              </label>
              <select
                value={fromWallet}
                onChange={(e) => setFromWallet(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(30,41,59,0.5)',
                  border: '2px solid rgba(74,144,226,0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="income">Income Wallet (${(wallet?.income_balance || 0).toFixed(2)})</option>
                <option value="gaming">Gaming Wallet (${(wallet?.gaming_balance || 0).toFixed(2)})</option>
              </select>
            </div>

            {/* Amount Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                color: '#e5e7eb',
                fontSize: '14px',
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                Amount to Redeem (USD)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max={availableBalance}
                  style={{
                    width: '100%',
                    background: 'rgba(30,41,59,0.5)',
                    border: '2px solid rgba(74,144,226,0.3)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => setAmount(availableBalance.toFixed(2))}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(74,144,226,0.2)',
                    border: '1px solid rgba(74,144,226,0.4)',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    color: '#4a90e2',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  MAX
                </button>
              </div>
              <p style={{
                color: '#64748b',
                fontSize: '12px',
                marginTop: '6px'
              }}>
                Available: ${availableBalance.toFixed(2)}
              </p>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
              }}>
                <p style={{ color: '#ef4444', fontSize: '14px', margin: 0 }}>
                  {error}
                </p>
              </div>
            )}

            {/* Next Button */}
            <button
              onClick={() => {
                const amt = parseFloat(amount)
                if (!amt || amt <= 0) {
                  setError('Please enter a valid amount')
                  return
                }
                if (amt > availableBalance) {
                  setError('Insufficient balance')
                  return
                }
                setError('')
                setStep(2)
              }}
              disabled={!amount || parseFloat(amount) <= 0}
              style={{
                width: '100%',
                background: parseFloat(amount) > 0
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'rgba(107,114,128,0.2)',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: parseFloat(amount) > 0 ? 'pointer' : 'not-allowed',
                opacity: parseFloat(amount) > 0 ? 1 : 0.5
              }}
            >
              Next →
            </button>
          </>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <>
            <div style={{
              background: 'rgba(74,144,226,0.1)',
              border: '1px solid rgba(74,144,226,0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <p style={{
                color: '#94a3b8',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                Review your redemption details:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'rgba(30,41,59,0.5)',
                  borderRadius: '8px'
                }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>From:</span>
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>{walletName}</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'rgba(30,41,59,0.5)',
                  borderRadius: '8px'
                }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>To:</span>
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>AVENZA Wallet</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: '8px'
                }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Amount:</span>
                  <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold' }}>
                    ${parseFloat(amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
              }}>
                <p style={{ color: '#ef4444', fontSize: '14px', margin: 0 }}>
                  {error}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'rgba(107,114,128,0.2)',
                  border: '1px solid rgba(107,114,128,0.3)',
                  borderRadius: '12px',
                  padding: '14px',
                  color: '#94a3b8',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
              >
                ← Back
              </button>

              <button
                onClick={handleRedeem}
                disabled={loading}
                style={{
                  flex: 1,
                  background: loading
                    ? 'rgba(74,144,226,0.2)'
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Processing...' : 'Confirm ✓'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

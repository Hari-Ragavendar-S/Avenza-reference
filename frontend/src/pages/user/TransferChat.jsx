import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function TransferChat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [amount, setAmount] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSetPinModal, setShowSetPinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState(0);
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [balance, setBalance] = useState(0);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
    checkWalletPin();
    fetchBalance();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [transfers]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://avenza.live/api/transfer/chat/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setTransfers(data.transfers || []);
      }
    } catch (err) {
      console.error('Error fetching chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkWalletPin = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://avenza.live/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Store PIN status for later use
        localStorage.setItem('walletPinSet', data.wallet_pin_set ? 'true' : 'false');
      }
    } catch (err) {
      console.error('Error checking PIN:', err);
    }
  };

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://avenza.live/api/wallet/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(parseFloat(data.avenza_balance || 0));
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const handleSendClick = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > balance) {
      alert('Insufficient AVENZA balance');
      return;
    }

    const walletPinSet = localStorage.getItem('walletPinSet') === 'true';
    if (!walletPinSet) {
      setShowSetPinModal(true);
    } else {
      setShowPinModal(true);
    }
  };

  const handleSetPin = async () => {
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      alert('PIN must be 4 digits');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://avenza.live/api/user/wallet-pin/set', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pin: newPin })
      });

      if (response.ok) {
        localStorage.setItem('walletPinSet', 'true');
        setShowSetPinModal(false);
        setPin(newPin);
        setNewPin('');
        // Now send the transfer
        sendTransfer(newPin);
      } else {
        const data = await response.json();
        alert(data.detail || 'Failed to set PIN');
      }
    } catch (err) {
      alert('Error setting PIN');
    }
  };

  const handlePinSubmit = () => {
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      alert('PIN must be 4 digits');
      return;
    }
    sendTransfer(pin);
  };

  const sendTransfer = async (pinToUse) => {
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://avenza.live/api/transfer/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiver_id: parseInt(userId),
          amount: parseFloat(amount),
          wallet_pin: pinToUse,
          description: `P2P transfer to ${user?.username}`
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Success - show success modal
        setTransferAmount(parseFloat(amount));
        setAmount('');
        setPin('');
        setShowPinModal(false);
        setShowSuccessModal(true);
        
        // Auto-hide success modal after 2 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          fetchChatHistory();
          fetchBalance();
        }, 2000);
      } else {
        alert(data.detail || 'Transfer failed');
        setPin('');
      }
    } catch (err) {
      alert('Error sending transfer');
    } finally {
      setSending(false);
    }
  };

  const getUserAvatar = (userData) => {
    if (userData?.profile_photo_url) {
      return (
        <img 
          src={userData.profile_photo_url} 
          alt={userData.name}
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
        fontSize: '20px',
        fontWeight: 'bold'
      }}>
        {userData?.username?.charAt(0).toUpperCase()}
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
        Loading chat...
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0f172a'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderBottom: '1px solid rgba(74, 144, 226, 0.3)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={() => navigate('/internal-transfer')}
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
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          overflow: 'hidden'
        }}>
          {getUserAvatar(user)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {user?.name}
          </div>
          <div style={{
            color: '#94a3b8',
            fontSize: '13px'
          }}>
            @{user?.username}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {transfers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#94a3b8'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💸</div>
            <p>No transfers yet</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>
              Start by sending money below
            </p>
          </div>
        ) : (
          transfers.map((transfer) => (
            <div
              key={transfer.id}
              style={{
                display: 'flex',
                justifyContent: transfer.is_sent ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '70%',
                background: transfer.is_sent 
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                  : 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '12px',
                padding: '12px 16px',
                position: 'relative'
              }}>
                <div style={{
                  color: '#fff',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '4px'
                }}>
                  {transfer.is_sent ? '-' : '+'}${parseFloat(transfer.amount).toFixed(2)}
                </div>
                {transfer.description && (
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '13px',
                    marginBottom: '4px'
                  }}>
                    {transfer.description}
                  </div>
                )}
                <div style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '11px'
                }}>
                  {transfer.created_at}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderTop: '1px solid rgba(74, 144, 226, 0.3)',
        padding: '16px 20px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            color: '#94a3b8',
            fontSize: '11px',
            marginBottom: '4px'
          }}>
            Balance: ${balance.toFixed(2)}
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount..."
            step="0.01"
            min="0"
            style={{
              width: '100%',
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              color: '#fff',
              fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>
        <button
          onClick={handleSendClick}
          disabled={!amount || parseFloat(amount) <= 0 || sending}
          style={{
            background: 'linear-gradient(135deg, #4a90e2, #357abd)',
            border: 'none',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            color: '#fff',
            fontSize: '20px',
            cursor: amount && parseFloat(amount) > 0 && !sending ? 'pointer' : 'not-allowed',
            opacity: amount && parseFloat(amount) > 0 && !sending ? 1 : 0.5,
            transition: 'all 0.3s'
          }}
        >
          {sending ? '⏳' : '💸'}
        </button>
      </div>

      {/* Set PIN Modal */}
      {showSetPinModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '2px solid rgba(74, 144, 226, 0.5)',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
            <h3 style={{
              color: '#fff',
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '12px'
            }}>
              Set Wallet PIN
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              marginBottom: '24px'
            }}>
              Create a 4-digit PIN to secure your transfers
            </p>
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.slice(0, 4))}
              placeholder="Enter 4-digit PIN"
              maxLength="4"
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                color: '#fff',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '8px',
                marginBottom: '20px',
                outline: 'none'
              }}
            />
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowSetPinModal(false);
                  setNewPin('');
                }}
                style={{
                  flex: 1,
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#ef4444',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSetPin}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Set PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enter PIN Modal */}
      {showPinModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '2px solid rgba(74, 144, 226, 0.5)',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
            <h3 style={{
              color: '#fff',
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '12px'
            }}>
              Enter Wallet PIN
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              marginBottom: '8px'
            }}>
              Sending ${parseFloat(amount).toFixed(2)} to {user?.username}
            </p>
            <p style={{
              color: '#4a90e2',
              fontSize: '13px',
              marginBottom: '24px'
            }}>
              Enter your 4-digit PIN to confirm
            </p>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 4))}
              placeholder="••••"
              maxLength="4"
              autoFocus
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                color: '#fff',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '8px',
                marginBottom: '20px',
                outline: 'none'
              }}
            />
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPin('');
                }}
                disabled={sending}
                style={{
                  flex: 1,
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#ef4444',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={sending || pin.length !== 4}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: sending || pin.length !== 4 ? 'not-allowed' : 'pointer',
                  opacity: sending || pin.length !== 4 ? 0.5 : 1
                }}
              >
                {sending ? 'Sending...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '2px solid rgba(16, 185, 129, 0.5)',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '3px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '48px',
              animation: 'bounce 0.6s ease-out'
            }}>
              ✓
            </div>
            <h3 style={{
              color: '#10b981',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '12px'
            }}>
              Transfer Successful!
            </h3>
            <p style={{
              color: '#fff',
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              ${transferAmount.toFixed(2)}
            </p>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px'
            }}>
              Sent to {user?.username}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

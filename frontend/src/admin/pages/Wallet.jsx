import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';

export default function Wallet() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Withdrawal Settings State
  const [withdrawalSettings, setWithdrawalSettings] = useState(null);
  const [showWithdrawalEditModal, setShowWithdrawalEditModal] = useState(false);
  const [newWithdrawalMin, setNewWithdrawalMin] = useState('');
  const [newWithdrawalMax, setNewWithdrawalMax] = useState('');
  const [newWithdrawalLimit, setNewWithdrawalLimit] = useState('');
  const [newWithdrawalFee, setNewWithdrawalFee] = useState('');
  const [updatingWithdrawal, setUpdatingWithdrawal] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchWithdrawalSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://avenza.live/api/admin/wallet/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setSettings(data);
      } else {
        setError(data.detail || 'Failed to load settings');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://avenza.live/api/admin/withdrawal/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setWithdrawalSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch withdrawal settings:', err);
    }
  };

  const handleEditClick = () => {
    setNewAddress(settings?.receiver_address || '');
    setShowEditModal(true);
    setError('');
    setSuccess('');
  };

  const handleUpdateAddress = async () => {
    if (!newAddress || !newAddress.startsWith('0x') || newAddress.length !== 42) {
      setError('Invalid wallet address format');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://avenza.live/api/admin/wallet/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          setting_value: newAddress
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Receiver address updated successfully');
        setShowEditModal(false);
        fetchSettings();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.detail || 'Failed to update address');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setUpdating(false);
    }
  };

  const handleWithdrawalSettingsClick = () => {
    setNewWithdrawalMin(withdrawalSettings?.min_amount?.toString() || '10');
    setNewWithdrawalMax(withdrawalSettings?.max_amount?.toString() || '300');
    setNewWithdrawalLimit(withdrawalSettings?.daily_limit_count?.toString() || '1');
    setNewWithdrawalFee(withdrawalSettings?.fee_percentage?.toString() || '10');
    setShowWithdrawalEditModal(true);
    setError('');
    setSuccess('');
  };

  const handleUpdateWithdrawalSettings = async () => {
    const minNum = parseFloat(newWithdrawalMin);
    const maxNum = parseFloat(newWithdrawalMax);
    const limitNum = parseInt(newWithdrawalLimit);
    const feeNum = parseFloat(newWithdrawalFee);
    
    if (isNaN(minNum) || minNum < 0) {
      setError('Minimum amount must be a positive number');
      return;
    }
    if (isNaN(maxNum) || maxNum < minNum) {
      setError('Maximum amount must be greater than minimum');
      return;
    }
    if (isNaN(limitNum) || limitNum < 1) {
      setError('Daily limit must be at least 1');
      return;
    }
    if (isNaN(feeNum) || feeNum < 0 || feeNum > 100) {
      setError('Fee must be between 0 and 100');
      return;
    }

    setUpdatingWithdrawal(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://avenza.live/api/admin/withdrawal/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          min_amount: minNum,
          max_amount: maxNum,
          daily_limit_count: limitNum,
          fee_percentage: feeNum
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Withdrawal settings updated successfully');
        setShowWithdrawalEditModal(false);
        fetchWithdrawalSettings();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.detail || 'Failed to update withdrawal settings');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setUpdatingWithdrawal(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <PageHeader title="AVENZA Wallet" subtitle="Platform wallet management" />
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PageHeader title="AVENZA Wallet Management" subtitle="Configure platform wallet settings" />

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

      {error && !showEditModal && !showWithdrawalEditModal && (
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

      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">USDT BEP20 Receiver Address Configuration</h3>
        </div>
        
        <div style={{ padding: '24px' }}>
          <div style={{
            background: 'rgba(74, 144, 226, 0.05)',
            border: '1px solid rgba(74, 144, 226, 0.2)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <label style={{
              display: 'block',
              color: '#e5e7eb',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '12px'
            }}>
              Current Receiver Address:
            </label>

            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#4a90e2',
              wordBreak: 'break-all'
            }}>
              {settings?.receiver_address}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(74, 144, 226, 0.2)'
            }}>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                  Status
                </div>
                <div style={{ color: '#10b981', fontWeight: '600' }}>
                  Active
                </div>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                  Last Updated
                </div>
                <div style={{ color: '#e5e7eb', fontWeight: '500' }}>
                  {settings?.last_updated || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                  Total Deposits Received
                </div>
                <div style={{ color: '#4a90e2', fontWeight: '600', fontSize: '18px' }}>
                  ${settings?.total_deposits_received?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </div>
              </div>
            </div>

            <button
              onClick={handleEditClick}
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
              Edit Address
            </button>
          </div>
        </div>
      </div>

      {/* Withdrawal Settings Card */}
      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">Withdrawal Settings Configuration</h3>
        </div>
        
        <div style={{ padding: '24px' }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            {withdrawalSettings ? (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px',
                  marginBottom: '24px'
                }}>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                      Withdrawal Fee
                    </div>
                    <div style={{ color: '#ef4444', fontWeight: '600', fontSize: '24px' }}>
                      {withdrawalSettings.fee_percentage}%
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                      Minimum Amount
                    </div>
                    <div style={{ color: '#e5e7eb', fontWeight: '600', fontSize: '20px' }}>
                      ${withdrawalSettings.min_amount}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                      Maximum Amount
                    </div>
                    <div style={{ color: '#e5e7eb', fontWeight: '600', fontSize: '20px' }}>
                      ${withdrawalSettings.max_amount}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                      Daily Limit
                    </div>
                    <div style={{ color: '#e5e7eb', fontWeight: '600', fontSize: '20px' }}>
                      {withdrawalSettings.daily_limit_count} transactions
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                      Status
                    </div>
                    <div style={{ 
                      color: withdrawalSettings.enabled ? '#10b981' : '#ef4444', 
                      fontWeight: '600',
                      fontSize: '16px'
                    }}>
                      {withdrawalSettings.enabled ? 'ENABLED' : 'DISABLED'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                      Wallet Address
                    </div>
                    <div style={{ 
                      color: '#4a90e2', 
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all'
                    }}>
                      {withdrawalSettings.withdrawal_wallet?.substring(0, 10)}...
                      {withdrawalSettings.withdrawal_wallet?.substring(withdrawalSettings.withdrawal_wallet.length - 8)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleWithdrawalSettingsClick}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
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
                  Edit Withdrawal Settings
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                Loading withdrawal settings...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Address Modal */}
      {showEditModal && (
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
              CONFIRM ADDRESS UPDATE
            </h2>
            <p style={{
              color: '#94a3b8',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              Update USDT BEP20 receiver address
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                New USDT BEP20 Receiver Address:
              </label>
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="0x..."
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{ color: '#ef4444', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '600' }}>
                WARNING:
              </p>
              <p style={{ color: '#fca5a5', fontSize: '13px', margin: '0' }}>
                Changing this address will affect all future user deposits. Make sure the new address is correct.
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
                onClick={handleUpdateAddress}
                disabled={updating}
                style={{
                  background: updating ? '#4b5563' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '140px'
                }}
              >
                {updating ? 'UPDATING...' : 'YES, UPDATE'}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setError('');
                }}
                disabled={updating}
                style={{
                  background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: updating ? 'not-allowed' : 'pointer',
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

      {/* Edit Withdrawal Settings Modal */}
      {showWithdrawalEditModal && (
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
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              UPDATE WITHDRAWAL SETTINGS
            </h2>
            <p style={{
              color: '#94a3b8',
              textAlign: 'center',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              Configure all withdrawal parameters
            </p>

            {/* Minimum Amount */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Minimum Withdrawal Amount ($):
              </label>
              <input
                type="number"
                value={newWithdrawalMin}
                onChange={(e) => setNewWithdrawalMin(e.target.value)}
                placeholder="10"
                min="0"
                step="1"
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Maximum Amount */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Maximum Withdrawal Per Day ($):
              </label>
              <input
                type="number"
                value={newWithdrawalMax}
                onChange={(e) => setNewWithdrawalMax(e.target.value)}
                placeholder="300"
                min="0"
                step="1"
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Daily Transaction Limit */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Daily Transaction Limit:
              </label>
              <input
                type="number"
                value={newWithdrawalLimit}
                onChange={(e) => setNewWithdrawalLimit(e.target.value)}
                placeholder="1"
                min="1"
                step="1"
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Fee Percentage */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Withdrawal Fee (Deduction %):
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={newWithdrawalFee}
                  onChange={(e) => setNewWithdrawalFee(e.target.value)}
                  placeholder="10"
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 40px 12px 12px',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  %
                </span>
              </div>
            </div>

            {/* Example Calculation */}
            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{ color: '#4a90e2', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '600' }}>
                📊 Current Settings Summary:
              </p>
              <div style={{ color: '#e5e7eb', fontSize: '13px', lineHeight: '1.6' }}>
                <p style={{ margin: '4px 0' }}>• Minimum: ${newWithdrawalMin || 10}</p>
                <p style={{ margin: '4px 0' }}>• Maximum: ${newWithdrawalMax || 300} per day</p>
                <p style={{ margin: '4px 0' }}>• Daily Limit: {newWithdrawalLimit || 1} transaction(s)</p>
                <p style={{ margin: '4px 0' }}>• Deduction: {newWithdrawalFee || 10}%</p>
                <p style={{ margin: '12px 0 4px 0', color: '#10b981', fontWeight: '600' }}>
                  Example: $100 withdrawal → Fee: ${((parseFloat(newWithdrawalFee) || 10) / 100 * 100).toFixed(2)} → User receives: ${(100 - ((parseFloat(newWithdrawalFee) || 10) / 100 * 100)).toFixed(2)} USDT
                </p>
              </div>
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
                onClick={handleUpdateWithdrawalSettings}
                disabled={updatingWithdrawal}
                style={{
                  background: updatingWithdrawal ? '#4b5563' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: updatingWithdrawal ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '140px'
                }}
              >
                {updatingWithdrawal ? 'UPDATING...' : 'SAVE SETTINGS'}
              </button>
              <button
                onClick={() => {
                  setShowWithdrawalEditModal(false);
                  setError('');
                }}
                disabled={updatingWithdrawal}
                style={{
                  background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: updatingWithdrawal ? 'not-allowed' : 'pointer',
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
    </div>
  );
}

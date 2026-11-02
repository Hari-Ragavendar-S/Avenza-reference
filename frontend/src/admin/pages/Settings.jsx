import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Withdrawal mode state
  const [withdrawalMode, setWithdrawalMode] = useState('automatic');
  const [loadingMode, setLoadingMode] = useState(true);
  const [showModeConfirmModal, setShowModeConfirmModal] = useState(false);
  const [pendingMode, setPendingMode] = useState('');

  // Fetch withdrawal mode on mount
  useEffect(() => {
    fetchWithdrawalMode();
  }, []);

  const fetchWithdrawalMode = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://avenza.live/api/admin/settings/withdrawal-mode', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setWithdrawalMode(data.mode);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal mode:', error);
    } finally {
      setLoadingMode(false);
    }
  };

  const handleModeChange = (newMode) => {
    setPendingMode(newMode);
    setShowModeConfirmModal(true);
  };

  const confirmModeChange = async () => {
    setShowModeConfirmModal(false);
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://avenza.live/api/admin/settings/withdrawal-mode', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mode: pendingMode })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setWithdrawalMode(data.mode);
        setMessage(`✅ Withdrawal mode changed to ${data.mode}`);
      } else {
        setMessage(`❌ ${data.detail || 'Failed to change mode'}`);
      }
    } catch (error) {
      console.error('Mode change error:', error);
      setMessage('❌ Failed to change withdrawal mode');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('❌ Passwords do not match');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (newPassword.length < 6) {
      setMessage('❌ Password must be at least 6 characters');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const confirmPasswordChange = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://avenza.live/api/admin/password/change', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('✅ Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage(`❌ ${data.detail || 'Failed to change password'}`);
      }
    } catch (error) {
      console.error('Password change error:', error);
      setMessage('❌ Failed to change password. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="admin-page">
      <PageHeader title="Settings" subtitle="Admin account settings" />

      {message && (
        <div className={`admin-message ${message.includes('✅') ? 'message-success' : 'message-error'}`}>
          {message}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '450px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              🔒
            </div>
            <h3 style={{
              color: '#fff',
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '12px'
            }}>
              Confirm Password Change
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Are you sure you want to change your admin password? You will need to use the new password for future logins.
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  color: '#ef4444',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmPasswordChange}
                style={{
                  background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Mode Confirmation Modal */}
      {showModeConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '450px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              🔄
            </div>
            <h3 style={{
              color: '#fff',
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '12px'
            }}>
              Change Withdrawal Mode?
            </h3>
            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <p style={{
                color: '#94a3b8',
                fontSize: '13px',
                margin: '0 0 8px 0'
              }}>
                Current: <strong style={{ color: '#4a90e2' }}>{withdrawalMode}</strong>
              </p>
              <p style={{
                color: '#94a3b8',
                fontSize: '13px',
                margin: 0
              }}>
                New: <strong style={{ color: '#10b981' }}>{pendingMode}</strong>
              </p>
            </div>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              {pendingMode === 'manual' ? (
                <>All new withdrawals will require admin approval. Users will submit requests and wait for your approval.</>
              ) : (
                <>Withdrawals will be processed instantly without admin approval.</>
              )}
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowModeConfirmModal(false)}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  color: '#ef4444',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmModeChange}
                style={{
                  background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Mode Settings */}
      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">Withdrawal Settings</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
            Control how withdrawals are processed on the platform
          </p>
          
          {loadingMode ? (
            <p style={{ color: '#94a3b8' }}>Loading...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                onClick={() => handleModeChange('automatic')}
                style={{
                  background: withdrawalMode === 'automatic' ? 'rgba(74, 144, 226, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                  border: withdrawalMode === 'automatic' ? '2px solid #4a90e2' : '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: '2px solid #4a90e2',
                    background: withdrawalMode === 'automatic' ? '#4a90e2' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {withdrawalMode === 'automatic' && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#fff'
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>
                      🤖 Automatic Processing
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                      Withdrawals are processed instantly without admin approval
                    </div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => handleModeChange('manual')}
                style={{
                  background: withdrawalMode === 'manual' ? 'rgba(74, 144, 226, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                  border: withdrawalMode === 'manual' ? '2px solid #4a90e2' : '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: '2px solid #4a90e2',
                    background: withdrawalMode === 'manual' ? '#4a90e2' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {withdrawalMode === 'manual' && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#fff'
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>
                      👤 Manual Approval Required
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                      Admin must approve each withdrawal request
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">Change Password</h3>
        </div>
        <form onSubmit={handlePasswordChange} className="settings-form">
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="settings-submit-btn" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">Account Information</h3>
        </div>
        <div className="account-info">
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">admin@avenza.trade</span>
          </div>
          <div className="info-row">
            <span className="info-label">Role:</span>
            <span className="info-value">Administrator</span>
          </div>
          <div className="info-row">
            <span className="info-label">Last Login:</span>
            <span className="info-value">Sep 2, 2026 at 1:30 PM</span>
          </div>
          <div className="info-row">
            <span className="info-label">Account Status:</span>
            <span className="info-value status-active">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

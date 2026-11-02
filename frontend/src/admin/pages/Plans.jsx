import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';

export default function Plans() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    daily_profit_percentage: '',
    downline_matching_bonus: '',
    status: 'active'
  });
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://avenza.live/api/admin/packages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      amount: pkg.amount,
      daily_profit_percentage: pkg.daily_profit_percentage,
      downline_matching_bonus: pkg.downline_matching_bonus || 0,
      status: pkg.status
    });
    setShowEditModal(true);
    setError('');
    setSuccess('');
  };

  const handleProceedToConfirm = () => {
    // Validate
    if (!formData.name.trim()) {
      setError('Package name is required');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!formData.daily_profit_percentage || parseFloat(formData.daily_profit_percentage) <= 0) {
      setError('Daily profit percentage must be greater than 0');
      return;
    }
    if (formData.downline_matching_bonus && (parseFloat(formData.downline_matching_bonus) < 0 || parseFloat(formData.downline_matching_bonus) > 100)) {
      setError('Downline matching bonus must be between 0 and 100');
      return;
    }

    setError('');
    setShowConfirm(true);
  };

  const handleConfirmUpdate = async () => {
    setUpdating(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://avenza.live/api/admin/package/${editingPackage.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          amount: parseFloat(formData.amount),
          daily_profit_percentage: parseFloat(formData.daily_profit_percentage),
          downline_matching_bonus: parseFloat(formData.downline_matching_bonus),
          status: formData.status
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        setShowConfirm(false);
        setShowEditModal(false);
        fetchPackages();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.detail || 'Failed to update package');
        setShowConfirm(false);
      }
    } catch (err) {
      setError('Failed to connect to server');
      setShowConfirm(false);
    } finally {
      setUpdating(false);
    }
  };

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

  if (loading) {
    return (
      <div className="admin-page">
        <PageHeader title="Investment Plans" subtitle="Manage investment packages" />
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Loading packages...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PageHeader 
        title="Investment Plans" 
        subtitle={`Manage investment plans (${packages.length} plans)`} 
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

      {/* Packages Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '32px' }}>{getPackageIcon(pkg.name)}</div>
                <h3 style={{
                  color: '#fff',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  {pkg.name}
                </h3>
              </div>
              <div style={{
                background: pkg.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: pkg.status === 'active' ? '#10b981' : '#ef4444',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {pkg.status.toUpperCase()}
              </div>
            </div>

            {/* Package Details */}
            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Amount:</span>
                <span style={{ color: '#4a90e2', fontSize: '18px', fontWeight: 'bold' }}>
                  ${parseFloat(pkg.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Daily Profit:</span>
                <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold' }}>
                  {parseFloat(pkg.daily_profit_percentage).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Statistics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>
                  Users Enrolled
                </div>
                <div style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>
                  {pkg.total_users_enrolled}
                </div>
              </div>
              <div style={{
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>
                  Total Investment
                </div>
                <div style={{ color: '#a855f7', fontSize: '16px', fontWeight: 'bold' }}>
                  ${parseFloat(pkg.total_investment_amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div style={{
              borderTop: '1px solid rgba(74, 144, 226, 0.2)',
              paddingTop: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#94a3b8',
                marginBottom: '4px'
              }}>
                <span>Created:</span>
                <span>{pkg.created_at}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#94a3b8'
              }}>
                <span>Updated:</span>
                <span>{pkg.updated_at}</span>
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => handleEditClick(pkg)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              EDIT PACKAGE
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && !showConfirm && (
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
          overflow: 'auto'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            paddingTop: '56px',
            maxWidth: '600px',
            width: '100%',
            position: 'relative',
            maxHeight: '90vh',
            overflow: 'auto',
            margin: 'auto'
          }}>
            {/* Close Button - Fixed at top */}
            <button
              onClick={() => {
                setShowEditModal(false);
                setError('');
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '24px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                lineHeight: '1',
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#dc2626';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ×
            </button>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              EDIT PACKAGE
            </h2>
            <p style={{
              color: '#94a3b8',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              Update package details
            </p>

            {/* Package Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Package Name:
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              />
            </div>

            {/* Amount */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Investment Amount ($):
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                min="0"
                step="0.01"
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
              />
            </div>

            {/* Daily Profit Percentage */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Daily Profit Percentage (%):
              </label>
              <input
                type="number"
                value={formData.daily_profit_percentage}
                onChange={(e) => setFormData({ ...formData, daily_profit_percentage: e.target.value })}
                min="0"
                step="0.01"
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
              />
            </div>

            {/* Downline Matching Bonus */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Downline Matching Bonus (%):
              </label>
              <input
                type="number"
                value={formData.downline_matching_bonus}
                onChange={(e) => setFormData({ ...formData, downline_matching_bonus: e.target.value })}
                min="0"
                max="100"
                step="0.1"
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
              />
            </div>

            {/* Status */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Status:
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Info Box */}
            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <p style={{ color: '#4a90e2', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '600' }}>
                Preview:
              </p>
              <p style={{ color: '#e5e7eb', fontSize: '13px', margin: '0' }}>
                Investment: ${formData.amount || 0}<br/>
                Daily Profit: {formData.daily_profit_percentage || 0}%<br/>
                Daily Amount: ${((parseFloat(formData.amount) || 0) * (parseFloat(formData.daily_profit_percentage) || 0) / 100).toFixed(2)}<br/>
                Downline Bonus: {formData.downline_matching_bonus || 0}%<br/>
                Max Return (3x): ${((parseFloat(formData.amount) || 0) * 3).toFixed(2)}
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
                  setShowEditModal(false);
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
          padding: '20px',
          overflow: 'auto'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            paddingTop: '56px',
            maxWidth: '500px',
            width: '100%',
            position: 'relative',
            maxHeight: '90vh',
            overflow: 'auto',
            margin: 'auto'
          }}>
            {/* Close Button - Fixed at top */}
            <button
              onClick={() => setShowConfirm(false)}
              disabled={updating}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: updating ? 'not-allowed' : 'pointer',
                color: '#fff',
                fontSize: '24px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                lineHeight: '1',
                opacity: updating ? 0.5 : 1,
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
              }}
              onMouseEnter={(e) => {
                if (!updating) {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!updating) {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              ×
            </button>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              CONFIRM PACKAGE UPDATE
            </h2>
            <p style={{
              color: '#94a3b8',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              Please confirm the changes
            </p>

            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Package:</span> 
                <span style={{ color: '#fff', fontWeight: '600', marginLeft: '8px' }}>{formData.name}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Amount:</span> 
                <span style={{ color: '#4a90e2', fontWeight: '600', marginLeft: '8px' }}>
                  ${parseFloat(formData.amount).toFixed(2)}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Daily Profit:</span> 
                <span style={{ color: '#10b981', fontWeight: '600', marginLeft: '8px' }}>
                  {parseFloat(formData.daily_profit_percentage).toFixed(2)}%
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Downline Bonus:</span> 
                <span style={{ color: '#a855f7', fontWeight: '600', marginLeft: '8px' }}>
                  {parseFloat(formData.downline_matching_bonus || 0).toFixed(1)}%
                </span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Status:</span> 
                <span style={{ 
                  color: formData.status === 'active' ? '#10b981' : '#ef4444',
                  fontWeight: '600',
                  marginLeft: '8px'
                }}>
                  {formData.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{ color: '#ef4444', fontSize: '14px', margin: 0, textAlign: 'center' }}>
                ⚠️ These changes will be reflected to all users viewing investment plans
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
                onClick={handleConfirmUpdate}
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
                onClick={() => setShowConfirm(false)}
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
    </div>
  );
}

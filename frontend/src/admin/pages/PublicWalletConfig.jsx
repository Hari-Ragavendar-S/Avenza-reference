import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';

export default function PublicWalletConfig() {
  const [config, setConfig] = useState({
    wallet_address: '',
    secret_phrase: '',
    network: 'BSC'
  });
  const [currentConfig, setCurrentConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCurrentConfig();
  }, []);

  const fetchCurrentConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://avenza.live/api/admin/public-wallet/config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentConfig(data);
      } else if (response.status === 404) {
        // No config yet - that's fine
        setCurrentConfig(null);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateInputs = () => {
    // Validate wallet address
    if (!config.wallet_address || !config.wallet_address.startsWith('0x')) {
      setError('Invalid wallet address. Must start with 0x');
      return false;
    }

    if (config.wallet_address.length < 26) {
      setError('Invalid wallet address length');
      return false;
    }

    // Validate secret phrase
    const words = config.secret_phrase.trim().split(/\s+/);
    if (words.length !== 12) {
      setError('Secret phrase must be exactly 12 words');
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateInputs()) {
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://avenza.live/api/admin/public-wallet/configure', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setShowConfirmModal(false);
        setConfig({ wallet_address: '', secret_phrase: '', network: 'BSC' });
        fetchCurrentConfig();
        
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.detail || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
        Loading configuration...
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PageHeader 
        title="Public Wallet Configuration" 
        subtitle="Configure public deposit wallet address and secret phrase" 
      />

      {/* Success Message */}
      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          color: '#10b981',
          fontSize: '14px'
        }}>
          ✅ {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          color: '#ef4444',
          fontSize: '14px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Current Configuration */}
      {currentConfig && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(16, 185, 129, 0.1))',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            📍 Current Configuration
          </h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
                Wallet Address:
              </p>
              <p style={{
                color: '#4a90e2',
                fontSize: '14px',
                fontFamily: 'monospace',
                fontWeight: '600',
                margin: 0,
                wordBreak: 'break-all'
              }}>
                {currentConfig.wallet_address}
              </p>
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
                Network:
              </p>
              <p style={{ color: '#10b981', fontSize: '14px', fontWeight: '600', margin: 0 }}>
                {currentConfig.network}
              </p>
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
                Last Updated:
              </p>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                {currentConfig.updated_at}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">
            {currentConfig ? '🔧 Update Configuration' : '⚙️ Initial Setup'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Wallet Address */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#e5e7eb',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              Wallet Address *
            </label>
            <input
              type="text"
              value={config.wallet_address}
              onChange={(e) => setConfig({ ...config, wallet_address: e.target.value })}
              placeholder="0x..."
              required
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#fff',
                fontSize: '14px',
                fontFamily: 'monospace',
                outline: 'none'
              }}
            />
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
              The public Ethereum-compatible wallet address
            </p>
          </div>

          {/* Secret Phrase */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#e5e7eb',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              12-Word Secret Phrase *
            </label>
            <textarea
              value={config.secret_phrase}
              onChange={(e) => setConfig({ ...config, secret_phrase: e.target.value })}
              placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
              required
              rows="3"
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#fff',
                fontSize: '14px',
                fontFamily: 'monospace',
                outline: 'none',
                resize: 'vertical'
              }}
            />
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              ⚠️ Keep this phrase secure! It will be encrypted before storage.
            </p>
          </div>

          {/* Network Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#e5e7eb',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              Primary Network *
            </label>
            <select
              value={config.network}
              onChange={(e) => setConfig({ ...config, network: e.target.value })}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="BSC">Binance Smart Chain (BSC) - BEP20</option>
              <option value="ETH">Ethereum (ETH) - ERC20</option>
              <option value="POLYGON">Polygon (MATIC)</option>
            </select>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
              The blockchain monitor will detect deposits on all supported networks
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%',
              background: saving ? '#4b5563' : 'linear-gradient(135deg, #4a90e2, #357abd)',
              border: 'none',
              borderRadius: '8px',
              padding: '14px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {saving ? '⏳ Saving...' : currentConfig ? '🔄 Update Configuration' : '💾 Save Configuration'}
          </button>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
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
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{ textAlign: 'center', fontSize: '64px', marginBottom: '16px' }}>
              ⚠️
            </div>
            <h2 style={{
              color: '#fff',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              Confirm Configuration
            </h2>
            <p style={{
              color: '#94a3b8',
              textAlign: 'center',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              Please review your settings before saving
            </p>

            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                  Wallet Address:
                </p>
                <p style={{
                  color: '#4a90e2',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  margin: 0,
                  wordBreak: 'break-all'
                }}>
                  {config.wallet_address}
                </p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                  Network:
                </p>
                <p style={{ color: '#10b981', fontSize: '13px', fontWeight: '600', margin: 0 }}>
                  {config.network}
                </p>
              </div>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                  Secret Phrase:
                </p>
                <p style={{ color: '#eab308', fontSize: '13px', fontWeight: '600', margin: 0 }}>
                  ●●●●●●●●●●●● (will be encrypted)
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleConfirm}
                disabled={saving}
                style={{
                  flex: 1,
                  background: saving ? '#4b5563' : 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? '⏳ Saving...' : '✅ YES, CONFIRM'}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
                style={{
                  flex: 1,
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#ef4444',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                ❌ CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

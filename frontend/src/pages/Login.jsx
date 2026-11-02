import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageLoader } from '../hooks/usePageLoader';
import PageLoader from '../components/PageLoader';
import '../styles/Auth.css';

function Login() {
  const pageLoading = usePageLoader(3000);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://avenza.live/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletLogin = async (walletType) => {
    setWalletLoading(true);
    setError('');

    try {
      // Check if wallet is available
      if (!window.ethereum && walletType === 'metamask') {
        throw new Error('MetaMask is not installed. Please install MetaMask extension.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet account found');
      }

      const walletAddress = accounts[0];

      // Step 1: Get nonce from backend
      const nonceResponse = await fetch('https://avenza.live/api/auth/wallet-nonce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet_address: walletAddress })
      });

      if (!nonceResponse.ok) {
        const errorData = await nonceResponse.json();
        throw new Error(errorData.detail || 'Failed to get authentication nonce');
      }

      const { message } = await nonceResponse.json();

      // Step 2: Request signature from wallet
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      });

      // Step 3: Login with signature
      const loginResponse = await fetch('https://avenza.live/api/auth/wallet-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature: signature
        })
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(loginData.detail || 'Wallet login failed');
      }

      if (!loginData.success) {
        // Wallet not connected to any account
        setError(loginData.message);
        setShowWalletModal(false);
        return;
      }

      // Store token and user data
      localStorage.setItem('token', loginData.token);
      localStorage.setItem('user', JSON.stringify(loginData.user));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Wallet connection failed');
      setShowWalletModal(false);
    } finally {
      setWalletLoading(false);
    }
  };

  if (pageLoading) return <PageLoader message="SECURING CONNECTION..." />;

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in to access your AVENZA account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="link">Forgot Password?</a>
            </div>

            <button type="submit" className="btn-primary btn-block btn-large" disabled={loading}>
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '24px 0',
            gap: '12px'
          }}>
            <div style={{
              flex: 1,
              height: '1px',
              background: 'rgba(74, 144, 226, 0.3)'
            }}></div>
            <span style={{
              color: '#94a3b8',
              fontSize: '14px',
              fontWeight: '500'
            }}>OR</span>
            <div style={{
              flex: 1,
              height: '1px',
              background: 'rgba(74, 144, 226, 0.3)'
            }}></div>
          </div>

          {/* Wallet Login Button */}
          <button
            type="button"
            onClick={() => setShowWalletModal(true)}
            disabled={walletLoading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '700',
              cursor: walletLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.3s',
              opacity: walletLoading ? 0.6 : 1
            }}
          >
            <span style={{ fontSize: '24px' }}>🔗</span>
            {walletLoading ? 'CONNECTING...' : 'Sign in with Wallet'}
          </button>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register" className="link">Create Account</Link></p>
          </div>
        </div>

        <div className="auth-info">
          <h2>Access Your Trading Platform</h2>
          <ul>
            <li>View your watchlists</li>
            <li>Access trading history</li>
            <li>Customize your experience</li>
            <li>Save your preferences</li>
          </ul>
        </div>
      </div>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '2px solid rgba(74, 144, 226, 0.5)',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                color: '#fff',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                Connect Wallet
              </h2>
              <button
                onClick={() => setShowWalletModal(false)}
                disabled={walletLoading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '28px',
                  cursor: walletLoading ? 'not-allowed' : 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              marginBottom: '24px'
            }}>
              Choose your preferred wallet to sign in
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* MetaMask */}
              <button
                onClick={() => handleWalletLogin('metamask')}
                disabled={walletLoading}
                style={{
                  background: 'rgba(74, 144, 226, 0.1)',
                  border: '2px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: walletLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  opacity: walletLoading ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!walletLoading) {
                    e.currentTarget.style.background = 'rgba(74, 144, 226, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(74, 144, 226, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.3)';
                }}
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                  alt="MetaMask"
                  style={{
                    width: '40px',
                    height: '40px'
                  }}
                />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    MetaMask
                  </div>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '12px'
                  }}>
                    Connect with MetaMask
                  </div>
                </div>
                <div style={{
                  color: '#4a90e2',
                  fontSize: '20px'
                }}>
                  →
                </div>
              </button>

              {/* Trust Wallet */}
              <button
                onClick={() => handleWalletLogin('trust')}
                disabled={walletLoading}
                style={{
                  background: 'rgba(74, 144, 226, 0.1)',
                  border: '2px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: walletLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  opacity: walletLoading ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!walletLoading) {
                    e.currentTarget.style.background = 'rgba(74, 144, 226, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(74, 144, 226, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.3)';
                }}
              >
                <img 
                  src="https://trustwallet.com/assets/images/media/assets/TWT.png" 
                  alt="Trust Wallet"
                  style={{
                    width: '40px',
                    height: '40px'
                  }}
                />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    Trust Wallet
                  </div>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '12px'
                  }}>
                    Connect with Trust Wallet
                  </div>
                </div>
                <div style={{
                  color: '#4a90e2',
                  fontSize: '20px'
                }}>
                  →
                </div>
              </button>

              {/* SafePal */}
              <button
                onClick={() => handleWalletLogin('safePal')}
                disabled={walletLoading}
                style={{
                  background: 'rgba(74, 144, 226, 0.1)',
                  border: '2px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: walletLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  opacity: walletLoading ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!walletLoading) {
                    e.currentTarget.style.background = 'rgba(74, 144, 226, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(74, 144, 226, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.3)';
                }}
              >
                <img 
                  src="https://www.safepal.com/img/logo.png" 
                  alt="SafePal"
                  style={{
                    width: '40px',
                    height: '40px'
                  }}
                />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    SafePal Wallet
                  </div>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '12px'
                  }}>
                    Connect with SafePal
                  </div>
                </div>
                <div style={{
                  color: '#4a90e2',
                  fontSize: '20px'
                }}>
                  →
                </div>
              </button>

              {/* Coinbase Wallet */}
              <button
                onClick={() => handleWalletLogin('coinbase')}
                disabled={walletLoading}
                style={{
                  background: 'rgba(74, 144, 226, 0.1)',
                  border: '2px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: walletLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  opacity: walletLoading ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!walletLoading) {
                    e.currentTarget.style.background = 'rgba(74, 144, 226, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(74, 144, 226, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.3)';
                }}
              >
                <img 
                  src="https://altcoinsbox.com/wp-content/uploads/2023/02/coinbase-wallet-logo.png" 
                  alt="Coinbase Wallet"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px'
                  }}
                />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    Coinbase Wallet
                  </div>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '12px'
                  }}>
                    Connect with Coinbase
                  </div>
                </div>
                <div style={{
                  color: '#4a90e2',
                  fontSize: '20px'
                }}>
                  →
                </div>
              </button>
            </div>

            {walletLoading && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: 'rgba(74, 144, 226, 0.1)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  color: '#4a90e2',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  🔄 Connecting...
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '12px'
                }}>
                  Please sign the message in your wallet
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;

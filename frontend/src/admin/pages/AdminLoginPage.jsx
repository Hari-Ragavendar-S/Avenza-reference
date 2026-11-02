import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSymbol from '../../assets/image/a.png';
import logoName from '../../assets/image/name.png';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://avenza.live/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Store token and admin data
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('admin', JSON.stringify(data.user));

      // Redirect to admin dashboard
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-container">
        {/* Logo Section */}
        <div className="login-logo-section">
          <div className="login-logo">
            <img src={logoSymbol} alt="AVENZA" className="login-logo-symbol" />
            <img src={logoName} alt="AVENZA" className="login-logo-name" />
          </div>
          <p className="login-subtitle">Admin Portal</p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div className="login-header">
            <h2 className="login-title">Admin Login</h2>
            <p className="login-description">Access the administration panel</p>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
            >
              {loading ? 'Signing in...' : 'Sign In as Admin'}
            </button>
          </form>

          <div className="login-footer">
            <button
              onClick={() => navigate('/')}
              className="back-link"
            >
              ← Back to Website
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="security-notice">
          <svg className="security-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure admin access only
        </div>
      </div>
    </div>
  );
}

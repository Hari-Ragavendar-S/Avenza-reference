import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePageLoader } from '../hooks/usePageLoader';
import PageLoader from '../components/PageLoader';
import '../styles/Auth.css';

function Register() {
  const pageLoading = usePageLoader(3000);
  const { referralUsername } = useParams();
  const location = window.location;
  
  // Detect if it's a left or right position link
  const position = location.pathname.endsWith('/left') ? 'left' : 
                   location.pathname.endsWith('/right') ? 'right' : null;
  
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralId: referralUsername || '',
    position: position || '' // Store the binary position
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  useEffect(() => {
    // Auto-fill referral ID from URL parameter
    if (referralUsername) {
      const location = window.location;
      const position = location.pathname.endsWith('/left') ? 'left' : 
                       location.pathname.endsWith('/right') ? 'right' : null;
      
      setFormData(prev => ({
        ...prev,
        referralId: referralUsername,
        position: position || ''
      }));
    }
  }, [referralUsername]);

  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers and underscore';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.referralId || !formData.referralId.trim()) {
      newErrors.referralId = 'Referral username is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Build URL with position as query parameter if it exists
      const url = formData.position 
        ? `https://avenza.live/api/register?position=${formData.position}`
        : 'https://avenza.live/api/register';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          name: formData.name,
          email: formData.email,
          mobile: formData.phone,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          referral_id: formData.referralId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Show welcome modal
      setUserData(data.user);
      setShowWelcome(true);

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      setErrors({ general: err.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <PageLoader message="SETTING UP ACCOUNT..." />;

  // Welcome Modal
  if (showWelcome && userData) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.5s ease-in'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '2px solid rgba(74, 144, 226, 0.5)',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(74, 144, 226, 0.3)',
          animation: 'slideUp 0.5s ease-out'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '20px',
            animation: 'bounce 1s ease-in-out'
          }}>
            🎉
          </div>
          
          <h1 style={{
            color: '#fff',
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            Welcome to AVENZA!
          </h1>
          
          <p style={{
            color: '#94a3b8',
            fontSize: '16px',
            marginBottom: '24px'
          }}>
            Your account has been created successfully
          </p>

          <div style={{
            background: 'rgba(74, 144, 226, 0.1)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{
              color: '#4a90e2',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              USERNAME
            </div>
            <div style={{
              color: '#fff',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>
              {userData.username}
            </div>

            <div style={{
              color: '#4a90e2',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              YOUR REFERRAL LINK
            </div>
            <div style={{
              color: '#10b981',
              fontSize: '16px',
              fontWeight: '600',
              wordBreak: 'break-all'
            }}>
              avenza.live/{userData.username}
            </div>
          </div>

          <div style={{
            color: '#94a3b8',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            Redirecting to your dashboard...
          </div>

          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(74, 144, 226, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #4a90e2, #10b981)',
              animation: 'progress 3s linear forwards'
            }} />
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(30px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Join AVENZA and start your investment journey</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {errors.general && <div className="error-message">{errors.general}</div>}

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a unique username"
                className={errors.username ? 'error' : ''}
              />
              {errors.username && <span className="error-text">{errors.username}</span>}
              <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Your referral link will be: avenza.live/{formData.username || 'username'}
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1234567890"
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="referralId">Referral Username *</label>
              <input
                type="text"
                id="referralId"
                name="referralId"
                value={formData.referralId}
                onChange={handleChange}
                placeholder="Enter referrer username"
                className={errors.referralId ? 'error' : ''}
                readOnly={!!referralUsername}
              />
              {errors.referralId && <span className="error-text">{errors.referralId}</span>}
              {referralUsername && (
                <span style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                  ✓ Referred by: {referralUsername}
                  {formData.position && (
                    <span style={{ 
                      marginLeft: '8px', 
                      padding: '2px 8px', 
                      background: formData.position === 'left' ? '#4a90e2' : '#9333ea',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '11px'
                    }}>
                      {formData.position === 'left' ? '👈 LEFT LEG' : '👉 RIGHT LEG'}
                    </span>
                  )}
                </span>
              )}
            </div>

            <button type="submit" className="btn-primary btn-block btn-large" disabled={loading}>
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" className="link">Sign In</Link></p>
          </div>
        </div>

        <div className="auth-info">
          <h2>Start Your Investment Journey</h2>
          <ul>
            <li>Secure account with binary MLM</li>
            <li>Earn from referrals and investments</li>
            <li>Track your earnings in real-time</li>
            <li>Withdraw anytime to your wallet</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Register;

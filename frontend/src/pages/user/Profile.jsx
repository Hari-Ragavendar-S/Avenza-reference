import { useState, useEffect } from 'react'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: ''
  })

  useEffect(() => {
    fetchProfile()
    
    // Handle window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // First, try to get wallet from localStorage (login session)
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      
      const response = await fetch('https://avenza.live/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Use wallet from localStorage if API doesn't have it (fallback)
        if (!data.wallet_address && userData.wallet_address) {
          data.wallet_address = userData.wallet_address
          data.wallet_type = userData.wallet_type
        }
        
        // API returns ProfileResponse directly (not wrapped)
        setProfile(data)
        setFormData({
          name: data.name || '',
          email: data.email || '',
          mobile: data.mobile || ''
        })
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const showSuccessModal = (message) => {
    setSuccessMessage(message)
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
    }, 2500)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://avenza.live/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showSuccessModal('Profile updated successfully!')
        fetchProfile()
      } else {
        const data = await response.json()
        alert(data.detail || 'Failed to update profile')
      }
    } catch (err) {
      alert('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = localStorage.getItem('token')
      const response = await fetch('https://avenza.live/api/upload/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        
        // Immediately update UI with new photo
        setProfile(prev => ({
          ...prev,
          profile_photo_url: data.file_url
        }))
        
        // Update localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}')
        userData.profile_photo_url = data.file_url
        localStorage.setItem('user', JSON.stringify(userData))
        
        showSuccessModal('Profile photo uploaded successfully!')
        
        // Try to update backend in background (don't wait for it)
        fetch('https://avenza.live/api/user/profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ profile_photo_url: data.file_url })
        }).catch(() => {
          // Silently fail - photo is already showing in UI
          console.log('Background profile update queued')
        })
        
      } else {
        const data = await response.json()
        alert(data.detail || 'Failed to upload photo')
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('Error uploading photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleConnectWallet = async (walletType) => {
    setWalletLoading(true)

    try {
      if (!window.ethereum) {
        alert('Please install MetaMask or another Web3 wallet')
        return
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        alert('No wallet account found')
        return
      }

      const walletAddress = accounts[0]

      // Get nonce
      const nonceResponse = await fetch('https://avenza.live/api/auth/wallet-nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress })
      })

      if (!nonceResponse.ok) {
        const errorData = await nonceResponse.json()
        alert(errorData.detail || 'Failed to get authentication nonce')
        return
      }

      const { message } = await nonceResponse.json()

      // Request signature
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      })

      // Connect wallet
      const token = localStorage.getItem('token')
      const connectResponse = await fetch('https://avenza.live/api/user/connect-wallet', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          wallet_type: walletType,
          signature: signature
        })
      })

      const connectData = await connectResponse.json()

      if (!connectResponse.ok) {
        alert(connectData.detail || 'Failed to connect wallet')
        return
      }

      setShowWalletModal(false)
      showSuccessModal(connectData.message + ' - Reloading...')
      
      // Reload page to refresh all data
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      alert(err.message || 'Wallet connection failed')
    } finally {
      setWalletLoading(false)
    }
  }

  const handleDisconnectWallet = async () => {
    if (!confirm('Are you sure you want to disconnect your wallet?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://avenza.live/api/user/disconnect-wallet', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        showSuccessModal('Wallet disconnected successfully!')
        setTimeout(() => fetchProfile(), 1000)
      } else {
        const data = await response.json()
        alert(data.detail || 'Failed to disconnect wallet')
      }
    } catch (err) {
      alert('Error disconnecting wallet')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>Loading profile...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', maxWidth: '1000px', width: '100%' }}>
      <div>
        <h1 className="page-title" style={{ fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0' }}>My Profile</h1>
        <p className="body-text" style={{ color: '#94a3b8', margin: 0 }}>Manage your account information</p>
      </div>

      {/* Profile Photo & Account Info */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr', gap: isMobile ? '16px' : '24px', alignItems: 'start' }}>
        {/* Profile Photo */}
        <div style={{ backgroundColor: '#0f1629', border: '1px solid #1e2942', borderRadius: '16px', padding: isMobile ? '16px' : '24px', textAlign: 'center', width: '100%' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
            <div style={{ 
              width: isMobile ? '100px' : '120px', 
              height: isMobile ? '100px' : '120px', 
              borderRadius: '50%', 
              overflow: 'hidden',
              border: '3px solid #4a90e2',
              background: profile?.profile_photo_url ? 'transparent' : 'linear-gradient(135deg, #4a90e2, #9333ea)',
              margin: '0 auto'
            }}>
              {profile?.profile_photo_url ? (
                <img 
                  src={profile.profile_photo_url} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: isMobile ? '36px' : '48px',
                  color: '#fff',
                  fontWeight: 'bold'
                }}>
                  {profile?.name?.charAt(0).toUpperCase() || profile?.username?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
            {uploading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '12px'
              }}>
                Uploading...
              </div>
            )}
          </div>
          <label htmlFor="photo-upload" style={{ 
            display: 'inline-block',
            backgroundColor: '#4a90e2',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.5 : 1
          }}>
            {uploading ? 'Uploading...' : 'Change Photo'}
          </label>
          <input 
            id="photo-upload" 
            type="file" 
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '8px', marginBottom: 0 }}>
            Max 5MB • JPG, PNG, GIF
          </p>
        </div>

        {/* Account Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ backgroundColor: '#0f1629', border: '1px solid rgba(74,144,226,0.3)', borderRadius: '16px', padding: '20px' }}>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>USERNAME</p>
            <p style={{ color: '#4a90e2', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>@{profile?.username}</p>
          </div>
          <div style={{ backgroundColor: '#0f1629', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '20px' }}>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>USER ID</p>
            <p style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>#{profile?.id}</p>
          </div>
          <div style={{ backgroundColor: '#0f1629', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '16px', padding: '20px' }}>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>REFERRAL CODE</p>
            <p style={{ color: '#a855f7', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{profile?.username || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Wallet Connection Card */}
      <div style={{ backgroundColor: '#0f1629', border: '1px solid #1e2942', borderRadius: '16px', padding: isMobile ? '16px' : '24px' }}>
        <h2 className="section-title" style={{ color: '#fff', fontWeight: 600, marginBottom: '16px' }}>Web3 Wallet</h2>
        
        {profile?.wallet_address ? (
          <div>
            {/* Connected Wallet Info - Same style as Avenza Wallet */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                }}></div>
                <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 600 }}>
                  Connected
                </span>
              </div>
              
              <div>
                <div style={{ color: '#10b981', fontSize: '12px', marginBottom: '6px' }}>
                  Wallet Address
                </div>
                <div style={{ 
                  color: '#e5e7eb', 
                  fontSize: isMobile ? '13px' : '14px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  lineHeight: '1.6'
                }}>
                  {profile.wallet_address}
                </div>
                {profile.wallet_type && (
                  <>
                    <div style={{ color: '#10b981', fontSize: '12px', marginTop: '12px', marginBottom: '6px' }}>
                      Wallet Type
                    </div>
                    <div style={{ 
                      color: '#4a90e2', 
                      fontSize: '14px',
                      textTransform: 'capitalize',
                      fontWeight: '600'
                    }}>
                      {profile.wallet_type}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'start',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>ℹ️</span>
              <p style={{ 
                color: '#94a3b8', 
                fontSize: '13px', 
                margin: 0,
                lineHeight: '1.5'
              }}>
                This wallet is used for your authentication and withdrawals. It was connected during login.
              </p>
            </div>

            <button
              onClick={handleDisconnectWallet}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: 600,
                padding: '12px 24px',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
              Connect your Web3 wallet to enable wallet-based login and seamless transactions
            </p>
            <button
              onClick={() => setShowWalletModal(true)}
              style={{
                backgroundColor: '#4a90e2',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                padding: '12px 24px',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '18px' }}>🔗</span>
              Connect Wallet
            </button>
          </div>
        )}
      </div>

      {/* Personal Information Form */}
      <div style={{ backgroundColor: '#0f1629', border: '1px solid #1e2942', borderRadius: '16px', padding: isMobile ? '16px' : '24px' }}>
        <h2 className="section-title" style={{ color: '#fff', fontWeight: 600, marginBottom: '20px' }}>Personal Information</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Full Name</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                style={{ 
                  width: '100%', 
                  backgroundColor: '#1a2035', 
                  border: '1px solid #2d3a54', 
                  borderRadius: '12px', 
                  padding: '12px', 
                  color: '#fff', 
                  fontSize: '14px' 
                }} 
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                style={{ 
                  width: '100%', 
                  backgroundColor: '#1a2035', 
                  border: '1px solid #2d3a54', 
                  borderRadius: '12px', 
                  padding: '12px', 
                  color: '#fff', 
                  fontSize: '14px' 
                }} 
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Mobile Number</label>
              <input 
                type="tel" 
                name="mobile" 
                value={formData.mobile} 
                onChange={handleChange} 
                style={{ 
                  width: '100%', 
                  backgroundColor: '#1a2035', 
                  border: '1px solid #2d3a54', 
                  borderRadius: '12px', 
                  padding: '12px', 
                  color: '#fff', 
                  fontSize: '14px' 
                }} 
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={saving} 
            style={{ 
              backgroundColor: '#4a90e2', 
              color: '#fff', 
              fontSize: '14px', 
              fontWeight: 600, 
              padding: '12px 32px', 
              border: 'none', 
              borderRadius: '12px', 
              cursor: saving ? 'not-allowed' : 'pointer', 
              opacity: saving ? 0.6 : 1 
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
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
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '2px solid rgba(74, 144, 226, 0.5)',
            borderRadius: '24px',
            padding: isMobile ? '20px' : '32px',
            maxWidth: isMobile ? '95vw' : '480px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              gap: '16px'
            }}>
              <h2 className="section-title" style={{
                color: '#fff',
                fontWeight: 'bold',
                margin: 0
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
              Choose your preferred wallet to connect
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* MetaMask */}
              <button
                onClick={() => handleConnectWallet('metamask')}
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
                onClick={() => handleConnectWallet('trust')}
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
                onClick={() => handleConnectWallet('safePal')}
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
                onClick={() => handleConnectWallet('coinbase')}
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

      {/* Success Modal */}
      {showSuccess && (
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
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-in'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '2px solid rgba(16, 185, 129, 0.5)',
            borderRadius: '24px',
            padding: isMobile ? '32px 20px' : '48px',
            textAlign: 'center',
            maxWidth: isMobile ? '95vw' : '400px',
            width: isMobile ? '90%' : '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              animation: 'bounceIn 0.5s ease-out'
            }}>
              ✅
            </div>
            <h3 style={{
              color: '#10b981',
              fontSize: '20px',
              fontWeight: '600',
              margin: '0 0 8px 0'
            }}>
              Success!
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '15px',
              margin: 0,
              lineHeight: '1.5'
            }}>
              {successMessage}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes bounceIn {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

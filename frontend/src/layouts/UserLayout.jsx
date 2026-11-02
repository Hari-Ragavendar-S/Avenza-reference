import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import logoSymbol from '../assets/image/a.png'
import logoName from '../assets/image/name.png'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { to: '/wallet', label: 'AVENZA Wallet', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
  { to: '/investments', label: 'Investment Plans', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
  { to: '/my-packages', label: 'My Packages', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { to: '/withdraw', label: 'Withdraw', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  { to: '/deposit', label: 'Deposit', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> },
  { to: '/transactions', label: 'Transactions', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { to: '/internal-transfer', label: 'Internal Transfer', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> },
  { to: '/referral', label: 'My Referral', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  { to: '/your-level', label: 'My Level', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg> },
  { to: '/level-income', label: 'Level Income', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
  { to: '/referral-bonus', label: 'Referral Bonus', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { to: '/binary-matching', label: 'Awards & Rewards', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg> },
  { to: '/matching-history-detailed', label: 'Matching History', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { to: '/downline-matching-bonus', label: 'Matching Bonus', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  { to: '/public-deposit-history', label: 'Public Deposits', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { to: '/tickets', label: 'Support', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
  { to: '/security', label: 'Security', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
]

export default function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const navigate = useNavigate()
  const notifRef = useRef(null)
  const searchRef = useRef(null)

  // Get actual user from localStorage and backend
  const [user, setUser] = useState(null)
  
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
      // Fetch latest user data from backend to get profile photo
      fetchUserProfile()
    } else {
      navigate('/login')
    }
  }, [navigate])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://avenza.live/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Backend returns ProfileResponse directly (not wrapped)
        setUser(prev => ({
          ...prev,
          profile_photo_url: data.profile_photo_url,
          name: data.name,
          username: data.username,
          referral_code: prev?.referral_code || data.username
        }))
        
        // Also update localStorage so the photo persists
        const updatedUser = { ...JSON.parse(localStorage.getItem('user') || '{}'), profile_photo_url: data.profile_photo_url }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    }
  }

  const notifications = []
  const unread = 0

  // Searchable items
  const searchableItems = [
    { label: 'Dashboard', path: '/dashboard', keywords: 'home overview' },
    { label: 'AVENZA Wallet', path: '/wallet', keywords: 'balance money funds' },
    { label: 'Deposit', path: '/deposit', keywords: 'add funds crypto' },
    { label: 'Withdraw', path: '/withdraw', keywords: 'cash out money' },
    { label: 'Investments', path: '/investments', keywords: 'plans packages invest' },
    { label: 'My Packages', path: '/my-packages', keywords: 'active investments' },
    { label: 'Transactions', path: '/transactions', keywords: 'history transfers' },
    { label: 'Internal Transfer', path: '/internal-transfer', keywords: 'send user' },
    { label: 'Referral', path: '/referral', keywords: 'team invite' },
    { label: 'Your Level', path: '/your-level', keywords: 'unlock status progress achievements' },
    { label: 'Level Income', path: '/level-income', keywords: 'roi passive team earnings' },
    { label: 'Referral Bonus', path: '/referral-bonus', keywords: 'direct bonus claim rewards' },
    { label: 'Awards', path: '/awards', keywords: 'rewards bonuses' },
    { label: 'Market', path: '/market', keywords: 'prices crypto' },
    { label: 'Trades', path: '/trades', keywords: 'trading history' },
    { label: 'Orders', path: '/orders', keywords: 'buy sell' },
    { label: 'AI Bot', path: '/ai-bot', keywords: 'automated trading' },
    { label: 'Plans', path: '/plans', keywords: 'investment options' },
    { label: 'Support', path: '/tickets', keywords: 'help tickets' },
    { label: 'Profile', path: '/profile', keywords: 'account settings' },
    { label: 'Security', path: '/security', keywords: 'password 2fa' },
    { label: 'KYC', path: '/kyc', keywords: 'verification documents' },
    { label: 'Notifications', path: '/notifications', keywords: 'alerts messages' },
  ]

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.trim().length > 0) {
      const filtered = searchableItems.filter(item => 
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.keywords.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
      setSearchResults(filtered)
    } else {
      setSearchResults([])
    }
  }

  const handleSearchSelect = (path) => {
    navigate(path)
    setSearchQuery('')
    setSearchResults([])
  }

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8' }}>Loading...</div>
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0a0e1a', position: 'relative', overflow: 'hidden' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 20 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '260px',
        backgroundColor: '#0f1629',
        borderRight: '1px solid #1e2942',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 30,
        transform: 'translateX(0)',
        transition: 'transform 0.3s',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px', borderBottom: '1px solid #1e2942' }}>
          <img src={logoSymbol} alt="AVENZA" style={{ width: '36px', height: '36px' }} />
          <img src={logoName} alt="AVENZA" style={{ height: '24px', width: 'auto' }} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                marginBottom: '4px',
                borderRadius: '12px',
                color: isActive ? '#4a90e2' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(74,144,226,0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(74,144,226,0.3)' : '1px solid transparent',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.15s',
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding: '16px', borderTop: '1px solid #1e2942' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(74, 144, 226, 0.5)', flexShrink: 0 }}>
              {user?.profile_photo_url ? (
                <img 
                  src={user.profile_photo_url} 
                  alt={user.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #4a90e2, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                  {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || user?.username}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{ color: '#4a90e2', fontSize: '12px', fontFamily: 'monospace' }}>{user?.referral_code || ''}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('user')
              localStorage.removeItem('token')
              navigate('/login')
            }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'transparent', border: 'none', borderRadius: '12px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '18px', height: '18px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ position: 'relative', zIndex: 10, flexShrink: 0, backgroundColor: '#0f1629', borderBottom: '1px solid #1e2942', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ display: 'none', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', fontSize: '24px', lineHeight: 1 }}
          >
            ☰
          </button>

          <div ref={searchRef} style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search pairs, orders..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: '100%', backgroundColor: '#1a2035', border: '1px solid #2d3a54', borderRadius: '12px', padding: '10px 12px 10px 40px', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', width: '18px', height: '18px', pointerEvents: 'none' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, backgroundColor: '#0f1629', border: '1px solid #1e2942', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 50, overflow: 'hidden' }}>
                {searchResults.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => handleSearchSelect(item.path)}
                    style={{ padding: '12px 16px', borderBottom: i < searchResults.length - 1 ? '1px solid #1e2942' : 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a2035'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            {/* Wallet Connect */}
            <button onClick={() => navigate('/wallet')} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(74,144,226,0.1)', border: '1px solid rgba(74,144,226,0.3)', color: '#4a90e2', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>AVENZA Wallet</span>
            </button>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                style={{ position: 'relative', background: 'transparent', border: 'none', padding: '8px', borderRadius: '12px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unread > 0 && (
                  <span style={{ position: 'absolute', top: '4px', right: '4px', width: '18px', height: '18px', backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '320px', backgroundColor: '#0f1629', border: '1px solid #1e2942', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', zIndex: 50, overflow: 'hidden' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #1e2942', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Notifications</span>
                    <button onClick={() => setNotifOpen(false)} style={{ color: '#4a90e2', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
                  </div>
                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {notifications.map((n) => (
                      <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(30,41,66,0.5)', backgroundColor: !n.is_read ? 'rgba(74,144,226,0.05)' : 'transparent' }}>
                        <p style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600, margin: '0 0 4px 0' }}>{n.title}</p>
                        <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <NavLink to="/user-profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '12px', textDecoration: 'none', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74, 144, 226, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(74, 144, 226, 0.5)' }}>
                {user?.profile_photo_url ? (
                  <img 
                    src={user.profile_photo_url} 
                    alt={user.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    background: 'linear-gradient(135deg, #4a90e2, #9333ea)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#fff', 
                    fontWeight: 600, 
                    fontSize: '12px' 
                  }}>
                    {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <span style={{ color: '#fff', fontSize: '14px' }}>{user?.name || user?.username}</span>
            </NavLink>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '24px', width: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }
        @media (max-width: 1024px) {
          aside { 
            transform: ${sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'} !important; 
          }
          aside + div { 
            margin-left: 0 !important;
            width: 100% !important;
          }
          header button:first-child { 
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
        }
        @media (max-width: 768px) {
          header {
            padding: 10px 12px !important;
          }
          header > div:first-of-type {
            flex: 1 !important;
            max-width: none !important;
          }
          header > div:last-child > button:first-child span {
            display: none !important;
          }
          header > div:last-child a span:last-child {
            display: none !important;
          }
          main {
            padding: 16px !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          h1 {
            font-size: 20px !important;
          }
        }
      `}</style>
    </div>
  )
}

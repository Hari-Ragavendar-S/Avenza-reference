import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BinaryTree from './components/BinaryTree'

export default function Referral() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('link') // 'link' or 'tree'
  const [treeData, setTreeData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [userDetails, setUserDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [copyLeftSuccess, setCopyLeftSuccess] = useState(false)
  const [copyRightSuccess, setCopyRightSuccess] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'tree' && !treeData) {
      fetchTreeData()
    }
  }, [activeTab])

  const fetchTreeData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://avenza.live/api/referral/tree', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTreeData(data)  // Store the full response including extreme positions
      }
    } catch (error) {
      console.error('Error fetching tree:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserDetails = async (userId) => {
    setLoadingDetails(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://avenza.live/api/referral/tree/${userId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserDetails(data)
        setShowDetailsModal(true)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleExpandNode = async (userId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://avenza.live/api/referral/tree/${userId}/children`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Update tree data with new children
        setTreeData(prevTree => updateTreeNode(prevTree, data.node))
      }
    } catch (error) {
      console.error('Error loading children:', error)
    }
  }

  const updateTreeNode = (treeData, updatedNode) => {
    if (!treeData || !treeData.tree) return treeData;
    
    const updateNode = (tree) => {
      if (tree.id === updatedNode.id) {
        return { ...tree, ...updatedNode }
      }
      
      const newTree = { ...tree }
      if (newTree.left_child) {
        newTree.left_child = updateNode(newTree.left_child)
      }
      if (newTree.right_child) {
        newTree.right_child = updateNode(newTree.right_child)
      }
      
      return newTree
    }
    
    return {
      ...treeData,
      tree: updateNode(treeData.tree)
    }
  }

  const referralLink = user ? `https://avenza.live/${user.username}` : ''
  const leftPositionLink = user ? `https://avenza.live/${user.username}/left` : ''
  const rightPositionLink = user ? `https://avenza.live/${user.username}/right` : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyLeftLink = async () => {
    try {
      await navigator.clipboard.writeText(leftPositionLink)
      setCopyLeftSuccess(true)
      setTimeout(() => setCopyLeftSuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyRightLink = async () => {
    try {
      await navigator.clipboard.writeText(rightPositionLink)
      setCopyRightSuccess(true)
      setTimeout(() => setCopyRightSuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `Join Avenza and start earning today! Use my referral link: ${referralLink}`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        padding: '20px'
      }}>
        <p style={{ color: '#94a3b8', fontSize: '18px' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(74,144,226,0.2), rgba(147,51,234,0.1))',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <svg 
            style={{ width: '32px', height: '32px', color: '#4a90e2' }}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
            My Referral Network
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
          Share your referral link and view your binary tree
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid rgba(74,144,226,0.2)',
        paddingBottom: '0'
      }}>
        <button
          onClick={() => setActiveTab('link')}
          style={{
            background: activeTab === 'link' ? 'rgba(74,144,226,0.2)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'link' ? '2px solid #4a90e2' : '2px solid transparent',
            padding: '12px 24px',
            color: activeTab === 'link' ? '#4a90e2' : '#94a3b8',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📋 Referral Link
        </button>
        <button
          onClick={() => setActiveTab('tree')}
          style={{
            background: activeTab === 'tree' ? 'rgba(74,144,226,0.2)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'tree' ? '2px solid #4a90e2' : '2px solid transparent',
            padding: '12px 24px',
            color: activeTab === 'tree' ? '#4a90e2' : '#94a3b8',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🌳 Binary Tree
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'link' ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(74,144,226,0.1), rgba(147,51,234,0.05))',
          border: '1px solid rgba(74,144,226,0.2)',
          borderRadius: '20px',
          padding: '24px',
          maxWidth: '100%',
          margin: '0 auto',
          overflow: 'hidden'
        }}>

          {/* Binary Position Links */}
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(147,51,234,0.1), rgba(74,144,226,0.05))',
            border: '1px solid rgba(147,51,234,0.3)',
            borderRadius: '16px'
          }}>
            <h3 style={{
              color: '#9333ea',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🔗 Share Your Binary Position Links
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              Share these links to build your team and place members in specific positions
            </p>

            {/* Left Position */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#4a90e2',
                fontSize: '14px',
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                👈 LEFT POSITION
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(74,144,226,0.3)',
                borderRadius: '12px',
                padding: '12px',
                gap: '10px',
                marginBottom: '10px',
                overflow: 'hidden'
              }}>
                <input
                  type="text"
                  value={leftPositionLink}
                  readOnly
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleCopyLeftLink}
                  style={{
                    flex: 1,
                    background: copyLeftSuccess ? '#10b981' : 'linear-gradient(135deg, #4a90e2, #2563eb)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {copyLeftSuccess ? '✅ Copied!' : '📋 Copy'}
                </button>
                <button
                  onClick={() => {
                    const message = `Join AVENZA platform through my LEFT position link and start earning!\n\n${leftPositionLink}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(37,211,102,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Right Position */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#9333ea',
                fontSize: '14px',
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                👉 RIGHT POSITION
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(147,51,234,0.3)',
                borderRadius: '12px',
                padding: '12px',
                gap: '10px',
                marginBottom: '10px',
                overflow: 'hidden'
              }}>
                <input
                  type="text"
                  value={rightPositionLink}
                  readOnly
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleCopyRightLink}
                  style={{
                    flex: 1,
                    background: copyRightSuccess ? '#10b981' : 'linear-gradient(135deg, #9333ea, #7c3aed)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {copyRightSuccess ? '✅ Copied!' : '📋 Copy'}
                </button>
                <button
                  onClick={() => {
                    const message = `Join AVENZA platform through my RIGHT position link and start earning!\n\n${rightPositionLink}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(37,211,102,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              Loading your binary tree...
            </div>
          ) : treeData ? (
            <>
              {/* Binary Tree vs Direct Referrals Explanation */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))',
                border: '2px solid rgba(251,191,36,0.5)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '32px' }}>ℹ️</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#fbbf24', fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
                      Understanding Binary Tree vs Direct Referrals
                    </h3>
                    
                    <div style={{ 
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '10px',
                      padding: '14px',
                      marginBottom: '12px'
                    }}>
                      <p style={{ color: '#fff', fontSize: '13px', margin: '0 0 10px 0', lineHeight: '1.6' }}>
                        <strong style={{ color: '#4a90e2' }}>🌳 Binary Tree Members:</strong><br/>
                        Everyone in your network structure including spillover members from your upline. 
                        This shows your complete binary organization.
                      </p>
                      <p style={{ color: '#fff', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                        <strong style={{ color: '#9333ea' }}>👥 Direct Referrals:</strong><br/>
                        Only people who signed up using YOUR personal referral link. 
                        These count for bonuses and level unlocking.
                      </p>
                    </div>

                    <div style={{
                      background: 'rgba(251,191,36,0.15)',
                      border: '1px solid rgba(251,191,36,0.3)',
                      borderRadius: '8px',
                      padding: '10px'
                    }}>
                      <p style={{ color: '#fbbf24', fontSize: '12px', fontWeight: '600', margin: '0 0 6px 0' }}>
                        💡 Why they're different:
                      </p>
                      <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                        When your downline's positions are full, new members automatically 
                        "spillover" into available spots in your tree. They appear in your binary tree but 
                        their sponsor_id still points to whoever referred them.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extreme Positions Banner */}
              {(treeData.extreme_left || treeData.extreme_right) && (
                <div style={{
                  marginBottom: '20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}>
                  {/* Extreme Left */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(74,144,226,0.2), rgba(74,144,226,0.05))',
                    border: '2px solid rgba(74,144,226,0.5)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      color: '#4a90e2',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      ⬅️ EXTREME LEFT
                    </p>
                    {treeData.extreme_left ? (
                      <>
                        <p style={{
                          color: '#fff',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          marginBottom: '4px'
                        }}>
                          @{treeData.extreme_left.username}
                        </p>
                        <p style={{
                          color: '#94a3b8',
                          fontSize: '13px',
                          marginBottom: '4px'
                        }}>
                          {treeData.extreme_left.name}
                        </p>
                        <p style={{
                          color: '#4a90e2',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          Depth: {treeData.extreme_left.depth} level{treeData.extreme_left.depth !== 1 ? 's' : ''} down
                        </p>
                      </>
                    ) : (
                      <p style={{ color: '#64748b', fontSize: '14px' }}>No left placements yet</p>
                    )}
                  </div>

                  {/* Extreme Right */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(147,51,234,0.2), rgba(147,51,234,0.05))',
                    border: '2px solid rgba(147,51,234,0.5)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      color: '#9333ea',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      EXTREME RIGHT ➡️
                    </p>
                    {treeData.extreme_right ? (
                      <>
                        <p style={{
                          color: '#fff',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          marginBottom: '4px'
                        }}>
                          @{treeData.extreme_right.username}
                        </p>
                        <p style={{
                          color: '#94a3b8',
                          fontSize: '13px',
                          marginBottom: '4px'
                        }}>
                          {treeData.extreme_right.name}
                        </p>
                        <p style={{
                          color: '#9333ea',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          Depth: {treeData.extreme_right.depth} level{treeData.extreme_right.depth !== 1 ? 's' : ''} down
                        </p>
                      </>
                    ) : (
                      <p style={{ color: '#64748b', fontSize: '14px' }}>No right placements yet</p>
                    )}
                  </div>
                </div>
              )}

              <div style={{ 
                marginBottom: '20px',
                padding: '16px',
                background: 'rgba(74,144,226,0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(74,144,226,0.2)'
              }}>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                  💡 <strong>Tip:</strong> Click on any node to view detailed information. Click expand to load more levels.
                </p>
              </div>
              
              <BinaryTree 
                rootNode={treeData.tree}
                onNodeClick={(node) => fetchUserDetails(node.id)}
              />
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              No tree data available
            </div>
          )}
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && userDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '2px solid rgba(74,144,226,0.5)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowDetailsModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.5)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                fontSize: '20px',
                cursor: 'pointer',
                lineHeight: 1
              }}
            >
              ×
            </button>

            {/* Profile Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid rgba(74,144,226,0.5)',
                margin: '0 auto 16px auto'
              }}>
                {userDetails.user.profile_photo_url ? (
                  <img 
                    src={userDetails.user.profile_photo_url}
                    alt={userDetails.user.name}
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
                    fontWeight: 'bold',
                    fontSize: '32px'
                  }}>
                    {userDetails.user.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              
              <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                {userDetails.user.name}
              </h2>
              <p style={{ color: '#4a90e2', fontSize: '16px', margin: '0 0 4px 0' }}>
                @{userDetails.user.username}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                Joined: {userDetails.user.join_date}
              </p>
              {userDetails.user.sponsor_username && (
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>
                  Sponsor: <span style={{ color: '#4a90e2' }}>@{userDetails.user.sponsor_username}</span>
                </p>
              )}
            </div>

            {/* Investment Details */}
            <div style={{
              background: 'rgba(74,144,226,0.1)',
              border: '1px solid rgba(74,144,226,0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h3 style={{ color: '#4a90e2', fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0' }}>
                💰 Investment Overview
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>Total Investments</p>
                  <p style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                    {userDetails.investment.total_investments}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>Total Invested</p>
                  <p style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                    {formatCurrency(userDetails.investment.total_invested)}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>Active Amount</p>
                  <p style={{ color: '#fbbf24', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                    {formatCurrency(userDetails.investment.active_investment)}
                  </p>
                </div>
              </div>
            </div>

            {/* Wallet Balances */}
            <div style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h3 style={{ color: '#10b981', fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0' }}>
                👛 Wallet Balances
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>Deposit</p>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                    {formatCurrency(userDetails.wallet.deposit_balance)}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>Income</p>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                    {formatCurrency(userDetails.wallet.income_balance)}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>ROI</p>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                    {formatCurrency(userDetails.wallet.roi_balance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Team Statistics */}
            <div style={{
              background: 'rgba(147,51,234,0.1)',
              border: '1px solid rgba(147,51,234,0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h3 style={{ color: '#9333ea', fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0' }}>
                👥 Team Statistics
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>Direct Referrals</p>
                  <p style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                    {userDetails.team.direct_referrals}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>Total Team</p>
                  <p style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                    {userDetails.team.total_team_size}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>Left Team</p>
                  <p style={{ color: '#4a90e2', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                    {userDetails.team.left_team}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>Right Team</p>
                  <p style={{ color: '#9333ea', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                    {userDetails.team.right_team}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            {userDetails.recent_transactions && userDetails.recent_transactions.length > 0 && (
              <div style={{
                background: 'rgba(74,144,226,0.05)',
                border: '1px solid rgba(74,144,226,0.2)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <h3 style={{ color: '#4a90e2', fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0' }}>
                  📊 Recent Activity
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {userDetails.recent_transactions.map((trans, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      background: 'rgba(74,144,226,0.05)',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <p style={{ color: '#fff', fontSize: '13px', fontWeight: '600', margin: '0 0 2px 0' }}>
                          {trans.type.replace('_', ' ').toUpperCase()}
                        </p>
                        <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                          {trans.date}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                          {formatCurrency(trans.amount)}
                        </p>
                        <p style={{ color: trans.status === 'completed' ? '#10b981' : '#fbbf24', fontSize: '10px', margin: 0 }}>
                          {trans.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

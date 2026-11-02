import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function BinaryTree() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [treeData, setTreeData] = useState(null)

  useEffect(() => {
    fetchTree()
  }, [])

  const fetchTree = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://avenza.live/api/binary/tree', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setTreeData(data)
      }
    } catch (err) {
      console.error('Error fetching tree:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0)
  }

  const getUserInitial = (name, username) => {
    if (name) return name.charAt(0).toUpperCase()
    if (username) return username.charAt(0).toUpperCase()
    return '?'
  }

  const TreeNode = ({ user, position, isRoot = false }) => {
    if (!user) {
      return (
        <div style={{
          width: '100%',
          maxWidth: '180px',
          background: 'rgba(74,144,226,0.05)',
          border: '2px dashed rgba(74,144,226,0.2)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
            {position} Position<br/>Available
          </p>
        </div>
      )
    }

    const borderColor = position === 'left' ? '#10b981' : position === 'right' ? '#4a90e2' : '#a855f7'
    
    return (
      <div style={{
        width: '100%',
        maxWidth: '180px',
        background: `linear-gradient(135deg, rgba(${position === 'left' ? '16,185,129' : position === 'right' ? '74,144,226' : '168,85,247'},0.1), rgba(15,23,42,0.5))`,
        border: `2px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center'
      }}>
        {/* Avatar */}
        <div style={{
          width: isRoot ? '60px' : '50px',
          height: isRoot ? '60px' : '50px',
          margin: '0 auto 12px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${borderColor}, rgba(0,0,0,0.3))`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isRoot ? '28px' : '24px',
          fontWeight: 'bold',
          color: '#fff',
          border: `3px solid ${borderColor}`
        }}>
          {user.profile_photo_url ? (
            <img src={user.profile_photo_url} alt={user.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            getUserInitial(user.name, user.username)
          )}
        </div>

        {/* Username */}
        <p style={{
          color: '#fff',
          fontSize: isRoot ? '15px' : '14px',
          fontWeight: '600',
          margin: '0 0 4px 0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          @{user.username}
        </p>

        {/* Position Badge */}
        {!isRoot && (
          <span style={{
            display: 'inline-block',
            background: `rgba(${position === 'left' ? '16,185,129' : '74,144,226'},0.2)`,
            color: borderColor,
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            {position?.toUpperCase()}
          </span>
        )}

        {/* Business Volume */}
        {!isRoot && (
          <div style={{ marginTop: '8px' }}>
            <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>Volume</p>
            <p style={{ color: borderColor, fontSize: '14px', fontWeight: '600', margin: 0 }}>
              {formatCurrency(user.left_business + user.right_business)}
            </p>
          </div>
        )}

        {/* Team Count */}
        <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '8px', margin: 0 }}>
          {user.total_team} members
        </p>

        {/* Status Badge */}
        {user.is_active && (
          <div style={{
            marginTop: '8px',
            display: 'inline-block',
            background: 'rgba(16,185,129,0.2)',
            color: '#10b981',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '600'
          }}>
            ✓ Active
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>Loading binary tree...</p>
      </div>
    )
  }

  if (!treeData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '16px' }}>Failed to load tree</p>
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
        padding: '32px',
        marginBottom: '24px'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: '0 0 8px 0' }}>
          🌳 My Award Team Tree
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
          View your team structure and volumes for awards
        </p>
      </div>

      {/* Business Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>LEFT BUSINESS</p>
          <p style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
            {formatCurrency(treeData.left_business)}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
            Pending: {formatCurrency(treeData.pending_left)}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(74,144,226,0.15), rgba(74,144,226,0.05))',
          border: '1px solid rgba(74,144,226,0.3)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>RIGHT BUSINESS</p>
          <p style={{ color: '#4a90e2', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
            {formatCurrency(treeData.right_business)}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
            Pending: {formatCurrency(treeData.pending_right)}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>MATCHED VOLUME</p>
          <p style={{ color: '#a855f7', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            {formatCurrency(treeData.matched_amount)}
          </p>
        </div>
      </div>

      {/* Tree Visualization */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        overflowX: 'auto'
      }}>
        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', marginBottom: '24px', textAlign: 'center' }}>
          Team Structure
        </h2>

        {/* Tree Display */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
          minWidth: '600px'
        }}>
          {/* Root User */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <TreeNode user={treeData.user} position="root" isRoot={true} />
          </div>

          {/* Connector Line */}
          <div style={{
            width: '2px',
            height: '40px',
            background: 'linear-gradient(180deg, rgba(74,144,226,0.5), rgba(74,144,226,0.2))',
            margin: '-16px 0'
          }} />

          {/* Split Connectors */}
          <div style={{
            position: 'relative',
            width: '80%',
            height: '2px',
            background: 'linear-gradient(90deg, rgba(16,185,129,0.5), rgba(74,144,226,0.3), rgba(74,144,226,0.5))',
            margin: '-16px 0'
          }}>
            {/* Left vertical */}
            <div style={{
              position: 'absolute',
              left: '0',
              top: '0',
              width: '2px',
              height: '40px',
              background: 'linear-gradient(180deg, rgba(16,185,129,0.5), rgba(16,185,129,0.2))'
            }} />
            {/* Right vertical */}
            <div style={{
              position: 'absolute',
              right: '0',
              top: '0',
              width: '2px',
              height: '40px',
              background: 'linear-gradient(180deg, rgba(74,144,226,0.5), rgba(74,144,226,0.2))'
            }} />
          </div>

          {/* Children */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '32px',
            width: '100%',
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <TreeNode user={treeData.left_child} position="left" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <TreeNode user={treeData.right_child} position="right" />
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: 'rgba(74,144,226,0.1)',
          border: '1px solid rgba(74,144,226,0.2)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
            💡 This shows your direct left and right placements. Each member has their own binary tree below them.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => navigate('/binary-matching')}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #4a90e2, #357abd)',
          border: 'none',
          borderRadius: '12px',
          padding: '16px',
          color: '#fff',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        ← Back to Awards & Rewards Dashboard
      </button>
    </div>
  )
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function InternalTransfer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentChats, setRecentChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Fetch recent chats
      const chatsRes = await fetch('https://avenza.live/api/transfer/recent-chats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        setRecentChats(chatsData.chats || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://avenza.live/api/transfer/search?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const openChat = (userId) => {
    navigate(`/transfer/chat/${userId}`);
  };

  const getUserAvatar = (user) => {
    if (user.profile_photo_url) {
      return (
        <img 
          src={user.profile_photo_url} 
          alt={user.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      );
    }
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #4a90e2, #357abd)',
        color: '#fff',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        {user.username?.charAt(0).toUpperCase()}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        Loading...
      </div>
    );
  }

  const displayUsers = searchResults;

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '8px'
        }}>
          Internal Transfer
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          Send money to other AVENZA users instantly
        </p>
      </div>

      {/* Search Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74, 144, 226, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or mobile number..."
            style={{
              width: '100%',
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px 12px 44px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <div style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            fontSize: '18px'
          }}>
            🔍
          </div>
        </div>
      </div>

      {/* Recent Chats */}
      {!searchQuery && recentChats.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{
            color: '#fff',
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            Your Chats
          </h3>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {recentChats.map((chat, index) => (
              <div
                key={chat.id}
                onClick={() => openChat(chat.id)}
                style={{
                  padding: '16px',
                  borderBottom: index < recentChats.length - 1 ? '1px solid rgba(74, 144, 226, 0.1)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74, 144, 226, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {getUserAvatar(chat)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    {chat.name}
                  </div>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '13px'
                  }}>
                    @{chat.username}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    color: '#10b981',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    ${parseFloat(chat.last_amount).toFixed(2)}
                  </div>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '11px'
                  }}>
                    {chat.total_transfers} transfer{chat.total_transfers !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div>
          <h3 style={{
            color: '#fff',
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            Search Results
          </h3>
          
          {displayUsers.length === 0 ? (
            <div style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
              <p style={{ color: '#94a3b8' }}>
                No users found
              </p>
            </div>
          ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '16px'
          }}>
            {displayUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => openChat(user.id)}
                style={{
                  background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.6)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(74, 144, 226, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto 12px'
                }}>
                  {getUserAvatar(user)}
                </div>
                <div style={{
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {user.name}
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '13px',
                  marginBottom: '8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  @{user.username}
                </div>
                <div style={{
                  color: '#4a90e2',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  TAP TO TRANSFER
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
}

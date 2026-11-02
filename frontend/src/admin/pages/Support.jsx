import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminSupport() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchConversations();
  }, [page]);

  useEffect(() => {
    // Debounce search
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
      fetchConversations();
    }, 800);
    setSearchTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://avenza.live/api/admin/support/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `https://avenza.live/api/admin/support/users?page=${page}&per_page=20&search=${search}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        setTotalPages(data.total_pages);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
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
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        {user.username?.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '8px'
        }}>
          Support Chat
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          Manage user support conversations
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              color: '#4a90e2',
              fontSize: '13px',
              marginBottom: '8px'
            }}>
              Total Conversations
            </div>
            <div style={{
              color: '#fff',
              fontSize: '32px',
              fontWeight: 'bold'
            }}>
              {stats.total_conversations}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              color: '#ef4444',
              fontSize: '13px',
              marginBottom: '8px'
            }}>
              Unread Conversations
            </div>
            <div style={{
              color: '#fff',
              fontSize: '32px',
              fontWeight: 'bold'
            }}>
              {stats.unread_conversations}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              color: '#10b981',
              fontSize: '13px',
              marginBottom: '8px'
            }}>
              Total Messages
            </div>
            <div style={{
              color: '#fff',
              fontSize: '32px',
              fontWeight: 'bold'
            }}>
              {stats.total_messages}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              color: '#a855f7',
              fontSize: '13px',
              marginBottom: '8px'
            }}>
              Messages Today
            </div>
            <div style={{
              color: '#fff',
              fontSize: '32px',
              fontWeight: 'bold'
            }}>
              {stats.messages_today}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username, name, or email..."
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
        />
      </div>

      {/* Conversations List */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#94a3b8'
        }}>
          Loading conversations...
        </div>
      ) : conversations.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'linear-gradient(135deg, rgba(74,144,226,0.1), rgba(147,51,234,0.05))',
          border: '1px solid rgba(74,144,226,0.2)',
          borderRadius: '16px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
          <h3 style={{
            color: '#fff',
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            No Conversations Yet
          </h3>
          <p style={{
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            {search ? 'No results found for your search' : 'Waiting for users to reach out to support'}
          </p>
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          {conversations.map((conv) => (
            <div
              key={conv.user_id}
              onClick={() => navigate(`/admin/support/chat/${conv.user_id}`)}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(74, 144, 226, 0.2)',
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(74, 144, 226, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative'
              }}>
                {getUserAvatar(conv)}
                {conv.unread_count > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ef4444',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#fff',
                    border: '2px solid #0f172a'
                  }}>
                    {conv.unread_count}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <div style={{
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}>
                    {conv.name}
                  </div>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '13px'
                  }}>
                    @{conv.username}
                  </div>
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '13px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {conv.last_message || 'No messages yet'}
                </div>
              </div>

              {/* Metadata */}
              <div style={{
                textAlign: 'right',
                flexShrink: 0
              }}>
                <div style={{
                  color: '#4a90e2',
                  fontSize: '12px',
                  marginBottom: '4px'
                }}>
                  {conv.last_message_time}
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '12px'
                }}>
                  {conv.total_messages} messages
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          marginTop: '24px'
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              background: page === 1 ? 'rgba(74, 144, 226, 0.1)' : 'rgba(74, 144, 226, 0.2)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: page === 1 ? '#64748b' : '#4a90e2',
              fontSize: '14px',
              fontWeight: '600',
              cursor: page === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              background: page === totalPages ? 'rgba(74, 144, 226, 0.1)' : 'rgba(74, 144, 226, 0.2)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: page === totalPages ? '#64748b' : '#4a90e2',
              fontSize: '14px',
              fontWeight: '600',
              cursor: page === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

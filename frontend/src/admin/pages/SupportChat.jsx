import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function AdminSupportChat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchChat();
    
    // Auto-refresh chat every 5 seconds
    const interval = setInterval(() => {
      fetchChat();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChat = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://avenza.live/api/admin/support/chat/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setMessages(data.messages || []);
      } else if (response.status === 404) {
        alert('User not found');
        navigate('/admin/support');
      }
    } catch (err) {
      console.error('Error fetching chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!newMessage.trim() || sending) return;

    if (newMessage.length > 500) {
      alert('Message too long. Maximum 500 characters.');
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://avenza.live/api/admin/support/reply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: parseInt(userId),
          message: newMessage.trim()
        })
      });

      if (response.ok) {
        setNewMessage('');
        fetchChat();
      } else {
        const data = await response.json();
        alert(data.detail || 'Failed to send message');
      }
    } catch (err) {
      alert('Error sending message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const getUserAvatar = () => {
    if (user?.profile_photo_url) {
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
        fontSize: '20px',
        fontWeight: 'bold'
      }}>
        {user?.username?.charAt(0).toUpperCase()}
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
        Loading chat...
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0f172a'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderBottom: '1px solid rgba(74, 144, 226, 0.3)',
        padding: '16px 20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <button
            onClick={() => navigate('/admin/support')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#4a90e2',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ←
          </button>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            overflow: 'hidden'
          }}>
            {getUserAvatar()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              {user?.name}
            </div>
            <div style={{
              color: '#94a3b8',
              fontSize: '13px'
            }}>
              @{user?.username} • ID #{user?.id}
            </div>
          </div>
          <button
            onClick={() => navigate(`/admin/user/${user?.id}`)}
            style={{
              background: 'rgba(74, 144, 226, 0.2)',
              border: '1px solid rgba(74, 144, 226, 0.5)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#4a90e2',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            View Profile
          </button>
        </div>

        {/* User Wallet Info */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '12px'
        }}>
          <div style={{
            flex: 1,
            background: 'rgba(74, 144, 226, 0.1)',
            borderRadius: '8px',
            padding: '8px 12px'
          }}>
            <div style={{
              color: '#4a90e2',
              fontSize: '11px',
              marginBottom: '2px'
            }}>
              AVENZA
            </div>
            <div style={{
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ${parseFloat(user?.avenza_balance || 0).toFixed(2)}
            </div>
          </div>
          <div style={{
            flex: 1,
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '8px',
            padding: '8px 12px'
          }}>
            <div style={{
              color: '#10b981',
              fontSize: '11px',
              marginBottom: '2px'
            }}>
              INCOME
            </div>
            <div style={{
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ${parseFloat(user?.income_balance || 0).toFixed(2)}
            </div>
          </div>
          <div style={{
            flex: 1,
            background: 'rgba(168, 85, 247, 0.1)',
            borderRadius: '8px',
            padding: '8px 12px'
          }}>
            <div style={{
              color: '#a855f7',
              fontSize: '11px',
              marginBottom: '2px'
            }}>
              GAMING
            </div>
            <div style={{
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ${parseFloat(user?.gaming_balance || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#94a3b8'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
            <p>No messages yet</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>
              Start the conversation with {user?.name}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.is_mine ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '70%',
                background: msg.is_mine 
                  ? 'linear-gradient(135deg, #4a90e2, #357abd)' 
                  : 'linear-gradient(135deg, #334155, #475569)',
                borderRadius: '12px',
                padding: '12px 16px',
                position: 'relative'
              }}>
                {!msg.is_mine && (
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '11px',
                    marginBottom: '4px',
                    fontWeight: '600'
                  }}>
                    {user?.name}
                  </div>
                )}
                <div style={{
                  color: '#fff',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  marginBottom: '4px',
                  wordWrap: 'break-word'
                }}>
                  {msg.message}
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '11px',
                  textAlign: 'right'
                }}>
                  {msg.created_at}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderTop: '1px solid rgba(74, 144, 226, 0.3)',
        padding: '16px 20px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            color: '#94a3b8',
            fontSize: '11px',
            marginBottom: '4px'
          }}>
            {newMessage.length}/500
          </div>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your reply..."
            maxLength="500"
            rows="1"
            style={{
              width: '100%',
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              minHeight: '44px',
              maxHeight: '120px'
            }}
          />
        </div>
        <button
          onClick={handleSendReply}
          disabled={!newMessage.trim() || sending}
          style={{
            background: newMessage.trim() && !sending 
              ? 'linear-gradient(135deg, #10b981, #059669)' 
              : 'rgba(16, 185, 129, 0.3)',
            border: 'none',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            color: '#fff',
            fontSize: '20px',
            cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s',
            flexShrink: 0
          }}
        >
          {sending ? '⏳' : '📤'}
        </button>
      </div>
    </div>
  );
}

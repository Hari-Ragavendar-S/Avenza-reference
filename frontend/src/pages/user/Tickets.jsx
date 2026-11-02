import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Support() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    
    // Auto-refresh messages every 5 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://avenza.live/api/support/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    if (newMessage.length > 500) {
      alert('Message too long. Maximum 500 characters.');
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://avenza.live/api/support/message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: newMessage.trim() })
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
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
      handleSendMessage();
    }
  };

  const quickQuestions = [
    '💰 How to deposit?',
    '🏦 Withdrawal issue',
    '📈 Investment questions',
    '👤 Account problem'
  ];

  const handleQuickQuestion = (question) => {
    setNewMessage(question);
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        Loading support chat...
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
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={() => navigate('/dashboard')}
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
          background: 'linear-gradient(135deg, #4a90e2, #357abd)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px'
        }}>
          🎧
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            Support Team
          </div>
          <div style={{
            color: '#94a3b8',
            fontSize: '13px'
          }}>
            We're here to help
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
            padding: '40px 20px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
            <h3 style={{
              color: '#fff',
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              Need help?
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              marginBottom: '24px'
            }}>
              Start a conversation with our support team
            </p>

            {/* Quick Questions */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginTop: '24px'
            }}>
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  style={{
                    background: 'rgba(74, 144, 226, 0.1)',
                    border: '1px solid rgba(74, 144, 226, 0.3)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#4a90e2',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(74, 144, 226, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(74, 144, 226, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.3)';
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
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
                  : 'linear-gradient(135deg, #1e293b, #334155)',
                borderRadius: '12px',
                padding: '12px 16px',
                position: 'relative'
              }}>
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
            placeholder="Type your message..."
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
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending}
          style={{
            background: newMessage.trim() && !sending 
              ? 'linear-gradient(135deg, #4a90e2, #357abd)' 
              : 'rgba(74, 144, 226, 0.3)',
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

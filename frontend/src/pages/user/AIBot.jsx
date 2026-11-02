export default function AIBot() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      padding: '20px'
    }}>
      <div style={{
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(74,144,226,0.1), rgba(147,51,234,0.05))',
        border: '1px solid rgba(74,144,226,0.2)',
        borderRadius: '24px',
        padding: '60px 40px',
        maxWidth: '500px',
        width: '100%'
      }}>
        <svg 
          style={{ width: '80px', height: '80px', color: '#4a90e2', marginBottom: '20px' }}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
          />
        </svg>
        
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#fff', 
          margin: '0 0 16px 0'
        }}>
          AI Trade Bot
        </h1>
        
        <p style={{ 
          fontSize: '18px', 
          color: '#94a3b8', 
          margin: 0
        }}>
          Coming Soon
        </p>
      </div>
    </div>
  )
}

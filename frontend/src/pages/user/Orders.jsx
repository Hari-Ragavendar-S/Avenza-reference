export default function Orders() {
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
          />
        </svg>
        
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#fff', 
          margin: '0 0 16px 0'
        }}>
          Orders
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

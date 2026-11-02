export default function Market() {
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
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" 
          />
        </svg>
        
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#fff', 
          margin: '0 0 16px 0'
        }}>
          Market
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

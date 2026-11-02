export default function Trades() {
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
            d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" 
          />
        </svg>
        
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#fff', 
          margin: '0 0 16px 0'
        }}>
          Trade History
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

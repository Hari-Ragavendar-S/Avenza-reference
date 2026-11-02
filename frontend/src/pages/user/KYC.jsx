export default function KYC() {
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
            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" 
          />
        </svg>
        
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#fff', 
          margin: '0 0 16px 0'
        }}>
          KYC
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

import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Pagination from '../components/Pagination';

export default function AdminWalletTransactions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 20;

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, searchTerm]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const url = `https://avenza.live/api/admin/wallet/transactions?page=${currentPage}&per_page=${itemsPerPage}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTotalTransactions(data.total || 0);
        setTotalPages(data.total_pages || 0);
      } else {
        console.error('Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const getTypeDisplay = (transaction) => {
    if (transaction.type === 'topup') {
      return 'Top-up';
    } else if (transaction.type === 'balance_adjustment') {
      return transaction.action === 'credit' ? 'Credit to User' : 'Debit from User';
    }
    return transaction.type;
  };

  const getTypeColor = (transaction) => {
    if (transaction.type === 'topup') {
      return '#10b981';
    } else if (transaction.type === 'balance_adjustment') {
      return transaction.action === 'credit' ? '#ef4444' : '#10b981';
    }
    return '#94a3b8';
  };

  if (loading) {
    return (
      <div className="admin-page">
        <PageHeader title="Admin Wallet Transactions" subtitle="View all admin wallet activity" />
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Loading transactions...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PageHeader 
        title="Admin Wallet Transactions" 
        subtitle={`View all admin wallet activity (${totalTransactions} total)`} 
      />

      {/* Search Bar */}
      <div className="admin-card" style={{ marginBottom: '20px', padding: '20px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search by username or reason..."
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

      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">Transaction History</h3>
          <div className="card-header-info">
            Showing {transactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, totalTransactions)} of {totalTransactions}
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(74, 144, 226, 0.2)' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Wallet</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Reason</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Admin Balance After</th>
                <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Tag</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    {searchTerm ? 'No transactions found matching your search' : 'No transactions found'}
                  </td>
                </tr>
              ) : (
                transactions.map((trans) => (
                  <tr 
                    key={trans.id} 
                    style={{ 
                      borderBottom: '1px solid rgba(74, 144, 226, 0.1)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74, 144, 226, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                      {trans.created_at}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: getTypeColor(trans) }}>
                      {getTypeDisplay(trans)}
                    </td>
                    <td style={{ padding: '16px', color: '#e5e7eb', fontSize: '14px' }}>
                      {trans.username || '-'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>
                      <span style={{ color: trans.action === 'credit' || trans.type === 'topup' ? '#10b981' : '#ef4444' }}>
                        {trans.action === 'credit' ? '-' : trans.type === 'topup' ? '+' : '+'}
                        ${parseFloat(trans.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#4a90e2', fontSize: '14px' }}>
                      {trans.wallet_type ? trans.wallet_type.toUpperCase() : '-'}
                    </td>
                    <td style={{ padding: '16px', color: '#e5e7eb', fontSize: '14px', maxWidth: '300px' }}>
                      {trans.reason}
                    </td>
                    <td style={{ padding: '16px', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                      ${parseFloat(trans.balance_after).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {trans.tag === 'user_topup' && (
                        <div style={{
                          display: 'inline-block',
                          background: 'rgba(234, 179, 8, 0.15)',
                          border: '1px solid rgba(234, 179, 8, 0.3)',
                          borderRadius: '6px',
                          padding: '4px 10px'
                        }}>
                          <span style={{ color: '#eab308', fontSize: '11px', fontWeight: '600' }}>
                            👤 USER TOP-UP
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

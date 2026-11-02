import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';

export default function InternalTransfers() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [transfers, setTransfers] = useState([]);
  const [stats, setStats] = useState(null);
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransfers();
    }, searchTerm ? 800 : 0);

    return () => clearTimeout(timer);
  }, [currentPage, searchTerm]);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const url = `https://avenza.live/api/admin/internal-transfers?page=${currentPage}&per_page=${itemsPerPage}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransfers(data.transfers || []);
        setStats(data.stats || {});
        setTotalTransfers(data.total || 0);
        setTotalPages(data.total_pages || 0);
      } else {
        console.error('Failed to fetch transfers');
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="admin-page">
        <PageHeader title="Internal Transfers" subtitle="P2P transfer transactions" />
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Loading transfers...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PageHeader 
        title="Internal Transfers" 
        subtitle={`P2P transfer transactions (${totalTransfers} total)`} 
      />

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div className="admin-card" style={{ padding: '20px' }}>
            <div style={{
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
              Total Transfers
            </div>
            <div style={{
              color: '#fff',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              {stats.total_transfers?.toLocaleString() || 0}
            </div>
          </div>

          <div className="admin-card" style={{ padding: '20px' }}>
            <div style={{
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
              Total Volume
            </div>
            <div style={{
              color: '#10b981',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              ${stats.total_volume?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
          </div>

          <div className="admin-card" style={{ padding: '20px' }}>
            <div style={{
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
              Average Transfer
            </div>
            <div style={{
              color: '#4a90e2',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              ${stats.average_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="admin-card" style={{ marginBottom: '20px', padding: '20px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search by sender or receiver username..."
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
          <h3 className="card-title">All Internal Transfers</h3>
          <div className="card-header-info">
            Showing {transfers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, totalTransfers)} of {totalTransfers}
          </div>
        </div>
        
        <Table headers={['ID', 'Sender', 'Receiver', 'Amount', 'Status', 'Date']}>
          {transfers.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                {searchTerm ? 'No transfers found matching your search' : 'No transfers found'}
              </td>
            </tr>
          ) : (
            transfers.map((transfer) => (
              <tr key={transfer.id}>
                <td className="table-cell-muted">#{transfer.id}</td>
                <td>
                  <div className="table-cell-primary">{transfer.sender_username}</div>
                  <div className="table-cell-muted" style={{ fontSize: '12px' }}>ID: {transfer.sender_id}</div>
                </td>
                <td>
                  <div className="table-cell-primary">{transfer.receiver_username}</div>
                  <div className="table-cell-muted" style={{ fontSize: '12px' }}>ID: {transfer.receiver_id}</div>
                </td>
                <td>
                  <div style={{
                    color: '#10b981',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    ${parseFloat(transfer.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="table-cell-muted" style={{ fontSize: '12px' }}>{transfer.currency}</div>
                </td>
                <td>
                  <Badge status={transfer.status} />
                </td>
                <td className="table-cell-muted">{transfer.created_at}</td>
              </tr>
            ))
          )}
        </Table>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

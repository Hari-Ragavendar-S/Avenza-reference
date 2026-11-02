import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import Badge from '../components/Badge';

export default function Deposits() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const perPage = 20;

  useEffect(() => {
    fetchDeposits();
  }, [page, statusFilter, search]);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString()
      });
      
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await fetch(`https://avenza.live/api/admin/deposits?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setDeposits(data.deposits);
        setStats(data.stats);
        setTotalPages(data.total_pages);
      }
    } catch (err) {
      console.error('Failed to fetch deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  const shortenHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  return (
    <div className="admin-page">
      <PageHeader 
        title="Deposits Management" 
        subtitle="Monitor all user deposits in real-time" 
      />

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(74,144,226,0.1), rgba(147,51,234,0.05))',
          border: '1px solid rgba(74,144,226,0.2)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
            All Deposits
          </div>
          <div style={{ color: '#4a90e2', fontSize: '28px', fontWeight: 'bold' }}>
            {stats.total}
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(234,179,8,0.05))',
          border: '1px solid rgba(234,179,8,0.2)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
            Pending
          </div>
          <div style={{ color: '#eab308', fontSize: '28px', fontWeight: 'bold' }}>
            {stats.pending}
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
            Completed
          </div>
          <div style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold' }}>
            {stats.completed}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search by username..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            flex: 1,
            minWidth: '250px',
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '8px',
            padding: '10px 16px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '8px',
            padding: '10px 16px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
            minWidth: '150px'
          }}
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
        </select>
      </div>

      {/* Table */}
      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">
            Showing {deposits.length > 0 ? ((page - 1) * perPage + 1) : 0}-{Math.min(page * perPage, stats.total)} of {stats.total} deposits
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            Loading deposits...
          </div>
        ) : deposits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            No deposits found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(74, 144, 226, 0.2)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                    DEPOSIT ID
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                    USERNAME
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                    AMOUNT
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                    TX HASH
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                    STATUS
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                    DATE & TIME
                  </th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => (
                  <tr key={deposit.id} style={{ borderBottom: '1px solid rgba(74, 144, 226, 0.1)' }}>
                    <td style={{ padding: '16px', color: '#e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                      #{deposit.id}
                    </td>
                    <td style={{ padding: '16px', color: '#e5e7eb', fontSize: '14px' }}>
                      {deposit.username}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ color: '#4a90e2', fontSize: '14px', fontWeight: '600' }}>
                        ${deposit.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                        {deposit.currency} {deposit.network}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ 
                        color: '#94a3b8', 
                        fontSize: '12px', 
                        fontFamily: 'monospace',
                        cursor: 'pointer'
                      }}
                      title={deposit.transaction_hash}
                      >
                        {shortenHash(deposit.transaction_hash)}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Badge status={deposit.status === 'completed' ? 'Completed' : deposit.status === 'pending' ? 'Pending' : 'Processing'} />
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>
                      {deposit.ist_created_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ padding: '20px', borderTop: '1px solid rgba(74, 144, 226, 0.2)' }}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

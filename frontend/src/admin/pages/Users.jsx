import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';

export default function Users() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const itemsPerPage = 20;

  // Debounce search - waits 800ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, searchTerm ? 800 : 0);

    return () => clearTimeout(timer);
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const url = `https://avenza.live/api/admin/users?page=${currentPage}&per_page=${itemsPerPage}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalUsers(data.total || 0);
        setTotalPages(data.total_pages || 0);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleUserClick = (userId) => {
    navigate(`/admin/user/${userId}`);
  };

  if (loading) {
    return (
      <div className="admin-page">
        <PageHeader title="Users" subtitle="Manage all users" />
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Loading users...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PageHeader title="Users" subtitle={`Manage all users (${totalUsers} total)`} />

      {/* Search Bar */}
      <div className="admin-card" style={{ marginBottom: '20px', padding: '20px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search by name, email, phone, or username..."
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
          <h3 className="card-title">All Users</h3>
          <div className="card-header-info">
            Showing {users.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers}
          </div>
        </div>
        
        <Table headers={['ID', 'Name', 'Username', 'Email', 'Mobile', 'AVENZA Balance', 'INCOME Balance', 'GAMING Balance', 'Status', 'Joined']}>
          {users.length === 0 ? (
            <tr>
              <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                {searchTerm ? 'No users found matching your search' : 'No users found'}
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr 
                key={user.id} 
                onClick={() => handleUserClick(user.id)}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74, 144, 226, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td className="table-cell-muted">#{user.id}</td>
                <td className="table-cell-primary">{user.name}</td>
                <td className="table-cell-mono">{user.username}</td>
                <td className="table-cell-muted">{user.email}</td>
                <td className="table-cell-muted">{user.mobile}</td>
                <td className="table-cell-success">${parseFloat(user.avenza_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="table-cell-success">${parseFloat(user.income_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="table-cell-success">${parseFloat(user.gaming_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>
                  <Badge status={user.status} />
                </td>
                <td className="table-cell-muted">{user.created_at}</td>
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

import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import SearchFilter from '../components/SearchFilter';

// Generate 27 dummy support tickets
const generateTickets = () => {
  const subjects = [
    'Deposit not credited', 'Withdrawal delay', 'Account verification issue', 'Login problem',
    'Password reset request', 'Trading issue', 'Commission not received', 'Plan upgrade',
    'Referral bonus query', 'Investment maturity', 'KYC document rejection', 'Balance discrepancy',
    'Payment method issue', 'App not working', 'Transaction failed', 'Account suspended',
    'Level upgrade query', 'Profit calculation', 'Wallet address change', 'Two-factor authentication',
    'Email verification', 'Profile update', 'Investment cancellation', 'ROI question',
    'Referral link broken', 'Bonus not credited', 'Account security concern'
  ];
  
  const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
  const priorities = ['High', 'Medium', 'Low'];
  
  return subjects.map((subject, index) => ({
    id: 10000 + index,
    user_id: 1023 + Math.floor(Math.random() * 200),
    subject,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    created_at: new Date(2026, 8, Math.floor(Math.random() * 30) + 1, Math.floor(Math.random() * 24)).toISOString(),
    updated_at: new Date(2026, 8, Math.floor(Math.random() * 30) + 1, Math.floor(Math.random() * 24)).toISOString()
  }));
};

export default function Tickets() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  
  const allTickets = generateTickets();
  const itemsPerPage = 10;
  
  const filteredTickets = allTickets.filter(ticket => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      ticket.id.toString().includes(searchTerm) ||
      ticket.user_id.toString().includes(searchTerm) ||
      ticket.subject.toLowerCase().includes(searchLower) ||
      ticket.status.toLowerCase().includes(searchLower) ||
      ticket.priority.toLowerCase().includes(searchLower);
    
    const matchesDate = (!dateFilter.from && !dateFilter.to) ||
      (new Date(ticket.created_at) >= new Date(dateFilter.from || '2000-01-01') &&
       new Date(ticket.created_at) <= new Date(dateFilter.to || '2100-12-31'));
    
    return matchesSearch && matchesDate;
  });
  
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const currentTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleDateFilter = (dates) => {
    setDateFilter(dates);
    setCurrentPage(1);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="admin-page">
      <PageHeader 
        title="Support Tickets" 
        subtitle={`Manage user support requests (${allTickets.length} tickets)`} 
      />

      <SearchFilter 
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        showDateFilter={true}
      />

      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">All Tickets</h3>
          <div className="card-header-info">
            Showing {currentTickets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredTickets.length)} of {filteredTickets.length}
            {searchTerm || dateFilter.from || dateFilter.to ? ' (filtered)' : ''}
          </div>
        </div>
        
        <Table headers={['Ticket ID', 'User ID', 'Subject', 'Priority', 'Status', 'Created', 'Updated']}>
          {currentTickets.map((ticket) => (
            <tr key={ticket.id}>
              <td className="table-cell-muted">#{ticket.id}</td>
              <td className="table-cell-muted">#{ticket.user_id}</td>
              <td className="table-cell-primary">{ticket.subject}</td>
              <td>
                <Badge status={ticket.priority} />
              </td>
              <td>
                <Badge status={ticket.status} />
              </td>
              <td className="table-cell-muted">{formatDate(ticket.created_at)}</td>
              <td className="table-cell-muted">{formatDate(ticket.updated_at)}</td>
            </tr>
          ))}
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

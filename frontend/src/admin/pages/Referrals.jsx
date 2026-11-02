import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import SearchFilter from '../components/SearchFilter';

// Generate 32 dummy referrals
const generateReferrals = () => {
  return Array.from({ length: 32 }, (_, index) => ({
    id: 9000 + index,
    referrer_id: 1023 + Math.floor(Math.random() * 100),
    referrer_name: `User ${1023 + Math.floor(Math.random() * 100)}`,
    referred_id: 1123 + Math.floor(Math.random() * 100),
    referred_name: `User ${1123 + Math.floor(Math.random() * 100)}`,
    commission: Math.floor(Math.random() * 500) + 50,
    level: Math.floor(Math.random() * 5) + 1,
    created_at: new Date(2026, 8, Math.floor(Math.random() * 30) + 1).toISOString()
  }));
};

export default function Referrals() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  
  const allReferrals = generateReferrals();
  const itemsPerPage = 10;
  
  const filteredReferrals = allReferrals.filter(ref => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      ref.id.toString().includes(searchTerm) ||
      ref.referrer_id.toString().includes(searchTerm) ||
      ref.referrer_name.toLowerCase().includes(searchLower) ||
      ref.referred_id.toString().includes(searchTerm) ||
      ref.referred_name.toLowerCase().includes(searchLower);
    
    const matchesDate = (!dateFilter.from && !dateFilter.to) ||
      (new Date(ref.created_at) >= new Date(dateFilter.from || '2000-01-01') &&
       new Date(ref.created_at) <= new Date(dateFilter.to || '2100-12-31'));
    
    return matchesSearch && matchesDate;
  });
  
  const totalPages = Math.ceil(filteredReferrals.length / itemsPerPage);
  const currentReferrals = filteredReferrals.slice(
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalCommission = allReferrals.reduce((sum, r) => sum + r.commission, 0);

  return (
    <div className="admin-page">
      <PageHeader 
        title="Referrals" 
        subtitle={`Total commission paid: $${totalCommission.toLocaleString()} (${allReferrals.length} referrals)`} 
      />

      <SearchFilter 
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        showDateFilter={true}
      />

      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">All Referrals</h3>
          <div className="card-header-info">
            Showing {currentReferrals.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredReferrals.length)} of {filteredReferrals.length}
            {searchTerm || dateFilter.from || dateFilter.to ? ' (filtered)' : ''}
          </div>
        </div>
        
        <Table headers={['Referral ID', 'Referrer', 'Referred User', 'Level', 'Commission', 'Date']}>
          {currentReferrals.map((ref) => (
            <tr key={ref.id}>
              <td className="table-cell-muted">#{ref.id}</td>
              <td className="table-cell-primary">#{ref.referrer_id} - {ref.referrer_name}</td>
              <td className="table-cell-muted">#{ref.referred_id} - {ref.referred_name}</td>
              <td className="table-cell-muted">Level {ref.level}</td>
              <td className="table-cell-success">${ref.commission.toLocaleString()}</td>
              <td className="table-cell-muted">{formatDate(ref.created_at)}</td>
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

import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import SearchFilter from '../components/SearchFilter';

// Generate 30 dummy ROI records
const generateROI = () => {
  return Array.from({ length: 30 }, (_, index) => ({
    id: 11000 + index,
    user_id: 1023 + Math.floor(Math.random() * 200),
    investment_id: 8000 + Math.floor(Math.random() * 15),
    principal: Math.floor(Math.random() * 50000) + 1000,
    roi_amount: Math.floor(Math.random() * 5000) + 100,
    roi_percentage: (Math.random() * 10 + 5).toFixed(2),
    status: Math.random() > 0.3 ? 'Completed' : 'Pending',
    paid_at: new Date(2026, 8, Math.floor(Math.random() * 30) + 1).toISOString()
  }));
};

export default function ROI() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  
  const allROI = generateROI();
  const itemsPerPage = 10;
  
  const filteredROI = allROI.filter(roi => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      roi.id.toString().includes(searchTerm) ||
      roi.user_id.toString().includes(searchTerm) ||
      roi.investment_id.toString().includes(searchTerm) ||
      roi.status.toLowerCase().includes(searchLower);
    
    const matchesDate = (!dateFilter.from && !dateFilter.to) ||
      (new Date(roi.paid_at) >= new Date(dateFilter.from || '2000-01-01') &&
       new Date(roi.paid_at) <= new Date(dateFilter.to || '2100-12-31'));
    
    return matchesSearch && matchesDate;
  });
  
  const totalPages = Math.ceil(filteredROI.length / itemsPerPage);
  const currentROI = filteredROI.slice(
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

  const totalPaid = allROI.filter(r => r.status === 'Completed').reduce((sum, r) => sum + r.roi_amount, 0);

  return (
    <div className="admin-page">
      <PageHeader 
        title="Profit Management (ROI)" 
        subtitle={`Total ROI paid: $${totalPaid.toLocaleString()} (${allROI.length} transactions)`} 
      />

      <SearchFilter 
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        showDateFilter={true}
      />

      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">All ROI Transactions</h3>
          <div className="card-header-info">
            Showing {currentROI.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredROI.length)} of {filteredROI.length}
            {searchTerm || dateFilter.from || dateFilter.to ? ' (filtered)' : ''}
          </div>
        </div>
        
        <Table headers={['ROI ID', 'User ID', 'Investment ID', 'Principal', 'ROI Amount', 'ROI %', 'Status', 'Date']}>
          {currentROI.map((roi) => (
            <tr key={roi.id}>
              <td className="table-cell-muted">#{roi.id}</td>
              <td className="table-cell-muted">#{roi.user_id}</td>
              <td className="table-cell-muted">#{roi.investment_id}</td>
              <td className="table-cell-primary">${roi.principal.toLocaleString()}</td>
              <td className="table-cell-success">+${roi.roi_amount.toLocaleString()}</td>
              <td className="table-cell-success">{roi.roi_percentage}%</td>
              <td>
                <Badge status={roi.status} />
              </td>
              <td className="table-cell-muted">{formatDate(roi.paid_at)}</td>
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

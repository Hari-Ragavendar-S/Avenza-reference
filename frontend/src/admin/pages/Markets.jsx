import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import SearchFilter from '../components/SearchFilter';

// Generate 25 dummy market pairs
const generateMarkets = () => {
  const pairs = [
    'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT',
    'SOL/USDT', 'DOT/USDT', 'DOGE/USDT', 'AVAX/USDT', 'MATIC/USDT',
    'LTC/USDT', 'LINK/USDT', 'UNI/USDT', 'ATOM/USDT', 'ETC/USDT',
    'XLM/USDT', 'ALGO/USDT', 'VET/USDT', 'FIL/USDT', 'TRX/USDT',
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'
  ];
  
  return pairs.map((pair, index) => ({
    id: 7000 + index,
    pair,
    price: Math.random() * 50000 + 100,
    change_24h: (Math.random() * 10 - 5).toFixed(2),
    volume_24h: Math.floor(Math.random() * 10000000) + 100000,
    is_active: Math.random() > 0.1,
    type: pair.includes('/USD') ? 'Forex' : 'Crypto'
  }));
};

export default function Markets() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const allMarkets = generateMarkets();
  const itemsPerPage = 10;
  
  const filteredMarkets = allMarkets.filter(market => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      market.pair.toLowerCase().includes(searchLower) ||
      market.type.toLowerCase().includes(searchLower) ||
      market.id.toString().includes(searchTerm);
    
    return matchesSearch;
  });
  
  const totalPages = Math.ceil(filteredMarkets.length / itemsPerPage);
  const currentMarkets = filteredMarkets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  return (
    <div className="admin-page">
      <PageHeader 
        title="Markets" 
        subtitle={`Manage trading pairs (${allMarkets.length} markets)`} 
      />

      <SearchFilter 
        onSearch={handleSearch}
        showDateFilter={false}
      />

      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">All Markets</h3>
          <div className="card-header-info">
            Showing {currentMarkets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredMarkets.length)} of {filteredMarkets.length}
            {searchTerm ? ' (filtered)' : ''}
          </div>
        </div>
        
        <Table headers={['Market ID', 'Pair', 'Type', 'Price', '24h Change', '24h Volume', 'Status']}>
          {currentMarkets.map((market) => (
            <tr key={market.id}>
              <td className="table-cell-muted">#{market.id}</td>
              <td className="table-cell-primary">{market.pair}</td>
              <td className="table-cell-muted">{market.type}</td>
              <td className="table-cell-primary">${market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className={parseFloat(market.change_24h) >= 0 ? 'table-cell-success' : 'table-cell-danger'}>
                {parseFloat(market.change_24h) >= 0 ? '+' : ''}{market.change_24h}%
              </td>
              <td className="table-cell-muted">${market.volume_24h.toLocaleString()}</td>
              <td>
                <Badge status={market.is_active ? 'Active' : 'Inactive'} />
              </td>
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

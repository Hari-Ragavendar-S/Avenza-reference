export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = [];
  
  // Always show first page
  pages.push(1);
  
  // Show pages around current page
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }
  
  // Always show last page
  if (totalPages > 1 && !pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return (
    <div className="admin-pagination">
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-btn"
      >
        Previous
      </button>
      
      <div className="pagination-pages">
        {pages.map((page, index) => {
          // Add ellipsis if there's a gap
          const showEllipsis = index > 0 && page - pages[index - 1] > 1;
          
          return (
            <div key={page}>
              {showEllipsis && <span className="pagination-ellipsis">...</span>}
              <button
                onClick={() => onPageChange(page)}
                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            </div>
          );
        })}
      </div>
      
      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-btn"
      >
        Next
      </button>
    </div>
  );
}

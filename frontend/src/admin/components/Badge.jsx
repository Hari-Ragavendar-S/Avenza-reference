export default function Badge({ status }) {
  const getStatusClass = () => {
    const statusMap = {
      // Status badges
      'Active': 'badge-active',
      'Completed': 'badge-completed',
      'Closed': 'badge-closed',
      'Pending': 'badge-pending',
      'Processing': 'badge-processing',
      'Open': 'badge-open',
      'In Progress': 'badge-progress',
      'Resolved': 'badge-resolved',
      'Suspended': 'badge-suspended',
      'Rejected': 'badge-rejected',
      'Inactive': 'badge-inactive',
      'Verified': 'badge-verified',
      'Not Submitted': 'badge-not-submitted',
      'BUY': 'badge-buy',
      'SELL': 'badge-sell',
      'High': 'badge-high',
      'Medium': 'badge-medium',
      'Low': 'badge-low',
    };
    return statusMap[status] || 'badge-default';
  };

  return (
    <span className={`admin-badge ${getStatusClass()}`}>
      {status}
    </span>
  );
}

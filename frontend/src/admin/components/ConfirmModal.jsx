export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal">
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button onClick={onCancel} className="modal-btn modal-btn-cancel">
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={`modal-btn ${danger ? 'modal-btn-danger' : 'modal-btn-confirm'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

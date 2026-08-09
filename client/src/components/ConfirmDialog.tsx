import { IconAlert } from './Icons';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-dialog-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconAlert style={{ color: 'var(--color-danger)' }} />
          {title}
        </h2>
        <p style={{ color: 'var(--color-muted)' }}>{message}</p>
        <div className="modal-actions">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

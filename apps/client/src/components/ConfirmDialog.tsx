import { useDialogFocus } from '../hooks/useDialogFocus';

type ConfirmDialogProps = {
  body: string;
  confirmLabel: string;
  isBusy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
};

export function ConfirmDialog({
  body,
  confirmLabel,
  isBusy = false,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  const dialogRef = useDialogFocus(true, onCancel);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (!isBusy && event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        aria-labelledby="confirmation-title"
        aria-modal="true"
        className="modal-card confirm-modal"
        ref={dialogRef}
        role="alertdialog"
        tabIndex={-1}
      >
        <p className="eyebrow">Please confirm</p>
        <h2 id="confirmation-title">{title}</h2>
        <p>{body}</p>
        <div className="modal-actions">
          <button
            className="secondary-button"
            disabled={isBusy}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="danger-button"
            disabled={isBusy}
            onClick={onConfirm}
            type="button"
          >
            {isBusy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

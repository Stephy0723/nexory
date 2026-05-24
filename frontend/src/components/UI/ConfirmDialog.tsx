import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Delete', loading }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3 mb-6">
        <AlertTriangle size={20} className="text-[#F59E0B] shrink-0 mt-0.5" />
        <p className="text-sm text-[#8B949E]">{message}</p>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
import type { Toast as ToastType } from '../types';
import { styles } from '../styles/shared';

interface ToastProps {
  toast: ToastType;
}

export function Toast({ toast }: ToastProps) {
  return (
    <div
      style={{
        ...styles.toast,
        borderColor: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
        }}
      />
      {toast.message}
    </div>
  );
}

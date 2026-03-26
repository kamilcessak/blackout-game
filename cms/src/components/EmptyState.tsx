import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { styles } from '../styles/shared';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <div style={styles.emptyState}>
      {icon}
      <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: 15 }}>{title}</p>
      {subtitle && (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{subtitle}</p>
      )}
    </div>
  );
}

export function LoadingState({ text = 'Ładowanie...' }: { text?: string }) {
  return (
    <div style={styles.emptyState}>
      <RefreshCw
        size={32}
        color="var(--text-muted)"
        style={{ animation: 'spin 1s linear infinite' }}
      />
      <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>{text}</p>
    </div>
  );
}

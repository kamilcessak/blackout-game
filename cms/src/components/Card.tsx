import type { ReactNode, CSSProperties } from 'react';
import { styles } from '../styles/shared';

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
}

interface CardHeaderProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function Card({ children, style }: CardProps) {
  return <div style={{ ...styles.card, ...style }}>{children}</div>;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  return <div style={{ ...styles.cardHeader, ...style }}>{children}</div>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 style={styles.cardTitle}>{children}</h2>;
}

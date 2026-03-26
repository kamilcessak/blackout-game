import { Zap, Package, Users, MapPin } from 'lucide-react';
import type { Tab } from '../types';
import { styles } from '../styles/shared';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  badgeText: string;
}

const TABS: { key: Tab; icon: typeof Package; label: string }[] = [
  { key: 'ITEMS', icon: Package, label: 'Przedmioty' },
  { key: 'PLAYERS', icon: Users, label: 'Gracze' },
  { key: 'AIRDROPS', icon: MapPin, label: 'Mapa / Zrzuty' },
];

export function Header({ activeTab, onTabChange, badgeText }: HeaderProps) {
  return (
    <header style={styles.header}>
      <div style={styles.headerInner}>
        <div style={styles.headerLeft}>
          <div style={styles.logoBox}>
            <Zap size={20} color="#fff" />
          </div>
          <div>
            <h1 style={styles.headerTitle}>Blackout - Panel Zarządzania</h1>
            <p style={styles.headerSub}>System zarządzania grą</p>
          </div>
        </div>

        <nav style={styles.tabNav}>
          {TABS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              style={{
                ...styles.tabBtn,
                ...(activeTab === key ? styles.tabBtnActive : {}),
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>

        <div style={styles.headerRight}>
          <span style={styles.badge}>{badgeText}</span>
        </div>
      </div>
    </header>
  );
}

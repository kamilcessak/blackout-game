import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { usePlayerStats } from '@/features/player/hooks/usePlayerStats';

type StatBarProps = {
  label: string;
  icon: string;
  value: number;
  color: string;
};

const StatBar = ({ label, icon, value, color }: StatBarProps) => {
  const v = () => {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
  };

  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel} numberOfLines={1}>
        {icon} {label}
      </Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${v()}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.statValue}>{Math.round(v())}</Text>
    </View>
  );
};

export const PlayerHUD = () => {
  const { data, isLoading, isError } = usePlayerStats();

  return (
    <View style={styles.container} pointerEvents="none">
      {isLoading ? (
        <View style={styles.centerRow}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      ) : isError || !data ? (
        <View style={styles.centerRow}>
          <Text style={styles.errorText}>Błąd HUD</Text>
        </View>
      ) : (
        <View style={styles.row}>
          <StatBar label="HP" icon="💖" value={data.hp} color="#ff3b30" />
          <StatBar label="Hunger" icon="🍗" value={data.hunger} color="#ff9500" />
          <StatBar label="Thirst" icon="💧" value={data.thirst} color="#0a84ff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 1000,
    elevation: 1000,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 10,
  },
  centerRow: {
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    minWidth: 90,
  },
  statLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 6,
  },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  statValue: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  errorText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
});

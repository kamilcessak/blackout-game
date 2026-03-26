import { useEffect, useState } from 'react';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import type { Tab } from './types';
import { useToast } from './hooks/useToast';
import { useItems } from './features/items/hooks/useItems';
import { usePlayers } from './features/players/hooks/usePlayers';
import { useAirdrops } from './features/airdrops/hooks/useAirdrops';
import { useGameConfig } from './features/config/hooks/useGameConfig';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { ItemsTab } from './features/items/components/ItemsTab';
import { PlayersTab } from './features/players/components/PlayersTab';
import { AirdropsTab } from './features/airdrops/components/AirdropsTab';
import { ConfigTab } from './features/config/components/ConfigTab';
import { styles } from './styles/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('ITEMS');
  const { toast, showToast } = useToast();
  const { items, loading: itemsLoading, fetchItems, createItem } = useItems(showToast);
  const {
    players,
    loading: playersLoading,
    fetchPlayers,
    killPlayer,
    healPlayer,
    setPlayerLevel,
  } = usePlayers(showToast);
  const airdrop = useAirdrops(showToast);
  const gameConfig = useGameConfig(showToast);

  useEffect(() => {
    if (activeTab === 'PLAYERS' && players.length === 0) fetchPlayers();
    if (activeTab === 'AIRDROPS' && items.length === 0) fetchItems();
  }, [activeTab, players.length, items.length, fetchPlayers, fetchItems]);

  const badgeText =
    activeTab === 'ITEMS'
      ? `${items.length} przedmiotów`
      : activeTab === 'PLAYERS'
        ? `${players.length} graczy`
        : activeTab === 'CONFIG'
          ? 'Konfiguracja'
          : 'Zrzuty';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header activeTab={activeTab} onTabChange={setActiveTab} badgeText={badgeText} />

      <main style={styles.main}>
        {activeTab === 'ITEMS' && (
          <ItemsTab
            items={items}
            loading={itemsLoading}
            onRefresh={fetchItems}
            onCreate={createItem}
          />
        )}

        {activeTab === 'PLAYERS' && (
          <PlayersTab
            players={players}
            loading={playersLoading}
            onRefresh={fetchPlayers}
            onKill={killPlayer}
            onHeal={healPlayer}
            onSetLevel={setPlayerLevel}
          />
        )}

        {activeTab === 'AIRDROPS' && (
          <AirdropsTab items={items} airdrop={airdrop} showToast={showToast} />
        )}

        {activeTab === 'CONFIG' && (
          <ConfigTab
            config={gameConfig.config}
            loading={gameConfig.loading}
            saving={gameConfig.saving}
            onSave={gameConfig.updateConfig}
          />
        )}
      </main>

      {toast && <Toast toast={toast} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: var(--text-muted); }
        select { cursor: pointer; }
        select option { background: var(--bg-secondary); color: var(--text-primary); }
        tr:hover { background: var(--bg-hover) !important; }
        button:not(:disabled):hover { filter: brightness(1.15); }
      `}</style>
    </div>
  );
}

export default App;

import { useEffect, useState } from 'react';
import { GameProvider, useGame } from '@/context/GameContext';
import HeroSetup from '@/components/HeroSetup';
import SceneView from '@/components/SceneView';
import Sidebar from '@/components/Sidebar';
import LogPanel from '@/components/LogPanel';
import Epilogue from '@/components/Epilogue';
import ConversationPanel from '@/components/ConversationPanel';
import type { Campaign } from '@/types';
import { campaignData } from '@shared/campaign';

const GameShell = ({
  isFetching,
  error
}: {
  isFetching: boolean;
  error: string | null;
}) => {
  const { campaign, hero, currentScene, isGameComplete } = useGame();

  if (!hero) {
    return (
      <div className="app-shell">
        {error && <div className="banner warning">{error}</div>}
        <HeroSetup />
        {isFetching && <div className="loading-indicator">Syncing campaign data…</div>}
      </div>
    );
  }

  if (isGameComplete) {
    return (
      <div className="app-shell">
        {error && <div className="banner warning">{error}</div>}
        <Epilogue />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {error && <div className="banner warning">{error}</div>}
      <header className="game-header">
        <div>
          <h1>{campaign.title}</h1>
          <p>{campaign.synopsis}</p>
        </div>
        <div className="game-hero">
          <span>Hero:</span>
          <strong>{hero.name}</strong>
        </div>
      </header>

      <main className="game-layout">
        <section className="primary-panel">
          {currentScene ? (
            <SceneView scene={currentScene} />
          ) : (
            <div className="scene-container">
              <p>No scene loaded.</p>
            </div>
          )}
        </section>
        <section className="secondary-panel">
          <Sidebar />
          <ConversationPanel />
          <LogPanel />
        </section>
      </main>

      {isFetching && <div className="loading-indicator overlay">Syncing campaign data…</div>}
    </div>
  );
};

const App = () => {
  const [campaign, setCampaign] = useState<Campaign | null>(campaignData);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadCampaign = async () => {
      try {
        const response = await fetch('/api/campaign', { credentials: 'same-origin' });
        if (!response.ok) {
          throw new Error('Failed to retrieve campaign');
        }
        const payload = (await response.json()) as Campaign;
        if (isMounted) {
          setCampaign(payload);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Offline mode — using bundled campaign data.');
        }
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };

    void loadCampaign();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <GameProvider campaign={campaign}>
      <GameShell isFetching={isFetching} error={error} />
    </GameProvider>
  );
};

export default App;

import { useCallback, useEffect, useState } from 'react';
import { GameProvider, useGame } from '@/context/GameContext';
import CharacterCreator from '@/components/CharacterCreator';
import Sidebar from '@/components/Sidebar';
import LogPanel from '@/components/LogPanel';
import Epilogue from '@/components/Epilogue';
import StoryCanvas from '@/components/StoryCanvas';
import CampaignGuide from '@/components/CampaignGuide';
import AuthPanel from '@/components/AuthPanel';
import { useAuth } from '@/context/AuthContext';
import type { Campaign } from '@/types';
import { campaignData } from '@shared/campaign';
import { CLASS_DEFINITIONS, RACE_DEFINITIONS, BACKGROUND_DEFINITIONS } from '@shared/referenceData';

const GameShell = ({
  isFetching,
  error,
  accountEmail,
  onSignOut,
  authNotice
}: {
  isFetching: boolean;
  error: string | null;
  accountEmail?: string | null;
  onSignOut?: () => void;
  authNotice?: string | null;
}) => {
  const { campaign, hero, isGameComplete } = useGame();

  const race = hero ? RACE_DEFINITIONS.find((entry) => entry.id === hero.raceId) : null;
  const klass = hero
    ? CLASS_DEFINITIONS.find((entry) => entry.id === hero.classId)
    : null;
  const background = hero
    ? BACKGROUND_DEFINITIONS.find((entry) => entry.id === hero.backgroundId)
    : null;

  let body: JSX.Element;
  let overlay: JSX.Element | null = null;

  if (!hero) {
    body = (
      <>
        <CharacterCreator />
        {isFetching && <div className="loading-indicator">Syncing campaign data…</div>}
      </>
    );
  } else if (isGameComplete) {
    body = <Epilogue />;
  } else {
    body = (
      <>
        <header className="game-header">
          <div>
            <h1>{campaign.title}</h1>
            <p>{campaign.synopsis}</p>
          </div>
          <div className="game-hero">
            <span>{hero.name}</span>
            <strong>
              {klass?.name ?? 'Adventurer'} • {race?.name ?? 'Unknown'} • {background?.name ?? 'Wanderer'}
            </strong>
          </div>
        </header>

        <main className="game-layout">
          <section className="primary-panel">
            <StoryCanvas />
          </section>
          <section className="secondary-panel">
            <CampaignGuide />
            <Sidebar />
            <LogPanel />
          </section>
        </main>
      </>
    );

    if (isFetching) {
      overlay = (
        <div className="loading-indicator overlay">Syncing campaign data…</div>
      );
    }
  }

  return (
    <div className="app-shell">
      {accountEmail && (
        <div className="account-banner">
          <span>
            Signed in as <strong>{accountEmail}</strong>
          </span>
          {onSignOut && (
            <button
              type="button"
              className="account-banner__signout"
              onClick={onSignOut}
            >
              Sign out
            </button>
          )}
        </div>
      )}
      {authNotice && <div className="banner info">{authNotice}</div>}
      {error && <div className="banner warning">{error}</div>}
      {body}
      {overlay}
    </div>
  );
};

const App = () => {
  const [campaign, setCampaign] = useState<Campaign | null>(campaignData);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const { user, initializing, authAvailable, signOut } = useAuth();

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

  useEffect(() => {
    if (user) {
      setGuestMode(false);
    }
  }, [user]);

  const handleSkipAuth = useCallback(() => {
    setGuestMode(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } finally {
      setGuestMode(false);
    }
  }, [signOut]);

  const accountEmail = user?.email ?? user?.uid ?? null;
  const authNotice = !authAvailable
    ? 'Authentication is not configured. Progress will be stored locally on this device.'
    : !user && guestMode
      ? 'Guest mode active — progress stays on this device.'
      : null;

  if (initializing) {
    return (
      <div className="app-shell">
        <div className="loading-indicator">Loading account…</div>
      </div>
    );
  }

  if (authAvailable && !user && !guestMode) {
    return (
      <div className="app-shell">
        {error && <div className="banner warning">{error}</div>}
        <AuthPanel onSkip={handleSkipAuth} />
      </div>
    );
  }

  return (
    <GameProvider campaign={campaign}>
      <GameShell
        isFetching={isFetching}
        error={error}
        accountEmail={accountEmail}
        onSignOut={user ? handleSignOut : undefined}
        authNotice={authNotice}
      />
    </GameProvider>
  );
};

export default App;

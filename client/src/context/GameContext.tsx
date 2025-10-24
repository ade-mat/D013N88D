import { createContext, useContext, useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import type { Campaign } from '@/types';
import { useGameEngine, type GameEngine } from '@/hooks/useGameEngine';
import { createRemotePersistence } from '@/lib/persistence/remotePersistence';
import { useAuth } from '@/context/AuthContext';

const GameContext = createContext<GameEngine | null>(null);

interface GameProviderProps extends PropsWithChildren {
  campaign: Campaign | null;
}

export const GameProvider = ({ campaign, children }: GameProviderProps) => {
  const { user, authAvailable, getIdToken } = useAuth();

  const persistence = useMemo(() => {
    if (!authAvailable || !user) {
      return undefined;
    }
    return createRemotePersistence(() => getIdToken());
  }, [authAvailable, getIdToken, user]);

  const engine = useGameEngine(campaign, persistence);
  return <GameContext.Provider value={engine}>{children}</GameContext.Provider>;
};

export const useGame = (): GameEngine => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

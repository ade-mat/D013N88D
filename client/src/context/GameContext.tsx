import { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import type { Campaign } from '@/types';
import { useGameEngine, type GameEngine } from '@/hooks/useGameEngine';

const GameContext = createContext<GameEngine | null>(null);

interface GameProviderProps extends PropsWithChildren {
  campaign: Campaign | null;
}

export const GameProvider = ({ campaign, children }: GameProviderProps) => {
  const engine = useGameEngine(campaign);
  return <GameContext.Provider value={engine}>{children}</GameContext.Provider>;
};

export const useGame = (): GameEngine => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

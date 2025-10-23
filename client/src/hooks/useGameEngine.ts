import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Campaign,
  ConversationTurn,
  HeroArchetype,
  HeroState,
  LogEntry,
  Metric,
  SceneChoice,
  SceneEffect,
  SceneNode,
  SceneOutcome
} from '@/types';
import { campaignData } from '@shared/campaign';
import { executeRoll, RollResult } from '@/utils/dice';

interface StoredState {
  hero: HeroState | null;
  currentSceneId: string | null;
  log: LogEntry[];
  visitedScenes: Record<string, number>;
  conversation: Record<string, ConversationTurn[]>;
}

const LOCAL_STORAGE_KEY = 'emberfall-ascent-save-v1';
const buildLogEntry = (
  type: LogEntry['type'],
  label: string,
  detail?: string
): LogEntry => ({
  id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
  type,
  label,
  detail,
  createdAt: Date.now()
});

const defaultMetrics: Record<Metric, number> = {
  stress: 0,
  wounds: 0,
  influence: 0,
  corruption: 0
};

const clampMetric = (metric: Metric, value: number) => {
  const max = metric === 'influence' ? 6 : metric === 'corruption' ? 6 : 8;
  return Math.min(Math.max(value, 0), max);
};

const createHeroState = (archetype: HeroArchetype, name: string): HeroState => ({
  id: `${archetype.id}-${Date.now()}`,
  name,
  archetypeId: archetype.id,
  attributes: { ...archetype.attributes },
  inventory: [...archetype.startingInventory],
  abilities: [...archetype.startingAbilities],
  metrics: { ...defaultMetrics },
  flags: {},
  allies: {}
});

const applyEffect = (hero: HeroState, effect?: SceneEffect): HeroState => {
  if (!effect) {
    return hero;
  }

  const updated: HeroState = {
    ...hero,
    inventory: [...hero.inventory],
    abilities: [...hero.abilities],
    metrics: { ...hero.metrics },
    flags: { ...hero.flags },
    allies: { ...hero.allies }
  };

  if (effect.addItems) {
    effect.addItems.forEach((item) => {
      if (!updated.inventory.includes(item)) {
        updated.inventory.push(item);
      }
    });
  }

  if (effect.removeItems) {
    updated.inventory = updated.inventory.filter(
      (item) => !effect.removeItems?.includes(item)
    );
  }

  if (effect.abilities) {
    effect.abilities.forEach((ability) => {
      if (!updated.abilities.includes(ability)) {
        updated.abilities.push(ability);
      }
    });
  }

  if (effect.metrics) {
    Object.entries(effect.metrics).forEach(([metric, delta]) => {
      const typedMetric = metric as Metric;
      const previous = updated.metrics[typedMetric] ?? 0;
      updated.metrics[typedMetric] = clampMetric(typedMetric, previous + delta);
    });
  }

  if (effect.flags) {
    Object.entries(effect.flags).forEach(([flag, value]) => {
      updated.flags[flag] = value;
    });
  }

  if (effect.allies) {
    Object.entries(effect.allies).forEach(([ally, status]) => {
      updated.allies[ally] = status;
    });
  }

  return updated;
};

const getScene = (campaign: Campaign, sceneId: string | null): SceneNode | null => {
  if (!sceneId) {
    return null;
  }
  return campaign.scenes.find((scene) => scene.id === sceneId) ?? null;
};

export interface GameEngine {
  campaign: Campaign;
  hero: HeroState | null;
  currentScene: SceneNode | null;
  currentSceneId: string | null;
  log: LogEntry[];
  lastRoll: RollResult | null;
  visitedScenes: Record<string, number>;
  conversation: Record<string, ConversationTurn[]>;
  startGame: (payload: { name: string; archetypeId: string }) => void;
  chooseOption: (choiceId: string) => void;
  resetGame: () => void;
  recordPlayerConversation: (npcId: string, text: string) => void;
  recordNpcConversation: (npcId: string, text: string) => void;
  isGameComplete: boolean;
}

export const useGameEngine = (remoteCampaign: Campaign | null): GameEngine => {
  const campaign = remoteCampaign ?? campaignData;

  const [hero, setHero] = useState<HeroState | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(
    campaign.introSceneId
  );
  const [log, setLog] = useState<LogEntry[]>([]);
  const [visitedScenes, setVisitedScenes] = useState<Record<string, number>>({});
  const [lastRoll, setLastRoll] = useState<RollResult | null>(null);
  const [conversation, setConversation] = useState<
    Record<string, ConversationTurn[]>
  >({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const lastSceneIdRef = useRef<string | null>(null);

  const currentScene = useMemo(
    () => getScene(campaign, currentSceneId),
    [campaign, currentSceneId]
  );

  const persistState = useCallback(
    (nextState: StoredState) => {
      if (typeof window === 'undefined') {
        return;
      }
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextState));
    },
    []
  );

  const appendLog = useCallback((entry: LogEntry) => {
    setLog((prev) => {
      const next = [...prev, entry];
      return next.slice(-120);
    });
  }, []);

  const applyOutcome = useCallback(
    (outcome: SceneOutcome, heroState: HeroState) => {
      appendLog(buildLogEntry('narration', outcome.narrative));

      let updatedHero = heroState;
      if (outcome.effects) {
        updatedHero = applyEffect(heroState, outcome.effects);
        if (outcome.effects.notes) {
          outcome.effects.notes.forEach((note) =>
            appendLog(buildLogEntry('effect', 'Effect', note))
          );
        }
      }

      setHero(updatedHero);
      setCurrentSceneId(outcome.nextSceneId);
      return updatedHero;
    },
    [appendLog]
  );

  const chooseOption = useCallback(
    (choiceId: string) => {
      if (!hero || !currentScene) {
        return;
      }

      const choice: SceneChoice | undefined = currentScene.options.find(
        (option) => option.id === choiceId
      );

      if (!choice) {
        return;
      }

      appendLog(buildLogEntry('choice', choice.label, choice.description));

      if (choice.autoSuccess) {
        applyOutcome(choice.autoSuccess, hero);
        return;
      }

      if (choice.skillCheck) {
        const { attribute, difficulty, advantageIfFlag, disadvantageIfFlag } =
          choice.skillCheck;
        const modifier = hero.attributes[attribute] ?? 0;
        const advantage = advantageIfFlag ? hero.flags[advantageIfFlag] === true : false;
        const disadvantage = disadvantageIfFlag
          ? hero.flags[disadvantageIfFlag] === true
          : false;
        const roll = executeRoll({
          modifier,
          difficulty,
          attribute,
          advantage,
          disadvantage
        });
        setLastRoll(roll);
        appendLog(
          buildLogEntry(
            'roll',
            `D20 + ${attribute.toUpperCase()}`,
            `Rolled ${roll.total} vs DC ${difficulty}`
          )
        );

        const outcome = roll.success
          ? choice.skillCheck.success
          : choice.skillCheck.failure;
        applyOutcome(outcome, hero);
      }
    },
    [appendLog, applyOutcome, currentScene, hero]
  );

  const startGame = useCallback(
    ({ name, archetypeId }: { name: string; archetypeId: string }) => {
      const archetype =
        campaign.archetypes.find((entry) => entry.id === archetypeId) ??
        campaign.archetypes[0];
      const newHero = createHeroState(archetype, name);

      setHero(newHero);
      setLog([
        buildLogEntry(
          'narration',
          `Welcome, ${newHero.name}`,
          `Archetype: ${archetype.name}`
        )
      ]);
      setVisitedScenes({});
      setConversation({});
      setLastRoll(null);
      setCurrentSceneId(campaign.introSceneId);
      lastSceneIdRef.current = null;
    },
    [campaign]
  );

  const resetGame = useCallback(() => {
    setHero(null);
    setLog([]);
    setVisitedScenes({});
    setConversation({});
    setLastRoll(null);
    setCurrentSceneId(campaign.introSceneId);
    lastSceneIdRef.current = null;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [campaign.introSceneId]);

  const recordPlayerConversation = useCallback((npcId: string, text: string) => {
    setConversation((prev) => {
      const existing = prev[npcId] ?? [];
      return {
        ...prev,
        [npcId]: [...existing, { speaker: 'player', text }]
      };
    });
  }, []);

  const recordNpcConversation = useCallback((npcId: string, text: string) => {
    setConversation((prev) => {
      const existing = prev[npcId] ?? [];
      return {
        ...prev,
        [npcId]: [...existing, { speaker: 'npc', text }]
      };
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || hasLoaded) {
      return;
    }

    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredState;
        if (parsed.hero) {
          setHero(parsed.hero);
        }
        setCurrentSceneId(parsed.currentSceneId ?? campaign.introSceneId);
        setLog(parsed.log ?? []);
        setVisitedScenes(parsed.visitedScenes ?? {});
        setConversation(parsed.conversation ?? {});
      } catch {
        // Ignore corrupted saves.
      }
    }
    setHasLoaded(true);
  }, [campaign.introSceneId, hasLoaded]);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }
    persistState({
      hero,
      currentSceneId,
      log,
      visitedScenes,
      conversation
    });
  }, [conversation, currentSceneId, hero, log, persistState, visitedScenes, hasLoaded]);

  useEffect(() => {
    if (!hero || !currentSceneId) {
      return;
    }

    if (lastSceneIdRef.current === currentSceneId) {
      return;
    }

    lastSceneIdRef.current = currentSceneId;

    const scene = getScene(campaign, currentSceneId);
    if (!scene) {
      return;
    }

    setVisitedScenes((prev) => ({
      ...prev,
      [scene.id]: (prev[scene.id] ?? 0) + 1
    }));

    if (scene.onEnter) {
      setHero((prevHero) => {
        if (!prevHero) {
          return prevHero;
        }
        const nextHero = applyEffect(prevHero, scene.onEnter);
        if (scene.onEnter.notes && scene.onEnter.notes.length > 0) {
          scene.onEnter.notes.forEach((note) =>
            appendLog(buildLogEntry('narration', 'Insight', note))
          );
        }
        return nextHero;
      });
    }
  }, [appendLog, campaign, currentSceneId, hero]);

  const isGameComplete = currentSceneId === null;

  return {
    campaign,
    hero,
    currentScene,
    currentSceneId,
    log,
    lastRoll,
    visitedScenes,
    conversation,
    startGame,
    chooseOption,
    resetGame,
    recordPlayerConversation,
    recordNpcConversation,
    isGameComplete
  };
};

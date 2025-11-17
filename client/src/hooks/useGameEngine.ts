import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Ability,
  Campaign,
  GameStateSnapshot,
  HeroResources,
  HeroState,
  LogEntry,
  Skill,
  StoryAdvanceResponse,
  StoryBeat
} from '@/types';
import { campaignData } from '@shared/campaign';
import {
  ABILITIES,
  ABILITY_LABEL,
  BACKGROUND_DEFINITIONS,
  CLASS_DEFINITIONS,
  RACE_DEFINITIONS,
  SKILLS
} from '@shared/referenceData';

export type StoredState = GameStateSnapshot;

const LOCAL_STORAGE_KEY = 'emberfall-ascent-save-v3';

export interface GamePersistence {
  load: () => Promise<StoredState | null>;
  save: (state: StoredState) => Promise<void>;
  clear: () => Promise<void>;
}

const createLocalStoragePersistence = (): GamePersistence => ({
  async load() {
    if (typeof window === 'undefined') {
      return null;
    }
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored) as StoredState;
    } catch {
      return null;
    }
  },
  async save(state) {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  },
  async clear() {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
});

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

const DEFAULT_STATUS_KEYS = ['stress', 'wounds', 'influence', 'corruption'] as const;

const clampStatusValue = (key: string, value: number) => {
  if (key === 'influence') {
    return Math.min(Math.max(value, 0), 6);
  }
  if (key === 'corruption') {
    return Math.min(Math.max(value, 0), 6);
  }
  return Math.min(Math.max(value, 0), 8);
};

const getAbilityModifier = (score: number) => Math.floor((score - 10) / 2);

const initializeStatus = () => {
  const status: Record<string, number> = {};
  DEFAULT_STATUS_KEYS.forEach((key) => {
    status[key] = 0;
  });
  return status;
};

const initializeSkills = () => {
  const skills: Record<Skill, boolean> = {} as Record<Skill, boolean>;
  SKILLS.forEach((skill) => {
    skills[skill.id] = false;
  });
  return skills;
};

const skillIdFromLabel = (label: string): Skill | undefined => {
  const normalised = label.replace(/[^a-zA-Z]/g, '').toLowerCase();
  return SKILLS.find((entry) => entry.label.replace(/[^a-zA-Z]/g, '').toLowerCase() === normalised)?.id;
};

export interface CharacterBuild {
  name: string;
  raceId: string;
  classId: string;
  backgroundId: string;
  abilityScores: Record<Ability, number>;
  selectedSkills: Skill[];
  notes?: string[];
}

const createHeroState = (build: CharacterBuild): HeroState => {
  const race =
    RACE_DEFINITIONS.find((entry) => entry.id === build.raceId) ?? RACE_DEFINITIONS[0];
  const klass =
    CLASS_DEFINITIONS.find((entry) => entry.id === build.classId) ?? CLASS_DEFINITIONS[0];
  const background =
    BACKGROUND_DEFINITIONS.find((entry) => entry.id === build.backgroundId) ??
    BACKGROUND_DEFINITIONS[0];

  const raceAdjustedScores: Record<Ability, number> = ABILITIES.reduce(
    (acc, ability) => {
      const base = build.abilityScores[ability] ?? 10;
      const racialBonus = race.abilityBonuses?.[ability] ?? 0;
      return {
        ...acc,
        [ability]: base + racialBonus
      };
    },
    {} as Record<Ability, number>
  );

  const proficiencyBonus = 2;

  const savingThrows = ABILITIES.reduce<Record<Ability, boolean>>((acc, ability) => {
    acc[ability] = klass.savingThrows.includes(ability);
    return acc;
  }, {} as Record<Ability, boolean>);

  const skillMap = initializeSkills();

  background.skillProficiencies.forEach((skill) => {
    skillMap[skill] = true;
  });

  build.selectedSkills.forEach((skill) => {
    skillMap[skill] = true;
  });

  if (race.proficiencies) {
    race.proficiencies.forEach((label) => {
      const skill = skillIdFromLabel(label);
      if (skill) {
        skillMap[skill] = true;
      }
    });
  }

  const abilityModCon = getAbilityModifier(raceAdjustedScores.constitution);
  const hitPoints = Math.max(klass.hitDie + abilityModCon, 1);

  const equipment = new Set<string>();
  klass.startingEquipment.forEach((item) => equipment.add(item));
  background.equipment.forEach((item) => equipment.add(item));

  const features: string[] = [];
  features.push(...klass.features);
  features.push(background.feature);
  features.push(...race.traits);

  const languages = new Set<string>();
  race.languages.forEach((language) => languages.add(language));
  background.languages.forEach((language) => languages.add(language));

  const toolProficiencies = new Set<string>();
  klass.toolProficiencies.forEach((tool) => toolProficiencies.add(tool));
  background.toolProficiencies.forEach((tool) => toolProficiencies.add(tool));

  const hero: HeroState = {
    id: `${build.classId}-${Date.now().toString(16)}`,
    name: build.name,
    level: 1,
    raceId: race.id,
    classId: klass.id,
    backgroundId: background.id,
    abilityScores: {
      strength: raceAdjustedScores.strength,
      dexterity: raceAdjustedScores.dexterity,
      constitution: raceAdjustedScores.constitution,
      intelligence: raceAdjustedScores.intelligence,
      wisdom: raceAdjustedScores.wisdom,
      charisma: raceAdjustedScores.charisma
    },
    proficiencyBonus,
    savingThrows,
    skills: skillMap,
    armorClass: 10 + getAbilityModifier(raceAdjustedScores.dexterity),
    speed: race.speed,
    resources: {
      hitPoints,
      tempHitPoints: 0,
      inspiration: 0
    },
    equipment: Array.from(equipment),
    features,
    traits: race.traits,
    languages: Array.from(languages),
    toolProficiencies: Array.from(toolProficiencies),
    spellcastingAbility: klass.spellcastingAbility,
    spellSlots: klass.spellcastingAbility ? { 1: 2 } : undefined,
    notes: build.notes ?? [],
    status: initializeStatus(),
    flags: {},
    allies: {}
  };

  return hero;
};

const applyBeatDelta = (hero: HeroState, beat: StoryBeat): HeroState => {
  if (!beat.delta) {
    return hero;
  }
  const updated: HeroState = {
    ...hero,
    status: { ...hero.status },
    flags: { ...hero.flags },
    allies: { ...hero.allies },
    notes: [...hero.notes],
    resources: { ...hero.resources }
  };

  if (beat.delta.statusAdjust) {
    Object.entries(beat.delta.statusAdjust).forEach(([key, delta]) => {
      const previous = updated.status[key] ?? 0;
      updated.status[key] = clampStatusValue(key, previous + delta);
    });
  }

  if (beat.delta.flags) {
    Object.entries(beat.delta.flags).forEach(([flag, value]) => {
      updated.flags[flag] = value;
    });
  }

  if (beat.delta.notes) {
    updated.notes.push(...beat.delta.notes);
  }

  if (beat.delta.allies) {
    Object.entries(beat.delta.allies).forEach(([ally, value]) => {
      updated.allies[ally] = value;
    });
  }

  return updated;
};

const buildOfflineBeat = (
  action: string,
  campaign: Campaign,
  beats: StoryBeat[]
): StoryBeat => {
  const lastBeat = beats.length > 0 ? beats[beats.length - 1] : null;
  const fallbackAct =
    lastBeat?.tags?.[0] ??
    campaign.acts[Math.min(beats.length, campaign.acts.length - 1)]?.id ??
    'act1';
  return {
    id: `offline-${Date.now().toString(16)}`,
    playerAction: action,
    narrative: `You ${action}. ${campaign.synopsis} The Heart still trembles, urging you forward.`,
    npcReplies: [],
    tags: [fallbackAct],
    createdAt: Date.now()
  };
};

export interface GameEngine {
  campaign: Campaign;
  hero: HeroState | null;
  storyBeats: StoryBeat[];
  log: LogEntry[];
  storyLoading: boolean;
  storyError: string | null;
  isGameComplete: boolean;
  abilityMod: (ability: Ability) => number;
  startGame: (build: CharacterBuild) => void;
  submitStoryAction: (action: string) => Promise<void>;
  resetGame: () => void;
}

export const useGameEngine = (
  remoteCampaign: Campaign | null,
  persistence?: GamePersistence
): GameEngine => {
  const campaign = remoteCampaign ?? campaignData;
  const [hero, setHero] = useState<HeroState | null>(null);
  const [storyBeats, setStoryBeats] = useState<StoryBeat[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const persistenceImpl = useMemo(
    () => persistence ?? createLocalStoragePersistence(),
    [persistence]
  );

  const abilityMod = useCallback(
    (ability: Ability) => {
      if (!hero) {
        return 0;
      }
      return getAbilityModifier(hero.abilityScores[ability]);
    },
    [hero]
  );

  const appendLog = useCallback((entry: LogEntry) => {
    setLog((prev) => {
      const next = [...prev, entry];
      return next.slice(-200);
    });
  }, []);

  const startGame = useCallback(
    (build: CharacterBuild) => {
      const nextHero = createHeroState(build);
      setHero(nextHero);
      setStoryBeats([]);
      setStoryError(null);
      appendLog(
        buildLogEntry(
          'system',
          'Campaign started',
          `Hero: ${nextHero.name} • ${ABILITY_LABEL.strength} ${nextHero.abilityScores.strength}`
        )
      );
    },
    [appendLog]
  );

  const resetGame = useCallback(() => {
    setHero(null);
    setStoryBeats([]);
    setStoryError(null);
    setLog([]);
    void persistenceImpl.clear();
  }, [persistenceImpl]);

  const submitStoryAction = useCallback(
    async (action: string) => {
      if (!hero) {
        return;
      }
      const trimmed = action.trim();
      if (!trimmed) {
        return;
      }

      appendLog(buildLogEntry('action', hero.name, trimmed));
      setStoryLoading(true);
      setStoryError(null);

      try {
        const response = await fetch('/api/story/advance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: trimmed,
            hero,
            beats: storyBeats.slice(-6)
          })
        });

        if (!response.ok) {
          throw new Error('oracle-offline');
        }

        const payload = (await response.json()) as StoryAdvanceResponse;
        const beat = payload.beat;
        setStoryBeats((prev) => [...prev, beat].slice(-25));
        if (beat.delta) {
          setHero((prev) => (prev ? applyBeatDelta(prev, beat) : prev));
        }
        appendLog(buildLogEntry('narration', beat.narrative));
        beat.npcReplies.forEach((reply) => {
          appendLog(buildLogEntry('effect', `Reply from ${reply.npcId}`, reply.text));
        });
      } catch (error) {
        setStoryError('Oracle offline — weaving local narration.');
        const fallback = buildOfflineBeat(trimmed, campaign, storyBeats);
        setStoryBeats((prev) => [...prev, fallback].slice(-25));
        appendLog(buildLogEntry('narration', fallback.narrative));
      } finally {
        setStoryLoading(false);
      }
    },
    [appendLog, campaign, hero, storyBeats]
  );

  const isGameComplete = useMemo(() => {
    if (!hero) {
      return false;
    }
    if (storyBeats.some((beat) => beat.delta?.isEnding)) {
      return true;
    }
    return Boolean(hero.flags.heart_cleansed || hero.flags.heart_shattered);
  }, [hero, storyBeats]);

  useEffect(() => {
    let isMounted = true;
    const restore = async () => {
      try {
        const stored = await persistenceImpl.load();
        if (stored && isMounted) {
          setHero(stored.hero);
          setStoryBeats(stored.storyBeats ?? []);
          setLog(stored.log ?? []);
        }
      } finally {
        if (isMounted) {
          setHasLoaded(true);
        }
      }
    };
    void restore();
    return () => {
      isMounted = false;
    };
  }, [persistenceImpl]);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }
    const snapshot: StoredState = {
      hero,
      storyBeats,
      log
    };
    void persistenceImpl.save(snapshot);
  }, [hero, storyBeats, log, hasLoaded, persistenceImpl]);

  return {
    campaign,
    hero,
    storyBeats,
    log,
    storyLoading,
    storyError,
    isGameComplete,
    abilityMod,
    startGame,
    submitStoryAction,
    resetGame
  };
};

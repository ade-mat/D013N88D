import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Ability,
  Campaign,
  ConversationTurn,
  HeroResources,
  HeroState,
  LogEntry,
  SceneChoice,
  SceneEffect,
  SceneNode,
  SceneOutcome,
  Skill
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
import {
  CheckRollResult,
  CheckRollOptions,
  formatCheckSummary,
  getSkillAbility,
  rollAbilityCheck
} from '@/utils/dice';

interface StoredState {
  hero: HeroState | null;
  currentSceneId: string | null;
  log: LogEntry[];
  visitedScenes: Record<string, number>;
  conversation: Record<string, ConversationTurn[]>;
}

const LOCAL_STORAGE_KEY = 'emberfall-ascent-save-v2';

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
  const race = RACE_DEFINITIONS.find((entry) => entry.id === build.raceId) ??
    RACE_DEFINITIONS[0];
  const klass = CLASS_DEFINITIONS.find((entry) => entry.id === build.classId) ??
    CLASS_DEFINITIONS[0];
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

  const proficiencyBonus = 2; // Level 1 baseline.

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
    spellSlots: klass.spellcastingAbility
      ? { 1: 2 }
      : undefined,
    notes: build.notes ?? [],
    status: initializeStatus(),
    flags: {},
    allies: {}
  };

  return hero;
};

const applyEffect = (hero: HeroState, effect?: SceneEffect): HeroState => {
  if (!effect) {
    return hero;
  }

  const updated: HeroState = {
    ...hero,
    equipment: [...hero.equipment],
    features: [...hero.features],
    notes: [...hero.notes],
    status: { ...hero.status },
    flags: { ...hero.flags },
    allies: { ...hero.allies },
    resources: { ...hero.resources }
  };

  if (effect.addItems) {
    effect.addItems.forEach((item) => {
      if (!updated.equipment.includes(item)) {
        updated.equipment.push(item);
      }
    });
  }

  if (effect.removeItems) {
    updated.equipment = updated.equipment.filter(
      (item) => !effect.removeItems?.includes(item)
    );
  }

  if (effect.flags) {
    Object.entries(effect.flags).forEach(([flag, value]) => {
      updated.flags[flag] = value;
    });
  }

  if (effect.statusAdjust) {
    Object.entries(effect.statusAdjust).forEach(([key, delta]) => {
      const previous = updated.status[key] ?? 0;
      updated.status[key] = clampStatusValue(key, previous + delta);
    });
  }

  if (effect.allies) {
    Object.entries(effect.allies).forEach(([ally, status]) => {
      updated.allies[ally] = status;
    });
  }

  if (effect.notes) {
    updated.notes.push(...effect.notes);
  }

  if (effect.resources) {
    const mergeResource = (key: keyof HeroResources) => {
      if (typeof effect.resources?.[key] === 'number') {
        updated.resources[key] = Math.max(0, effect.resources[key]!);
      }
    };
    mergeResource('hitPoints');
    mergeResource('tempHitPoints');
    mergeResource('inspiration');
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
  lastRoll: CheckRollResult | null;
  visitedScenes: Record<string, number>;
  conversation: Record<string, ConversationTurn[]>;
  startGame: (build: CharacterBuild) => void;
  chooseOption: (choiceId: string) => void;
  resetGame: () => void;
  recordPlayerConversation: (npcId: string, text: string) => void;
  recordNpcConversation: (npcId: string, text: string) => void;
  isGameComplete: boolean;
  abilityMod: (ability: Ability) => number;
}

export const useGameEngine = (remoteCampaign: Campaign | null): GameEngine => {
  const campaign = remoteCampaign ?? campaignData;

  const [hero, setHero] = useState<HeroState | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(
    campaign.introSceneId
  );
  const [log, setLog] = useState<LogEntry[]>([]);
  const [visitedScenes, setVisitedScenes] = useState<Record<string, number>>({});
  const [lastRoll, setLastRoll] = useState<CheckRollResult | null>(null);
  const [conversation, setConversation] = useState<
    Record<string, ConversationTurn[]>
  >({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const lastSceneIdRef = useRef<string | null>(null);

  const currentScene = useMemo(
    () => getScene(campaign, currentSceneId),
    [campaign, currentSceneId]
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
      return next.slice(-150);
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

  const handleSkillCheck = useCallback(
    (
      choice: SceneChoice,
      heroState: HeroState
    ) => {
      if (!choice.skillCheck) {
        return heroState;
      }

      const { ability, skill, dc, advantageIfFlag, disadvantageIfFlag } =
        choice.skillCheck;

      const abilityModifier = getAbilityModifier(heroState.abilityScores[ability]);
      const proficientInSkill = skill ? heroState.skills[skill] === true : false;
      const miscBonus = heroState.flags['heart_cleansed'] && ability === 'wisdom' ? 1 : 0;

      const options: CheckRollOptions = {
        ability,
        abilityMod: abilityModifier,
        proficiencyBonus: heroState.proficiencyBonus,
        proficient: proficientInSkill,
        miscBonus,
        dc,
        advantage: advantageIfFlag ? heroState.flags[advantageIfFlag] === true : false,
        disadvantage: disadvantageIfFlag
          ? heroState.flags[disadvantageIfFlag] === true
          : false,
        skill
      };

      const roll = rollAbilityCheck(options);
      setLastRoll(roll);
      const labelParts = [
        `Check: ${skill ? skill.replace(/([A-Z])/g, ' $1') : ABILITY_LABEL[ability]}`
      ];
      appendLog(buildLogEntry('roll', labelParts.join(' '), formatCheckSummary(roll)));

      const outcome = roll.success
        ? choice.skillCheck.success
        : choice.skillCheck.failure;

      return applyOutcome(outcome, heroState);
    },
    [appendLog, applyOutcome]
  );

  const chooseOption = useCallback(
    (choiceId: string) => {
      if (!hero || !currentScene) {
        return;
      }

      const choice = currentScene.options.find((option) => option.id === choiceId);
      if (!choice) {
        return;
      }

      appendLog(buildLogEntry('choice', choice.label, choice.description));

      if (choice.autoSuccess) {
        applyOutcome(choice.autoSuccess, hero);
        return;
      }

      if (choice.skillCheck) {
        const updatedHero = handleSkillCheck(choice, hero);
        setHero(updatedHero);
      }
    },
    [appendLog, applyOutcome, currentScene, handleSkillCheck, hero]
  );

  const startGame = useCallback(
    (build: CharacterBuild) => {
      const newHero = createHeroState(build);
      setHero(newHero);
      setLog([
        buildLogEntry(
          'narration',
          `Welcome, ${newHero.name}`,
          `${CLASS_DEFINITIONS.find((c) => c.id === newHero.classId)?.name ?? 'Adventurer'} of the ${RACE_DEFINITIONS.find((r) => r.id === newHero.raceId)?.name ?? 'Unknown'} lineage`
        )
      ]);
      setVisitedScenes({});
      setConversation({});
      setLastRoll(null);
      setCurrentSceneId(campaign.introSceneId);
      lastSceneIdRef.current = null;
    },
    [campaign.introSceneId]
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
        // swallow malformed saves
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
    isGameComplete,
    abilityMod
  };
};

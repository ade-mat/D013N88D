export type Attribute = 'might' | 'finesse' | 'insight' | 'resolve';

export type Metric = 'stress' | 'wounds' | 'influence' | 'corruption';

export interface HeroArchetype {
  id: string;
  name: string;
  summary: string;
  description: string;
  focus: Attribute;
  attributes: Record<Attribute, number>;
  startingAbilities: string[];
  startingInventory: string[];
}

export interface HeroState {
  id: string;
  name: string;
  archetypeId: string;
  attributes: Record<Attribute, number>;
  inventory: string[];
  abilities: string[];
  metrics: Record<Metric, number>;
  flags: Record<string, boolean>;
  allies: Record<string, 'ally' | 'rival' | 'neutral'>;
}

export interface SceneEffect {
  addItems?: string[];
  removeItems?: string[];
  metrics?: Partial<Record<Metric, number>>;
  flags?: Record<string, boolean>;
  allies?: Record<string, 'ally' | 'rival' | 'neutral'>;
  abilities?: string[];
  notes?: string[];
}

export interface SceneOutcome {
  id: string;
  nextSceneId: string | null;
  narrative: string;
  effects?: SceneEffect;
}

export interface SkillCheckDefinition {
  attribute: Attribute;
  difficulty: number;
  success: SceneOutcome;
  failure: SceneOutcome;
  advantageIfFlag?: string;
  disadvantageIfFlag?: string;
}

export interface SceneChoice {
  id: string;
  label: string;
  description?: string;
  requiresFlag?: string;
  hideIfFlag?: string;
  autoSuccess?: SceneOutcome;
  skillCheck?: SkillCheckDefinition;
}

export interface SceneNode {
  id: string;
  title: string;
  narrative: string;
  options: SceneChoice[];
  once?: boolean;
  tags?: string[];
  onEnter?: SceneEffect;
  fallbackSceneId?: string | null;
}

export interface Campaign {
  id: string;
  title: string;
  synopsis: string;
  introSceneId: string;
  scenes: SceneNode[];
  archetypes: HeroArchetype[];
  guidance?: string[];
}

export interface LogEntry {
  id: string;
  type: 'narration' | 'choice' | 'roll' | 'effect';
  label: string;
  detail?: string;
  createdAt: number;
}

export interface ConversationTurn {
  speaker: 'player' | 'npc';
  text: string;
}

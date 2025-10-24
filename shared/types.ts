export type Ability =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

export type Skill =
  | 'acrobatics'
  | 'animalHandling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleightOfHand'
  | 'stealth'
  | 'survival';

export interface ClassDefinition {
  id: string;
  name: string;
  hitDie: number;
  primaryAbilities: Ability[];
  savingThrows: Ability[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  skillOptions: Skill[];
  skillChoices: number;
  startingEquipment: string[];
  features: string[];
  spellcastingAbility?: Ability;
}

export interface RaceDefinition {
  id: string;
  name: string;
  abilityBonuses: Partial<Record<Ability, number>>;
  speed: number;
  size: 'Small' | 'Medium';
  traits: string[];
  languages: string[];
  proficiencies?: string[];
}

export interface BackgroundDefinition {
  id: string;
  name: string;
  skillProficiencies: Skill[];
  toolProficiencies: string[];
  languages: string[];
  equipment: string[];
  feature: string;
  suggestedCharacteristics: string[];
}

export interface HeroAbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface HeroResources {
  hitPoints: number;
  tempHitPoints: number;
  inspiration: number;
}

export interface HeroState {
  id: string;
  name: string;
  level: number;
  raceId: string;
  classId: string;
  backgroundId: string;
  abilityScores: HeroAbilityScores;
  proficiencyBonus: number;
  savingThrows: Record<Ability, boolean>;
  skills: Record<Skill, boolean>;
  armorClass: number;
  speed: number;
  resources: HeroResources;
  equipment: string[];
  features: string[];
  traits: string[];
  languages: string[];
  toolProficiencies: string[];
  spellcastingAbility?: Ability;
  spellSlots?: Record<number, number>;
  notes: string[];
  status: Record<string, number>;
  flags: Record<string, boolean>;
  allies: Record<string, 'ally' | 'rival' | 'neutral'>;
}

export interface SceneEffect {
  addItems?: string[];
  removeItems?: string[];
  resources?: Partial<HeroResources>;
  flags?: Record<string, boolean>;
  allies?: Record<string, 'ally' | 'rival' | 'neutral'>;
  statusAdjust?: Record<string, number>;
  notes?: string[];
}

export interface SceneOutcome {
  id: string;
  nextSceneId: string | null;
  narrative: string;
  effects?: SceneEffect;
}

export interface SkillCheckDefinition {
  ability: Ability;
  skill?: Skill;
  dc: number;
  advantageIfFlag?: string;
  disadvantageIfFlag?: string;
  success: SceneOutcome;
  failure: SceneOutcome;
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

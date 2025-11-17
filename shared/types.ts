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

export interface CampaignAct {
  id: string;
  title: string;
  situation: string;
  objectives: string[];
  complications?: string[];
  escalation?: string;
}

export interface CampaignCharacter {
  id: string;
  name: string;
  role: string;
  motivation: string;
  voice: string;
  secrets?: string[];
  resources?: string[];
}

export interface CampaignLoreEntry {
  id: string;
  title: string;
  details: string[];
}

export interface Campaign {
  id: string;
  title: string;
  synopsis: string;
  tone: string;
  guidance?: string[];
  themes?: string[];
  acts: CampaignAct[];
  characters: CampaignCharacter[];
  lore: CampaignLoreEntry[];
}

export interface StoryBeatDelta {
  statusAdjust?: Record<string, number>;
  flags?: Record<string, boolean>;
  allies?: Record<string, 'ally' | 'rival' | 'neutral'>;
  notes?: string[];
  isEnding?: boolean;
}

export interface StoryBeatReply {
  npcId: string;
  text: string;
}

export interface StoryBeat {
  id: string;
  playerAction: string;
  narrative: string;
  npcReplies: StoryBeatReply[];
  tags?: string[];
  delta?: StoryBeatDelta;
  createdAt: number;
}

export interface StoryAdvanceRequest {
  action: string;
  hero: HeroState;
  beats: StoryBeat[];
}

export interface StoryAdvanceResponse {
  beat: StoryBeat;
}

export interface LogEntry {
  id: string;
  type: 'narration' | 'action' | 'system' | 'effect';
  label: string;
  detail?: string;
  createdAt: number;
}

export interface GameStateSnapshot {
  hero: HeroState | null;
  storyBeats: StoryBeat[];
  log: LogEntry[];
}

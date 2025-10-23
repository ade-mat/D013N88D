import type { Ability, Skill } from '@/types';
import { SKILLS } from '@shared/referenceData';

export interface DieRollDetail {
  die: number;
  sides: number;
}

export interface DiceFormulaResult {
  total: number;
  rolls: DieRollDetail[];
  modifier: number;
  formula: string;
}

export interface CheckRollResult {
  primary: number;
  secondary?: number;
  kept: number;
  total: number;
  dc: number;
  success: boolean;
  advantage: boolean;
  disadvantage: boolean;
  ability: Ability;
  abilityMod: number;
  proficiencyBonus: number;
  proficient: boolean;
  miscBonus: number;
  skill?: Skill;
}

const randInt = (sides: number) => Math.floor(Math.random() * sides) + 1;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const parseAndRollFormula = (formula: string): DiceFormulaResult => {
  const cleaned = formula.replace(/\s+/g, '').toLowerCase();
  const dicePattern = /(\d*)d(\d+)([+-]\d+)?/;
  const match = cleaned.match(dicePattern);

  if (!match) {
    const modifier = Number.parseInt(cleaned, 10);
    const total = Number.isNaN(modifier) ? 0 : modifier;
    return {
      rolls: [],
      total,
      modifier: total,
      formula: cleaned || '0'
    };
  }

  const [, countRaw, sidesRaw, modifierRaw] = match;
  const count = Number.parseInt(countRaw || '1', 10);
  const sides = Number.parseInt(sidesRaw, 10);
  const modifier = modifierRaw ? Number.parseInt(modifierRaw, 10) : 0;

  const rolls: DieRollDetail[] = Array.from({ length: Math.max(count, 1) }, () => ({
    die: randInt(sides),
    sides
  }));

  const total = rolls.reduce((sum, roll) => sum + roll.die, 0) + modifier;

  const baseFormula = `${count}d${sides}`;
  const displayFormula =
    modifier === 0 ? baseFormula : `${baseFormula}${modifier >= 0 ? `+${modifier}` : modifier}`;

  return {
    rolls,
    total,
    modifier,
    formula: displayFormula
  };
};

export interface CheckRollOptions {
  ability: Ability;
  abilityMod: number;
  proficiencyBonus: number;
  proficient?: boolean;
  miscBonus?: number;
  dc: number;
  advantage?: boolean;
  disadvantage?: boolean;
  skill?: Skill;
}

export const rollAbilityCheck = ({
  ability,
  abilityMod,
  proficiencyBonus,
  proficient = false,
  miscBonus = 0,
  dc,
  advantage = false,
  disadvantage = false,
  skill
}: CheckRollOptions): CheckRollResult => {
  const primary = randInt(20);
  const secondary = advantage || disadvantage ? randInt(20) : undefined;
  let kept = primary;

  if (advantage && secondary !== undefined) {
    kept = Math.max(primary, secondary);
  } else if (disadvantage && secondary !== undefined) {
    kept = Math.min(primary, secondary);
  }

  const profBonus = proficient ? proficiencyBonus : 0;
  const totalRaw = kept + abilityMod + profBonus + miscBonus;
  const total = clamp(totalRaw, -5, 40);

  return {
    primary,
    secondary,
    kept,
    total,
    dc,
    success: total >= dc,
    advantage,
    disadvantage,
    ability,
    abilityMod,
    proficiencyBonus,
    proficient,
    miscBonus,
    skill
  };
};

export const getSkillAbility = (skill: Skill): Ability => {
  const entry = SKILLS.find((item) => item.id === skill);
  return entry ? entry.ability : 'wisdom';
};

export const formatCheckSummary = (result: CheckRollResult): string => {
  const parts: string[] = [];
  parts.push(`d20 = ${result.kept}`);
  parts.push(`Ability ${result.abilityMod >= 0 ? `+${result.abilityMod}` : result.abilityMod}`);

  if (result.proficient) {
    parts.push(`Proficiency +${result.proficiencyBonus}`);
  }

  if (result.miscBonus !== 0) {
    parts.push(`Misc ${result.miscBonus >= 0 ? `+${result.miscBonus}` : result.miscBonus}`);
  }

  parts.push(`Total ${result.total} vs DC ${result.dc}`);
  return parts.join(' • ');
};

import { Attribute } from '@/types';

export interface RollResult {
  die: number;
  secondaryDie?: number;
  modifier: number;
  total: number;
  difficulty: number;
  attribute: Attribute;
  success: boolean;
  advantage: boolean;
  disadvantage: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const rollD20 = () => Math.floor(Math.random() * 20) + 1;

export interface RollOptions {
  modifier: number;
  difficulty: number;
  attribute: Attribute;
  advantage?: boolean;
  disadvantage?: boolean;
}

export function executeRoll({
  modifier,
  difficulty,
  attribute,
  advantage = false,
  disadvantage = false
}: RollOptions): RollResult {
  const primary = rollD20();
  const secondary = advantage || disadvantage ? rollD20() : undefined;
  let die = primary;

  if (advantage && secondary !== undefined) {
    die = Math.max(primary, secondary);
  } else if (disadvantage && secondary !== undefined) {
    die = Math.min(primary, secondary);
  }

  const total = clamp(die + modifier, 0, 40);
  const success = total >= difficulty;

  return {
    die,
    secondaryDie: secondary,
    modifier,
    total,
    difficulty,
    attribute,
    success,
    advantage,
    disadvantage
  };
}

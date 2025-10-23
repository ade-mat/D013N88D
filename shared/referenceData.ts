import { Ability, BackgroundDefinition, ClassDefinition, RaceDefinition, Skill } from './types.js';

export const ABILITIES: Ability[] = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma'
];

export const SKILLS: { id: Skill; label: string; ability: Ability }[] = [
  { id: 'acrobatics', label: 'Acrobatics', ability: 'dexterity' },
  { id: 'animalHandling', label: 'Animal Handling', ability: 'wisdom' },
  { id: 'arcana', label: 'Arcana', ability: 'intelligence' },
  { id: 'athletics', label: 'Athletics', ability: 'strength' },
  { id: 'deception', label: 'Deception', ability: 'charisma' },
  { id: 'history', label: 'History', ability: 'intelligence' },
  { id: 'insight', label: 'Insight', ability: 'wisdom' },
  { id: 'intimidation', label: 'Intimidation', ability: 'charisma' },
  { id: 'investigation', label: 'Investigation', ability: 'intelligence' },
  { id: 'medicine', label: 'Medicine', ability: 'wisdom' },
  { id: 'nature', label: 'Nature', ability: 'intelligence' },
  { id: 'perception', label: 'Perception', ability: 'wisdom' },
  { id: 'performance', label: 'Performance', ability: 'charisma' },
  { id: 'persuasion', label: 'Persuasion', ability: 'charisma' },
  { id: 'religion', label: 'Religion', ability: 'intelligence' },
  { id: 'sleightOfHand', label: 'Sleight of Hand', ability: 'dexterity' },
  { id: 'stealth', label: 'Stealth', ability: 'dexterity' },
  { id: 'survival', label: 'Survival', ability: 'wisdom' }
];

export const CLASS_DEFINITIONS: ClassDefinition[] = [
  {
    id: 'fighter',
    name: 'Fighter',
    hitDie: 10,
    primaryAbilities: ['strength', 'constitution'],
    savingThrows: ['strength', 'constitution'],
    armorProficiencies: ['All armour', 'Shields'],
    weaponProficiencies: ['Simple weapons', 'Martial weapons'],
    toolProficiencies: [],
    skillOptions: ['acrobatics', 'animalHandling', 'athletics', 'history', 'insight', 'perception', 'survival'],
    skillChoices: 2,
    startingEquipment: [
      'Chain mail or leather armour, longbow, and 20 arrows',
      'Martial weapon and shield or two martial weapons',
      'Light crossbow and 20 bolts or two handaxes',
      'Dungeoneer’s pack or Explorer’s pack'
    ],
    features: ['Fighting Style', 'Second Wind']
  },
  {
    id: 'rogue',
    name: 'Rogue',
    hitDie: 8,
    primaryAbilities: ['dexterity'],
    savingThrows: ['dexterity', 'intelligence'],
    armorProficiencies: ['Light armour'],
    weaponProficiencies: ['Simple weapons', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords'],
    toolProficiencies: ['Thieves’ tools'],
    skillOptions: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleightOfHand', 'stealth'],
    skillChoices: 4,
    startingEquipment: [
      'Rapier or shortsword',
      'Shortbow and 20 arrows or shortsword',
      'Burglar’s pack, Dungeoneer’s pack, or Explorer’s pack',
      'Leather armour, two daggers, and thieves’ tools'
    ],
    features: ['Expertise', 'Sneak Attack', 'Thieves’ Cant']
  },
  {
    id: 'wizard',
    name: 'Wizard',
    hitDie: 6,
    primaryAbilities: ['intelligence'],
    savingThrows: ['intelligence', 'wisdom'],
    armorProficiencies: [],
    weaponProficiencies: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'],
    toolProficiencies: [],
    skillOptions: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'],
    skillChoices: 2,
    startingEquipment: [
      'Quarterstaff or dagger',
      'Component pouch or arcane focus',
      'Scholar’s pack or Explorer’s pack',
      'Spellbook'
    ],
    features: ['Spellcasting', 'Arcane Recovery'],
    spellcastingAbility: 'intelligence'
  },
  {
    id: 'cleric',
    name: 'Cleric',
    hitDie: 8,
    primaryAbilities: ['wisdom'],
    savingThrows: ['wisdom', 'charisma'],
    armorProficiencies: ['Light armour', 'Medium armour', 'Shields'],
    weaponProficiencies: ['Simple weapons'],
    toolProficiencies: [],
    skillOptions: ['history', 'insight', 'medicine', 'persuasion', 'religion'],
    skillChoices: 2,
    startingEquipment: [
      'Mace or warhammer (if proficient)',
      'Scale mail, leather armour, or chain mail (if proficient)',
      'Light crossbow and 20 bolts or simple weapon',
      'Priest’s pack or Explorer’s pack',
      'Shield and holy symbol'
    ],
    features: ['Spellcasting', 'Divine Domain'],
    spellcastingAbility: 'wisdom'
  }
];

export const RACE_DEFINITIONS: RaceDefinition[] = [
  {
    id: 'human',
    name: 'Human',
    abilityBonuses: {
      strength: 1,
      dexterity: 1,
      constitution: 1,
      intelligence: 1,
      wisdom: 1,
      charisma: 1
    },
    speed: 30,
    size: 'Medium',
    traits: ['Versatile', 'Determined'],
    languages: ['Common', 'Choice of one extra language']
  },
  {
    id: 'elf',
    name: 'High Elf',
    abilityBonuses: { dexterity: 2, intelligence: 1 },
    speed: 30,
    size: 'Medium',
    traits: ['Darkvision', 'Keen Senses', 'Fey Ancestry', 'Trance', 'Cantrip'],
    languages: ['Common', 'Elvish'],
    proficiencies: ['Perception']
  },
  {
    id: 'dwarf',
    name: 'Hill Dwarf',
    abilityBonuses: { constitution: 2, wisdom: 1 },
    speed: 25,
    size: 'Medium',
    traits: ['Darkvision', 'Dwarven Resilience', 'Dwarven Combat Training', 'Stonecunning'],
    languages: ['Common', 'Dwarvish']
  },
  {
    id: 'halfling',
    name: 'Lightfoot Halfling',
    abilityBonuses: { dexterity: 2, charisma: 1 },
    speed: 25,
    size: 'Small',
    traits: ['Lucky', 'Brave', 'Halfling Nimbleness', 'Naturally Stealthy'],
    languages: ['Common', 'Halfling']
  }
];

export const BACKGROUND_DEFINITIONS: BackgroundDefinition[] = [
  {
    id: 'acolyte',
    name: 'Acolyte',
    skillProficiencies: ['insight', 'religion'],
    toolProficiencies: [],
    languages: ['Choice of two'],
    equipment: ['Holy symbol', 'Prayer book', '5 sticks of incense', 'Vestments', 'Common clothes', '15 gp'],
    feature: 'Shelter of the Faithful',
    suggestedCharacteristics: [
      'Ideals rooted in faith',
      'Bonds tied to temples or mentors',
      'Flaws that test devotion'
    ]
  },
  {
    id: 'soldier',
    name: 'Soldier',
    skillProficiencies: ['athletics', 'intimidation'],
    toolProficiencies: ['Gaming set (one of your choice)', 'Vehicles (land)'],
    languages: [],
    equipment: ['Insignia of rank', 'Trophy from a fallen enemy', 'Set of bone dice or deck of cards', 'Common clothes', '10 gp'],
    feature: 'Military Rank',
    suggestedCharacteristics: [
      'Disciplined loyalty',
      'Camaraderie among comrades',
      'Haunted by the memories of war'
    ]
  },
  {
    id: 'sage',
    name: 'Sage',
    skillProficiencies: ['arcana', 'history'],
    toolProficiencies: [],
    languages: ['Choice of two'],
    equipment: ['Bottle of ink', 'Quill', 'Small knife', 'Letter from a dead colleague', 'Common clothes', '10 gp'],
    feature: 'Researcher',
    suggestedCharacteristics: [
      'Curiosity about the world',
      'Dedicated to uncovering lost knowledge',
      'Distracted by esoteric questions'
    ]
  },
  {
    id: 'outlander',
    name: 'Outlander',
    skillProficiencies: ['athletics', 'survival'],
    toolProficiencies: ['Musical instrument (one of your choice)'],
    languages: ['Choice of one'],
    equipment: ['Staff', 'Hunting trap', 'Trophy from a killed animal', 'Traveller’s clothes', '10 gp'],
    feature: 'Wanderer',
    suggestedCharacteristics: [
      'Prefers the wilds to crowded streets',
      'Protective of the natural world',
      'Slow to trust civilisation'
    ]
  }
];

export const STANDARD_ABILITY_ARRAY = [15, 14, 13, 12, 10, 8];

export const ABILITY_LABEL: Record<Ability, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma'
};

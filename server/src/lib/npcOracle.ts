interface HeroSnapshot {
  name: string;
  status: Record<string, number>;
  flags: Record<string, boolean>;
  resources: { hitPoints: number; tempHitPoints?: number; inspiration?: number };
}

const describeState = (hero: HeroSnapshot): string => {
  const tensions: string[] = [];
  if ((hero.status.stress ?? 0) >= 4) {
    tensions.push('your nerves are fraying');
  }
  if ((hero.status.wounds ?? 0) >= 3) {
    tensions.push('your wounds need mending');
  }
  if ((hero.status.corruption ?? 0) >= 3) {
    tensions.push('the Heart’s corruption clings to you');
  }
  if ((hero.status.influence ?? 0) >= 3) {
    tensions.push('Emberfall watches and trusts you');
  }
  if (hero.resources.hitPoints <= 6) {
    tensions.push('your injuries need attention');
  }
  return tensions.length > 0 ? tensions.join(', ') : 'you remain balanced for now';
};

const seraphineReply = (prompt: string, hero: HeroSnapshot) => {
  const insight =
    hero.flags.empathized_lirael || hero.flags.mapped_spire
      ? 'The threads you have already seen are aligning.'
      : 'The threads tremble, awaiting your choice.';
  return `I cast your words into the lantern. ${insight} ${
    (hero.status.corruption ?? 0) > 2
      ? 'Guard your spirit; the Heart hungers for you.'
      : 'Hold fast to compassion; it will steady the Heart.'
  }`;
};

const tamsinReply = (prompt: string, hero: HeroSnapshot) => {
  if (prompt.toLowerCase().includes('gadget')) {
    return 'Gadget? Easy. Slam the actuator twice, then let it cool. If it sparks purple, you did it right.';
  }
  const vertical = hero.flags.vertical_advantage
    ? 'That climb kit should keep you nimble.'
    : 'Wish you had snagged my rig, but you will manage.';
  return `Whatever mess you are in, remember: reroute power, hit the weak points, move fast. ${vertical}`;
};

const marekReply = (prompt: string, hero: HeroSnapshot) => {
  const respect = hero.flags.marek_support || hero.flags.marek_respects;
  const tone = respect ? 'You have my trust.' : 'I still have reservations, but Emberfall needs results.';
  return `${tone} ${
    (hero.status.influence ?? 0) > 2
      ? 'Citizens speak of your deeds. Use that goodwill.'
      : 'Keep a low profile until you secure the Heart.'
  }`;
};

const nerrixReply = (prompt: string, hero: HeroSnapshot) => {
  if (hero.flags.nerrix_rescued) {
    return 'I have recalibrated the failsafes like we discussed. Give the Heart a harmonic pulse—think of a steady heartbeat.';
  }
  if (hero.flags.nerrix_failed) {
    return 'Still waiting here. Hurry, or the containment will snap and we both burn.';
  }
  return 'If you find me, break the rune lattice from the bottom. The top nodes feed off the lower anchors.';
};

const liraelReply = (prompt: string, hero: HeroSnapshot) => {
  if (hero.flags.heart_cleansed) {
    return 'Your resolve steadied the Heart. Together we will guard Emberfall.';
  }
  if (hero.flags.heart_shattered) {
    return 'The ember-sky still echoes with our choice. I witness your sacrifice.';
  }
  return 'The Heart aches. Approach with grace or fury, but know I will answer in kind.';
};

const npcResponders: Record<string, (prompt: string, hero: HeroSnapshot) => string> = {
  seraphine: seraphineReply,
  tamsin: tamsinReply,
  marek: marekReply,
  nerrix: nerrixReply,
  lirael: liraelReply
};

export const createOracleResponse = (
  npcId: string,
  prompt: string,
  hero: HeroSnapshot
): string => {
  const responder = npcResponders[npcId];
  if (
    !Object.prototype.hasOwnProperty.call(npcResponders, npcId) ||
    typeof responder !== 'function'
  ) {
    return `The link crackles without response. (NPC "${npcId}" is unavailable.)`;
  }

  const base = responder(prompt, hero);
  const state = describeState(hero);

  return `${base} Also, ${state}.`;
};

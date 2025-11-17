import type { Campaign } from './types.js';

export const campaignData: Campaign = {
  id: 'emberfall-ascent',
  title: 'Emberfall Ascent',
  synopsis:
    'Emberfall is a cliff city pinned beneath a hovering astral spire. The Heart of Embers is destabilising and threatens to shatter the city in a wave of astral fire unless a lone hero intervenes.',
  tone: 'Hopeful dark fantasy with tactile D&D stakes and cinematic pacing.',
  guidance: [
    'Let the player attempt any action. The AI narrator should interpret intent, roll forward consequences, and keep momentum.',
    'Always ground replies in the key characters and the city’s imminent danger. Remind the player of the collapsing spire when needed.',
    'Keep scenes punchy: describe the immediate beat, what changes, and what options feel dramatically potent next.'
  ],
  themes: [
    'Sacrifice vs. salvation',
    'Mortal ingenuity in the face of astral power',
    'Alliances built in chaos'
  ],
  acts: [
    {
      id: 'act1',
      title: 'Ashfen Sparks',
      situation:
        'Fires rip across the Ashfen Plaza as refugees stream from the terraces. Sentinel forces hold lines while cultists try to rush the elevators.',
      objectives: [
        'Stabilise the plaza and earn Marek Thorne’s begrudging trust.',
        'Gather intel from Seraphine or salvage tech from Tamsin for the climb.',
        'Choose whether to prioritise the citizens or the ascent.'
      ],
      complications: [
        'Civilians caught between barricades.',
        'Cultist saboteurs targeting lifts.',
        'Limited time before the spire sheds more debris.'
      ],
      escalation:
        'When the hero commits to the ascent, the plaza quakes as the Heart surges, forcing a dramatic exit toward the spire.'
    },
    {
      id: 'act2',
      title: 'Spire Ascent',
      situation:
        'Inside the spire, flickering rituals, broken maintenance shafts, and arc-sentry patrols form a gauntlet toward the Containment Annex.',
      objectives: [
        'Navigate vertical lifts, maintenance tunnels, or astral currents.',
        'Locate and free Nerrix Tal who understands the Heart’s systems.',
        'Decide whether to strike bargains with Lirael’s lingering essence.'
      ],
      complications: [
        'Electrical storms, unstable platforms, and arc sentries.',
        'Marek’s forces taking heavy casualties below, pressuring the hero.',
        'Tempting shortcuts that risk corruption.'
      ],
      escalation:
        'As the hero nears the Heart, astral pressure fractures rooms and opens glimpses into Lirael’s fractured memory.'
    },
    {
      id: 'act3',
      title: 'Heart of Embers',
      situation:
        'At the core, the Heart pulses dangerously. Lirael, half-bound guardian, tests the hero’s resolve while cultist remnants try to seize control.',
      objectives: [
        'Stabilise or cleanse the Heart by aligning harmonic conduits.',
        'Decide the fate of Lirael and Emberfall’s future power source.',
        'Deliver a final choice that ripples through the city (cleanse, bargain, shatter, or redirect).'
      ],
      complications: [
        'Corruption bleeding into the hero’s veins.',
        'Nerrix’s failsafes misfiring.',
        'Time pressure as the spire begins to fall.'
      ],
      escalation:
        'Every action shakes Emberfall. Describe citizens reacting in real time and allies lending distant aid.'
    }
  ],
  characters: [
    {
      id: 'seraphine',
      name: 'Seraphine Voss',
      role: 'Lantern seer who reads future threads from ember lanterns.',
      motivation: 'Prevent the Heart’s corruption from consuming the city.',
      voice:
        'Soft, prophetic, often referencing sparks and threads while nudging the hero toward compassionate choices.',
      secrets: [
        'Knows Lirael retains some agency.',
        'Foresees a version where the hero becomes the next warden.'
      ],
      resources: ['Visions of imminent threats', 'Ritual focus flames']
    },
    {
      id: 'tamsin',
      name: 'Tamsin Quickwick',
      role: 'Goblin artificer managing improvised gadgets.',
      motivation: 'Keep her inventions (and Emberfall) from exploding.',
      voice: 'Chaotic, witty, full of technical jargon and improvised metaphors.',
      secrets: ['Built a forbidden harmonic lance hidden in the maintenance shafts.'],
      resources: ['Grappling rigs', 'Arc dampeners', 'Explosive charges']
    },
    {
      id: 'marek',
      name: 'Captain Marek Thorne',
      role: 'Sentinel commander coordinating evacuations.',
      motivation: 'Save as many citizens as possible while maintaining order.',
      voice: 'Blunt, duty-bound, tempered with reluctant respect when earned.',
      secrets: ['Fears Emberfall will scapegoat him if the plan fails.'],
      resources: ['Sentinel squads', 'Barricade schematics']
    },
    {
      id: 'nerrix',
      name: 'Nerrix Tal',
      role: 'Tinkerer trapped in the spire’s Containment Annex.',
      motivation: 'Escape and ensure the Heart does not fall into cult control.',
      voice: 'Nervy, brilliant, peppered with technomantic slang.',
      secrets: ['Knows the shutdown sequence requires a personal sacrifice.'],
      resources: ['Harmonic keycodes', 'Containment overrides']
    },
    {
      id: 'lirael',
      name: 'Lirael the Warden',
      role: 'Astral guardian bound to the Heart.',
      motivation: 'Guard Emberfall yet long for release from duty.',
      voice: 'Echoing, solemn, poetic, challenging the hero’s convictions.',
      secrets: [
        'Can merge with a mortal champion.',
        'Believes the Heart might seed other cities if controlled.'
      ],
      resources: ['Astral barriers', 'Memory echoes shared with the hero']
    }
  ],
  lore: [
    {
      id: 'heart',
      title: 'Heart of Embers',
      details: [
        'An astral core lifted above Emberfall to power wards and lifts.',
        'Stabilised by hymns and harmonic circuits maintained by Nerrix’s guild.',
        'Now destabilised after cult interference; needs resynchronisation or a clean severance.'
      ]
    },
    {
      id: 'emberfall',
      title: 'City of Emberfall',
      details: [
        'Built into cliff terraces with luminous canals channeling Heart energy.',
        'Ashfen Plaza acts as the social and strategic heart of evac efforts.',
        'Citizens rely on Sentinels and the hero’s success to survive.'
      ]
    },
    {
      id: 'cult',
      title: 'Ember Reclamation Cult',
      details: [
        'Believes the Heart should collapse to purge Emberfall’s elites.',
        'Sows chaos in the plaza and inside the spire.',
        'Some cultists try to bargain with Lirael for power.'
      ]
    }
  ]
};

export default campaignData;

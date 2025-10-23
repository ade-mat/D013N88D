import { Campaign } from './types.js';

export const campaignData: Campaign = {
  id: 'emberfall-ascent',
  title: 'Emberfall Ascent',
  synopsis:
    'A lone hero races through the fractured city of Emberfall to reclaim the Heart of Embers before the floating spire collapses and consumes the city in astral fire.',
  introSceneId: 'intro_arrival',
  guidance: [
    'Your hero carries four core attributes. Scenes will call for skill checks using these values.',
    'Success and failure both drive the story forward; lean into the complications that arise.',
    'Track allies and boons—they can shift later encounters or unlock new resolutions.',
    'Stress and wounds increase dc while influence and corruption change the finale tone.'
  ],
  archetypes: [
    {
      id: 'envoy',
      name: 'Skilled Envoy',
      summary: 'A deft negotiator and agile infiltrator with contacts across Emberfall.',
      description:
        'Poised and quick-witted, the Envoy navigates crises through charm, agility, and precision. Years spent as Emberfall’s unofficial fixer grant access to covert routes and favors.',
      focus: 'finesse',
      attributes: {
        might: 1,
        finesse: 4,
        insight: 3,
        resolve: 2
      },
      startingAbilities: ['Silver Tongue', 'Shadowstep'],
      startingInventory: ['Ciphered Signet', 'Smoke Vials']
    },
    {
      id: 'adept',
      name: 'Arcane Adept',
      summary: 'A scholar of astral currents wielding sigils and runic insight.',
      description:
        'The Adept deciphers arcane locks and bends etheric forces with practiced discipline. Exposure to the Heart of Embers grants uncanny sensitivity to corruption.',
      focus: 'insight',
      attributes: {
        might: 1,
        finesse: 2,
        insight: 4,
        resolve: 3
      },
      startingAbilities: ['Runesight', 'Astral Ward'],
      startingInventory: ['Glyph-etched Grimoire', 'Resonant Focus']
    },
    {
      id: 'vanguard',
      name: 'Iron Vanguard',
      summary: 'A battle-tested guardian bearing heavy mail and unwavering resolve.',
      description:
        'Forged in the Emberfall garrison, the Vanguard channels raw strength and stalwart presence. When chaos erupts, the Vanguard stands between the city and ruin.',
      focus: 'might',
      attributes: {
        might: 4,
        finesse: 2,
        insight: 1,
        resolve: 3
      },
      startingAbilities: ['Bulwark Stance', 'Hammer of the Dawn'],
      startingInventory: ['Runic Shield', 'Shock Gauntlet']
    }
  ],
  scenes: [
    {
      id: 'intro_arrival',
      title: 'Smoke Over Emberfall',
      narrative:
        'You arrive beneath the hovering shards of the shattered spire. Sparks rain on the market square while citizens flee toward the lower terraces. The Heart of Embers pulses overhead, unstable and keening. You have one chance to claim it before the spire collapses.',
      options: [
        {
          id: 'intro_seek_seraphine',
          label: 'Seek out Seraphine Voss, the seer who summoned you.',
          autoSuccess: {
            id: 'outcome_seraphine_meeting',
            nextSceneId: 'seraphine_sanctum',
            narrative:
              'You slip through a side alley to the Lantern Sanctum. Seraphine waits amid swirling incense, eyes aglow with premonitions.',
            effects: {
              flags: { met_seraphine: true },
              allies: { seraphine: 'ally' },
              addItems: ['Seer’s Charm']
            }
          }
        },
        {
          id: 'intro_seek_tamsin',
          label: 'Track down Tamsin Quickwick for a gadget-laden approach.',
          autoSuccess: {
            id: 'outcome_tamsin_meeting',
            nextSceneId: 'tamsin_workshop',
            narrative:
              'You duck into the gear-cluttered nook beneath the bridge district. Tamsin wipes grease from her goggles and grins.',
            effects: {
              flags: { met_tamsin: true },
              allies: { tamsin: 'ally' },
              addItems: ['Grapple Launcher']
            }
          }
        },
        {
          id: 'intro_report_thorne',
          label: 'Report to Captain Marek Thorne to secure official support.',
          skillCheck: {
            attribute: 'charisma',
            skill: 'persuasion',
            dc: 14,
            advantageIfFlag: 'met_seraphine',
            success: {
              id: 'outcome_thorne_aid',
              nextSceneId: 'throne_command',
              narrative:
                'Thorne reads urgency in your gesture. He grants a squad marker and whispers about a hidden sentinel route into the spire.',
              effects: {
                flags: { marek_support: true },
                allies: { marek: 'ally' },
                addItems: ['Sentinel Badge'],
                statusAdjust: { influence: 1 }
              }
            },
            failure: {
              id: 'outcome_thorne_suspicion',
              nextSceneId: 'marek_clash',
              narrative:
                'Suspicion flashes across Thorne’s scarred face. He orders you shadowed, complicating your next move.',
              effects: {
                flags: { marek_suspicious: true },
                statusAdjust: { stress: 1 }
              }
            }
          }
        }
      ],
      onEnter: {
        statusAdjust: { stress: 1 },
        notes: ['The city is already on edge. Time is short.']
      }
    },
    {
      id: 'seraphine_sanctum',
      title: 'The Lantern Sanctum',
      narrative:
        'Seraphine traces a sigil in the air, revealing flickers of possible futures. “The Heart sings to you,” she murmurs. “But it also listens. Choose your steps wisely.”',
      options: [
        {
          id: 'seraphine_vision',
          label: 'Accept a guided vision of the spire.',
          skillCheck: {
            attribute: 'wisdom',
            skill: 'insight',
            dc: 13,
            success: {
              id: 'outcome_seraphine_vision_success',
              nextSceneId: 'market_crossroads',
              narrative:
                'Flashes of staircases, guardian wards, and a caged tinkerer cascade before you. You commit the patterns to memory.',
              effects: {
                flags: { mapped_spire: true },
                statusAdjust: { influence: 1 }
              }
            },
            failure: {
              id: 'outcome_seraphine_vision_burn',
              nextSceneId: 'market_crossroads',
              narrative:
                'The astral resonance scorches your mind. Seraphine steadies you, but the experience leaves you rattled.',
              effects: {
                statusAdjust: { stress: 2 },
                flags: { astral_burn: true }
              }
            }
          }
        },
        {
          id: 'seraphine_divination',
          label: 'Request a warded charm to shield against corruption.',
          skillCheck: {
            attribute: 'charisma',
            skill: 'persuasion',
            dc: 12,
            success: {
              id: 'outcome_seraphine_charm',
              nextSceneId: 'market_crossroads',
              narrative:
                'Seraphine knots threads of starlight into a charm that pulses with protection.',
              effects: {
                addItems: ['Heartward Charm'],
                flags: { corruption_resist: true }
              }
            },
            failure: {
              id: 'outcome_seraphine_tax',
              nextSceneId: 'market_crossroads',
              narrative:
                'The ritual backfires, draining your stamina. Seraphine apologizes as the charm dissolves in sparks.',
              effects: {
                statusAdjust: { stress: 1, wounds: 1 }
              }
            }
          }
        },
        {
          id: 'seraphine_depart',
          label: 'Thank Seraphine and head for the market crossroads.',
          autoSuccess: {
            id: 'outcome_seraphine_depart',
            nextSceneId: 'market_crossroads',
            narrative:
              'Seraphine squeezes your arm. “I will watch the threads. Return with hope.”'
          }
        }
      ],
      onEnter: {
        notes: ['Seraphine’s allyship may unlock visions later in the spire.']
      }
    },
    {
      id: 'tamsin_workshop',
      title: 'Workshop of Whirring Wonders',
      narrative:
        'Tamsin kicks a crate aside, revealing half-finished gadgets. “The spire’s systems are ancient,” she says. “Let’s give you an edge.”',
      options: [
        {
          id: 'tamsin_gadget',
          label: 'Test a repulsor rig for vertical traversal.',
          skillCheck: {
            attribute: 'dexterity',
            skill: 'sleightOfHand',
            dc: 12,
            success: {
              id: 'outcome_tamsin_repulsor',
              nextSceneId: 'market_crossroads',
              narrative:
                'The rig hums as you anchor to the workshop rafters. You feel light, ready to scale the spire.',
              effects: {
                addItems: ['Repulsor Rig'],
                flags: { vertical_advantage: true }
              }
            },
            failure: {
              id: 'outcome_tamsin_mishap',
              nextSceneId: 'market_crossroads',
              narrative:
                'The rig sputters mid-lift, sending you tumbling into scrap metal. Tamsin winces and tosses you a bruise salve.',
              effects: {
                statusAdjust: { wounds: 1, stress: 1 }
              }
            }
          }
        },
        {
          id: 'tamsin_briefing',
          label: 'Get a briefing on maintenance tunnels.',
          autoSuccess: {
            id: 'outcome_tamsin_briefed',
            nextSceneId: 'market_crossroads',
            narrative:
              'Tamsin scribbles notes on a grease-stained parchment, outlining hidden vents and emergency shafts.',
            effects: {
              flags: { knows_tunnels: true }
            }
          }
        },
        {
          id: 'tamsin_static',
          label: 'Ask Tamsin to rig a stun charge in case of trouble.',
          skillCheck: {
            attribute: 'intelligence',
            skill: 'arcana',
            dc: 11,
            success: {
              id: 'outcome_tamsin_stun',
              nextSceneId: 'market_crossroads',
              narrative:
                'You calibrate the charge together, crafting a potent burst.',
              effects: {
                addItems: ['Static Charge'],
                flags: { emergency_stun: true }
              }
            },
            failure: {
              id: 'outcome_tamsin_overload',
              nextSceneId: 'market_crossroads',
              narrative:
                'The charge overloads, singing your fingertips. Tamsin fans away smoke with an apologetic shrug.',
              effects: {
                statusAdjust: { stress: 1 }
              }
            }
          }
        }
      ],
      onEnter: {
        notes: ['Tamsin can improvise later if you kept her confident.']
      }
    },
    {
      id: 'throne_command',
      title: 'Sentinel Briefing',
      narrative:
        'Captain Thorne issues terse orders while the guard rally civilians. “Use the badge wisely,” he says. “Sentinel lifts are keyed to it. Fail, and Emberfall fails with you.”',
      options: [
        {
          id: 'throne_assign',
          label: 'Accept a sentinel escort to the spire approach.',
          autoSuccess: {
            id: 'outcome_thorne_escort',
            nextSceneId: 'market_crossroads',
            narrative:
              'Two sentinels flank you as you cut through barricades, clearing a direct route to the spire.',
            effects: {
              flags: { sentinel_route: true },
              statusAdjust: { influence: 1 }
            }
          }
        },
        {
          id: 'throne_warn',
          label: 'Warn Thorne about astral backlash you sensed in the Heart.',
          skillCheck: {
            attribute: 'wisdom',
            skill: 'insight',
            dc: 13,
            success: {
              id: 'outcome_thorne_warn_success',
              nextSceneId: 'market_crossroads',
              narrative:
                'Thorne adjusts his strategy, promising to evacuate the terraces and keep channels open for your signal.',
              effects: {
                flags: { marek_support: true },
                statusAdjust: { influence: 1 }
              }
            },
            failure: {
              id: 'outcome_thorne_warn_fail',
              nextSceneId: 'market_crossroads',
              narrative:
                'He nods politely but disbelief lingers. You leave with urgency gnawing at you.',
              effects: {
                statusAdjust: { stress: 1 }
              }
            }
          }
        },
        {
          id: 'throne_depart',
          label: 'Head for the market crossroads.',
          autoSuccess: {
            id: 'outcome_thorne_depart',
            nextSceneId: 'market_crossroads',
            narrative: 'You stride toward the spire as the guard rally behind you.'
          }
        }
      ]
    },
    {
      id: 'marek_clash',
      title: 'Shadowed by Sentinels',
      narrative:
        'Two sentinels tail you through the crowd. Orders echo: “Do not let them near the spire until verified.” Time bleeds away.',
      options: [
        {
          id: 'marek_slip',
          label: 'Slip the tail using market stalls.',
          skillCheck: {
            attribute: 'dexterity',
            skill: 'stealth',
            dc: 13,
            success: {
              id: 'outcome_marek_slip',
              nextSceneId: 'market_crossroads',
              narrative:
                'You vanish amidst rushing refugees, shaking the sentinels and regaining momentum.',
              effects: {
                flags: { evaded_guards: true }
              }
            },
            failure: {
              id: 'outcome_marek_stress',
              nextSceneId: 'market_crossroads',
              narrative:
                'A sentinel grazes your shoulder with a truncheon before you break free. Pain thrums as you bolt.',
              effects: {
                statusAdjust: { stress: 1, wounds: 1 }
              }
            }
          }
        },
        {
          id: 'marek_confront',
          label: 'Confront the sentinels with raw determination.',
          skillCheck: {
            attribute: 'charisma',
            skill: 'intimidation',
            dc: 12,
            success: {
              id: 'outcome_marek_intimidate',
              nextSceneId: 'market_crossroads',
              narrative:
                'You plant your feet and declare authority. The sentinels, shaken by the spire’s tremors, back down.',
              effects: {
                statusAdjust: { influence: 1 },
                flags: { marek_respects: true }
              }
            },
            failure: {
              id: 'outcome_marek_subdue',
              nextSceneId: 'market_crossroads',
              narrative:
                'They attempt to detain you, but chaos in the square forces them to release you with a final warning.',
              effects: {
                statusAdjust: { stress: 2 }
              }
            }
          }
        },
        {
          id: 'marek_ruse',
          label: 'Use a forged signal flare to divert them.',
          requiresFlag: 'met_tamsin',
          skillCheck: {
            attribute: 'intelligence',
            skill: 'investigation',
            dc: 11,
            success: {
              id: 'outcome_marek_ruse_success',
              nextSceneId: 'market_crossroads',
              narrative:
                'Tamsin’s flare erupts in a nearby tower. The sentinels sprint away, leaving you a clear path.',
              effects: {
                flags: { tamsin_impressed: true }
              }
            },
            failure: {
              id: 'outcome_marek_ruse_fail',
              nextSceneId: 'market_crossroads',
              narrative:
                'The flare sputters. The sentinels glare as you bolt, more stressed than before.',
              effects: {
                statusAdjust: { stress: 1 }
              }
            }
          }
        }
      ]
    },
    {
      id: 'market_crossroads',
      title: 'Crossroads in Crisis',
      narrative:
        'Smoke swirls above the plaza as citizens dart between barricades. The spire looms overhead, its lower platforms shuddering in unstable arcs.',
      options: [
        {
          id: 'crossroads_aid_civilians',
          label: 'Aid trapped civilians to earn their trust.',
          skillCheck: {
            attribute: 'strength',
            skill: 'athletics',
            dc: 12,
            success: {
              id: 'outcome_crossroads_aid_success',
              nextSceneId: 'spire_approach',
              narrative:
                'You heft rubble aside, freeing a family. Grateful faces whisper blessings as you rush onward.',
              effects: {
                statusAdjust: { influence: 1 }
              }
            },
            failure: {
              id: 'outcome_crossroads_aid_fail',
              nextSceneId: 'spire_approach',
              narrative:
                'The rubble shifts dangerously and you barely escape. Helping cost precious energy.',
              effects: {
                statusAdjust: { stress: 1 }
              }
            }
          }
        },
        {
          id: 'crossroads_interrogate_spirit',
          label: 'Consult a tethered spirit lingering near the spire lift.',
          requiresFlag: 'met_seraphine',
          skillCheck: {
            attribute: 'wisdom',
            skill: 'religion',
            dc: 12,
            success: {
              id: 'outcome_crossroads_spirit_success',
              nextSceneId: 'spire_approach',
              narrative:
                'The spirit whispers of a prisoner engineer, Nerrix, held below the Heart. Rescuing them could stabilize the core.',
              effects: {
                flags: { learned_nerrix: true }
              }
            },
            failure: {
              id: 'outcome_crossroads_spirit_fail',
              nextSceneId: 'spire_approach',
              narrative:
                'The spirit lashes out with cold fury. You stagger, spine iced by spectral touch.',
              effects: {
                statusAdjust: { stress: 1, corruption: 1 }
              }
            }
          }
        },
        {
          id: 'crossroads_dash',
          label: 'Dash straight for the spire approach before time slips.',
          autoSuccess: {
            id: 'outcome_crossroads_dash',
            nextSceneId: 'spire_approach',
            narrative:
              'You weave through wreckage toward the spire’s skeletal lifts, heart pounding.'
          }
        }
      ]
    },
    {
      id: 'spire_approach',
      title: 'Shattered Spire Approach',
      narrative:
        'The base of the floating spire groans as chunks of stone drift loose. Two routes remain: the ritual lift, flickering with unstable light, and a narrow maintenance shaft venting ozone.',
      options: [
        {
          id: 'approach_ritual_lift',
          label: 'Attempt to stabilize the ritual elevator.',
          skillCheck: {
            attribute: 'intelligence',
            skill: 'arcana',
            dc: 14,
            advantageIfFlag: 'met_seraphine',
            success: {
              id: 'outcome_lift_stabilized',
              nextSceneId: 'etheric_lift',
              narrative:
                'You weave sigils into the lift’s pattern, calming its violent tremors. The platform hums, awaiting ascent.',
              effects: {
                flags: { lift_accessible: true }
              }
            },
            failure: {
              id: 'outcome_lift_backlash',
              nextSceneId: 'maintenance_shaft',
              narrative:
                'Energy kicks back, forcing you to abandon the lift and crawl toward the maintenance shaft with ringing ears.',
              effects: {
                statusAdjust: { stress: 2 },
                flags: { lift_failed: true }
              }
            }
          }
        },
        {
          id: 'approach_maintenance',
          label: 'Climb the maintenance shaft Tamsin described.',
          skillCheck: {
            attribute: 'dexterity',
            skill: 'acrobatics',
            dc: 13,
            advantageIfFlag: 'vertical_advantage',
            success: {
              id: 'outcome_shaft_success',
              nextSceneId: 'maintenance_shaft',
              narrative:
                'You scale the shaft with practiced ease, dodging sparking conduits toward the mid-spire junction.',
              effects: {
                flags: { stealth_route: true }
              }
            },
            failure: {
              id: 'outcome_shaft_fall',
              nextSceneId: 'maintenance_shaft',
              narrative:
                'A rung snaps. You slam into a crossbeam before catching yourself, bruised but alive.',
              effects: {
                statusAdjust: { wounds: 1, stress: 1 }
              }
            }
          }
        },
        {
          id: 'approach_guard_route',
          label: 'Show the sentinel badge and request escort.',
          requiresFlag: 'marek_support',
          autoSuccess: {
            id: 'outcome_guard_route',
            nextSceneId: 'etheric_lift',
            narrative:
              'Sentinels clear a path and key the ritual lift for you, offering a salute as you ascend.',
            effects: {
              flags: { lift_accessible: true, sentinel_route: true }
            }
          }
        }
      ]
    },
    {
      id: 'etheric_lift',
      title: 'Etheric Lift Ascent',
      narrative:
        'The lift carries you through a storm of vibrant shards. Astral currents lash against the warding sigils. Midway, the platform jolts to a halt beside an auxiliary junction.',
      options: [
        {
          id: 'lift_override',
          label: 'Force a restart through the control glyphs.',
          skillCheck: {
            attribute: 'intelligence',
            skill: 'arcana',
            dc: 14,
            success: {
              id: 'outcome_lift_override',
              nextSceneId: 'spire_midway',
              narrative:
                'You decipher the glyph sequence and the lift glides onward, steady once more.',
              effects: {
                statusAdjust: { influence: 1 }
              }
            },
            failure: {
              id: 'outcome_lift_misfire',
              nextSceneId: 'spire_midway',
              narrative:
                'The glyphs backlash, singeing your focus. The lift lurches upward erratically.',
              effects: {
                statusAdjust: { stress: 2 }
              }
            }
          }
        },
        {
          id: 'lift_investigate',
          label: 'Investigate the junction for prisoners.',
          requiresFlag: 'learned_nerrix',
          autoSuccess: {
            id: 'outcome_lift_investigate',
            nextSceneId: 'nerrix_cell',
            narrative:
              'You pry open the junction hatch, revealing a dim holding cell pulsing with containment fields.'
          }
        },
        {
          id: 'lift_wait',
          label: 'Wait patiently for the lift to resume.',
          autoSuccess: {
            id: 'outcome_lift_wait',
            nextSceneId: 'spire_midway',
            narrative:
              'Moments stretch before the lift shudders back to life, carrying you to the mid-spire plaza.'
          }
        }
      ],
      fallbackSceneId: 'spire_midway'
    },
    {
      id: 'maintenance_shaft',
      title: 'Electrified Maintenance Shaft',
      narrative:
        'The shaft slants upward with live conduits arcing across narrow platforms. Distant clangs hint at automaton sentries patrolling nearby.',
      options: [
        {
          id: 'shaft_silent',
          label: 'Move silently between the conduits.',
          skillCheck: {
            attribute: 'dexterity',
            skill: 'stealth',
            dc: 13,
            success: {
              id: 'outcome_shaft_silent',
              nextSceneId: 'spire_midway',
              narrative:
                'You slip past sparking conduits and bypass the sentry patrols.',
              effects: {
                flags: { stealth_route: true }
              }
            },
            failure: {
              id: 'outcome_shaft_alert',
              nextSceneId: 'sentry_skirmish',
              narrative:
                'A conduit flares, triggering dormant sentries that lurch to life.',
              effects: {
                statusAdjust: { stress: 1 }
              }
            }
          }
        },
        {
          id: 'shaft_force',
          label: 'Smash through an obstructing maintenance door.',
          skillCheck: {
            attribute: 'strength',
            skill: 'athletics',
            dc: 13,
            success: {
              id: 'outcome_shaft_force',
              nextSceneId: 'spire_midway',
              narrative:
                'You batter the door aside and storm through before the sentries recalibrate.',
              effects: {
                statusAdjust: { influence: 1 }
              }
            },
            failure: {
              id: 'outcome_shaft_force_fail',
              nextSceneId: 'sentry_skirmish',
              narrative:
                'The door holds. Sentinels converge as you brace for combat.',
              effects: {
                statusAdjust: { stress: 2 }
              }
            }
          }
        },
        {
          id: 'shaft_rappel',
          label: 'Use gear to rappel around dangerous sections.',
          requiresFlag: 'vertical_advantage',
          autoSuccess: {
            id: 'outcome_shaft_rappel',
            nextSceneId: 'spire_midway',
            narrative:
              'Your rig carries you safely over the worst arcs, depositing you near the mid-spire plaza.'
          }
        }
      ],
      fallbackSceneId: 'sentry_skirmish'
    },
    {
      id: 'sentry_skirmish',
      title: 'Arc-Sentry Skirmish',
      narrative:
        'Arc-sentries whirl toward you, blades humming with energy. Sparks fly as they advance in synchronized formation.',
      options: [
        {
          id: 'sentry_overload',
          label: 'Overload their cores with a dizzying attack.',
          requiresFlag: 'emergency_stun',
          autoSuccess: {
            id: 'outcome_sentry_overload',
            nextSceneId: 'spire_midway',
            narrative:
              'You trigger Tamsin’s charge, toppling the sentries in a burst of static.',
            effects: {
              flags: { emergency_stun: false }
            }
          }
        },
        {
          id: 'sentry_duel',
          label: 'Fight through the sentries with brute force.',
          skillCheck: {
            attribute: 'strength',
            skill: 'athletics',
            dc: 14,
            success: {
              id: 'outcome_sentry_duel_success',
              nextSceneId: 'spire_midway',
              narrative:
                'You cleave through the sentries, shattering their cores with decisive blows.',
              effects: {
                statusAdjust: { stress: 1 }
              }
            },
            failure: {
              id: 'outcome_sentry_duel_fail',
              nextSceneId: 'spire_midway',
              narrative:
                'The sentries slice into your defenses before you disable them. You stagger onward wounded.',
              effects: {
                statusAdjust: { wounds: 2, stress: 1 }
              }
            }
          }
        },
        {
          id: 'sentry_hack',
          label: 'Attempt to hack their command protocols mid-combat.',
          skillCheck: {
            attribute: 'intelligence',
            skill: 'arcana',
            dc: 15,
            success: {
              id: 'outcome_sentry_hack',
              nextSceneId: 'spire_midway',
              narrative:
                'Runes flare as you seize command of the sentries, ordering them to stand down.',
              effects: {
                flags: { commandeered_sentries: true },
                statusAdjust: { influence: 1 }
              }
            },
            failure: {
              id: 'outcome_sentry_hack_fail',
              nextSceneId: 'spire_midway',
              narrative:
                'The hack slips. Feedback scorches your channels as you disable them the hard way.',
              effects: {
                statusAdjust: { stress: 2 }
              }
            }
          }
        }
      ],
      onEnter: {
        statusAdjust: { stress: 1 }
      }
    },
    {
      id: 'nerrix_cell',
      title: 'Nerrix’s Containment Cell',
      narrative:
        'Nerrix, a soot-streaked tinkerer, hangs suspended in amber light. “Get me out and I’ll stabilize the Heart,” they plead.',
      options: [
        {
          id: 'nerrix_free',
          label: 'Disable the containment rune lattice.',
          skillCheck: {
            attribute: 'intelligence',
            skill: 'arcana',
            dc: 13,
            success: {
              id: 'outcome_nerrix_free_success',
              nextSceneId: 'spire_midway',
              narrative:
                'The lattice collapses. Nerrix drops to their knees, grateful and ready to aid you.',
              effects: {
                allies: { nerrix: 'ally' },
                flags: { nerrix_rescued: true }
              }
            },
            failure: {
              id: 'outcome_nerrix_free_fail',
              nextSceneId: 'spire_midway',
              narrative:
                'Energy flares, forcing you to abort before you fry both of you. Nerrix remains trapped, hope dwindling.',
              effects: {
                statusAdjust: { stress: 1 },
                flags: { nerrix_failed: true }
              }
            }
          }
        },
        {
          id: 'nerrix_bargain',
          label: 'Bargain with Nerrix for intel in exchange for later rescue.',
          skillCheck: {
            attribute: 'charisma',
            skill: 'persuasion',
            dc: 12,
            success: {
              id: 'outcome_nerrix_bargain_success',
              nextSceneId: 'spire_midway',
              narrative:
                'Nerrix shares a bypass phrase for the Heart’s guardian, trusting you’ll return.',
              effects: {
                flags: { heart_bypass_phrase: true }
              }
            },
            failure: {
              id: 'outcome_nerrix_bargain_fail',
              nextSceneId: 'spire_midway',
              narrative:
                'Nerrix curses you, vowing to sabotage your efforts if you abandon them.',
              effects: {
                allies: { nerrix: 'rival' },
                statusAdjust: { corruption: 1 }
              }
            }
          }
        },
        {
          id: 'nerrix_leave',
          label: 'Apologize and continue upward before the lift fails.',
          autoSuccess: {
            id: 'outcome_nerrix_leave',
            nextSceneId: 'spire_midway',
            narrative:
              'You steel yourself and move on, the cell door closing with a regretful hiss.'
          }
        }
      ]
    },
    {
      id: 'spire_midway',
      title: 'Mid-Spire Plaza',
      narrative:
        'You emerge on a broken plaza hovering near the Heart’s chamber. Energy arcs to shattered archways as the floating spire groans.',
      options: [
        {
          id: 'midway_assess',
          label: 'Assess the plaza for hazards and opportunities.',
          skillCheck: {
            attribute: 'wisdom',
            skill: 'perception',
            dc: 12,
            success: {
              id: 'outcome_midway_assess_success',
              nextSceneId: 'heart_antechamber',
              narrative:
                'You spot a stable path and a dormant ward, buying time before the final chamber.',
              effects: {
                flags: { safe_path: true }
              }
            },
            failure: {
              id: 'outcome_midway_assess_fail',
              nextSceneId: 'heart_antechamber',
              narrative:
                'A hidden glyph erupts, staggering you as you rush into the antechamber regardless.',
              effects: {
                statusAdjust: { stress: 1 }
              }
            }
          }
        },
        {
          id: 'midway_rally_allies',
          label: 'Signal allies for remote aid.',
          requiresFlag: 'marek_support',
          autoSuccess: {
            id: 'outcome_midway_rally',
            nextSceneId: 'heart_antechamber',
            narrative:
              'Thorne’s sentinels lock onto your beacon, promising to hold the plaza and cover your retreat.',
            effects: {
              flags: { rally_support: true }
            }
          }
        },
        {
          id: 'midway_focus',
          label: 'Meditate briefly to center yourself.',
          autoSuccess: {
            id: 'outcome_midway_focus',
            nextSceneId: 'heart_antechamber',
            narrative:
              'You inhale slow, calming breaths. Despite the chaos, clarity settles over you.',
            effects: {
              statusAdjust: { stress: -1 }
            }
          }
        }
      ],
      onEnter: {
        notes: ['Beyond lies the Heart. Prepare for the guardian.']
      }
    },
    {
      id: 'heart_antechamber',
      title: 'Whispers of the Heart',
      narrative:
        'The antechamber resonates with layered voices. Shadows coil around a broken statue of Lirael, the Heart’s astral warden. The final door awaits.',
      options: [
        {
          id: 'antechamber_invocation',
          label: 'Invoke protective wards before entering.',
          requiresFlag: 'corruption_resist',
          autoSuccess: {
            id: 'outcome_antechamber_ward',
            nextSceneId: 'heart_chamber',
            narrative:
              'The charm glows, wrapping you in a sheath of light as you step toward the Heart.'
          }
        },
        {
          id: 'antechamber_ready_weapon',
          label: 'Ready your weapon and kick open the door.',
          autoSuccess: {
            id: 'outcome_antechamber_weapon',
            nextSceneId: 'heart_chamber',
            narrative:
              'You brace yourself, weapon forward, and stride into the Heart’s chamber prepared for battle.'
          }
        },
        {
          id: 'antechamber_listen',
          label: 'Listen to the whispers to glean Lirael’s state.',
          skillCheck: {
            attribute: 'wisdom',
            skill: 'insight',
            dc: 14,
            success: {
              id: 'outcome_antechamber_listen_success',
              nextSceneId: 'heart_chamber',
              narrative:
                'You perceive sorrow beneath the corruption. Lirael longs for release, not destruction.',
              effects: {
                flags: { empathized_lirael: true }
              }
            },
            failure: {
              id: 'outcome_antechamber_listen_fail',
              nextSceneId: 'heart_chamber',
              narrative:
                'The whispers claw at your mind. You stumble through the door shaken.',
              effects: {
                statusAdjust: { corruption: 1, stress: 1 }
              }
            }
          }
        }
      ]
    },
    {
      id: 'heart_chamber',
      title: 'The Heart of Embers',
      narrative:
        'Within the fractured chamber, the Heart pulses erratically. Lirael, once radiant, now stands corrupted by astral fire. “Leave,” she intones, voice layered with thunder. “The Heart will consume all.”',
      options: [
        {
          id: 'heart_cleanse',
          label: 'Attempt to cleanse the Heart and restore Lirael.',
          skillCheck: {
            attribute: 'charisma',
            skill: 'persuasion',
            dc: 15,
            advantageIfFlag: 'empathized_lirael',
            success: {
              id: 'outcome_heart_cleanse_success',
              nextSceneId: 'escape_gauntlet',
              narrative:
                'Light surges through you. Lirael’s corruption melts away and she grants you the Heart, stabilized yet fragile.',
              effects: {
                flags: { heart_cleansed: true },
                allies: { lirael: 'ally' },
                statusAdjust: { influence: 2 }
              }
            },
            failure: {
              id: 'outcome_heart_cleanse_fail',
              nextSceneId: 'escape_gauntlet',
              narrative:
                'The Heart resists, lashing you with scorching light. Lirael howls and the chamber quakes.',
              effects: {
                statusAdjust: { stress: 2, corruption: 1 }
              }
            }
          }
        },
        {
          id: 'heart_bargain',
          label: 'Bargain with the Heart, offering to bear its burden.',
          skillCheck: {
            attribute: 'wisdom',
            skill: 'religion',
            dc: 15,
            success: {
              id: 'outcome_heart_bargain_success',
              nextSceneId: 'escape_gauntlet',
              narrative:
                'You entwine your essence with the Heart, taking on its radiance. Lirael bows, freed of the curse.',
              effects: {
                flags: { heart_bargained: true },
                statusAdjust: { corruption: 1 }
              }
            },
            failure: {
              id: 'outcome_heart_bargain_fail',
              nextSceneId: 'escape_gauntlet',
              narrative:
                'The Heart recoils, destabilizing further. Lirael readies to strike as cracks splinter the chamber.',
              effects: {
                statusAdjust: { stress: 2 },
                flags: { lirael_enraged: true }
              }
            }
          }
        },
        {
          id: 'heart_shatter',
          label: 'Shatter the Heart to prevent catastrophic corruption.',
          skillCheck: {
            attribute: 'strength',
            skill: 'athletics',
            dc: 16,
            success: {
              id: 'outcome_heart_shatter_success',
              nextSceneId: 'escape_gauntlet',
              narrative:
                'You smash the Heart, dispersing its energy. Lirael collapses, and the spire begins to crumble outright.',
              effects: {
                flags: { heart_shattered: true },
                statusAdjust: { stress: 1 }
              }
            },
            failure: {
              id: 'outcome_heart_shatter_fail',
              nextSceneId: 'escape_gauntlet',
              narrative:
                'The Heart resists your strike, detonating in a wave that sears your flesh.',
              effects: {
                statusAdjust: { stress: 2, wounds: 2 },
                flags: { heart_instable: true }
              }
            }
          }
        }
      ]
    },
    {
      id: 'escape_gauntlet',
      title: 'Cascade Escape',
      narrative:
        'With the Heart decided, the spire destabilizes. Platforms collapse as torrents of energy chase you toward the exit.',
      options: [
        {
          id: 'escape_dash',
          label: 'Sprint through falling debris.',
          skillCheck: {
            attribute: 'dexterity',
            skill: 'acrobatics',
            dc: 14,
            advantageIfFlag: 'stealth_route',
            success: {
              id: 'outcome_escape_dash_success',
              nextSceneId: 'epilogue_resolution',
              narrative:
                'You vault collapsing platforms and burst onto a stable ledge overlooking Emberfall.',
              effects: {
                statusAdjust: { stress: 1 }
              }
            },
            failure: {
              id: 'outcome_escape_dash_fail',
              nextSceneId: 'epilogue_resolution',
              narrative:
                'Debris slams into you mid-leap. You limp onward, battered but alive.',
              effects: {
                statusAdjust: { wounds: 2, stress: 1 }
              }
            }
          }
        },
        {
          id: 'escape_guarded',
          label: 'Rely on allies to clear a path.',
          requiresFlag: 'rally_support',
          autoSuccess: {
            id: 'outcome_escape_allies',
            nextSceneId: 'epilogue_resolution',
            narrative:
              'Sentinels and citizens in the plaza catch you, cushioning the landing as the spire groans overhead.'
          }
        },
        {
          id: 'escape_lirael',
          label: 'Call upon Lirael’s aid.',
          requiresFlag: 'heart_cleansed',
          autoSuccess: {
            id: 'outcome_escape_lirael',
            nextSceneId: 'epilogue_resolution',
            narrative:
              'Lirael opens a shimmering gate, guiding you safely to the ground as the Heart radiates steady light.'
          }
        }
      ]
    },
    {
      id: 'epilogue_resolution',
      title: 'Epilogue: Emberfall’s Fate',
      narrative:
        'You stand amid the surviving terraces as dawn breaks. Emberfall watches, hopeful or fearful, to learn what you achieved within the spire.',
      options: [
        {
          id: 'epilogue_reflect',
          label: 'Reflect on the journey and accept the outcome.',
          autoSuccess: {
            id: 'outcome_epilogue_reflect',
            nextSceneId: null,
            narrative:
              'Your choices echo through Emberfall. The city will remember the night the Heart nearly fell—and the hero who answered.'
          }
        }
      ]
    }
  ]
};

export default campaignData;

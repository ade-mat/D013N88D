import { useMemo } from 'react';
import { useGame } from '@/context/GameContext';

type WorldMapVariant = 'full' | 'sidebar';

interface WorldMapProps {
  variant?: WorldMapVariant;
}

const fallbackNodes = [
  {
    id: 'act1',
    title: 'Ashfen Sparks',
    summary:
      'Ashfen Plaza burns while Sentinels and refugees scramble beneath the spire.',
    tier: 'city',
    prompts: [
      'Stabilise the plaza defences.',
      'Coordinate with Seraphine or Tamsin.',
      'Keep citizens moving toward safety.'
    ]
  },
  {
    id: 'act2',
    title: 'Spire Ascent',
    summary:
      'The interior gauntlet twists with ritual storms, lifts, and arc-sentries.',
    tier: 'spire',
    prompts: [
      'Cut a path through maintenance shafts.',
      'Free Nerrix from containment.',
      'Secure a safe route to the Heart.'
    ]
  },
  {
    id: 'act3',
    title: 'Heart of Embers',
    summary: 'Within the core, Lirael tests your resolve as the Heart unravels.',
    tier: 'heart',
    prompts: [
      'Stabilise the harmonic conduits.',
      'Decide Lirael’s fate.',
      'Protect Emberfall from the Heart’s collapse.'
    ]
  }
];

const statusLabel = (status: 'upcoming' | 'visited' | 'current') => {
  switch (status) {
    case 'current':
      return 'In Focus';
    case 'visited':
      return 'Completed';
    default:
      return 'Approaching';
  }
};

const WorldMap = ({ variant = 'sidebar' }: WorldMapProps) => {
  const { campaign, storyBeats } = useGame();
  const nodes = useMemo(() => {
    if (!campaign.acts || campaign.acts.length === 0) {
      return fallbackNodes;
    }
    return campaign.acts.map((act, index) => ({
      id: act.id,
      title: act.title,
      summary: act.situation,
      tier: index === 0 ? 'city' : index === campaign.acts.length - 1 ? 'heart' : 'spire',
      prompts: act.objectives.length > 0 ? act.objectives : fallbackNodes[index]?.prompts ?? []
    }));
  }, [campaign.acts]);

  const visitedTags = useMemo(() => {
    const tags = new Set<string>();
    storyBeats.forEach((beat) => {
      beat.tags?.forEach((tag) => tags.add(tag));
    });
    return tags;
  }, [storyBeats]);

  const currentActId = useMemo(() => {
    const lastBeat = storyBeats[storyBeats.length - 1];
    const tag = lastBeat?.tags?.find((entry) => nodes.some((node) => node.id === entry));
    return tag ?? nodes[0]?.id ?? null;
  }, [nodes, storyBeats]);

  const currentAct = nodes.find((node) => node.id === currentActId) ?? nodes[0];

  return (
    <section
      className={`story-map-panel ${variant === 'sidebar' ? 'story-map-panel--compact' : ''}`}
    >
      <header className="story-map__header">
        <div>
          <h3>Emberfall Atlas</h3>
          <p>{currentAct?.summary}</p>
        </div>
        <div className="story-map__status-chip">
          {currentAct ? currentAct.title : 'Exploration underway'}
        </div>
      </header>

      <div className="story-map__timeline">
        {nodes.map((node, index) => {
          const visited = visitedTags.has(node.id);
          const status: 'current' | 'visited' | 'upcoming' =
            currentActId === node.id ? 'current' : visited ? 'visited' : 'upcoming';
          return (
            <article key={node.id} className={`story-node story-node--${status}`}>
              <div className="story-node__index">{index + 1}</div>
              <div className="story-node__body">
                <div className="story-node__heading">
                  <h4>{node.title}</h4>
                  <span className="story-node__pillar">{statusLabel(status)}</span>
                </div>
                <p>{node.summary}</p>
                <ul>
                  {node.prompts.slice(0, 2).map((prompt) => (
                    <li key={prompt}>{prompt}</li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>

      {currentAct && currentAct.prompts.length > 0 && (
        <div className="story-map__suggestions">
          <h4>Suggested prompts</h4>
          <ul>
            {currentAct.prompts.slice(0, 3).map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default WorldMap;

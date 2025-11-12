import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useGame } from '@/context/GameContext';
import type { SceneNode, WorldMapLocation } from '@/types';

type WorldMapVariant = 'full' | 'sidebar';

interface WorldMapProps {
  variant?: WorldMapVariant;
}

const tierLabels: Record<NonNullable<WorldMapLocation['tier']> | 'city', string> = {
  city: 'City District',
  approach: 'Approach Route',
  spire: 'Spire Interior',
  heart: 'Heart Threshold'
};

const landmasses = [
  {
    id: 'emberfall-bastion',
    path: 'M8 118C4 98 12 82 24 78C33 75 37 66 31 57C24 47 28 34 44 32C58 30 64 24 73 27C86 32 93 28 98 36C103 44 101 56 94 63C88 70 90 80 98 88C107 97 106 108 98 116C90 124 76 122 64 118C52 114 44 123 31 122C20 121 12 125 8 118Z'
  },
  {
    id: 'spire-crown',
    path: 'M16 84C12 70 21 62 34 60C47 58 54 52 52 42C50 32 56 22 70 20C82 18 93 14 98 22C104 31 101 44 94 50C88 56 90 64 96 70C104 79 100 90 88 92C74 94 60 100 46 98C32 96 20 94 16 84Z'
  }
];

const ridgePaths = [
  'M15 92C32 82 48 84 64 76C76 70 86 68 96 70',
  'M28 58C44 64 62 62 76 52C86 44 94 46 100 54'
];

const runePaths = [
  'M38 44L42 32L46 44L58 48L46 52L42 64L38 52L26 48Z',
  'M70 86L74 96L84 100L74 104L70 114L66 104L56 100L66 96Z'
];

const buildSceneTitleLookup = (scenes: SceneNode[]) => {
  const lookup = new Map<string, string>();
  scenes.forEach((scene) => {
    lookup.set(scene.id, scene.title);
  });
  return lookup;
};

const tierGlyph = (tier?: WorldMapLocation['tier']) => {
  switch (tier) {
    case 'approach':
      return (
        <svg viewBox="0 0 24 24" className="world-map__glyph" aria-hidden="true">
          <path d="M12 3L19 21H5L12 3Z" />
          <path d="M6 15H18" />
        </svg>
      );
    case 'spire':
      return (
        <svg viewBox="0 0 24 24" className="world-map__glyph" aria-hidden="true">
          <path d="M12 2L16.5 8L14.5 22L12 18L9.5 22L7.5 8L12 2Z" />
          <circle cx="12" cy="11" r="2" />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" className="world-map__glyph" aria-hidden="true">
          <path d="M12 6C13.5 3.5 18.5 4 19.5 8C20.5 12 12 18 12 18C12 18 3.5 12 4.5 8C5.5 4 10.5 3.5 12 6Z" />
          <circle cx="12" cy="9.5" r="1.4" />
        </svg>
      );
    case 'city':
    default:
      return (
        <svg viewBox="0 0 24 24" className="world-map__glyph" aria-hidden="true">
          <path d="M6 20V11H8V8H10V6H12V8H14V11H16V20" />
          <path d="M5 20H19" />
        </svg>
      );
  }
};

const CompassRose = () => (
  <svg className="world-map__compass" viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="60" cy="60" r="44" />
    <path d="M60 10L68 52L110 60L68 68L60 110L52 68L10 60L52 52Z" />
    <circle cx="60" cy="60" r="10" />
    <text x="60" y="16">N</text>
    <text x="102" y="64">E</text>
    <text x="60" y="110">S</text>
    <text x="18" y="64">W</text>
  </svg>
);

const WorldMap = ({ variant = 'full' }: WorldMapProps) => {
  const { campaign, currentSceneId, visitedScenes } = useGame();
  const mapConfig = campaign.map;
  const [focusedLocationId, setFocusedLocationId] = useState<string | null>(null);

  const panelClass = clsx(
    'world-map-panel',
    variant === 'sidebar' && 'world-map-panel--compact'
  );

  const { locationById, sceneToLocation } = useMemo(() => {
    if (!mapConfig) {
      return {
        locationById: new Map<string, WorldMapLocation>(),
        sceneToLocation: new Map<string, string>()
      };
    }
    const locationIndex = new Map<string, WorldMapLocation>();
    const sceneIndex = new Map<string, string>();
    mapConfig.locations.forEach((location) => {
      locationIndex.set(location.id, location);
      location.sceneIds.forEach((sceneId) => {
        sceneIndex.set(sceneId, location.id);
      });
    });
    return { locationById: locationIndex, sceneToLocation: sceneIndex };
  }, [mapConfig]);

  if (!mapConfig || mapConfig.locations.length === 0) {
    return (
      <section className={panelClass}>
        <header className="world-map__header">
          <div>
            <h3>World Map</h3>
            <p className="muted">This campaign does not define any mappable locations.</p>
          </div>
        </header>
      </section>
    );
  }

  const sceneTitleLookup = useMemo(
    () => buildSceneTitleLookup(campaign.scenes),
    [campaign.scenes]
  );

  const visitedLocationIds = useMemo(() => {
    const visited = new Set<string>();
    mapConfig.locations.forEach((location) => {
      const hasVisited = location.sceneIds.some(
        (sceneId) => (visitedScenes[sceneId] ?? 0) > 0
      );
      if (hasVisited) {
        visited.add(location.id);
      }
    });
    return visited;
  }, [mapConfig.locations, visitedScenes]);

  const connectionSegments = useMemo(() => {
    const segments: Array<{
      id: string;
      from: WorldMapLocation;
      to: WorldMapLocation;
      visited: boolean;
    }> = [];
    const seen = new Set<string>();

    mapConfig.locations.forEach((location) => {
      location.connections?.forEach((targetId) => {
        const target = locationById.get(targetId);
        if (!target) {
          return;
        }
        const key =
          location.id < target.id
            ? `${location.id}-${target.id}`
            : `${target.id}-${location.id}`;
        if (seen.has(key)) {
          return;
        }
        seen.add(key);
        segments.push({
          id: key,
          from: location,
          to: target,
          visited:
            visitedLocationIds.has(location.id) &&
            visitedLocationIds.has(target.id)
        });
      });
    });

    return segments;
  }, [locationById, mapConfig.locations, visitedLocationIds]);

  const resolveLocation = (locationId: string | null) =>
    locationId ? locationById.get(locationId) ?? null : null;

  const currentLocationId =
    (currentSceneId ? sceneToLocation.get(currentSceneId) : null) ??
    (currentSceneId
      ? campaign.scenes.find((scene) => scene.id === currentSceneId)?.locationId ??
        null
      : null);

  const detailLocation =
    resolveLocation(focusedLocationId) ??
    resolveLocation(currentLocationId) ??
    mapConfig.locations[0] ??
    null;

  const detailSceneTitles =
    detailLocation?.sceneIds
      .map((sceneId) => sceneTitleLookup.get(sceneId))
      .filter(Boolean) ?? [];

  const visitedLocations = mapConfig.locations.filter((location) =>
    visitedLocationIds.has(location.id)
  );

  const upcomingLocations = mapConfig.locations
    .filter((location) => !visitedLocationIds.has(location.id))
    .slice(0, variant === 'sidebar' ? 2 : 4);

  const progressLabel = `${visitedLocations.length}/${mapConfig.locations.length}`;
  const viewBox = `0 0 ${mapConfig.width} ${mapConfig.height}`;
  const nodeRadius = variant === 'sidebar' ? 2.4 : 3.2;
  const haloRadius = nodeRadius + 1.2;

  return (
    <section className={panelClass}>
      <header className="world-map__header">
        <div>
          <h3>Emberfall Atlas</h3>
          {variant === 'full' && mapConfig.description ? (
            <p className="muted">{mapConfig.description}</p>
          ) : (
            <p className="muted">Track the threads you have woven through Emberfall.</p>
          )}
        </div>
        <div className="world-map__progress">
          <span>Visited</span>
          <strong>{progressLabel}</strong>
        </div>
      </header>

      <div className="world-map__legend">
        <span>
          <span className="legend-dot current" />
          Current
        </span>
        <span>
          <span className="legend-dot visited" />
          Visited
        </span>
        <span>
          <span className="legend-dot future" />
          Unvisited
        </span>
      </div>

      <div className="world-map__canvas">
        <svg
          className="world-map__svg"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="atlasGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(249,113,22,0.28)" />
              <stop offset="60%" stopColor="rgba(15,23,42,0.2)" />
              <stop offset="100%" stopColor="rgba(15,23,42,0.6)" />
            </linearGradient>
            <filter id="paperGrain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves="3"
                result="noise"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0"
              />
              <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
            </filter>
            <pattern
              id="atlasGrid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path d="M10 0H0V10" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.2" />
            </pattern>
          </defs>
          <rect
            width={mapConfig.width}
            height={mapConfig.height}
            fill="url(#atlasGrid)"
            opacity={0.8}
          />
          <g filter="url(#paperGrain)">
            {landmasses.map((land) => (
              <path key={land.id} d={land.path} className="world-map__landmass" />
            ))}
            {ridgePaths.map((path, index) => (
              <path key={`ridge-${index}`} d={path} className="world-map__ridge" />
            ))}
            {runePaths.map((path, index) => (
              <path key={`rune-${index}`} d={path} className="world-map__rune" />
            ))}
          </g>
          <g className="world-map__connection-lines">
            {connectionSegments.map((segment) => (
              <line
                key={segment.id}
                x1={segment.from.position.x}
                y1={segment.from.position.y}
                x2={segment.to.position.x}
                y2={segment.to.position.y}
                className={clsx(
                  'world-map__segment',
                  segment.visited && 'world-map__segment--visited'
                )}
              />
            ))}
          </g>
          <g className="world-map__node-glows">
            {mapConfig.locations.map((location) => {
              const visited = visitedLocationIds.has(location.id);
              const isCurrent = currentLocationId === location.id;
              return (
                <g key={`glow-${location.id}`}>
                  <circle
                    cx={location.position.x}
                    cy={location.position.y}
                    r={haloRadius}
                    className={clsx(
                      'world-map__node-halo',
                      visited && 'visited',
                      isCurrent && 'current'
                    )}
                  />
                  <circle
                    cx={location.position.x}
                    cy={location.position.y}
                    r={nodeRadius}
                    className={clsx(
                      'world-map__node-core',
                      visited && 'visited',
                      isCurrent && 'current'
                    )}
                  />
                </g>
              );
            })}
          </g>
        </svg>
        <div className="world-map__node-layer">
          {mapConfig.locations.map((location) => {
            const visited = visitedLocationIds.has(location.id);
            const isCurrent = currentLocationId === location.id;
            const left = (location.position.x / mapConfig.width) * 100;
            const top = (location.position.y / mapConfig.height) * 100;
            return (
              <button
                key={location.id}
                type="button"
                className={clsx(
                  'world-map__node',
                  visited && 'visited',
                  isCurrent && 'current'
                )}
                style={{ left: `${left}%`, top: `${top}%` }}
                onMouseEnter={() => setFocusedLocationId(location.id)}
                onMouseLeave={() => setFocusedLocationId(null)}
                onFocus={() => setFocusedLocationId(location.id)}
                onBlur={() => setFocusedLocationId(null)}
              >
                <span className="world-map__node-glyph">{tierGlyph(location.tier)}</span>
                <span className="world-map__node-label">{location.name}</span>
              </button>
            );
          })}
        </div>
        <CompassRose />
      </div>

      {detailLocation && (
        <div className="world-map__details">
          <div className="world-map__detail-heading">
            <div className="world-map__detail-icon">{tierGlyph(detailLocation.tier)}</div>
            <div>
              <h4>{detailLocation.name}</h4>
              <p>{detailLocation.summary}</p>
            </div>
          </div>
          <div className="world-map__detail-meta">
            <span className="world-map__tier-chip">
              {tierLabels[detailLocation.tier ?? 'city']}
            </span>
            <div className="world-map__detail-status">
              <span
                className={clsx(
                  'world-map__badge',
                  visitedLocationIds.has(detailLocation.id) && 'visited',
                  currentLocationId === detailLocation.id && 'current'
                )}
              >
                {currentLocationId === detailLocation.id
                  ? 'Active Objective'
                  : visitedLocationIds.has(detailLocation.id)
                    ? 'Visited'
                    : 'Hidden'}
              </span>
            </div>
          </div>
          {detailSceneTitles.length > 0 && (
            <p className="world-map__scene-list">
              Scenes: {detailSceneTitles.join(', ')}
            </p>
          )}
        </div>
      )}

      <div className="world-map__status">
        <div>
          <h5>Visited Landmarks</h5>
          <ul>
            {visitedLocations.length === 0 ? (
              <li className="muted">No locations explored yet.</li>
            ) : (
              visitedLocations.map((location) => (
                <li key={location.id}>
                  <span className="world-map__status-glyph">{tierGlyph(location.tier)}</span>
                  {location.name}
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <h5>On the Horizon</h5>
          <ul>
            {upcomingLocations.length === 0 ? (
              <li className="muted">All locations cleared.</li>
            ) : (
              upcomingLocations.map((location) => (
                <li key={location.id}>
                  <span className="world-map__status-glyph">{tierGlyph(location.tier)}</span>
                  {location.name}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default WorldMap;

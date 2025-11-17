import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
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
    path: 'M6 114C4 96 14 78 28 74C39 71 44 64 40 55C34 42 40 30 56 26C67 23 75 20 84 24C95 28 106 38 106 54C106 65 102 74 109 82C117 91 114 110 101 118C88 126 74 122 64 118C50 113 44 119 34 120C22 121 8 124 6 114Z'
  },
  {
    id: 'spire-crown',
    path: 'M18 82C14 70 24 60 36 58C48 56 55 50 54 40C52 28 62 20 78 18C90 16 102 20 108 30C114 40 112 52 104 60C96 68 98 76 104 84C112 94 108 104 96 106C82 108 68 112 54 110C40 108 22 94 18 82Z'
  }
];

const shorelinePaths = [
  'M10 104C20 90 36 86 52 78C68 70 84 70 96 76C110 82 116 96 112 108',
  'M26 66C42 74 62 74 78 64C90 56 106 54 118 64'
];

const contourPaths = [
  'M18 94C28 84 48 80 62 74C74 68 86 68 96 74',
  'M32 60C48 68 66 64 80 56C94 48 106 46 116 52'
];

const runePaths = [
  {
    id: 'sigil-market',
    d: 'M0 -6L4 -2L2 0L4 2L0 6L-4 2L-2 0L-4 -2Z',
    transform: 'translate(34 92) scale(1.2)'
  },
  {
    id: 'sigil-plaza',
    d: 'M0 -5L3 0L0 5L-3 0Z M0 -8V8',
    transform: 'translate(64 64) scale(1.1)'
  },
  {
    id: 'sigil-heart',
    d: 'M0 -6C2 -10 8 -10 9 -4C10 2 0 8 0 8C0 8 -10 2 -9 -4C-8 -10 -2 -10 0 -6Z',
    transform: 'translate(82 34) scale(0.9)'
  }
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
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const handleOpenFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
  };

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen]);

  const handleCanvasKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenFullscreen();
    }
  };

  const mapCanvas = (size: 'normal' | 'full') => (
    <div
      className={clsx(
        'world-map__canvas',
        size === 'full' && 'world-map__canvas--fullscreen'
      )}
      role={size === 'normal' ? 'button' : undefined}
      tabIndex={size === 'normal' ? 0 : undefined}
      aria-label={size === 'normal' ? 'Open Emberfall map' : undefined}
      onClick={size === 'normal' ? handleOpenFullscreen : undefined}
      onKeyDown={size === 'normal' ? handleCanvasKey : undefined}
    >
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
          <radialGradient id="landGradient" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor="#1f2b4b" />
            <stop offset="60%" stopColor="#11172c" />
            <stop offset="100%" stopColor="#070b16" />
          </radialGradient>
          <pattern
            id="atlasGrid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path d="M10 0H0V10" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.25" />
          </pattern>
        </defs>
        <rect
          width={mapConfig.width}
          height={mapConfig.height}
          fill="url(#atlasGrid)"
          opacity={0.6}
        />
        <g className="world-map__terrain">
          {landmasses.map((land) => (
            <path
              key={land.id}
              d={land.path}
              className="world-map__landmass"
              fill="url(#landGradient)"
            />
          ))}
          {shorelinePaths.map((path, index) => (
            <path key={`shore-${index}`} d={path} className="world-map__shoreline" />
          ))}
          {contourPaths.map((path, index) => (
            <path key={`contour-${index}`} d={path} className="world-map__contour" />
          ))}
          {runePaths.map((sigil) => (
            <path key={sigil.id} d={sigil.d} className="world-map__rune" transform={sigil.transform} />
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
      {size === 'normal' && <div className="world-map__expand-hint">Click to expand</div>}
      <CompassRose />
    </div>
  );

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

      {mapCanvas('normal')}

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
      {isFullscreen && (
        <div className="world-map-modal" role="dialog" aria-modal="true">
          <div className="world-map-modal__backdrop" onClick={handleCloseFullscreen} />
          <div className="world-map-modal__content">
            <header>
              <h3>Emberfall Atlas</h3>
              <button
                type="button"
                className="world-map-modal__close"
                onClick={handleCloseFullscreen}
                aria-label="Close map"
              >
                ×
              </button>
            </header>
            <div className="world-map-modal__body">
              <div className="world-map-modal__map">{mapCanvas('full')}</div>
              <div className="world-map-modal__sidebar">
                {detailLocation && (
                  <div className="world-map__details">
                    <div className="world-map__detail-heading">
                      <div className="world-map__detail-icon">
                        {tierGlyph(detailLocation.tier)}
                      </div>
                      <div>
                        <h4>{detailLocation.name}</h4>
                        <p>{detailLocation.summary}</p>
                      </div>
                    </div>
                    <div className="world-map__detail-meta">
                      <span className="world-map__tier-chip">
                        {tierLabels[detailLocation.tier ?? 'city']}
                      </span>
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
                            <span className="world-map__status-glyph">
                              {tierGlyph(location.tier)}
                            </span>
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
                            <span className="world-map__status-glyph">
                              {tierGlyph(location.tier)}
                            </span>
                            {location.name}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default WorldMap;

import { useMemo, useState } from 'react';
import { useGame } from '@/context/GameContext';

const MIN_NAME_LENGTH = 2;

const HeroSetup = () => {
  const { campaign, startGame, resetGame } = useGame();
  const [heroName, setHeroName] = useState('');
  const [selectedArchetypeId, setSelectedArchetypeId] = useState(
    campaign.archetypes[0]?.id ?? ''
  );

  const selectedArchetype = useMemo(
    () => campaign.archetypes.find((entry) => entry.id === selectedArchetypeId),
    [campaign.archetypes, selectedArchetypeId]
  );

  const canStart = heroName.trim().length >= MIN_NAME_LENGTH && !!selectedArchetype;

  const handleStart = () => {
    if (!selectedArchetype || !canStart) {
      return;
    }
    startGame({ name: heroName.trim(), archetypeId: selectedArchetype.id });
  };

  return (
    <div className="setup-container">
      <header className="setup-header">
        <h1>Emberfall Ascent</h1>
        <p className="setup-tagline">
          Solo campaign — reclaim the Heart of Embers before the spire collapses.
        </p>
      </header>

      <section className="setup-body">
        <div className="setup-inputs">
          <label htmlFor="hero-name">Hero Name</label>
          <input
            id="hero-name"
            name="hero-name"
            type="text"
            placeholder="Enter your legend"
            value={heroName}
            onChange={(event) => setHeroName(event.target.value)}
          />
        </div>

        <div className="setup-archetype-grid">
          {campaign.archetypes.map((archetype) => {
            const isActive = archetype.id === selectedArchetypeId;
            return (
              <button
                key={archetype.id}
                type="button"
                className={`archetype-card ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedArchetypeId(archetype.id)}
              >
                <h2>{archetype.name}</h2>
                <p className="archetype-summary">{archetype.summary}</p>
                <p className="archetype-description">{archetype.description}</p>
                <div className="archetype-attributes">
                  {Object.entries(archetype.attributes).map(([key, value]) => (
                    <span key={key} className="attribute-chip">
                      {key.toUpperCase()}: {value}
                    </span>
                  ))}
                </div>
                <div className="archetype-lists">
                  <div>
                    <h3>Abilities</h3>
                    <ul>
                      {archetype.startingAbilities.map((ability) => (
                        <li key={ability}>{ability}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>Inventory</h3>
                    <ul>
                      {archetype.startingInventory.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="setup-footer">
        <div className="setup-actions">
          <button type="button" className="ghost-button" onClick={resetGame}>
            Reset Save
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!canStart}
            onClick={handleStart}
          >
            Begin Campaign
          </button>
        </div>
      </footer>

      {selectedArchetype && (
        <aside className="setup-guidance">
          <h3>Campaign Guidance</h3>
          <ul>
            {campaign.guidance?.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
};

export default HeroSetup;

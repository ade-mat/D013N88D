import { useGame } from '@/context/GameContext';
import type { Metric } from '@/types';

const metricLabels: Record<Metric, string> = {
  stress: 'Stress',
  wounds: 'Wounds',
  influence: 'Influence',
  corruption: 'Corruption'
};

const Sidebar = () => {
  const { hero, resetGame } = useGame();

  if (!hero) {
    return null;
  }

  return (
    <aside className="sidebar">
      <section className="hero-block">
        <header>
          <h3>{hero.name}</h3>
          <p className="hero-subtitle">Attributes</p>
        </header>
        <div className="attribute-grid">
          {Object.entries(hero.attributes).map(([key, value]) => (
            <div key={key} className="attribute-item">
              <span>{key.toUpperCase()}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="hero-block">
        <header>
          <h3>Metrics</h3>
        </header>
        <ul className="metric-list">
          {(Object.keys(metricLabels) as Metric[]).map((metric) => (
            <li key={metric}>
              <span>{metricLabels[metric]}</span>
              <strong>{hero.metrics[metric]}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="hero-block">
        <header>
          <h3>Inventory</h3>
        </header>
        <ul className="simple-list">
          {hero.inventory.length > 0 ? (
            hero.inventory.map((item) => <li key={item}>{item}</li>)
          ) : (
            <li className="muted">Empty</li>
          )}
        </ul>
      </section>

      <section className="hero-block">
        <header>
          <h3>Abilities</h3>
        </header>
        <ul className="simple-list">
          {hero.abilities.map((ability) => (
            <li key={ability}>{ability}</li>
          ))}
        </ul>
      </section>

      <section className="hero-block">
        <header>
          <h3>Allies & Standing</h3>
        </header>
        <ul className="simple-list">
          {Object.keys(hero.allies).length > 0 ? (
            Object.entries(hero.allies).map(([ally, status]) => (
              <li key={ally}>
                {ally} — <span className={`status-${status}`}>{status}</span>
              </li>
            ))
          ) : (
            <li className="muted">No confirmed allies</li>
          )}
        </ul>
      </section>

      <section className="hero-actions">
        <button type="button" className="ghost-button" onClick={resetGame}>
          Restart Campaign
        </button>
      </section>
    </aside>
  );
};

export default Sidebar;

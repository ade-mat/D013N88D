import { useMemo } from 'react';
import { useGame } from '@/context/GameContext';
import { ABILITY_LABEL, SKILLS } from '@shared/referenceData';

const statusLabels: Record<string, string> = {
  stress: 'Stress',
  wounds: 'Wounds',
  influence: 'Influence',
  corruption: 'Corruption'
};

const Sidebar = () => {
  const { hero, resetGame, abilityMod } = useGame();

  if (!hero) {
    return null;
  }

  const abilityEntries = useMemo(
    () =>
      Object.entries(hero.abilityScores).map(([ability, score]) => {
        const typed = ability as keyof typeof ABILITY_LABEL;
        const modifier = abilityMod(typed);
        return {
          id: typed,
          label: ABILITY_LABEL[typed],
          score,
          modifier
        };
      }),
    [abilityMod, hero.abilityScores]
  );

  const savingThrows = useMemo(
    () =>
      abilityEntries.map((entry) => ({
        ...entry,
        proficient: hero.savingThrows[entry.id]
      })),
    [abilityEntries, hero.savingThrows]
  );

  const skillEntries = useMemo(
    () =>
      SKILLS.map((skill) => ({
        id: skill.id,
        label: skill.label,
        ability: ABILITY_LABEL[skill.ability],
        proficient: hero.skills[skill.id] === true
      })),
    [hero.skills]
  );

  const statusEntries = useMemo(
    () =>
      Object.entries(hero.status).map(([key, value]) => ({
        key,
        label: statusLabels[key] ?? key,
        value
      })),
    [hero.status]
  );

  return (
    <aside className="sidebar">
      <section className="hero-block">
        <header>
          <h3>Adventurer Sheet</h3>
          <p className="hero-subtitle">
            Level {hero.level} • AC {hero.armorClass} • HP {hero.resources.hitPoints} • Speed {hero.speed} ft
          </p>
          <p className="hero-subtitle">Inspiration {hero.resources.inspiration}</p>
        </header>
        <div className="ability-grid">
          {abilityEntries.map((entry) => (
            <div key={entry.id} className="ability-item">
              <span>{entry.label}</span>
              <strong>{entry.score}</strong>
              <em>{entry.modifier >= 0 ? `+${entry.modifier}` : entry.modifier}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="hero-block">
        <header>
          <h3>Saving Throws</h3>
        </header>
        <ul className="metric-list">
          {savingThrows.map((entry) => (
            <li key={entry.id} className={entry.proficient ? 'proficient' : ''}>
              <span>{entry.label}</span>
              <strong>{entry.modifier >= 0 ? `+${entry.modifier}` : entry.modifier}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="hero-block">
        <header>
          <h3>Skills</h3>
        </header>
        <ul className="skills-list">
          {skillEntries.map((skill) => (
            <li key={skill.id} className={skill.proficient ? 'proficient' : ''}>
              <strong>{skill.label}</strong>
              <span>{skill.ability}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="hero-block">
        <header>
          <h3>Status & Boons</h3>
        </header>
        <ul className="metric-list">
          {statusEntries.map((entry) => (
            <li key={entry.key}>
              <span>{entry.label}</span>
              <strong>{entry.value}</strong>
            </li>
          ))}
          <li>
            <span>Hit Points</span>
            <strong>{hero.resources.hitPoints}</strong>
          </li>
          {hero.resources.tempHitPoints > 0 && (
            <li>
              <span>Temp HP</span>
              <strong>{hero.resources.tempHitPoints}</strong>
            </li>
          )}
          {hero.resources.inspiration > 0 && (
            <li>
              <span>Inspiration</span>
              <strong>{hero.resources.inspiration}</strong>
            </li>
          )}
        </ul>
      </section>

      <section className="hero-block">
        <header>
          <h3>Equipment</h3>
        </header>
        <ul className="simple-list">
          {hero.equipment.length > 0 ? (
            hero.equipment.map((item) => <li key={item}>{item}</li>)
          ) : (
            <li className="muted">No notable equipment</li>
          )}
        </ul>
      </section>

      <section className="hero-block">
        <header>
          <h3>Features & Allies</h3>
        </header>
        <ul className="simple-list">
          {hero.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <hr className="divider" />
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

import { useMemo } from 'react';
import { useGame } from '@/context/GameContext';
import { ABILITY_LABEL, SKILLS } from '@shared/referenceData';

const determineEnding = (flags: Record<string, boolean>) => {
  if (flags.heart_cleansed) {
    return 'With the Heart cleansed and Lirael restored, Emberfall greets a tempered dawn. The city whispers your name with reverence.';
  }
  if (flags.heart_bargained) {
    return 'You now bear the Heart’s burden. Emberfall survives, yet its hero glows with otherworldly fire. Your watch has only begun.';
  }
  if (flags.heart_shattered) {
    return 'The Heart lies in shards, but the inferno is averted. Emberfall mourns the sacrifice yet rebuilds upon firmer ground.';
  }
  if (flags.heart_instable) {
    return 'The Heart thrums unstably. Emberfall is saved for now, though astral flares haunt the horizon.';
  }
  return 'Emberfall endures, shaped by the echoes of your choices.';
};

const Epilogue = () => {
  const { hero, log, resetGame, abilityMod } = useGame();

  const highlightLog = useMemo(() => log.slice(-6).reverse(), [log]);

  if (!hero) {
    return null;
  }

  const endingText = determineEnding(hero.flags);

  return (
    <div className="epilogue-container">
      <header>
        <h2>Epilogue</h2>
        <p>{endingText}</p>
      </header>

      <section className="epilogue-metrics">
        <h3>Final Ability Scores</h3>
        <ul>
          {Object.entries(hero.abilityScores).map(([ability, score]) => {
            const typed = ability as keyof typeof ABILITY_LABEL;
            const modifier = abilityMod(typed);
            return (
              <li key={ability}>
                {ABILITY_LABEL[typed]}: <strong>{score}</strong>{' '}
                <span className="muted">(mod {modifier >= 0 ? `+${modifier}` : modifier})</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="epilogue-metrics">
        <h3>Status Trackers</h3>
        <ul>
          {Object.entries(hero.status).map(([key, value]) => (
            <li key={key}>
              {key.replace(/_/g, ' ')}: <strong>{value}</strong>
            </li>
          ))}
          <li>
            Hit Points: <strong>{hero.resources.hitPoints}</strong>
          </li>
          <li>
            Inspiration: <strong>{hero.resources.inspiration}</strong>
          </li>
        </ul>
      </section>

      <section className="epilogue-metrics">
        <h3>Proficiencies</h3>
        <ul>
          {SKILLS.filter((skill) => hero.skills[skill.id]).map((skill) => (
            <li key={skill.id}>
              {skill.label} ({ABILITY_LABEL[skill.ability]})
            </li>
          ))}
          {hero.toolProficiencies.length > 0 && (
            <li>Tools: {hero.toolProficiencies.join(', ')}</li>
          )}
        </ul>
      </section>

      <section className="epilogue-flags">
        <h3>Key Flags</h3>
        <ul>
          {Object.entries(hero.flags)
            .filter(([, value]) => value === true)
            .map(([flag]) => (
              <li key={flag}>{flag.replace(/_/g, ' ')}</li>
            ))}
          {Object.values(hero.flags).every((value) => value === false) && (
            <li>No lasting flags recorded.</li>
          )}
        </ul>
      </section>

      <section className="epilogue-log">
        <h3>Final Moments</h3>
        <ul>
          {highlightLog.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.label}</strong>
              {entry.detail && <span> — {entry.detail}</span>}
            </li>
          ))}
        </ul>
      </section>

      <footer className="epilogue-actions">
        <button type="button" className="primary-button" onClick={resetGame}>
          Undertake a New Run
        </button>
      </footer>
    </div>
  );
};

export default Epilogue;

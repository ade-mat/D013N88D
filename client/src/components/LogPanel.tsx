import { useMemo } from 'react';
import { useGame } from '@/context/GameContext';

const LogPanel = () => {
  const { log } = useGame();

  const entries = useMemo(() => [...log].reverse(), [log]);

  return (
    <section className="log-panel">
      <header>
        <h3>Story Log</h3>
      </header>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id} className={`log-entry log-${entry.type}`}>
            <p className="log-label">{entry.label}</p>
            {entry.detail && <p className="log-detail">{entry.detail}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default LogPanel;

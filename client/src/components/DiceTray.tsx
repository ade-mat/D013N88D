import { useState } from 'react';
import { parseAndRollFormula } from '@/utils/dice';

interface HistoryEntry {
  id: string;
  formula: string;
  total: number;
  detail: string;
}

const QUICK_DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', '2d6', '4d6'];

const DiceTray = () => {
  const [formula, setFormula] = useState('d20');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const rollDice = (expression: string) => {
    const result = parseAndRollFormula(expression);
    const detail = result.rolls.length
      ? `${result.rolls.map((roll) => roll.die).join(', ')}${
          result.modifier !== 0 ? (result.modifier > 0 ? ` + ${result.modifier}` : ` - ${Math.abs(result.modifier)}`) : ''
        }`
      : `${result.modifier}`;
    setHistory((prev) => [
      {
        id: `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 6)}`,
        formula: result.formula,
        total: result.total,
        detail
      },
      ...prev
    ].slice(0, 12));
  };

  const handleRoll = () => {
    if (!formula.trim()) {
      return;
    }
    rollDice(formula.trim());
  };

  return (
    <section className="dice-tray">
      <header>
        <h3>Dice Tray</h3>
        <p className="muted small-text">Roll custom dice formulae (e.g., 2d6+3).</p>
      </header>
      <div className="dice-controls">
        <div className="dice-input">
          <input
            type="text"
            value={formula}
            onChange={(event) => setFormula(event.target.value)}
            placeholder="Enter formula"
          />
          <button type="button" className="primary-button" onClick={handleRoll}>
            Roll
          </button>
        </div>
        <div className="quick-dice">
          {QUICK_DICE.map((entry) => (
            <button
              key={entry}
              type="button"
              className="ghost-button"
              onClick={() => {
                setFormula(entry);
                rollDice(entry);
              }}
            >
              {entry}
            </button>
          ))}
        </div>
      </div>
      <ul className="dice-history">
        {history.length === 0 ? (
          <li className="muted">No rolls yet.</li>
        ) : (
          history.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.formula}</strong>
              <span>Total {entry.total}</span>
              <em>{entry.detail}</em>
            </li>
          ))
        )}
      </ul>
    </section>
  );
};

export default DiceTray;

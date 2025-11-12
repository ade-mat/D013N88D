import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGame } from '@/context/GameContext';
import { parseAndRollFormula, formatCheckSummary } from '@/utils/dice';
import { ABILITY_LABEL, SKILLS } from '@shared/referenceData';

type HistoryEntry = {
  id: string;
  label: string;
  subtitle?: string;
  total: number;
  detail: string;
};

const DICE_FACES = [2, 4, 6, 8, 10, 12, 20, 100];
const MIN_COUNT = 1;
const MAX_COUNT = 6;

const DiceTray = () => {
  const { pendingSkillCheck, rollPendingSkillCheck } = useGame();
  const [selectedDie, setSelectedDie] = useState(20);
  const [diceCount, setDiceCount] = useState(1);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeResult, setActiveResult] = useState<HistoryEntry | null>(null);

  const isResolvingCheck = Boolean(pendingSkillCheck);

  useEffect(() => {
    if (pendingSkillCheck) {
      setSelectedDie(20);
      setDiceCount(1);
    }
  }, [pendingSkillCheck]);

  const addHistoryEntry = useCallback((entry: HistoryEntry) => {
    setActiveResult(entry);
    setHistory((prev) => [entry, ...prev].slice(0, 10));
  }, []);

  const handleManualRoll = () => {
    if (isResolvingCheck) {
      const context = pendingSkillCheck;
      const result = rollPendingSkillCheck();
      if (!context || !result) {
        return;
      }
      const skillLabel = context.skill
        ? SKILLS.find((entry) => entry.id === context.skill)?.label ?? context.skill
        : `${ABILITY_LABEL[context.ability]} Check`;

      addHistoryEntry({
        id: `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 6)}`,
        label: skillLabel,
        subtitle: `${result.success ? 'Success' : 'Failure'} • DC ${result.dc}`,
        total: result.total,
        detail: formatCheckSummary(result)
      });
      return;
    }

    const formula = `${diceCount}d${selectedDie}`;
    const roll = parseAndRollFormula(formula);
    const modifier =
      roll.modifier !== 0
        ? roll.modifier > 0
          ? ` + ${roll.modifier}`
          : ` - ${Math.abs(roll.modifier)}`
        : '';
    const detail =
      roll.rolls.length > 0
        ? `${roll.rolls.map((entry) => entry.die).join(', ')}${modifier}`
        : `${roll.total}`;

    addHistoryEntry({
      id: `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 6)}`,
      label: formula,
      subtitle: 'Manual roll',
      total: roll.total,
      detail
    });
  };

  const clearHistory = () => {
    setHistory([]);
    setActiveResult(null);
  };

  const adjustDiceCount = (delta: number) => {
    setDiceCount((prev) => {
      const next = prev + delta;
      return Math.min(MAX_COUNT, Math.max(MIN_COUNT, next));
    });
  };

  const chipHistory = useMemo(
    () => history.slice(0, 3).map((entry) => ({ id: entry.id, total: entry.total })),
    [history]
  );

  const helperText = isResolvingCheck
    ? `Tap Roll to resolve the check (DC ${pendingSkillCheck?.dc ?? '--'}).`
    : activeResult?.detail ?? 'Pick a die, adjust the count, then tap Roll.';

  const title = isResolvingCheck
    ? pendingSkillCheck?.skill
      ? `${SKILLS.find((entry) => entry.id === pendingSkillCheck.skill)?.label ?? 'Skill'} (${ABILITY_LABEL[pendingSkillCheck.ability]})`
      : `${ABILITY_LABEL[pendingSkillCheck?.ability ?? 'strength']} Check`
    : `${diceCount}d${selectedDie}`;

  const advantageBadge = pendingSkillCheck?.advantage
    ? 'Advantage'
    : pendingSkillCheck?.disadvantage
      ? 'Disadvantage'
      : null;

  const statBreakdown = pendingSkillCheck
    ? [
        `Ability ${pendingSkillCheck.abilityMod >= 0 ? `+${pendingSkillCheck.abilityMod}` : pendingSkillCheck.abilityMod}`,
        pendingSkillCheck.proficient
          ? `Proficiency +${pendingSkillCheck.proficiencyBonus}`
          : null,
        pendingSkillCheck.miscBonus !== 0
          ? `Misc ${pendingSkillCheck.miscBonus > 0 ? '+' : ''}${pendingSkillCheck.miscBonus}`
          : null
      ].filter(Boolean)
    : null;

  return (
    <section className={`dice-tray ${isResolvingCheck ? 'dice-tray--pending' : ''}`}>
      <header className="dice-tray__header">
        <div>
          <h3>{isResolvingCheck ? 'Resolve Skill Check' : 'Dice Tray'}</h3>
          <p className="muted small-text">{helperText}</p>
        </div>
        {isResolvingCheck && (
          <span className="dc-pill">DC {pendingSkillCheck?.dc ?? '--'}</span>
        )}
      </header>

      <div className="dice-tray__history">
        {chipHistory.length === 0 ? (
          <span className="muted small-text">No rolls yet.</span>
        ) : (
          chipHistory.map((entry) => (
            <span key={entry.id} className="history-chip">
              {entry.total}
            </span>
          ))
        )}
      </div>

      <div className="dice-tray__total-row">
        <button
          type="button"
          className="total-adjust"
          onClick={() => adjustDiceCount(-1)}
          disabled={isResolvingCheck || diceCount <= MIN_COUNT}
          aria-label="Decrease dice count"
        >
          –
        </button>
        <div className="dice-total-value">
          {activeResult ? activeResult.total : '--'}
          <small>{title}</small>
        </div>
        <button
          type="button"
          className="total-adjust"
          onClick={() => adjustDiceCount(1)}
          disabled={isResolvingCheck || diceCount >= MAX_COUNT}
          aria-label="Increase dice count"
        >
          +
        </button>
      </div>

      {isResolvingCheck && (
        <div className="dice-tray__stats">
          {statBreakdown?.map((entry) => (
            <span key={entry}>{entry}</span>
          ))}
          {advantageBadge && <span className="badge">{advantageBadge}</span>}
        </div>
      )}

      <div className="dice-face-grid">
        {DICE_FACES.map((face) => {
          const disabled = isResolvingCheck && face !== 20;
          const isActive = selectedDie === face;
          return (
            <button
              key={face}
              type="button"
              className={`dice-face ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedDie(face)}
              disabled={disabled}
            >
              <span>{face}</span>
              {isResolvingCheck && face === 20 && <small>Check</small>}
            </button>
          );
        })}
      </div>

      <div className="dice-actions">
        <button type="button" className="primary-button expand" onClick={handleManualRoll}>
          {isResolvingCheck ? 'Roll Skill Check' : 'Roll Dice'}
        </button>
        {!isResolvingCheck && history.length > 0 && (
          <button type="button" className="ghost-button" onClick={clearHistory}>
            Reset
          </button>
        )}
      </div>

      <ul className="dice-log">
        {history.length === 0 ? (
          <li className="muted">Rolls appear here.</li>
        ) : (
          history.map((entry) => (
            <li key={entry.id}>
              <div>
                <strong>{entry.label}</strong>
                {entry.subtitle && <span>{entry.subtitle}</span>}
              </div>
              <div>
                <span className="total">{entry.total}</span>
                <em>{entry.detail}</em>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
};

export default DiceTray;

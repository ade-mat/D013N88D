import { useMemo, useState } from 'react';
import { useGame } from '@/context/GameContext';
import {
  ABILITIES,
  ABILITY_LABEL,
  BACKGROUND_DEFINITIONS,
  CLASS_DEFINITIONS,
  RACE_DEFINITIONS,
  SKILLS,
  STANDARD_ABILITY_ARRAY
} from '@shared/referenceData';
import type { Ability, Skill } from '@/types';

const abilityRoll = () => {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
    .sort((a, b) => a - b)
    .slice(1);
  return rolls.reduce((sum, value) => sum + value, 0);
};

const rollAbilitySet = () => Array.from({ length: 6 }, () => abilityRoll());

interface AbilityOption {
  label: string;
  value: number;
  disabled: boolean;
}

const formatAbilityOption = (value: number, availableCount: number): AbilityOption => ({
  label: `${value}${availableCount <= 0 ? ' (used)' : ''}`,
  value,
  disabled: availableCount <= 0
});

const CharacterCreator = () => {
  const { startGame, resetGame } = useGame();

  const [step, setStep] = useState(0);
  const [heroName, setHeroName] = useState('');
  const [raceId, setRaceId] = useState(RACE_DEFINITIONS[0]?.id ?? '');
  const [classId, setClassId] = useState(CLASS_DEFINITIONS[0]?.id ?? '');
  const [backgroundId, setBackgroundId] = useState(
    BACKGROUND_DEFINITIONS[0]?.id ?? ''
  );
  const [assignedScores, setAssignedScores] = useState<Record<Ability, number | null>>({
    strength: null,
    dexterity: null,
    constitution: null,
    intelligence: null,
    wisdom: null,
    charisma: null
  });
  const [scorePool, setScorePool] = useState<number[]>([...STANDARD_ABILITY_ARRAY]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [customNotes, setCustomNotes] = useState('');

  const race = useMemo(
    () => RACE_DEFINITIONS.find((entry) => entry.id === raceId) ?? RACE_DEFINITIONS[0],
    [raceId]
  );
  const klass = useMemo(
    () => CLASS_DEFINITIONS.find((entry) => entry.id === classId) ?? CLASS_DEFINITIONS[0],
    [classId]
  );
  const background = useMemo(
    () =>
      BACKGROUND_DEFINITIONS.find((entry) => entry.id === backgroundId) ??
      BACKGROUND_DEFINITIONS[0],
    [backgroundId]
  );

  const scoreUsage = useMemo(() => {
    const usageMap = new Map<number, number>();
    scorePool.forEach((value) => {
      usageMap.set(value, (usageMap.get(value) ?? 0) + 1);
    });

    ABILITIES.forEach((ability) => {
      const assigned = assignedScores[ability];
      if (assigned !== null) {
        usageMap.set(assigned, (usageMap.get(assigned) ?? 0) - 1);
      }
    });

    return usageMap;
  }, [assignedScores, scorePool]);

  const abilityOptions = useMemo(() => {
    return scorePool
      .filter((value, index, array) => array.indexOf(value) === index)
      .map((value) => formatAbilityOption(value, scoreUsage.get(value) ?? 0));
  }, [scorePool, scoreUsage]);

  const assignedAbilityScores = useMemo(() => {
    const record: Record<Ability, number> = {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    };
    ABILITIES.forEach((ability) => {
      const base = assignedScores[ability] ?? 10;
      const racialBonus = race.abilityBonuses?.[ability] ?? 0;
      record[ability] = base + racialBonus;
    });
    return record;
  }, [assignedScores, race.abilityBonuses]);

  const abilityComplete = useMemo(
    () => ABILITIES.every((ability) => assignedScores[ability] !== null),
    [assignedScores]
  );

  const backgroundSkills = useMemo(() => new Set(background.skillProficiencies), [background]);

  const maxSkillChoices = klass.skillChoices;

  const availableSkillOptions = useMemo(() => {
    return klass.skillOptions.map((skill) => {
      const info = SKILLS.find((entry) => entry.id === skill);
      return {
        id: skill,
        label: info ? info.label : skill,
        ability: info ? ABILITY_LABEL[info.ability] : '—',
        locked: backgroundSkills.has(skill)
      };
    });
  }, [backgroundSkills, klass.skillOptions]);

  const toggleSkill = (skill: Skill) => {
    if (backgroundSkills.has(skill)) {
      return;
    }
    setSelectedSkills((prev) => {
      const exists = prev.includes(skill);
      if (exists) {
        return prev.filter((entry) => entry !== skill);
      }
      if (prev.length >= maxSkillChoices) {
        return prev;
      }
      return [...prev, skill];
    });
  };

  const handleAbilitySelect = (ability: Ability, value: number | null) => {
    setAssignedScores((prev) => ({
      ...prev,
      [ability]: value
    }));
  };

  const handleRollArray = () => {
    const rolls = rollAbilitySet().sort((a, b) => b - a);
    setScorePool(rolls);
    const nextAssigned: Record<Ability, number | null> = { ...assignedScores };
    ABILITIES.forEach((ability) => {
      nextAssigned[ability] = null;
    });
    setAssignedScores(nextAssigned);
  };

  const handleUseStandardArray = () => {
    setScorePool([...STANDARD_ABILITY_ARRAY]);
    const reset: Record<Ability, number | null> = { ...assignedScores };
    ABILITIES.forEach((ability) => {
      reset[ability] = null;
    });
    setAssignedScores(reset);
  };

  const readyToLaunch =
    heroName.trim().length >= 2 &&
    abilityComplete &&
    (selectedSkills.length === maxSkillChoices || maxSkillChoices === 0);

  const goToStep = (nextStep: number) => {
    if (nextStep < step && nextStep >= 0) {
      setStep(nextStep);
      return;
    }
    if (step === 0 && heroName.trim().length < 2) {
      return;
    }
    if (step === 1 && !abilityComplete) {
      return;
    }
    setStep(nextStep);
  };

  const handleLaunch = () => {
    if (!readyToLaunch) {
      return;
    }

    const abilityScores: Record<Ability, number> = ABILITIES.reduce(
      (acc, ability) => ({
        ...acc,
        [ability]: (assignedScores[ability] ?? 10)
      }),
      {} as Record<Ability, number>
    );

    const allClassSkills = new Set<Skill>([...background.skillProficiencies]);
    selectedSkills.forEach((skill) => allClassSkills.add(skill));

    startGame({
      name: heroName.trim(),
      raceId,
      classId,
      backgroundId,
      abilityScores,
      selectedSkills: Array.from(allClassSkills),
      notes: customNotes ? customNotes.split('\n').map((line) => line.trim()).filter(Boolean) : undefined
    });
  };

  return (
    <div className="setup-container">
      <header className="setup-header">
        <h1>Forge Your Hero</h1>
        <p className="setup-tagline">
          Build a level 1 adventurer using core D&D options before stepping into Emberfall.
        </p>
      </header>

      <nav className="setup-steps">
        {['Concept', 'Ability Scores', 'Skills & Finish'].map((label, index) => (
          <button
            key={label}
            type="button"
            className={`step-chip ${step === index ? 'active' : ''}`}
            onClick={() => goToStep(index)}
          >
            <span className="step-index">{index + 1}</span>
            {label}
          </button>
        ))}
      </nav>

      {step === 0 && (
        <section className="setup-body">
          <div className="setup-grid">
            <div>
              <label htmlFor="hero-name">Hero Name</label>
              <input
                id="hero-name"
                type="text"
                placeholder="Name your legend"
                value={heroName}
                onChange={(event) => setHeroName(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="hero-race">Race</label>
              <select
                id="hero-race"
                value={raceId}
                onChange={(event) => setRaceId(event.target.value)}
              >
                {RACE_DEFINITIONS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
              <p className="muted small-text">
                Ability bonuses: {ABILITIES.map((ability) => `${ABILITY_LABEL[ability]} ${race.abilityBonuses?.[ability] ?? 0 > 0 ? `+${race.abilityBonuses?.[ability] ?? 0}` : '+0'}`).join(', ')}
              </p>
            </div>

            <div>
              <label htmlFor="hero-class">Class</label>
              <select
                id="hero-class"
                value={classId}
                onChange={(event) => {
                  setClassId(event.target.value);
                  setSelectedSkills([]);
                }}
              >
                {CLASS_DEFINITIONS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
              <p className="muted small-text">
                Hit Die d{klass.hitDie} • Proficiencies: {klass.armorProficiencies.join(', ')}
              </p>
            </div>

            <div>
              <label htmlFor="hero-background">Background</label>
              <select
                id="hero-background"
                value={backgroundId}
                onChange={(event) => setBackgroundId(event.target.value)}
              >
                {BACKGROUND_DEFINITIONS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
              <p className="muted small-text">
                Skill proficiencies: {background.skillProficiencies
                  .map((skill) => SKILLS.find((entry) => entry.id === skill)?.label ?? skill)
                  .join(', ')}
              </p>
            </div>
          </div>

          <div className="setup-notes">
            <label htmlFor="hero-notes">Personal Notes (optional)</label>
            <textarea
              id="hero-notes"
              rows={3}
              placeholder="Backstory hook, appearance, motivation..."
              value={customNotes}
              onChange={(event) => setCustomNotes(event.target.value)}
            />
          </div>

          <footer className="setup-footer">
            <button type="button" className="primary-button" onClick={() => goToStep(1)} disabled={heroName.trim().length < 2}>
              Continue to Ability Scores
            </button>
          </footer>
        </section>
      )}

      {step === 1 && (
        <section className="setup-body">
          <div className="ability-controls">
            <div className="ability-toolbar">
              <button type="button" className="ghost-button" onClick={handleUseStandardArray}>
                Use Standard Array
              </button>
              <button type="button" className="ghost-button" onClick={handleRollArray}>
                Roll 4d6 Drop Lowest
              </button>
              <span className="muted small-text">Scores available: {scorePool.join(', ')}</span>
            </div>

            <div className="ability-grid">
              {ABILITIES.map((ability) => {
                const optionList = abilityOptions.map((option) => ({
                  ...option,
                  disabled:
                    option.disabled && assignedScores[ability] !== option.value
                }));

                const baseValue = assignedScores[ability];
                const racialBonus = race.abilityBonuses?.[ability] ?? 0;
                const finalValue =
                  (baseValue ?? 10) + racialBonus;
                const modifier = Math.floor((finalValue - 10) / 2);

                return (
                  <div key={ability} className="ability-card">
                    <header>
                      <h3>{ABILITY_LABEL[ability]}</h3>
                      <span className="muted">Mod {modifier >= 0 ? `+${modifier}` : modifier}</span>
                    </header>
                    <select
                      value={baseValue ?? ''}
                      onChange={(event) => {
                        const value = event.target.value === '' ? null : Number.parseInt(event.target.value, 10);
                        handleAbilitySelect(ability, value);
                      }}
                    >
                      <option value="">Select score</option>
                      {optionList.map((option) => (
                        <option key={`${ability}-${option.value}`} value={option.value} disabled={option.disabled}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="muted small-text">Final score {finalValue} (racial bonus {racialBonus >= 0 ? `+${racialBonus}` : racialBonus})</p>
                  </div>
                );
              })}
            </div>
          </div>

          <footer className="setup-footer">
            <div className="setup-actions">
              <button type="button" className="ghost-button" onClick={() => goToStep(0)}>
                Back
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => goToStep(2)}
                disabled={!abilityComplete}
              >
                Choose Skills
              </button>
            </div>
          </footer>
        </section>
      )}

      {step === 2 && (
        <section className="setup-body">
          <div className="skills-grid">
            <header className="skills-header">
              <h2>Class Skill Proficiencies</h2>
              <p className="muted small-text">
                Select {maxSkillChoices} skill{maxSkillChoices === 1 ? '' : 's'}: {selectedSkills.length}/{maxSkillChoices}
              </p>
            </header>

            <div className="skills-selection-list">
              {availableSkillOptions.map((skill) => {
                const locked = skill.locked;
                const checked = locked || selectedSkills.includes(skill.id);
                return (
                  <label key={skill.id} className={`skill-option ${locked ? 'locked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={locked}
                      onChange={() => toggleSkill(skill.id)}
                    />
                    <div>
                      <strong>{skill.label}</strong>
                      <p className="muted small-text">Ability: {skill.ability}</p>
                      {locked && <p className="locked-note">From background</p>}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="summary-card">
            <h3>Character Summary</h3>
            <ul>
              <li>
                <strong>Race:</strong> {race.name} — Speed {race.speed} ft
              </li>
              <li>
                <strong>Class:</strong> {klass.name} — Hit Die d{klass.hitDie}
              </li>
              <li>
                <strong>Background:</strong> {background.name}
              </li>
              <li>
                <strong>Ability Scores:</strong>{' '}
                {ABILITIES.map((ability) => `${ABILITY_LABEL[ability]} ${assignedAbilityScores[ability]}`).join(', ')}
              </li>
            </ul>
          </div>

          <footer className="setup-footer">
            <div className="setup-actions">
              <button type="button" className="ghost-button" onClick={() => goToStep(1)}>
                Back
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={!readyToLaunch}
                onClick={handleLaunch}
              >
                Begin Campaign
              </button>
              <button type="button" className="ghost-button" onClick={resetGame}>
                Reset Save
              </button>
            </div>
          </footer>
        </section>
      )}
    </div>
  );
};

export default CharacterCreator;

import { useMemo } from 'react';
import { useGame } from '@/context/GameContext';
import type { SceneChoice, SceneNode } from '@/types';
import { ABILITY_LABEL, SKILLS } from '@shared/referenceData';

type AugmentedChoice = SceneChoice & {
  isHidden: boolean;
  isEnabled: boolean;
  requiresSatisfied: boolean;
};

interface SceneViewProps {
  scene: SceneNode;
}

const SceneView = ({ scene }: SceneViewProps) => {
  const { hero, chooseOption, lastRoll } = useGame();

  const options = useMemo<AugmentedChoice[]>(() => {
    return scene.options.map((option) => {
      const requiresSatisfied =
        !option.requiresFlag || (hero ? hero.flags[option.requiresFlag] === true : true);
      const hidden =
        option.hideIfFlag && hero ? hero.flags[option.hideIfFlag] === true : false;

      const isEnabled = hero ? requiresSatisfied && !hidden : true;
      return {
        ...option,
        isHidden: hidden,
        isEnabled,
        requiresSatisfied
      };
    });
  }, [hero, scene.options]);

  if (!hero) {
    return null;
  }

  const renderSkillRequirement = (choice: SceneChoice) => {
    if (!choice.skillCheck) {
      return null;
    }
    return (
      <p className="choice-meta">
        {choice.skillCheck.skill
          ? `${SKILLS.find((entry) => entry.id === choice.skillCheck?.skill)?.label ?? 'Skill'} ( ${ABILITY_LABEL[choice.skillCheck.ability]} )`
          : `${ABILITY_LABEL[choice.skillCheck.ability]} Check`}{' '}
        vs DC {choice.skillCheck.dc}
      </p>
    );
  };

  return (
    <div className="scene-container">
      <header className="scene-header">
        <h2>{scene.title}</h2>
      </header>
      <div className="scene-narrative">
        <p>{scene.narrative}</p>
      </div>

      {lastRoll && (
        <div className={`roll-summary ${lastRoll.success ? 'success' : 'failure'}`}>
          <strong>Last Check:</strong>{' '}
          {lastRoll.skill
            ? `${SKILLS.find((entry) => entry.id === lastRoll.skill)?.label ?? lastRoll.skill} (${ABILITY_LABEL[lastRoll.ability]})`
            : `${ABILITY_LABEL[lastRoll.ability]} Check`}
          <p className="roll-detail">
            d20 {lastRoll.primary}
            {lastRoll.secondary !== undefined && ` / ${lastRoll.secondary}`} • kept {lastRoll.kept}
          </p>
          <p className="roll-detail">
            Total {lastRoll.total} vs DC {lastRoll.dc}{' '}
            {lastRoll.success ? 'Success' : 'Failure'}
          </p>
        </div>
      )}

      <section className="scene-options">
        {options
          .filter((option) => !option.isHidden)
          .map((option) => (
            <button
              key={option.id}
              type="button"
              className="choice-card"
              disabled={!option.isEnabled}
              onClick={() => chooseOption(option.id)}
            >
              <div className="choice-content">
                <h3>{option.label}</h3>
                {option.description && <p>{option.description}</p>}
                {renderSkillRequirement(option)}
                {!option.requiresSatisfied && option.requiresFlag && (
                  <p className="choice-requirement">
                    Requires: {option.requiresFlag.replace(/_/g, ' ')}
                  </p>
                )}
              </div>
            </button>
          ))}
      </section>
    </div>
  );
};

export default SceneView;

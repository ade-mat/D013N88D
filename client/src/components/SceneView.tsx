import { useMemo } from 'react';
import { useGame } from '@/context/GameContext';
import type { SceneChoice, SceneNode } from '@/types';

interface SceneViewProps {
  scene: SceneNode;
}

const SceneView = ({ scene }: SceneViewProps) => {
  const { hero, chooseOption, lastRoll } = useGame();

  const options = useMemo(() => {
    if (!hero) {
      return scene.options;
    }
    return scene.options.map((option) => {
      const requiresSatisfied =
        !option.requiresFlag || hero.flags[option.requiresFlag] === true;
      const hidden = option.hideIfFlag && hero.flags[option.hideIfFlag] === true;
      return {
        ...option,
        isHidden: hidden,
        isEnabled: requiresSatisfied && !hidden,
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
        Skill Check — {choice.skillCheck.attribute.toUpperCase()} vs DC{' '}
        {choice.skillCheck.difficulty}
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
          <strong>Last Roll:</strong> d20 {lastRoll.die}
          {lastRoll.secondaryDie !== undefined && ` / ${lastRoll.secondaryDie}`}{' '}
          + {lastRoll.modifier} = {lastRoll.total} vs DC {lastRoll.difficulty}{' '}
          ({lastRoll.success ? 'Success' : 'Failure'})
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

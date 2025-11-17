import { useMemo } from 'react';
import { useGame } from '@/context/GameContext';

const CampaignGuide = () => {
  const { campaign } = useGame();

  const acts = useMemo(() => campaign.acts ?? [], [campaign.acts]);
  const characters = useMemo(() => campaign.characters ?? [], [campaign.characters]);

  return (
    <section className="campaign-guide">
      <header>
        <h3>Campaign Anchors</h3>
        <p className="muted">Acts and allies that shape each beat.</p>
      </header>

      <div className="campaign-guide__section">
        <h4>Acts</h4>
        <ul>
          {acts.map((act) => (
            <li key={act.id}>
              <strong>{act.title}</strong>
              <p>{act.situation}</p>
              <p className="muted">Objectives: {act.objectives.join(', ')}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="campaign-guide__section">
        <h4>Key Characters</h4>
        <ul>
          {characters.map((character) => (
            <li key={character.id}>
              <strong>{character.name}</strong> <span>— {character.role}</span>
              <p>{character.motivation}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default CampaignGuide;

import { useMemo } from 'react';
import { useGame } from '@/context/GameContext';

const characterTag = (
  characterId: string,
  allies: Record<string, 'ally' | 'rival' | 'neutral'>,
  flags: Record<string, boolean>
) => {
  if (flags[`with_${characterId}`]) {
    return { label: 'Present', tone: 'present' as const };
  }
  if (allies[characterId] === 'ally') {
    return { label: 'In Party', tone: 'party' as const };
  }
  if (allies[characterId] === 'rival' || flags[`${characterId}_enemy`]) {
    return { label: 'Known Enemy', tone: 'enemy' as const };
  }
  return null;
};

const CampaignGuide = () => {
  const { campaign, hero } = useGame();

  const characters = useMemo(() => campaign.characters ?? [], [campaign.characters]);

  const tagGroups = {
    present: 'Currently with you',
    party: 'Allies in your network',
    enemy: 'Known enemies'
  };

  return (
    <section className="campaign-guide">
      <header>
        <div>
          <h3>Allies & Adversaries</h3>
          <p className="muted">Track who walks beside you—and who opposes you.</p>
        </div>
        <div className="campaign-guide__legend">
          {Object.entries(tagGroups).map(([tone, label]) => (
            <span key={tone} className={`character-tag character-tag--${tone}`}>
              {label}
            </span>
          ))}
        </div>
      </header>

      <div className="campaign-guide__section">
        <ul>
          {characters.map((character) => {
            const tag =
              hero ? characterTag(character.id, hero.allies, hero.flags) : null;
            return (
              <li key={character.id}>
                <div className="character-row">
                  <div>
                    <strong>{character.name}</strong>
                    <span> {character.role}</span>
                  </div>
                  {tag && (
                    <span className={`character-tag character-tag--${tag.tone}`}>
                      {tag.label}
                    </span>
                  )}
                </div>
                <p>{character.motivation}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default CampaignGuide;

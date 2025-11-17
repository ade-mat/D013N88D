import { useCallback, useMemo, useState } from 'react';
import { useGame } from '@/context/GameContext';

const StoryCanvas = () => {
  const {
    campaign,
    hero,
    storyBeats,
    storyError,
    storyLoading,
    submitStoryAction
  } = useGame();
  const [draft, setDraft] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!hero || !draft.trim()) {
      return;
    }
    const text = draft.trim();
    setDraft('');
    await submitStoryAction(text);
  }, [draft, hero, submitStoryAction]);

  const disabled = !hero || storyLoading || draft.trim().length === 0;

  const introMessage = useMemo(() => {
    if (!campaign) {
      return '';
    }
    if (campaign.guidance && campaign.guidance.length > 0) {
      return campaign.guidance[0];
    }
    return campaign.synopsis;
  }, [campaign]);

  return (
    <section className="story-canvas">
      <header className="story-canvas__header">
        <div>
          <h2>Story Flow</h2>
          <p>{campaign.synopsis}</p>
        </div>
        {introMessage && <p className="muted">{introMessage}</p>}
      </header>

      <div className="story-canvas__timeline">
        {storyBeats.length === 0 ? (
          <article className="story-beat muted">
            <p>
              {hero
                ? 'Describe your opening move to begin the ascent.'
                : 'Create your hero to begin the campaign.'}
            </p>
          </article>
        ) : (
          storyBeats.map((beat) => (
            <article key={beat.id} className="story-beat">
              <div className="story-beat__action">
                <span>You</span>
                <p>{beat.playerAction}</p>
              </div>
              <div className="story-beat__narrative">
                <span>Emberfall</span>
                <p>{beat.narrative}</p>
                {beat.npcReplies.length > 0 && (
                  <ul>
                    {beat.npcReplies.map((reply, index) => (
                      <li key={`${reply.npcId}-${index}`}>
                        <strong>{reply.npcId}</strong>: {reply.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {storyError && <p className="story-canvas__error">{storyError}</p>}

      <div className="story-canvas__input">
        <textarea
          rows={4}
          disabled={!hero}
          placeholder={
            hero
              ? 'Describe your next move or say something to the cast…'
              : 'Complete character creation to begin.'
          }
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={disabled}
        >
          {storyLoading ? 'Summoning…' : 'Send Action'}
        </button>
      </div>
    </section>
  );
};

export default StoryCanvas;

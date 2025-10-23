import { useMemo, useState } from 'react';
import { useGame } from '@/context/GameContext';

const npcDirectory: Record<
  string,
  { name: string; description: string; fallback: (prompt: string) => string }
> = {
  seraphine: {
    name: 'Seraphine Voss',
    description: 'Lantern seer attuned to future threads.',
    fallback: (prompt) =>
      `I gaze through the embers and glimpse your words: "${prompt}". Trust the path that feels impossible; the Heart bends toward your resolve.`
  },
  tamsin: {
    name: 'Tamsin Quickwick',
    description: 'Goblin artificer with a chaotic streak.',
    fallback: () =>
      'Gears are spinning and I have at least three plans. Hit the conduit with the flat of your blade and keep moving!'
  },
  marek: {
    name: 'Captain Marek Thorne',
    description: 'Sentinel commander wrestling with duty.',
    fallback: () =>
      'Hold the line. I have squads repositioning to cover your exit. Make the Heart worth the risk.'
  },
  nerrix: {
    name: 'Nerrix Tal',
    description: 'Captured tinkerer who knows the Heart’s systems.',
    fallback: () =>
      'Listen, the Heart responds to harmonic phrases. Keep the pulses steady and remember me when you reach the core.'
  },
  lirael: {
    name: 'Lirael the Warden',
    description: 'Astral guardian bound to the Heart of Embers.',
    fallback: () =>
      'My voice is fragmented. Steady the Heart, mortal. Show me there is grace beyond this corruption.'
  }
};

const ConversationPanel = () => {
  const {
    hero,
    conversation,
    recordNpcConversation,
    recordPlayerConversation
  } = useGame();
  const [selectedNpc, setSelectedNpc] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableContacts = useMemo(() => {
    if (!hero) {
      return [];
    }

    const contacts = new Set<string>();
    Object.entries(hero.allies).forEach(([ally, status]) => {
      if (status !== 'neutral') {
        contacts.add(ally);
      }
    });
    Object.entries(hero.flags).forEach(([flag, value]) => {
      if (value && npcDirectory[flag]) {
        contacts.add(flag);
      }
    });
    if (hero.flags.heart_cleansed) {
      contacts.add('lirael');
    }
    return Array.from(contacts).filter((npcId) => npcDirectory[npcId]);
  }, [hero]);

  const activeNpc = selectedNpc ?? availableContacts[0] ?? null;
  const history = activeNpc ? conversation[activeNpc] ?? [] : [];

  const sendMessage = async () => {
    if (!hero || !activeNpc || message.trim().length === 0) {
      return;
    }

    const prompt = message.trim();
    recordPlayerConversation(activeNpc, prompt);
    setMessage('');
    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcId: activeNpc,
          prompt,
          hero: {
            name: hero.name,
            metrics: hero.metrics,
            flags: hero.flags
          }
        })
      });

      if (!response.ok) {
        throw new Error('oracle-offline');
      }

      const data = (await response.json()) as { reply: string };
      recordNpcConversation(activeNpc, data.reply);
    } catch {
      const fallback = npcDirectory[activeNpc].fallback(prompt);
      recordNpcConversation(activeNpc, fallback);
      setError('Oracle offline — using scripted response.');
    } finally {
      setPending(false);
    }
  };

  if (!hero || availableContacts.length === 0) {
    return null;
  }

  return (
    <section className="conversation-panel">
      <header>
        <h3>Allied Channel</h3>
        {error && <p className="conversation-error">{error}</p>}
      </header>

      <div className="conversation-contact-list">
        {availableContacts.map((npcId) => {
          const details = npcDirectory[npcId];
          const isActive = npcId === activeNpc;
          return (
            <button
              key={npcId}
              type="button"
              className={`contact-chip ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedNpc(npcId)}
            >
              <strong>{details.name}</strong>
              <span>{details.description}</span>
            </button>
          );
        })}
      </div>

      <div className="conversation-log">
        {history.length === 0 ? (
          <p className="muted">No messages yet.</p>
        ) : (
          history.map((turn, index) => (
            <div key={`${turn.speaker}-${index}`} className={`conversation-turn ${turn.speaker}`}>
              <span className="speaker">{turn.speaker === 'npc' ? 'Them' : 'You'}</span>
              <p>{turn.text}</p>
            </div>
          ))
        )}
      </div>

      <div className="conversation-input">
        <textarea
          rows={3}
          placeholder="Ask for guidance…"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <button type="button" className="primary-button" onClick={sendMessage} disabled={pending}>
          {pending ? 'Contacting…' : 'Send'}
        </button>
      </div>
    </section>
  );
};

export default ConversationPanel;

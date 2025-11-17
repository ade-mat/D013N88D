import { randomUUID } from 'node:crypto';
import { VertexAI } from '@google-cloud/vertexai';
import type {
  Campaign,
  StoryAdvanceRequest,
  StoryBeat,
  StoryBeatReply
} from '../../../shared/types.js';

const DEFAULT_MODEL = 'gemini-1.5-pro';
const DEFAULT_LOCATION = 'us-central1';

type GenerativeModel = ReturnType<VertexAI['getGenerativeModel']>;

let cachedModel: GenerativeModel | null = null;

const isVertexConfigured = () => {
  return Boolean(process.env.GENAI_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID);
};

const ensureModel = (): GenerativeModel | null => {
  if (!isVertexConfigured()) {
    return null;
  }
  if (cachedModel) {
    return cachedModel;
  }

  const project = process.env.GENAI_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID;
  if (!project) {
    return null;
  }
  const location = process.env.GENAI_LOCATION ?? DEFAULT_LOCATION;
  const modelName = process.env.GENAI_MODEL ?? DEFAULT_MODEL;

  const client = new VertexAI({
    project,
    location
  });
  cachedModel = client.getGenerativeModel({ model: modelName });
  return cachedModel;
};

const summariseBeats = (beats: StoryBeat[], limit = 4) => {
  const recent = beats.slice(-limit);
  return recent
    .map(
      (beat) =>
        `Player: ${beat.playerAction}\nStory: ${beat.narrative}\nReplies: ${beat.npcReplies
          .map((reply) => `${reply.npcId}: ${reply.text}`)
          .join(' | ')}`
    )
    .join('\n---\n');
};

const vertexWindowMs = 60 * 1000;
const vertexMaxCalls = 40;
const vertexCallHistory: number[] = [];

const canInvokeVertex = () => {
  const now = Date.now();
  while (vertexCallHistory.length > 0 && now - vertexCallHistory[0] > vertexWindowMs) {
    vertexCallHistory.shift();
  }
  if (vertexCallHistory.length >= vertexMaxCalls) {
    return false;
  }
  vertexCallHistory.push(now);
  return true;
};

const buildPrompt = (request: StoryAdvanceRequest, campaign: Campaign) => {
  const { hero, action, beats } = request;
  const heroStatus = Object.entries(hero.status)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  const heroFlags = Object.entries(hero.flags)
    .filter(([, value]) => value)
    .map(([flag]) => flag)
    .join(', ');

  const actOverview = campaign.acts
    .map(
      (act) => `Act ${act.title} — Situation: ${act.situation}.
Objectives:
- ${act.objectives.join('\n- ')}
Complications: ${act.complications?.join(', ') ?? '—'}`
    )
    .join('\n\n');

  const characterOverview = campaign.characters
    .map(
      (character) =>
        `${character.name} (${character.role}) — Motivation: ${character.motivation}. Voice: ${character.voice}`
    )
    .join('\n');

  const loreOverview = campaign.lore
    .map((entry) => `${entry.title}: ${entry.details.join(' ')}`)
    .join('\n');

  const recap = beats.length > 0 ? summariseBeats(beats) : 'No prior beats. Start with Act I tension.';

  return `
You are an AI game master running a single-player D&D inspired story set in Emberfall.
Keep tension high, honour prior choices, and always respond with valid JSON.
JSON schema:
{
  "narrative": "<describe what happens next in 2-4 sentences>",
  "npcReplies": [{"npcId": "seraphine", "text": "<quoted dialogue>"}],
  "tags": ["act1", "battle"],
  "delta": {
    "statusAdjust": {"stress": 1},
    "flags": {"heart_cleansed": true},
    "notes": ["Player unlocked the lantern code"],
    "isEnding": false
  }
}

Campaign synopsis: ${campaign.synopsis}
Tone: ${campaign.tone}
Themes: ${campaign.themes?.join(', ') ?? '—'}
Acts:
${actOverview}

Key characters:
${characterOverview}

Lore notes:
${loreOverview}

Hero: ${hero.name}
Class: ${hero.classId} • Race: ${hero.raceId}
Status: ${heroStatus}
Flags: ${heroFlags || 'none'}

Recent beats:
${recap}

Player just attempted: "${action}"
Respond with JSON only — no code fences or commentary.
`;
};

const parseJson = (candidate: string): Record<string, unknown> | null => {
  const trimmed = candidate.trim();
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  const slice = trimmed.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(slice) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const extractTextFromResponse = (result: unknown): string => {
  const response = result as {
    response?: {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
  };
  const candidate = response.response?.candidates?.find(
    (entry) => entry.content?.parts?.some((part) => typeof part.text === 'string')
  );
  if (!candidate?.content?.parts) {
    return '';
  }
  const part = candidate.content.parts.find((entry) => typeof entry.text === 'string');
  return part?.text ?? '';
};

const normaliseReplies = (value: unknown): StoryBeatReply[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const npcId = typeof record.npcId === 'string' ? record.npcId : 'narrator';
      const text = typeof record.text === 'string' ? record.text : '';
      if (!text) {
        return null;
      }
      return { npcId, text };
    })
    .filter((entry): entry is StoryBeatReply => Boolean(entry));
};

const coerceStoryBeat = (
  payload: Record<string, unknown>,
  action: string
): StoryBeat | null => {
  if (typeof payload.narrative !== 'string' || payload.narrative.trim().length === 0) {
    return null;
  }
  return {
    id: randomUUID(),
    playerAction: action,
    narrative: payload.narrative,
    npcReplies: normaliseReplies(payload.npcReplies) ?? [],
    tags: Array.isArray(payload.tags)
      ? payload.tags.filter((tag): tag is string => typeof tag === 'string')
      : undefined,
    delta:
      payload.delta && typeof payload.delta === 'object'
        ? (payload.delta as StoryBeat['delta'])
        : undefined,
    createdAt: Date.now()
  };
};

const chooseAnchorCharacter = (campaign: Campaign): StoryBeatReply => {
  const roster = campaign.characters;
  const choice = roster[Math.floor(Math.random() * roster.length)];
  return {
    npcId: choice?.id ?? 'narrator',
    text:
      choice?.voice ??
      'The people of Emberfall wait for you to steady the Heart. Keep moving.'
  };
};

const fallbackNarrative = (
  action: string,
  campaign: Campaign,
  beats: StoryBeat[]
): StoryBeat => {
  const lastBeat = beats.length > 0 ? beats[beats.length - 1] : null;
  const recentAct =
    lastBeat?.tags?.find((tag) => campaign.acts.some((act) => act.id === tag)) ??
    campaign.acts[beats.length >= 4 ? 2 : beats.length >= 2 ? 1 : 0]?.id ??
    'act1';
  const act =
    campaign.acts.find((entry) => entry.id === recentAct) ?? campaign.acts[0];
  const description = `You ${action}. ${act.situation} You sense time slipping as the Heart pulses above Emberfall.`;
  return {
    id: randomUUID(),
    playerAction: action,
    narrative: description,
    npcReplies: [chooseAnchorCharacter(campaign)],
    tags: [act.id],
    createdAt: Date.now()
  };
};

export const generateStoryBeat = async (
  request: StoryAdvanceRequest,
  campaign: Campaign
): Promise<StoryBeat> => {
  const model = ensureModel();
  const prompt = buildPrompt(request, campaign);

  if (!model) {
    return fallbackNarrative(request.action, campaign, request.beats);
  }

  if (!canInvokeVertex()) {
    throw new Error('vertex-rate-limit');
  }

  try {
    const result = await model.generateContent([
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]);
    const text = extractTextFromResponse(result);
    const jsonPayload = parseJson(text);
    if (!jsonPayload) {
      throw new Error('Vertex AI did not return JSON');
    }
    const beat = coerceStoryBeat(jsonPayload, request.action);
    if (!beat) {
      throw new Error('Unable to coerce story beat from Vertex payload');
    }
    return beat;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      'Falling back to deterministic narrative due to Vertex AI error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return fallbackNarrative(request.action, campaign, request.beats);
  }
};

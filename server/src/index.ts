import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { campaignData } from '../../shared/campaign.js';
import type { Campaign, StoryAdvanceRequest } from '../../shared/types.js';
import { generateStoryBeat } from './lib/storyEngine.js';
import progressRouter from './routes/progress.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(compression());
app.use(morgan('dev'));

const campaign: Campaign = campaignData;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/campaign', (_req, res) => {
  res.json(campaign);
});

const storyLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

app.post('/api/story/advance', storyLimiter, async (req, res) => {
  const payload = req.body as Partial<StoryAdvanceRequest>;
  if (!payload || typeof payload.action !== 'string' || !payload.hero) {
    return res.status(400).json({ error: 'action and hero are required.' });
  }

  const trimmedAction = payload.action.trim();
  if (!trimmedAction) {
    return res.status(400).json({ error: 'action must be a non-empty string.' });
  }

  const beats = Array.isArray(payload.beats) ? payload.beats.slice(-6) : [];

  try {
    const beat = await generateStoryBeat(
      { action: trimmedAction, hero: payload.hero, beats },
      campaign
    );
    return res.json({ beat });
  } catch (error) {
    return res.status(500).json({
      error: 'Unable to advance story at this time.'
    });
  }
});

app.use('/api/progress', progressRouter);

const clientDistCandidates = [
  path.resolve(__dirname, '../../../client/dist'),
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist')
];

const clientDistPath = clientDistCandidates.find((candidate) =>
  fs.existsSync(candidate)
);

// Set up rate limiter: max 100 requests per 15 minutes per IP
const staticFileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

if (clientDistPath) {
  app.use(express.static(clientDistPath));
  app.get('*', staticFileLimiter, (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Emberfall server listening on port ${port}`);
});

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { campaignData } from '../../shared/campaign';
import type { Campaign, Metric } from '../../shared/types';
import { createOracleResponse } from './lib/npcOracle';

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

interface HeroPayload {
  name: string;
  metrics?: Partial<Record<Metric, number>>;
  flags?: Record<string, boolean>;
}

app.post('/api/oracle', (req, res) => {
  const { npcId, prompt, hero } = req.body as {
    npcId?: string;
    prompt?: string;
    hero?: HeroPayload;
  };

  if (!npcId || !prompt || !hero) {
    return res.status(400).json({ error: 'npcId, prompt, and hero payload are required.' });
  }

  const reply = createOracleResponse(npcId, prompt, {
    name: hero.name,
    // Fallback metrics structure if not provided.
    metrics: {
      stress: hero.metrics?.stress ?? 0,
      wounds: hero.metrics?.wounds ?? 0,
      influence: hero.metrics?.influence ?? 0,
      corruption: hero.metrics?.corruption ?? 0
    },
    flags: hero.flags ?? {}
  });

  res.json({ reply });
});

const clientDistCandidates = [
  path.resolve(__dirname, '../../../client/dist'),
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist')
];

const clientDistPath = clientDistCandidates.find((candidate) =>
  fs.existsSync(candidate)
);

if (clientDistPath) {
  app.use(express.static(clientDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Emberfall server listening on port ${port}`);
});

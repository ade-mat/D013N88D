import { Router } from 'express';
// Rate limiting middleware
import rateLimit from 'express-rate-limit';
import type { GameStateSnapshot } from '../../../shared/types.js';
import {
  getFirestore,
  isFirebaseAdminReady,
  serverTimestamp
} from '../lib/firebaseAdmin.js';
import { requireFirebaseAuth } from '../middleware/firebaseAuth.js';

interface ProgressDocument {
  state: GameStateSnapshot;
  updatedAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
}

const router = Router();

// Set up rate limiter: maximum 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP/user to 100 requests per windowMs
});

const isValidState = (candidate: unknown): candidate is GameStateSnapshot => {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }
  const value = candidate as Partial<GameStateSnapshot>;
  return (
    'currentSceneId' in value &&
    'log' in value &&
    'visitedScenes' in value &&
    'conversation' in value
  );
};

router.use(requireFirebaseAuth);
router.use(limiter);
router.get('/', async (req, res) => {
  if (!isFirebaseAdminReady()) {
    return res.status(503).json({ error: 'Persistence backend unavailable.' });
  }

  const firestore = getFirestore();
  const uid = req.firebaseUser?.uid;

  if (!firestore || !uid) {
    return res.status(503).json({ error: 'Persistence backend unavailable.' });
  }

  try {
    const docRef = firestore.collection(collectionName).doc(uid);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'No saved progress.' });
    }
    const data = snapshot.data() as ProgressDocument | undefined;
    if (!data?.state) {
      return res.status(404).json({ error: 'No saved progress.' });
    }
    return res.json(data.state);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve progress.' });
  }
});

router.post('/', async (req, res) => {
  if (!isFirebaseAdminReady()) {
    return res.status(503).json({ error: 'Persistence backend unavailable.' });
  }

  const firestore = getFirestore();
  const uid = req.firebaseUser?.uid;

  if (!firestore || !uid) {
    return res.status(503).json({ error: 'Persistence backend unavailable.' });
  }

  const payload = req.body;
  if (!isValidState(payload)) {
    return res.status(400).json({ error: 'Invalid progress payload.' });
  }

  try {
    const docRef = firestore.collection(collectionName).doc(uid);
    const document: ProgressDocument = {
      state: payload,
      updatedAt: serverTimestamp()
    };
    await docRef.set(document);
    return res.status(204).end();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save progress.' });
  }
});

router.delete('/', async (req, res) => {
  if (!isFirebaseAdminReady()) {
    return res.status(503).json({ error: 'Persistence backend unavailable.' });
  }

  const firestore = getFirestore();
  const uid = req.firebaseUser?.uid;

  if (!firestore || !uid) {
    return res.status(503).json({ error: 'Persistence backend unavailable.' });
  }

  try {
    await firestore.collection(collectionName).doc(uid).delete();
    return res.status(204).end();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete progress.' });
  }
});

export default router;

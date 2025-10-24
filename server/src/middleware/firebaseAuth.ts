import type { NextFunction, Request, Response } from 'express';
import { getFirebaseAuth, isFirebaseAdminReady } from '../lib/firebaseAdmin.js';

declare module 'express-serve-static-core' {
  interface Request {
    firebaseUser?: import('firebase-admin').auth.DecodedIdToken;
  }
}

const extractBearerToken = (headerValue: string | undefined): string | null => {
  if (!headerValue) {
    return null;
  }
  const [scheme, value] = headerValue.split(' ');
  if (!value || scheme.toLowerCase() !== 'bearer') {
    return null;
  }
  return value.trim();
};

export const requireFirebaseAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isFirebaseAdminReady()) {
    return res.status(503).json({ error: 'Authentication service unavailable.' });
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    return res.status(503).json({ error: 'Authentication service unavailable.' });
  }

  const token = extractBearerToken(req.header('Authorization'));
  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token.' });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.firebaseUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

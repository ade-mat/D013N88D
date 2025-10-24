import type { GamePersistence, StoredState } from '@/hooks/useGameEngine';

type TokenProvider = () => Promise<string | null>;

const apiRequest = async <T>(
  tokenProvider: TokenProvider,
  input: RequestInfo,
  init: RequestInit & { expectJson?: boolean; tolerateNotFound?: boolean } = {}
): Promise<T | null> => {
  const token = await tokenProvider();
  if (!token) {
    throw new Error('Authentication token unavailable.');
  }

  const { expectJson = true, tolerateNotFound = false, ...requestInit } = init;

  const response = await fetch(input, {
    ...requestInit,
    headers: {
      ...(requestInit.headers ?? {}),
      Authorization: `Bearer ${token}`,
      ...(requestInit.body ? { 'Content-Type': 'application/json' } : {})
    },
    credentials: 'include'
  });

  if (response.status === 404 && tolerateNotFound) {
    return null;
  }

  if (!response.ok) {
    const message =
      (expectJson ? await response.text().catch(() => null) : null) ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!expectJson) {
    return null;
  }

  return (await response.json()) as T;
};

export const createRemotePersistence = (
  tokenProvider: TokenProvider
): GamePersistence => ({
  async load() {
    const payload = await apiRequest<StoredState>(tokenProvider, '/api/progress', {
      method: 'GET',
      tolerateNotFound: true
    });
    return payload ?? null;
  },
  async save(state) {
    await apiRequest<void>(tokenProvider, '/api/progress', {
      method: 'POST',
      body: JSON.stringify(state),
      expectJson: false
    });
  },
  async clear() {
    await apiRequest<void>(tokenProvider, '/api/progress', {
      method: 'DELETE',
      expectJson: false,
      tolerateNotFound: true
    });
  }
});

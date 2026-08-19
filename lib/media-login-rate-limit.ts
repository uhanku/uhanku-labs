const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const attempts = new Map<string, { failures: number; resetAt: number }>();

function pruneExpired(now: number) {
  if (attempts.size < 1000) return;

  for (const [key, value] of attempts) {
    if (value.resetAt <= now) attempts.delete(key);
  }
}

export function canAttemptMediaLogin(key: string) {
  const now = Date.now();
  pruneExpired(now);
  const record = attempts.get(key);

  if (!record || record.resetAt <= now) {
    attempts.delete(key);
    return true;
  }

  return record.failures < MAX_FAILURES;
}

export function recordMediaLoginFailure(key: string) {
  const now = Date.now();
  const existing = attempts.get(key);

  if (!existing || existing.resetAt <= now) {
    attempts.set(key, { failures: 1, resetAt: now + WINDOW_MS });
    return;
  }

  existing.failures += 1;
}

export function clearMediaLoginFailures(key: string) {
  attempts.delete(key);
}

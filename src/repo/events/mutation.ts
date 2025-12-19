import type { EventLogRequest } from './types';

export async function logEvent(payload: EventLogRequest) {
  if (typeof window === 'undefined') return;
  const body = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    const blob = new Blob([body], { type: 'application/json' });
    const sent = navigator.sendBeacon('/api/events', blob);
    if (sent) return;
  }

  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body,
    });
  } catch {}
}

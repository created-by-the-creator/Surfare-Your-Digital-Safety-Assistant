import { useEffect, useState } from 'react';

// Not precached: a cached app shell must not count as a working connection.
export async function probeConnection(signal) {
  const url = new URL(`${import.meta.env.BASE_URL}connection.txt`, window.location.origin);
  url.searchParams.set('check', Date.now());
  const response = await fetch(url, { cache: 'no-store', signal });
  return response.ok && (await response.text()).trim() === 'surfare-connected';
}

export default function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    let active = true;
    let controller;
    let timeout;
    const check = async () => {
      controller?.abort();
      window.clearTimeout(timeout);
      if (!navigator.onLine) { setIsOnline(false); return; }
      const request = new AbortController();
      controller = request;
      timeout = window.setTimeout(() => request.abort(), 4000);
      try {
        const connected = await probeConnection(request.signal);
        if (active && controller === request) setIsOnline(navigator.onLine && connected);
      } catch {
        if (active && controller === request) setIsOnline(false);
      } finally {
        if (controller === request) window.clearTimeout(timeout);
      }
    };
    const onVisible = () => { if (!document.hidden) void check(); };
    void check();
    const interval = window.setInterval(onVisible, 20000);
    window.addEventListener('online', check);
    window.addEventListener('offline', check);
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      controller?.abort();
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      window.removeEventListener('online', check);
      window.removeEventListener('offline', check);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return isOnline;
}

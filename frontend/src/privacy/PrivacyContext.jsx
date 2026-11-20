import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { clearAcknowledgment, readAcknowledgment, saveAcknowledgment } from './acknowledgment.js';

const PrivacyContext = createContext(null);

function initialAcknowledgment() {
  try { return readAcknowledgment(window.localStorage); } catch { return null; }
}

export function PrivacyProvider({ children }) {
  const [hasAcknowledged, setHasAcknowledged] = useState(() => Boolean(initialAcknowledgment()));
  const acknowledged = useRef(hasAcknowledged);
  const [notice, setNotice] = useState(null);
  const pending = useRef([]);

  const requestAcknowledgment = useCallback(() => {
    if (acknowledged.current) return Promise.resolve(true);
    setNotice('required');
    return new Promise((resolve) => pending.current.push(resolve));
  }, []);

  const reviewNotice = useCallback(() => setNotice('review'), []);
  const finishNotice = useCallback((accepted) => {
    if (accepted) {
      try { saveAcknowledgment(window.localStorage); } catch { /* Keep the choice for this session. */ }
      acknowledged.current = true;
      setHasAcknowledged(true);
    }
    setNotice(null);
    pending.current.splice(0).forEach((resolve) => resolve(accepted));
  }, []);

  const resetAcknowledgment = useCallback(() => {
    try { clearAcknowledgment(window.localStorage); } catch { /* Keep the reset for this session. */ }
    acknowledged.current = false;
    setHasAcknowledged(false);
    setNotice(null);
    pending.current.splice(0).forEach((resolve) => resolve(false));
  }, []);

  const value = useMemo(() => ({
    hasAcknowledged, notice, requestAcknowledgment, reviewNotice, finishNotice, resetAcknowledgment,
  }), [hasAcknowledged, notice, requestAcknowledgment, reviewNotice, finishNotice, resetAcknowledgment]);

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacyNotice() {
  return useContext(PrivacyContext);
}

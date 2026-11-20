export const NOTICE_VERSION = '2026-11-19.1';
export const ACKNOWLEDGMENT_KEY = 'surfare-privacy-acknowledgment';

export function readAcknowledgment(storage) {
  try {
    const record = JSON.parse(storage.getItem(ACKNOWLEDGMENT_KEY));
    return record?.version === NOTICE_VERSION && typeof record.acceptedAt === 'string'
      && Number.isFinite(Date.parse(record.acceptedAt)) ? record : null;
  } catch {
    return null;
  }
}

export function saveAcknowledgment(storage) {
  const record = { version: NOTICE_VERSION, acceptedAt: new Date().toISOString() };
  try { storage.setItem(ACKNOWLEDGMENT_KEY, JSON.stringify(record)); } catch { /* Session-only when storage is unavailable. */ }
  return record;
}

export function clearAcknowledgment(storage) {
  try { storage.removeItem(ACKNOWLEDGMENT_KEY); } catch { /* Storage may be blocked. */ }
}

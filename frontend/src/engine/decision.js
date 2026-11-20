const THRESHOLDS = Object.freeze({
  suspicious: 3,
  high: 8,
});

export function decideRisk(signals, content, options = {}) {
  const score = signals.reduce((sum, signal) => sum + signal.weight, 0);
  const enoughContent = typeof content === 'string' && content.trim().length >= 12;
  const hasCredentialAndPressure =
    signals.some((signal) => ['otp_request', 'credential_request'].includes(signal.id)) &&
    signals.some((signal) => ['urgency', 'threat_loss'].includes(signal.id));

  let level = 'low';
  if (!enoughContent) level = 'unknown';
  else if (options.onlineUnavailable && signals.length === 0) level = 'unknown';
  else if (options.onlineMatch || hasCredentialAndPressure || score >= THRESHOLDS.high) {
    level = 'high';
  } else if (score >= THRESHOLDS.suspicious) {
    level = 'suspicious';
  }

  return {
    level,
    score,
    signals,
    usedOnline: Boolean(options.onlineMatch),
    onlineUnavailable: Boolean(options.onlineUnavailable),
    summaryKey: options.onlineMatch ? 'summary_online' : 'summary_local',
    checkedText: content,
  };
}

export { THRESHOLDS };

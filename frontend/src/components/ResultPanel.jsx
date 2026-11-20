import { useEffect, useId, useRef, useState } from 'react';
import {
  Download,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { ASSETS, MASCOT_BY_STATE } from '../assets.js';

const LEVEL_KEYS = {
  low: 'low',
  suspicious: 'suspicious',
  high: 'high',
  unknown: 'unknown',
};

const LEVEL_MASCOTS = {
  low: MASCOT_BY_STATE.low,
  suspicious: ASSETS.iconWarning,
  high: ASSETS.surfyAlarm,
  unknown: MASCOT_BY_STATE.notEnoughInfo,
};

function warningSummary(result, t) {
  const warningCount = result.signals.filter((signal) => signal.id !== 'online_match').length;
  if (!warningCount) return t('result.summary.none');
  const type = result.summaryKey === 'summary_online' ? 'online' : 'local';
  const number = warningCount === 1 ? 'one' : 'many';
  return t(`result.summary.${type}.${number}`, { count: warningCount });
}

function saveReport(result, t, includeContent) {
  const level = LEVEL_KEYS[result.level] ?? 'unknown';
  const lines = [
    t('report.title'),
    t('report.result', { level: t(`result.${level}`) }),
    warningSummary(result, t),
    '',
    t('report.warningSigns'),
    ...(result.signals.length
      ? result.signals.map((signal) => `- ${t(`signal.${signal.id}`)}${signal.evidence ? ` (${signal.evidence})` : ''}`)
      : [`- ${t('report.noWarnings')}`]),
    '',
    t('report.safeNextStep'),
    t(`result.advice.${level}`),
    '',
    t('report.created', { date: new Date().toLocaleString() }),
  ];
  if (includeContent && result.checkedText) {
    lines.push('', t('report.checkedContent'), result.checkedText);
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'surfare-check-report.txt';
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildHighlightSegments(text, result) {
  const source = String(text || '');
  const evidenceRanges = [];
  const signals = result?.aiStatus === 'completed' && Array.isArray(result?.geminiIndicators)
    ? result.geminiIndicators
    : Array.isArray(result?.signals)
      ? result.signals
      : [];

  function addEvidence(signal, evidence) {
    if (typeof evidence !== 'string' || evidence.length < 2) return;
    const needle = evidence.trim();
    if (!needle) return;
    const lowerSource = source.toLowerCase();
    const lowerNeedle = needle.toLowerCase();
    let start = 0;
    while (start <= source.length) {
      const index = lowerSource.indexOf(lowerNeedle, start);
      if (index < 0) break;
      evidenceRanges.push({ start: index, end: index + needle.length, signal });
      start = index + needle.length;
    }
  }

  signals.forEach((signal) => {
    if (signal?.evidence) addEvidence(signal, signal.evidence);
  });
  if (result?.matchedPhrase) addEvidence({ id: 'matched_phrase', evidence: result.matchedPhrase }, result.matchedPhrase);

  if (!evidenceRanges.length) {
    return source ? [{ text: source, signals: [] }] : [];
  }

  evidenceRanges.sort((left, right) => left.start - right.start || left.end - right.end);
  const merged = [];
  evidenceRanges.forEach((range) => {
    const previous = merged.at(-1);
    if (previous && range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end);
      if (!previous.signals.some((signal) => signal.id === range.signal.id)) {
        previous.signals.push(range.signal);
      }
      return;
    }
    merged.push({ start: range.start, end: range.end, signals: [range.signal] });
  });

  const segments = [];
  let cursor = 0;
  merged.forEach((range) => {
    if (range.start > cursor) {
      segments.push({ text: source.slice(cursor, range.start), signals: [] });
    }
    segments.push({
      text: source.slice(range.start, range.end),
      signals: range.signals,
    });
    cursor = range.end;
  });
  if (cursor < source.length) segments.push({ text: source.slice(cursor), signals: [] });
  return segments;
}

function getUnknownReasons(result) {
  if (result.reasonKeys?.length) return result.reasonKeys;
  const text = String(result.checkedText || '').trim();
  const reasons = [];
  if (text.length < 20) reasons.push('result.unknown.reason.littleText');
  if (!/(https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})/i.test(text)) {
    reasons.push('result.unknown.reason.noLink');
  }
  if (result.signals.length === 0) reasons.push('result.unknown.reason.noSignals');
  return reasons;
}

export default function ResultPanel({ status, result, errorKey, t, onReset }) {
  const [includeContent, setIncludeContent] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const titleId = useId();
  const reportPopoverId = useId();
  const reportPopoverRef = useRef(null);
  const level = result ? (LEVEL_KEYS[result.level] ?? 'unknown') : 'low';
  const showResult = status === 'result' && result;
  const warningCount = result?.signals?.filter((signal) => signal.id !== 'online_match').length ?? 0;
  const isUnknown = Boolean(showResult && level === 'unknown');
  const isHighlightedSample = Boolean(result?.matchedPhrase);
  const riskDescriptionLevel = level === 'suspicious' ? 'medium' : level;
  const unknownReasons = isUnknown ? getUnknownReasons(result) : [];
  const mascot = result ? LEVEL_MASCOTS[level] : MASCOT_BY_STATE.ready.mascot;

  useEffect(() => {
    setIncludeContent(false);
    setIsReportOpen(false);
    setSelectedSignal(null);
  }, [result?.checkedText]);

  useEffect(() => {
    if (!isReportOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!reportPopoverRef.current?.contains(event.target)) setIsReportOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsReportOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isReportOpen]);

  const stateTitle = showResult
    ? t(`result.${level}`)
    : status === 'analyzing'
      ? t('result.loading')
      : status === 'error'
        ? t('result.error')
        : t('result.ready');
  const summary = showResult
    ? isUnknown
      ? t('result.unknown.subtitle')
      : result.datasetIntent
        ? t('result.datasetSummary', { intent: result.datasetIntent })
      : warningCount
        ? warningSummary(result, t)
        : t('result.summary.none')
    : status === 'error'
      ? t(errorKey || 'error.analysis')
      : status === 'analyzing'
        ? t('result.loading')
        : t('result.ready.subtitle');
  const meterLabel = showResult
    ? isUnknown
      ? t('result.meter.unknown')
      : t(`result.meter.${level}`)
    : t('result.ready');

  return (
    <div className="result-column">
      <section
        className={`result-panel result-${showResult ? level : status}`}
        aria-labelledby={titleId}
        aria-live="polite"
        aria-busy={status === 'analyzing'}
      >
        <div className="result-content">
          <div className="result-cap"><h2>{t('result.title')}</h2></div>
          <div className="result-body">
            <div className={`result-heading ${showResult ? `result-heading-${level}` : 'result-heading-idle'}`}>
              {showResult ? (
                <div className={`result-state-tile tile-${level}`}>
                  {level === 'low' && <ShieldCheck aria-hidden="true" />}
                  {level === 'suspicious' && <img src={ASSETS.iconWarning} alt="" />}
                  {level === 'high' && <img src={ASSETS.iconAlert} alt="" />}
                  {level === 'unknown' && <HelpCircle aria-hidden="true" />}
                </div>
              ) : (
                <span className="result-ready-icon" aria-hidden="true"><ShieldCheck /></span>
              )}
              <div className="result-title-copy">
                <h3 id={titleId} className="result-state-title">{stateTitle}</h3>
                <p className="result-prompt">{summary}</p>
              </div>
            </div>

            {status === 'analyzing' && (
              <div className="result-loading" role="status">
                <span className="loading-orbit" aria-hidden="true" />
                <p>{t('result.loading')}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="result-error" role="alert">
                <button type="button" className="result-secondary-button" onClick={onReset}>
                  <RotateCcw size={17} aria-hidden="true" />
                  {t('check.new')}
                </button>
              </div>
            )}

            {showResult && !isUnknown && (
              <div className={`risk-meter-wrap meter-position-${level}`}>
                <div
                  className="risk-meter has-risk-result"
                  role="img"
                  aria-label={`${t('result.riskLevel')}: ${meterLabel}`}
                >
                  <span className="meter-segment meter-segment-low" />
                  <span className="meter-segment meter-segment-suspicious" />
                  <span className="meter-segment meter-segment-high" />
                  <span className="meter-indicator" aria-hidden="true" />
                </div>
                <div className="risk-meter-labels" aria-hidden="true">
                  <span className={level === 'low' ? 'is-active' : ''}>{t('result.meter.low')}</span>
                  <span className={level === 'suspicious' ? 'is-active' : ''}>{t('result.meter.suspicious')}</span>
                  <span className={level === 'high' ? 'is-active' : ''}>{t('result.meter.high')}</span>
                </div>
                <div className="risk-level-description">
                  <strong>{t(`result.description.${riskDescriptionLevel}.title`)}</strong>
                  <p>{t(`result.description.${riskDescriptionLevel}.body`)}</p>
                </div>
              </div>
            )}
            {isUnknown && (
              <div className="unknown-meter-description">
                <p className="unknown-meter-note">{t('result.unknown.unplaced')}</p>
                <div className="risk-level-description">
                  <strong>{t('result.description.unknown.title')}</strong>
                  <p>{t('result.description.unknown.body')}</p>
                </div>
              </div>
            )}

            {showResult && (
              <div className={`result-details ${isUnknown ? 'result-details-unknown' : ''}`}>
                <div className="reference-message-layout">
                  <img
                    className="reference-mascot"
                    src={mascot}
                    alt=""
                    width="1000"
                    height="1000"
                    decoding="async"
                  />
                  <details className="result-accordion checked-accordion">
                      <summary>{t('result.viewChecked')}</summary>
                      <div className="checked-content">
                        {buildHighlightSegments(result.checkedText || t('result.insufficient'), result).map((segment, index) =>
                          segment.signals.length ? (
                            <button
                              type="button"
                              className="checked-highlight"
                              key={`${segment.text}-${index}`}
                              onClick={() => setSelectedSignal(segment.signals[0])}
                              aria-label={`${t('result.whyFlagged')}: ${segment.text}`}
                            >
                              {segment.text}
                            </button>
                          ) : (
                            <span key={`${segment.text}-${index}`}>{segment.text}</span>
                          ),
                        )}
                        {selectedSignal && (
                          <div className="highlight-explanation" role="region" aria-label={t('result.whyFlagged')}>
                            <strong>{t('result.whyFlagged')}</strong>
                            <p>
                              {selectedSignal.explanation ||
                                result.detectorIndicators?.find((indicator) => indicator.id === selectedSignal.id)?.message ||
                                t(`signal.${selectedSignal.id}`)}
                            </p>
                            {selectedSignal.evidence && (
                              <blockquote>{String(selectedSignal.evidence)}</blockquote>
                            )}
                          </div>
                        )}
                      </div>
                    </details>
                </div>

                {showResult && (
                  <div className="what-to-do-panel">
                    <div className="what-to-do-copy">
                      <h3>
                        <Lightbulb className="what-to-do-icon" aria-hidden="true" />
                        {t(level === 'low'
                          ? 'result.nextTitleLow'
                          : 'result.nextTitle')}
                      </h3>
                      <p>{t(level === 'low'
                        ? 'result.nextIntroLow'
                        : 'result.nextIntro')}</p>
                      <ul>
                        <li>{t(level === 'low'
                          ? 'result.nextPointLow1'
                          : level === 'high'
                            ? 'result.nextPointHigh1'
                            : 'result.nextPointSuspicious1')}</li>
                        <li>{t(level === 'low'
                          ? 'result.nextPointLow2'
                          : level === 'high'
                            ? 'result.nextPointHigh2'
                            : 'result.nextPointSuspicious2')}</li>
                        <li>{t(level === 'low'
                          ? 'result.nextPointLow3'
                          : level === 'high'
                            ? 'result.nextPointHigh3'
                            : 'result.nextPointSuspicious3')}</li>
                      </ul>
                    </div>
                    <img className="what-to-do-mascot" src={ASSETS.surfyTablet} alt="" width="1000" height="1000" />
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="result-footer">
            <span className="result-team"><ShieldCheck aria-hidden="true" />{t('result.team')}</span>
            {showResult && <div className="report-control" ref={reportPopoverRef}>
              {isReportOpen && showResult && (
                <div className="result-save-popover" id={reportPopoverId} role="dialog" aria-label={t('result.saveReport')}>
                  <label>
                    <input
                      type="checkbox"
                      checked={includeContent}
                      onChange={(event) => setIncludeContent(event.target.checked)}
                    />
                    {t('result.includeContent')}
                  </label>
                  <button type="button" onClick={() => {
                    saveReport(result, t, includeContent);
                    setIsReportOpen(false);
                  }}>
                    <Download aria-hidden="true" />
                    {t('result.download')}
                  </button>
                </div>
              )}
              <button
                className="result-save-button"
                type="button"
                disabled={!showResult}
                aria-expanded={isReportOpen}
                aria-controls={reportPopoverId}
                onClick={() => setIsReportOpen((open) => !open)}
              >
                <Download aria-hidden="true" />
                {t('result.saveReport')}
              </button>
            </div>}
          </footer>
        </div>
      </section>
    </div>
  );
}

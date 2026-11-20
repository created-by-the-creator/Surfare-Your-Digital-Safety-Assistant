import { describe, expect, it } from 'vitest';
import { buildHighlightSegments } from './ResultPanel.jsx';

describe('checked-message highlights', () => {
  it('builds clickable segments for warning evidence', () => {
    const segments = buildHighlightSegments(
      'Send your OTP now. Your account will be blocked today.',
      {
        signals: [
          { id: 'otp_request', evidence: 'OTP' },
          { id: 'threat_loss', evidence: 'blocked today' },
        ],
      },
    );
    expect(segments.filter((segment) => segment.signals.length).map((segment) => segment.text)).toEqual([
      'OTP',
      'blocked today',
    ]);
  });

  it('does not highlight ordinary text without evidence', () => {
    const segments = buildHighlightSegments('The school meeting is tomorrow.', { signals: [] });
    expect(segments).toEqual([
      { text: 'The school meeting is tomorrow.', signals: [] },
    ]);
  });

  it('uses exact Gemini quotes instead of broad local evidence', () => {
    const segments = buildHighlightSegments(
      'Delikado na pati anak mo pag di ka nagpadala ng pera.',
      {
        aiStatus: 'completed',
        geminiIndicators: [{
          evidence: 'pag di ka nagpadala ng pera',
          explanation: 'This condition uses a money payment to threaten danger to the child.',
        }],
        signals: [{
          evidence: 'Delikado na pati anak mo pag di ka nagpadala ng pera',
          explanation: 'generic combined evidence',
        }],
      },
    );
    expect(segments.filter((segment) => segment.signals.length).map((segment) => segment.text))
      .toEqual(['pag di ka nagpadala ng pera']);
  });

  it('preserves backend explanation on exact local evidence', () => {
    const segments = buildHighlightSegments(
      'Delikado na pati anak mo pag di ka nagpadala ng pera.',
      {
        signals: [{
          id: 'extortion',
          evidence: 'Delikado na pati anak mo',
          explanation: 'This wording warns that the child may face danger.',
        }],
      },
    );
    expect(segments.find((segment) => segment.signals.length).signals[0].explanation)
      .toBe('This wording warns that the child may face danger.');
  });
});

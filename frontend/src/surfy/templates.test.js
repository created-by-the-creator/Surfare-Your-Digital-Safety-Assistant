import { describe, expect, it } from 'vitest';
import { translate } from '../i18n/useI18n.js';
import { getApplicableSurfyQuestionKeys, getSurfyAnswer } from './templates.js';

describe('Ask Surfy topic matching', () => {
  const english = (key) => translate('en', key);

  it('does not mistake "Does" for the next-step keyword "do"', () => {
    expect(getSurfyAnswer('Does this work offline?', null, english)).toBe(english('ask.offline.answer'));
  });

  it.each(['en', 'tl', 'taglish'])('answers the matching suggested topic in %s', (language) => {
    const t = (key) => translate(language, key);
    expect(getSurfyAnswer(t('ask.offline'), null, t)).toBe(t('ask.offline.answer'));
    expect(getSurfyAnswer(t('ask.photo'), null, t)).toBe(t('ask.photo.answer'));
    expect(getSurfyAnswer(t('ask.uncertain'), null, t)).toBe(t('result.insufficient'));
  });

  it('asks for a check before explaining warnings, then explains real signals', () => {
    expect(getSurfyAnswer(english('ask.why'), null, english)).toBe(english('ask.noResult'));
    expect(getSurfyAnswer(english('ask.next'), null, english)).toBe(english('ask.noResult'));
    expect(getSurfyAnswer(english('ask.why'), { signals: [{ id: 'urgency' }] }, english)).toBe(english('signal.urgency'));
  });

  it('shows only questions applicable to the submitted input type', () => {
    expect(getApplicableSurfyQuestionKeys({ inputType: 'text' }))
      .not.toContain('ask.photo');
    expect(getApplicableSurfyQuestionKeys({ inputType: 'text' }))
      .not.toContain('ask.link');
    expect(getApplicableSurfyQuestionKeys({ inputType: 'image' }))
      .toContain('ask.photo');
    expect(getApplicableSurfyQuestionKeys({ inputType: 'links' }))
      .toContain('ask.link');
  });

  it('uses exact Gemini evidence when explaining a Gemini-checked result', () => {
    const result = {
      geminiIndicators: [{
        evidence: 'send your OTP',
        explanation: 'The sender asks for a secret code.',
      }],
    };
    expect(getSurfyAnswer(english('ask.why'), result, english))
      .toBe('The sender asks for a secret code. Specific text: "send your OTP"');
  });
});

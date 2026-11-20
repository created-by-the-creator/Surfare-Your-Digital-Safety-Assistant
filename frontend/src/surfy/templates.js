export const SURFY_QUESTION_KEYS = [
  'ask.why',
  'ask.next',
  'ask.offline',
  'ask.photo',
  'ask.uncertain',
  'ask.link',
];

export function getApplicableSurfyQuestionKeys(result) {
  const type = result?.inputType;
  if (type === 'links') {
    return ['ask.why', 'ask.next', 'ask.link', 'ask.uncertain', 'ask.offline'];
  }
  if (type === 'qr') {
    const keys = ['ask.why', 'ask.next', 'ask.uncertain', 'ask.offline'];
    if (result?.checkedText && /https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,}/i.test(result.checkedText))
      keys.splice(2, 0, 'ask.link');
    return keys;
  }
  if (type === 'image') {
    return ['ask.why', 'ask.next', 'ask.photo', 'ask.uncertain', 'ask.offline'];
  }
  return ['ask.why', 'ask.next', 'ask.uncertain', 'ask.offline'];
}

const QUESTION_MATCHERS = [
  { key: 'ask.why', words: ['why', 'flagged', 'warning', 'bakit', 'mark', 'suspicious'] },
  { key: 'ask.next', words: ['what', 'do', 'now', 'should', 'gagawin', 'next', 'action'] },
  { key: 'ask.link', words: ['link', 'safe', 'open', 'click', 'bukas', 'ligtas'] },
  { key: 'ask.offline', words: ['offline', 'internet', 'online', 'connection', 'walang net'] },
  { key: 'ask.photo', words: ['photo', 'picture', 'image', 'keep', 'save', 'sine-save', 'larawan'] },
  { key: 'ask.uncertain', words: ['sure', 'certain', 'unsure', 'not sure', 'sigurado', 'uncertain'] },
];

function normalizeQuestion(question) {
  return question.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function findQuestionKey(question, t) {
  const normalized = normalizeQuestion(question);
  const exact = SURFY_QUESTION_KEYS.find((key) => normalizeQuestion(t(key)) === normalized);
  if (exact) return exact;
  const searchable = ` ${normalized} `;
  const best = QUESTION_MATCHERS
    .map(({ key, words }) => ({
      key,
      score: words.reduce((score, word) => score + (searchable.includes(` ${normalizeQuestion(word)} `) ? 1 : 0), 0),
    }))
    .sort((left, right) => right.score - left.score)[0];
  return best?.score ? best.key : null;
}

export function getSurfyAnswer(question, result, t) {
  const key = findQuestionKey(question, t);
  if (!key) return t('ask.fallback');
  if (!result && (key === 'ask.why' || key === 'ask.next')) return t('ask.noResult');

  if (key === 'ask.why') {
    if (result?.geminiIndicators?.length) {
      const aiExplanation = result.geminiIndicators
        .map((indicator) => indicator.explanation)
        .filter(Boolean)
        .join(' ');
      const aiEvidence = result.geminiIndicators
        .filter((indicator) => indicator.evidence)
        .map((indicator) => `Specific text: "${indicator.evidence}"`)
        .join(' ');
      if (aiExplanation) return `${aiExplanation} ${aiEvidence}`.trim();
    }
    if (result?.detectorIndicators?.length) {
      return result.detectorIndicators
        .map((indicator) => indicator.message || indicator.title)
        .filter(Boolean)
        .concat(
          result.detectorIndicators
            .filter((indicator) => indicator.evidence)
            .map((indicator) => `Specific text: "${indicator.evidence}"`),
        )
        .join(' ');
    }
    const indicators = result?.signals?.map((signal) => t(`signal.${signal.id}`)).filter(Boolean);
    return indicators?.length
      ? indicators.join(' ')
      : t('result.summary.none');
  }
  if (key === 'ask.next') return result?.level === 'low' ? t('risk.low.description') : t('result.advice');
  if (key === 'ask.link') {
    return result?.level === 'low'
      ? t('ask.link.low')
      : t('ask.link.caution');
  }
  if (key === 'ask.offline') return t('ask.offline.answer');
  if (key === 'ask.photo') return t('ask.photo.answer');
  return t('result.insufficient');
}

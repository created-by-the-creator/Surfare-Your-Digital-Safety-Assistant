import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CameraModal from './components/CameraModal.jsx';
import CheckCard from './components/CheckCard.jsx';
import FeedbackModal from './components/FeedbackModal.jsx';
import Footer from './components/Footer.jsx';
import Hero from './components/Hero.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import Navbar from './components/Navbar.jsx';
import ResultPanel from './components/ResultPanel.jsx';
import RiskLevels from './components/RiskLevels.jsx';
import { analyzeInput } from './engine/analyze.js';
import { getSurfyAnswer } from './surfy/templates.js';
import { htmlLanguage, translate } from './i18n/useI18n.js';
import useScrollReveal from './useScrollReveal.js';
import useFluidMotion from './useFluidMotion.js';
import { usePrivacyNotice } from './privacy/PrivacyContext.jsx';
import WelcomeExperience from './components/WelcomeExperience.jsx';
import useConnectionStatus from './useConnectionStatus.js';

const LANGUAGES = ['en', 'tl', 'taglish'];

const DEMO_CASES = {
  low: {
    tab: 'text',
    message: 'Your appointment is confirmed for tomorrow at 10 AM. Details: https://example.com/appointment',
    level: 'low',
    score: 1,
    signals: [
      { id: 'link_in_message', severity: 1, weight: 1, evidence: 'https://example.com/appointment' },
    ],
  },
  suspicious: {
    tab: 'text',
    message: 'Provide us with the details we sent you and Give me your money and account details.',
    level: 'suspicious',
    score: 6,
    signals: [
      { id: 'urgency', severity: 2, weight: 2 },
      { id: 'link_mismatch', severity: 3, weight: 3 },
      { id: 'otp_request', severity: 3, weight: 4 },
      { id: 'threat_loss', severity: 2, weight: 2 },
      { id: 'online_match', severity: 3, weight: 8, evidence: 'sample online lookup' },
    ],
    matchedPhrase: 'Give me your money and account details.',
    isDemoSuspicious: true,
  },
  high: {
    tab: 'text',
    message: 'Your GCash account will be blocked today. Send your OTP now to keep access.',
    level: 'high',
    score: 9,
    signals: [
      { id: 'urgency', severity: 2, weight: 2, evidence: 'today' },
      { id: 'otp_request', severity: 3, weight: 4, evidence: 'OTP' },
      { id: 'credential_request', severity: 3, weight: 3, evidence: 'account' },
    ],
  },
  unknown: {
    tab: 'text',
    message: 'Hi.',
    level: 'unknown',
    score: 0,
    signals: [],
    reasonKeys: [
      'result.unknown.reason.littleText',
      'result.unknown.reason.noLink',
      'result.unknown.reason.noSignals',
    ],
  },
  'ask-chat': {
    tab: 'text',
    message: 'Your GCash account will be blocked today. Send your OTP now to keep access.',
    level: 'suspicious',
    score: 6,
    signals: [
      { id: 'urgency', severity: 2, weight: 2 },
      { id: 'otp_request', severity: 3, weight: 4 },
      { id: 'credential_request', severity: 3, weight: 3 },
    ],
  },
  links: {
    tab: 'links',
    inputs: { url: 'gcash.login-example.xyz/verify' },
    level: 'suspicious',
    score: 5,
    signals: [
      { id: 'brand_in_subdomain_not_domain', severity: 3, weight: 3, evidence: 'gcash.login-example.xyz' },
      { id: 'risky_tld', severity: 2, weight: 2, evidence: '.xyz' },
    ],
  },
  qr: {
    tab: 'qr',
    inputs: { qrValue: 'https://gcash.login-example.xyz/verify' },
    level: 'high',
    score: 8,
    signals: [
      { id: 'brand_in_subdomain_not_domain', severity: 3, weight: 3, evidence: 'gcash.login-example.xyz' },
      { id: 'risky_tld', severity: 2, weight: 2, evidence: '.xyz' },
      { id: 'online_match', severity: 3, weight: 8, evidence: 'sample offline demo' },
    ],
  },
  error: {
    tab: 'qr',
    inputs: {},
    level: 'unknown',
    score: 0,
    signals: [],
    errorKey: 'error.qr_missing',
  },
};

const DEMO_ALIASES = {
  ask: 'suspicious',
  autoask: 'suspicious',
  feedback: 'suspicious',
};

function useInitialLanguage() {
  try {
    const savedLanguage = window.localStorage.getItem('surfare-language');
    return LANGUAGES.includes(savedLanguage) ? savedLanguage : 'en';
  } catch {
    return 'en';
  }
}

function demoResult(scenario, checkedText) {
  const { level, score, signals } = scenario;
  const usedOnline = signals.some((signal) => signal.id === 'online_match');
  return {
    level,
    score,
    signals,
    usedOnline,
    onlineUnavailable: false,
    summaryKey: usedOnline ? 'summary_online' : 'summary_local',
    checkedText,
    matchedPhrase: scenario.matchedPhrase,
    isDemoSuspicious: scenario.isDemoSuspicious,
    reasonKeys: scenario.reasonKeys,
  };
}

export default function App() {
  useScrollReveal();
  useFluidMotion();
  const { hasAcknowledged, requestAcknowledgment } = usePrivacyNotice();
  const [lang, setLang] = useState(useInitialLanguage);
  const t = useCallback((key, values) => translate(lang, key, values), [lang]);
  const isOnline = useConnectionStatus();
  const [activeTab, setActiveTab] = useState('text');
  const [offlineOnly, setOfflineOnly] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);
  useEffect(() => { if (!hasAcknowledged) setOfflineOnly(true); }, [hasAcknowledged]);
  const [inputs, setInputs] = useState({
    message: '',
    url: '',
    image: null,
    qr: null,
    qrValue: '',
  });
  const [status, setStatus] = useState('idle');
  const [isCheckUsed, setIsCheckUsed] = useState(false);
  const [result, setResult] = useState(null);
  const [errorKey, setErrorKey] = useState('');
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [surfyOpenRequest, setSurfyOpenRequest] = useState(0);
  const [isAskClosing, setIsAskClosing] = useState(false);
  const [isAskThinking, setIsAskThinking] = useState(false);
  const [askMessages, setAskMessages] = useState([]);
  const [feedbackType, setFeedbackType] = useState('text');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState('');
  const askOpenTimer = useRef(null);
  const askCloseTimer = useRef(null);
  const askAnswerTimer = useRef(null);
  const askAnswerQueue = useRef([]);
  const checkRunId = useRef(0);
  const checkUsedRef = useRef(false);

  useEffect(() => () => {
    window.clearTimeout(askOpenTimer.current);
    window.clearTimeout(askCloseTimer.current);
    window.clearTimeout(askAnswerTimer.current);
  }, []);


  useEffect(() => {
    try { window.localStorage.setItem('surfare-language', lang); } catch { /* Keep the language for this session. */ }
    document.documentElement.lang = htmlLanguage(lang);
  }, [lang]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const demo = new URLSearchParams(window.location.search).get('demo')?.toLowerCase();
    if (demo === 'idle') return;
    const scenarioKey = DEMO_ALIASES[demo] ?? demo;
    const scenario = DEMO_CASES[scenarioKey];
    if (!scenario) return;
    checkUsedRef.current = !scenario.errorKey;
    setIsCheckUsed(!scenario.errorKey);
    setActiveTab(scenario.tab);
    setInputs((previous) => ({
      ...previous,
      ...(scenario.inputs ?? {}),
      ...(scenario.message ? { message: scenario.message } : {}),
    }));
    const result = demoResult(
      scenario,
      scenario.inputs?.url ?? scenario.inputs?.qrValue ?? scenario.message ?? '',
    );
    if (scenario.errorKey) {
      setErrorKey(scenario.errorKey);
      setStatus('error');
    }
    if (demo === 'autoask') {
      const count = scenario.signals.filter((signal) => signal.id !== 'online_match').length;
      setResult(null);
      setStatus('analyzing');
      setIsAskOpen(false);
      const askTimer = window.setTimeout(() => setIsAskOpen(true), 150);
      const resultTimer = window.setTimeout(() => {
        setResult(result);
        setStatus('result');
        setAskMessages([{ role: 'surfy', text: t('ask.greeting', { count }) }]);
      }, 700);
      return () => {
        window.clearTimeout(askTimer);
        window.clearTimeout(resultTimer);
      };
    }
    setResult(result);
    if (!scenario.errorKey) setStatus('result');
    if (demo === 'ask' || demo === 'autoask' || demo === 'ask-chat') {
      const count = scenario.signals.filter((signal) => signal.id !== 'online_match').length;
      const greeting = { role: 'surfy', text: t('ask.greeting', { count }) };
      setAskMessages(demo === 'ask-chat'
        ? [
          greeting,
          { role: 'user', text: t('ask.why') },
          { role: 'surfy', text: t('result.explanation.suspicious') },
          { role: 'user', text: t('ask.next') },
        ]
        : [greeting]);
      setIsAskOpen(true);
    }
    if (demo === 'feedback') {
      setFeedbackType('text');
      setIsFeedbackOpen(true);
    }
  }, []);

  const updateInput = useCallback((key, value) => {
    setInputs((previous) => ({ ...previous, [key]: value }));
  }, []);

  const handleCheck = async () => {
    if (!await requestAcknowledgment()) return;
    if (checkUsedRef.current) return;
    checkUsedRef.current = true;
    setIsCheckUsed(true);
    const runId = ++checkRunId.current;
    window.clearTimeout(askCloseTimer.current);
    setIsAskClosing(false);
    if (!isAskOpen) {
      window.clearTimeout(askOpenTimer.current);
      askOpenTimer.current = window.setTimeout(() => setIsAskOpen(true), 150);
    }
    setStatus('analyzing');
    setErrorKey('');
    try {
      const analysis = await analyzeInput(activeTab, inputs, {
        onlineLookup: !offlineOnly,
        aiEnabled: aiEnabled && !offlineOnly,
      });
      if (runId !== checkRunId.current) return;
      if (analysis.errorKey) {
        setErrorKey(analysis.errorKey);
        setResult(analysis);
        setStatus('error');
        checkUsedRef.current = false;
        setIsCheckUsed(false);
        return;
      }
      setResult(analysis);
      setStatus('result');
      const warningCount = analysis.signals.filter((signal) => signal.id !== 'online_match').length;
      setAskMessages((previous) => [
        ...previous,
        ...(previous.length ? [{ role: 'divider', text: t('ask.newResult') }] : []),
        { role: 'surfy', text: t('ask.greeting', { count: warningCount }) },
      ]);
    } catch (error) {
      if (runId !== checkRunId.current) return;
      console.error('Analysis failed:', error);
      const errorKeys = {
        file_empty: 'error.file_empty',
        file_too_large: 'error.file_too_large',
        file_unsupported: 'error.file_unsupported',
        image_dimensions: 'error.image_dimensions',
        canvas_unavailable: 'error.canvas_unavailable',
      };
      setErrorKey(errorKeys[error?.message] ?? 'error.analysis');
      setStatus('error');
      checkUsedRef.current = false;
      setIsCheckUsed(false);
    }
  };

  const reset = useCallback(() => {
    checkRunId.current += 1;
    checkUsedRef.current = false;
    setIsCheckUsed(false);
    window.clearTimeout(askOpenTimer.current);
    window.clearTimeout(askCloseTimer.current);
    window.clearTimeout(askAnswerTimer.current);
    askAnswerTimer.current = null;
    askAnswerQueue.current = [];
    setActiveTab('text');
    setInputs({ message: '', url: '', image: null, qr: null, qrValue: '' });
    setStatus('idle');
    setResult(null);
    setErrorKey('');
    setAskMessages([]);
    setIsAskOpen(false);
    setIsAskClosing(false);
    setIsAskThinking(false);
  }, []);

  const scheduleAskAnswer = useCallback(() => {
    if (askAnswerTimer.current || !askAnswerQueue.current.length) return;
    const answer = askAnswerQueue.current.shift();
    setIsAskThinking(true);
    askAnswerTimer.current = window.setTimeout(() => {
      askAnswerTimer.current = null;
      setAskMessages((previous) => [...previous, { role: 'surfy', text: answer }]);
      if (askAnswerQueue.current.length) scheduleAskAnswer();
      else setIsAskThinking(false);
    }, 600);
  }, []);
  const handleAskSend = useCallback((question) => {
    setAskMessages((previous) => [...previous, { role: 'user', text: question }]);
    askAnswerQueue.current.push(getSurfyAnswer(question, result, t));
    scheduleAskAnswer();
  }, [result, scheduleAskAnswer, t]);

  const openFeedback = useCallback(async (type = activeTab) => {
    if (!await requestAcknowledgment()) return;
    setFeedbackType(type);
    setIsFeedbackOpen(true);
  }, [activeTab, requestAcknowledgment]);
  const handleNewCheck = useCallback(() => {
    if (status === 'result') {
      const previousTab = activeTab;
      reset();
      openFeedback(previousTab);
      return;
    }
    reset();
  }, [activeTab, openFeedback, reset, status]);
  const closeFeedback = useCallback(() => {
    setIsFeedbackOpen(false);
  }, []);
  const camera = useMemo(
    () => (cameraTarget ? (
      <CameraModal
        t={t}
        target={cameraTarget}
        onCapture={(file, qrValue) => {
          updateInput(cameraTarget, file);
          if (cameraTarget === 'qr') updateInput('qrValue', qrValue);
          setCameraTarget('');
        }}
        onClose={() => setCameraTarget('')}
      />
    ) : null),
    [cameraTarget, t],
  );

  return (
    <WelcomeExperience t={t}>
    <div className="app-bg">
      <Navbar
        lang={lang}
        onLanguageChange={setLang}
        isOnline={isOnline}
        offlineOnly={offlineOnly}
        onOfflineOnlyChange={setOfflineOnly}
        aiEnabled={aiEnabled}
        onAiEnabledChange={setAiEnabled}
        t={t}
      />
      <main>
        <Hero t={t} />
        <CheckCard
          activeTab={activeTab}
          inputs={inputs}
          onTabChange={setActiveTab}
          onInputChange={updateInput}
          onCheck={handleCheck}
          onReset={handleNewCheck}
          onCamera={async (target) => { if (await requestAcknowledgment()) setCameraTarget(target); }}
          isAnalyzing={status === 'analyzing'}
          isCheckUsed={isCheckUsed}
          status={status}
          isAskOpen={isAskOpen}
          isAskClosing={isAskClosing}
          isAskThinking={isAskThinking}
          askMessages={askMessages}
          result={result}
          onAskSend={handleAskSend}
          surfyOpenRequest={surfyOpenRequest}
          feedbackDialog={isFeedbackOpen ? (
            <FeedbackModal
              isOpen={isFeedbackOpen}
              initialType={feedbackType}
              onClose={closeFeedback}
              t={t}
            />
          ) : null}
          t={t}
        >
          <ResultPanel
            status={status}
            result={result}
            errorKey={errorKey}
            t={t}
            onReset={reset}
          />
        </CheckCard>
        <HowItWorks t={t} />
        <RiskLevels t={t} />
      </main>
      <Footer t={t} />
      {camera}
    </div>
    </WelcomeExperience>
  );
}

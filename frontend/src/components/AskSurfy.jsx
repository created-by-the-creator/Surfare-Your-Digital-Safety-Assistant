import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Send } from 'lucide-react';
import { ASSETS } from '../assets.js';
import { SURFY_QUESTION_KEYS } from '../surfy/templates.js';
import { getApplicableSurfyQuestionKeys } from '../surfy/templates.js';
import './AskSurfy.css';

export default function AskSurfy({
  isOpen,
  isClosing,
  isThinking,
  messages,
  onSend,
  openRequest,
  t,
  result,
}) {
  const [draft, setDraft] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const followLatestRef = useRef(true);

  useEffect(() => { setIsCollapsed(false); }, [openRequest]);

  useEffect(() => {
    const messagesElement = messagesRef.current;
    if (messagesElement && followLatestRef.current && !isCollapsed) {
      messagesElement.scrollTo({
        top: messagesElement.scrollHeight,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    }
  }, [messages, isThinking, isCollapsed]);

  if (!isOpen) return null;

  const submit = (value) => {
    const question = value.trim();
    if (!question) return;
    followLatestRef.current = true;
    onSend(question);
    setDraft('');
    if (inputRef.current) {
      inputRef.current.style.height = '';
      inputRef.current.style.overflowY = 'hidden';
    }
  };

  return (
    <section
      className={`ask-dialog${isClosing ? ' is-closing' : ''}${isCollapsed ? ' is-collapsed' : ''}`}
      role="complementary"
      aria-label={t('ask.title')}
    >
      <div className="ask-wave" aria-hidden="true">
        <svg viewBox="0 0 600 80" preserveAspectRatio="none">
          <path d="M0 28C90 0 170 51 270 25S460 6 600 28V80H0Z" fill="#2f73c6" />
          <path d="M0 44C110 70 180 15 310 44S475 61 600 38V80H0Z" fill="#8dd7f5" />
        </svg>
      </div>

      <header className="ask-brand">
        <span className="ask-avatar" aria-hidden="true">
          <img src={ASSETS.surfyWink} alt="" width="1000" height="1000" decoding="async" />
        </span>
        <div className="ask-heading">
          <p className="ask-eyebrow">{t('ask.eyebrow')}</p>
          <h2>{t('ask.title')}</h2>
        </div>
        <button className="ask-toggle" type="button"
          aria-label={t(isCollapsed ? 'ask.expand' : 'ask.collapse')}
          aria-expanded={!isCollapsed} aria-controls="ask-conversation"
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}>
          {isCollapsed ? <ChevronDown size={20} aria-hidden="true" /> : <ChevronUp size={20} aria-hidden="true" />}
        </button>
      </header>

      <div className="ask-content" id="ask-conversation">
        <div className="ask-messages" ref={messagesRef} aria-live="polite" aria-relevant="additions text"
          onScroll={(event) => {
            const element = event.currentTarget;
            element.dataset.scrolled = element.scrollTop > 4 ? 'true' : 'false';
            followLatestRef.current = element.scrollHeight - element.clientHeight - element.scrollTop < 48;
          }}>
          {!messages.length && !isThinking && <p className="ask-welcome">{t('ask.welcome')}</p>}
          {messages.map((message, index) => {
            if (message.role === 'divider') {
              return (
                <div className="ask-result-divider" role="separator" key={`divider-${index}`}>
                  <span>{message.text}</span>
                </div>
              );
            }
            return (
              <p
                className={`chat-bubble ${message.role === 'user' ? 'chat-user' : 'chat-surfy'}`}
                key={`${message.role}-${index}`}
              >
                {message.text}
              </p>
            );
          })}
          {isThinking && (
            <p className="chat-bubble chat-surfy chat-typing" role="status" aria-label={t('ask.thinking')}>
              <span aria-hidden="true"><i /><i /><i /></span>
            </p>
          )}
        </div>

        <div className="ask-chips" role="group" aria-label={t('ask.suggestions')}>
          {getApplicableSurfyQuestionKeys(result).map((key) => (
            <button type="button" className="ask-chip" key={key} onClick={() => submit(t(key))}>
              {t(key)}
            </button>
          ))}
        </div>

        <form
          className="ask-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit(draft);
          }}
        >
          <label className="sr-only" htmlFor="ask-input">
            {t('ask.input')}
          </label>
          <textarea
            id="ask-input"
            ref={inputRef}
            rows="1"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onInput={(event) => {
              const textarea = event.currentTarget;
              const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight) || 20;
              const cssMaximumHeight = Number.parseFloat(getComputedStyle(textarea).maxHeight);
              const maximumHeight = Math.min(
                lineHeight * 3 + 36,
                Number.isFinite(cssMaximumHeight) ? cssMaximumHeight : Infinity,
              );
              textarea.style.height = 'auto';
              textarea.style.height = `${Math.min(textarea.scrollHeight, maximumHeight)}px`;
              textarea.style.overflowY = textarea.scrollHeight > maximumHeight ? 'auto' : 'hidden';
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                event.currentTarget.form.requestSubmit();
              }
            }}
            placeholder={t('ask.input')}
            autoComplete="off"
          />
          <button type="submit" disabled={!draft.trim()} aria-label={t('ask.send')}>
            <Send aria-hidden="true" />
          </button>
        </form>
      </div>
    </section>
  );
}

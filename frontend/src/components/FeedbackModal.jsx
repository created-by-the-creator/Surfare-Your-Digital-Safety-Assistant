import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import emailjs from '@emailjs/browser';
import { ChevronDown, X } from 'lucide-react';

const TOPICS = [
  { value: 'Message check', key: 'feedback.topic.message' },
  { value: 'Link check', key: 'feedback.topic.link' },
  { value: 'Image or QR code check', key: 'feedback.topic.image' },
  { value: 'Design and ease of use', key: 'feedback.topic.design' },
  { value: 'Something else', key: 'feedback.topic.other' },
];

const RATINGS = {
  1: 'feedback.rating.1',
  2: 'feedback.rating.2',
  3: 'feedback.rating.3',
  4: 'feedback.rating.4',
  5: 'feedback.rating.5',
};

function topicForCheckType(type) {
  if (type === 'links') return 'Link check';
  if (type === 'image' || type === 'qr') return 'Image or QR code check';
  return 'Message check';
}

export default function FeedbackModal({ isOpen, initialType, onClose, t }) {
  const [rating, setRating] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [topic, setTopic] = useState(() => topicForCheckType(initialType));
  const [other, setOther] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ text: '', kind: '' });
  const [isSending, setIsSending] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState(0);
  const modalRef = useRef(null);
  const firstStarRef = useRef(null);
  const topicButtonRef = useRef(null);
  const topicListRef = useRef(null);
  const otherInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousFocus = document.activeElement;
    firstStarRef.current?.focus({ preventScroll: true });
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), [tabindex="0"]',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const handleOutsidePointerDown = (event) => {
      if (!modalRef.current?.contains(event.target)) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
      previousFocus?.focus?.();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isTopicOpen) topicListRef.current?.focus();
  }, [isTopicOpen]);

  useEffect(() => {
    if (!isTopicOpen) return undefined;
    const closeOutside = (event) => {
      if (!topicListRef.current?.parentElement?.contains(event.target)) {
        setIsTopicOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [isTopicOpen]);

  if (!isOpen) return null;

  const setError = (key) => setStatus({ text: t(key), kind: 'error' });
  const chooseTopic = (index, shouldFocus = false) => {
    const nextTopic = TOPICS[index].value;
    setTopic(nextTopic);
    setActiveTopic(index);
    setIsTopicOpen(false);
    if (nextTopic === 'Something else') {
      window.setTimeout(() => otherInputRef.current?.focus(), 0);
    } else {
      setOther('');
      if (shouldFocus) topicButtonRef.current?.focus();
    }
  };
  const resetForm = () => {
    setRating('');
    setTopic(topicForCheckType(initialType));
    setOther('');
    setMessage('');
    setName('');
    setEmail('');
    setStatus({ text: '', kind: '' });
    setIsDone(false);
    setIsTopicOpen(false);
  };

  const sendFeedback = async (event) => {
    event.preventDefault();
    if (!rating) return setError('feedback.error.rating');
    if (topic === 'Something else' && !other.trim()) return setError('feedback.error.topic');
    if (!message.trim()) return setError('feedback.error.message');
    if (email.trim() && !emailInputRef.current?.checkValidity()) {
      return setError('feedback.error.email');
    }

    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    if (!publicKey || !serviceId || !templateId) {
      setError('feedback.error.config');
      return;
    }

    const ratingValue = Number(rating);
    const ratingLabel = t(RATINGS[ratingValue]);
    const params = {
      rating: String(ratingValue),
      rating_label: ratingLabel,
      stars: '★'.repeat(ratingValue) + '☆'.repeat(5 - ratingValue),
      topic: topic === 'Something else' ? `Something else: ${other.trim()}` : topic,
      message: message.trim(),
      name: name.trim() || 'Anonymous',
      email: email.trim() || 'Not provided',
      page: window.location.href,
      sent_at: new Date().toLocaleString(),
    };

    setIsSending(true);
    setStatus({ text: '', kind: '' });
    try {
      await emailjs.send(serviceId, templateId, params, { publicKey });
      setIsDone(true);
    } catch (error) {
      console.error('EmailJS error:', error);
      setError('feedback.error.send');
    } finally {
      setIsSending(false);
    }
  };

  return createPortal(
    <div className="feedback-catcher">
      <section
        className="feedback-dialog"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('feedback.title')}
        onTouchStart={(event) => {
          touchStartY.current = event.touches[0]?.clientY ?? null;
        }}
        onTouchEnd={(event) => {
          const endY = event.changedTouches[0]?.clientY;
          if (touchStartY.current !== null && endY !== undefined && endY - touchStartY.current > 80) {
            onClose();
          }
          touchStartY.current = null;
        }}
      >
        <span className="feedback-drag-handle" aria-hidden="true" />
        <button className="feedback-close" type="button" onClick={onClose} aria-label={t('feedback.close')}>
          <X size={20} aria-hidden="true" />
        </button>
        {!isDone ? (
          <form className="feedback-form" noValidate onSubmit={sendFeedback}>
            <h2>{t('feedback.title')}</h2>
            <p className="feedback-subtitle">{t('feedback.subtitle')}</p>

            <fieldset className="feedback-fieldset">
              <legend>{t('feedback.rating')}</legend>
              <div
                className="feedback-stars"
                role="radiogroup"
                aria-label={t('feedback.rating')}
                onMouseLeave={() => setHoveredRating(0)}
              >
                {[5, 4, 3, 2, 1].map((value, index) => (
                  <span className="feedback-star-option" key={value}>
                    <input
                      ref={index === 0 ? firstStarRef : undefined}
                      id={`feedback-star-${value}`}
                      type="radio"
                      name="rating"
                      value={value}
                      checked={rating === String(value)}
                      onChange={() => {
                        setRating(String(value));
                        setStatus({ text: '', kind: '' });
                      }}
                    />
                    <label
                      className={(hoveredRating || Number(rating)) >= value ? 'is-selected' : ''}
                      htmlFor={`feedback-star-${value}`}
                      aria-label={t('feedback.star.aria', { count: value })}
                      onMouseEnter={() => setHoveredRating(value)}
                    >
                      ★
                    </label>
                  </span>
                ))}
              </div>
              <span className="feedback-rating-text" aria-live="polite">
                {rating ? t('feedback.stars', { label: t(RATINGS[rating]), count: rating }) : ''}
              </span>
            </fieldset>

            <div className="feedback-field">
              <label className="feedback-label" id="feedback-topic-label">
                {t('feedback.topic')}
              </label>
              <div className="feedback-dropdown">
                <button
                  className="feedback-dropdown-button"
                  type="button"
                  ref={topicButtonRef}
                  aria-haspopup="listbox"
                  aria-expanded={isTopicOpen}
                  aria-labelledby="feedback-topic-label feedback-topic-value"
                  onClick={() => {
                    if (isTopicOpen) {
                      setIsTopicOpen(false);
                    } else {
                      const index = TOPICS.findIndex((option) => option.value === topic);
                      setActiveTopic(Math.max(0, index));
                      setIsTopicOpen(true);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                      event.preventDefault();
                      setIsTopicOpen(true);
                      topicListRef.current?.focus();
                    }
                  }}
                >
                  <span id="feedback-topic-value">
                    {t(TOPICS.find((option) => option.value === topic)?.key ?? TOPICS[0].key)}
                  </span>
                  <ChevronDown className={isTopicOpen ? 'is-open' : ''} size={17} aria-hidden="true" />
                </button>
                {isTopicOpen && (
                  <ul
                    className="feedback-dropdown-list"
                    ref={topicListRef}
                    role="listbox"
                    tabIndex={-1}
                    aria-labelledby="feedback-topic-label"
                    aria-activedescendant={`feedback-topic-${activeTopic}`}
                    onKeyDown={(event) => {
                      let next = activeTopic;
                      if (event.key === 'ArrowDown') next = (activeTopic + 1) % TOPICS.length;
                      else if (event.key === 'ArrowUp') next = (activeTopic - 1 + TOPICS.length) % TOPICS.length;
                      else if (event.key === 'Home') next = 0;
                      else if (event.key === 'End') next = TOPICS.length - 1;
                      else if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        chooseTopic(activeTopic, true);
                        return;
                      } else if (event.key === 'Escape') {
                        event.stopPropagation();
                        setIsTopicOpen(false);
                        topicButtonRef.current?.focus();
                        return;
                      } else if (event.key === 'Tab') {
                        setIsTopicOpen(false);
                        return;
                      } else {
                        return;
                      }
                      event.preventDefault();
                      setActiveTopic(next);
                    }}
                  >
                    {TOPICS.map((option, index) => (
                      <li
                        id={`feedback-topic-${index}`}
                        key={option.value}
                        role="option"
                        aria-selected={topic === option.value}
                        className={activeTopic === index ? 'is-active' : ''}
                        onMouseEnter={() => setActiveTopic(index)}
                        onClick={() => chooseTopic(index, true)}
                      >
                        {t(option.key)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {topic === 'Something else' && (
              <div className="feedback-field">
                <label className="feedback-label" htmlFor="feedback-other">
                  {t('feedback.specify')}
                </label>
                <input
                  ref={otherInputRef}
                  id="feedback-other"
                  type="text"
                  maxLength="100"
                  value={other}
                  onChange={(event) => setOther(event.target.value)}
                  placeholder={t('feedback.specify.placeholder')}
                />
              </div>
            )}

            <div className="feedback-field">
              <label className="feedback-label" htmlFor="feedback-message">
                {t('feedback.message')}
              </label>
              <textarea
                id="feedback-message"
                required
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t('feedback.message.placeholder')}
              />
            </div>

            <div className="feedback-row">
              <div className="feedback-field">
                <label className="feedback-label" htmlFor="feedback-name">
                  {t('feedback.name')} <span>{t('feedback.optional')}</span>
                </label>
                <input
                  id="feedback-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="feedback-field">
                <label className="feedback-label" htmlFor="feedback-email">
                  {t('feedback.email')} <span>{t('feedback.optional')}</span>
                </label>
                <input
                  id="feedback-email"
                  ref={emailInputRef}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <button className="feedback-submit" type="submit" disabled={isSending}>
              {isSending ? t('feedback.sending') : t('feedback.send')}
            </button>
            <button className="feedback-skip" type="button" onClick={onClose}>
              {t('feedback.skip')}
            </button>
            <p className={`feedback-status ${status.kind}`} role="status" aria-live="polite">
              {status.text}
            </p>
          </form>
        ) : (
          <div className="feedback-done">
            <span className="feedback-big-star" aria-hidden="true">★</span>
            <h2>{t('feedback.done.title')}</h2>
            <p>{t('feedback.done.body')}</p>
            <button className="feedback-again" type="button" onClick={resetForm}>
              {t('feedback.again')}
            </button>
            <button className="feedback-done-button" type="button" onClick={onClose}>
              {t('feedback.done')}
            </button>
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}

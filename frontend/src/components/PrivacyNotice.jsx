import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Fingerprint, LockKeyhole, Minus, ShieldCheck, X } from 'lucide-react';
import { ASSETS } from '../assets.js';
import { usePrivacyNotice } from '../privacy/PrivacyContext.jsx';
import './PrivacyNotice.css';

const ACKNOWLEDGMENTS = ['minimize', 'process', 'sharing', 'providers', 'security', 'sensitive', 'rights'];
const SECTIONS = ['purpose', 'sharing', 'ai', 'retention', 'security', 'rights', 'terms'];
const REFERENCES = [
  ['Republic Act No. 10173', 'https://privacy.gov.ph/data-privacy-act/'],
  ['National Privacy Commission', 'https://privacy.gov.ph/data-subject-rights/'],
  ['OpenRouter', 'https://openrouter.ai/privacy'],
  ['Google', 'https://policies.google.com/privacy'],
  ['Cloudflare', 'https://www.cloudflare.com/privacypolicy/'],
  ['EmailJS', 'https://www.emailjs.com/legal/privacy-policy/'],
];

export default function PrivacyNotice({ t, reduced }) {
  const { hasAcknowledged, finishNotice, resetAcknowledgment } = usePrivacyNotice();
  const [checked, setChecked] = useState(() => ACKNOWLEDGMENTS.map(() => hasAcknowledged));
  const [closing, setClosing] = useState(null);
  const dialogRef = useRef(null);
  const selectAllRef = useRef(null);
  const id = useId();
  const count = checked.filter(Boolean).length;
  const allChecked = count === ACKNOWLEDGMENTS.length;
  const operator = import.meta.env.VITE_PRIVACY_OPERATOR?.trim();
  const email = import.meta.env.VITE_PRIVACY_EMAIL?.trim();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    dialog.querySelector('h2')?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    selectAllRef.current.indeterminate = count > 0 && !allChecked;
  }, [count, allChecked]);

  useEffect(() => {
    if (!closing) return undefined;
    const timer = window.setTimeout(() => {
      if (closing === 'reset') resetAcknowledgment();
      else finishNotice(closing === 'accept');
    }, reduced ? 0 : 300);
    return () => window.clearTimeout(timer);
  }, [closing, reduced, finishNotice, resetAcknowledgment]);

  const dismiss = () => { if (!closing) setClosing('decline'); };

  return (
    <dialog className={`privacy-notice${closing ? ' is-closing' : ''}`} ref={dialogRef}
      aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
      onCancel={(event) => { event.preventDefault(); dismiss(); }}>
      <div className="notice-layout">
        <aside className="notice-brand-panel">
          <a className="notice-brand" href="#top" onClick={(event) => event.preventDefault()} tabIndex={-1} aria-label="Surfare">
            <img src={ASSETS.appIcon} alt="" width="40" height="40" /><span>Surfare</span>
          </a>
          <div className="notice-illustration" aria-hidden="true">
            <span className="notice-orbit orbit-outer" /><span className="notice-orbit orbit-inner" />
            <span className="notice-shield"><Fingerprint size={54} strokeWidth={1.3} /></span>
            <span className="notice-lock"><LockKeyhole size={19} /></span>
          </div>
          <div className="notice-brand-copy">
            <p className="notice-eyebrow">{t('notice.brandEyebrow')}</p>
            <p className="notice-brand-title">{t('notice.brandTitle')}</p>
            <p>{t('notice.brandBody')}</p>
          </div>
          <div className="notice-local-badge"><ShieldCheck size={17} aria-hidden="true" /><span>{t('notice.localBadge')}</span></div>
        </aside>

        <form className="notice-main" onSubmit={(event) => {
          event.preventDefault();
          if (allChecked && !closing) setClosing('accept');
        }}>
          <header className="notice-header">
            <div><p className="notice-eyebrow">{t('notice.eyebrow')}</p>
              <h2 id={`${id}-title`} tabIndex={-1}>{t('notice.title')}</h2>
            </div>
            <button className="notice-close" type="button" onClick={dismiss} aria-label={t('notice.notNow')} disabled={Boolean(closing)}><X size={20} /></button>
          </header>

          <div className="notice-scroll">
            <p className="notice-description" id={`${id}-description`}>{t('notice.description')}</p>
            <div className="notice-choice-callout"><LockKeyhole size={17} aria-hidden="true" /><p>{t('notice.separateChoices')}</p></div>

            <details className="notice-policy">
              <summary><span>{t('notice.readPolicy')}</span><ChevronDown size={18} aria-hidden="true" /></summary>
              <div className="notice-policy-body">
                <p className="notice-updated">{t('notice.updated')}</p>
                {SECTIONS.map((section) => (
                  <section key={section}><h3>{t(`notice.policy.${section}.title`)}</h3><p>{t(`notice.policy.${section}.body`)}</p></section>
                ))}
                {(operator || email) && <section><h3>{t('notice.contact')}</h3>
                  {operator && <p>{operator}</p>}
                  {email && <a href={`mailto:${encodeURIComponent(email)}`}>{email}</a>}
                </section>}
                <nav className="notice-references" aria-label={t('notice.references')}>
                  <h3>{t('notice.references')}</h3>
                  {REFERENCES.map(([label, url]) => <a key={url} href={url} target="_blank" rel="noopener noreferrer">{label}</a>)}
                </nav>
                {hasAcknowledged && <button className="notice-reset" type="button" onClick={() => setClosing('reset')} disabled={Boolean(closing)}>{t('notice.reset')}</button>}
              </div>
            </details>

            <fieldset className="notice-acknowledgments" disabled={Boolean(closing)}>
              <legend className="visually-hidden">{t('notice.acknowledgments')}</legend>
              <label className="notice-select-all">
                <span className="notice-checkbox"><input type="checkbox" ref={selectAllRef} checked={allChecked} aria-label={t('notice.selectAll')}
                  onChange={(event) => setChecked(ACKNOWLEDGMENTS.map(() => event.target.checked))} />
                  {count > 0 && !allChecked ? <Minus size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}</span>
                <strong>{t('notice.selectAll')}</strong>
                <span className="notice-selected-count" aria-live="polite">{t('notice.selectedCount', { count, total: ACKNOWLEDGMENTS.length })}</span>
              </label>
              <div className="notice-checklist">
                {ACKNOWLEDGMENTS.map((key, index) => (
                  <label className={`notice-acknowledgment${checked[index] ? ' is-selected' : ''}`} key={key}>
                    <span className="notice-checkbox"><input type="checkbox" checked={checked[index]}
                      onChange={(event) => setChecked((previous) => previous.map((value, i) => i === index ? event.target.checked : value))} />
                      <Check size={14} aria-hidden="true" /></span>
                    <span>{t(`notice.ack.${key}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <footer className="notice-actions">
            <p>{t('notice.agreement')}</p>
            <div className="notice-action-row">
              <button className="notice-decline" type="button" onClick={dismiss} disabled={Boolean(closing)}>{t('notice.notNow')}</button>
              <button className="notice-accept" type="submit" disabled={!allChecked || Boolean(closing)} aria-describedby={`${id}-hint`}>
                <ShieldCheck size={18} aria-hidden="true" />{t('notice.agree')}
              </button>
            </div>
            <p className="notice-action-hint" id={`${id}-hint`}>{t(allChecked ? 'notice.ready' : 'notice.required')}</p>
          </footer>
        </form>
      </div>
    </dialog>
  );
}

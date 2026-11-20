import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Globe, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { ASSETS } from '../assets.js';
import './Navbar.css';

const LANGUAGES = [
  { value: 'en', name: 'English', detail: 'English', short: 'EN' },
  { value: 'tl', name: 'Filipino', detail: 'Tagalog', short: 'FIL' },
  { value: 'taglish', name: 'Taglish', detail: 'Filipino + English', short: 'TAG' },
];

export default function Navbar({
  lang,
  onLanguageChange,
  isOnline,
  offlineOnly,
  onOfflineOnlyChange,
  aiEnabled,
  onAiEnabledChange,
  t,
}) {
  const [open, setOpen] = useState(null);
  const id = useId();
  const controls = useRef(null);
  const languageButton = useRef(null);
  const connectionButton = useRef(null);
  const menu = useRef(null);
  const selected = LANGUAGES.find((language) => language.value === lang) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => {
      if (!controls.current?.contains(event.target)) setOpen(null);
    };
    const escape = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(null);
      (open === 'language' ? languageButton : connectionButton).current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  useEffect(() => {
    if (open === 'language') menu.current?.querySelector('[aria-checked="true"]')?.focus();
  }, [open]);

  const navigateLanguages = (event) => {
    const items = [...menu.current.querySelectorAll('[role="menuitemradio"]')];
    const index = items.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % items.length;
    if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = items.length - 1;
    if (next !== undefined) { event.preventDefault(); items[next].focus(); }
  };

  return (
    <header className="site-header">
      <div className="nav-inner">
        <a className="brand" href="#top" aria-label={t('nav.home')}>
          <img src={ASSETS.appIcon} alt="" width="38" height="38" decoding="async" />
          <span>Surfare</span>
        </a>
        <div className="nav-controls" ref={controls} onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(null);
        }}>
          <div className="header-control-wrap">
            <button className="language-control header-control" type="button" ref={languageButton}
              aria-label={`${t('nav.language')}: ${selected.name}`} aria-haspopup="menu"
              aria-expanded={open === 'language'} aria-controls={`${id}-languages`}
              onClick={() => setOpen(open === 'language' ? null : 'language')}
              onKeyDown={(event) => {
                if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen('language'); }
              }}>
              <Globe size={18} aria-hidden="true" />
              <span className="language-name">{selected.name}</span>
              <span className="language-abbreviation" aria-hidden="true">{selected.short}</span>
              <ChevronDown className="header-chevron" size={14} aria-hidden="true" />
            </button>
            {open === 'language' && (
              <div className="header-popover language-popover" id={`${id}-languages`}>
                <p className="header-popover-eyebrow">{t('nav.language')}</p>
                <div role="menu" aria-label={t('nav.language')} ref={menu} onKeyDown={navigateLanguages}>
                  {LANGUAGES.map((language) => (
                    <button type="button" role="menuitemradio" aria-checked={lang === language.value}
                      className="language-option" key={language.value} onClick={() => {
                        onLanguageChange(language.value); setOpen(null); languageButton.current.focus();
                      }}>
                      <span className="language-monogram" aria-hidden="true">{language.short}</span>
                      <span className="language-option-copy"><strong>{language.name}</strong><span>{language.detail}</span></span>
                      {lang === language.value && <Check size={18} aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="header-control-wrap connection-wrap">
            <button className={`connection-status header-control ${isOnline ? 'is-online' : 'is-offline'}`}
              type="button" ref={connectionButton} aria-expanded={open === 'connection'}
              aria-controls={`${id}-connection`} onClick={() => setOpen(open === 'connection' ? null : 'connection')}>
              {isOnline ? <Wifi size={18} aria-hidden="true" /> : <WifiOff size={18} aria-hidden="true" />}
              <span aria-live="polite">{t(isOnline ? 'nav.online' : 'nav.offline')}</span>
              <ChevronDown className="header-chevron" size={14} aria-hidden="true" />
            </button>
            {open === 'connection' && (
              <div className="header-popover connection-popover" id={`${id}-connection`}>
                <p className="header-popover-eyebrow">{t('nav.connection')}</p>
                <h2>{t(isOnline ? 'nav.connectedTitle' : 'nav.disconnectedTitle')}</h2>
                <p className="connection-description">{t(isOnline ? 'nav.connectedBody' : 'nav.disconnectedBody')}</p>
                <div className="connection-capability"><ShieldCheck size={19} aria-hidden="true" /><p>{t('nav.localCapability')}</p></div>
                <div className={`connection-capability ${!isOnline ? 'is-limited' : ''}`}>
                  {isOnline ? <Wifi size={19} aria-hidden="true" /> : <WifiOff size={19} aria-hidden="true" />}
                  <p>{t(!isOnline ? 'nav.offlineLimit' : import.meta.env.VITE_WORKER_URL ? 'nav.onlineCapability' : 'nav.lookupUnavailable')}</p>
                </div>
                <div className="connection-preference">
                  <label><span>{t('check.offlineOnly')}</span><input type="checkbox" role="switch"
                    checked={offlineOnly} onChange={(event) => onOfflineOnlyChange(event.target.checked)} /></label>
                  <p>{t('check.onlineNotice')}</p>
                </div>
                {isOnline && (
                  <div className="connection-preference">
                    <label>
                      <span>{t('check.aiEnabled')}</span>
                      <input
                        type="checkbox"
                        role="switch"
                        checked={aiEnabled}
                        onChange={(event) => onAiEnabledChange(event.target.checked)}
                      />
                    </label>
                    <p>{t('check.aiNotice')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

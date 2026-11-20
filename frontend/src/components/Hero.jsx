import { ASSETS } from '../assets.js';
import { Compass } from 'lucide-react';
import { useSiteTour } from './WelcomeExperience.jsx';
import './HeroScene.css';

export default function Hero({ t }) {
  const startTour = useSiteTour();
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-sun" aria-hidden="true">
        <span className="sun-halo" />
        <svg viewBox="0 0 120 120">
          <defs>
            <radialGradient id="hero-sun-light" cx="35%" cy="30%" r="75%">
              <stop offset="0" stopColor="#fff1c5" />
              <stop offset=".65" stopColor="#ffc56e" />
              <stop offset="1" stopColor="#f98b63" />
            </radialGradient>
          </defs>
          <g className="sun-rays" stroke="#ffdda0" strokeWidth="3" strokeLinecap="round">
            {Array.from({ length: 12 }, (_, index) => (
              <path key={index} d="M60 9V18" transform={`rotate(${index * 30} 60 60)`} />
            ))}
          </g>
          <circle className="sun-core" cx="60" cy="60" r="28" fill="url(#hero-sun-light)" />
        </svg>
      </div>
      <div className="hero-content">
        <p className="hero-eyebrow">{t('hero.eyebrow')}</p>
        <h1 id="hero-title">
          <span className="hero-title-before">{t('hero.before')}</span>{' '}
          <span className="hero-title-highlight">{t('hero.highlight')}</span>{' '}
          <span className="hero-title-after">{t('hero.after')}</span>
        </h1>
        <p className="hero-subtitle">{t('hero.subtitle')}</p>
        <div className="hero-actions">
          <a className="hero-primary" href="#check">{t('hero.cta')}</a>
          <a className="hero-secondary" href="#how-it-works">{t('hero.learn')}</a>
        </div>
        <button className="hero-tour-start" type="button" data-tour-start onClick={startTour}>
          <Compass size={16} aria-hidden="true" />{t('tour.start')}
        </button>
      </div>
      <div className="hero-surf-scene" aria-hidden="true">
        <div className="surf-rider">
          <span className="surf-water-shadow" />
          <img className="hero-mascot" src={ASSETS.surfySurfingLeft} alt="" width="1254" height="1254" decoding="async" />
          <svg className="surf-contact" viewBox="0 0 300 90" preserveAspectRatio="none">
            <path className="surf-wake-blue" d="M40 50C110 87 226 88 289 61" />
            <path className="surf-wake-foam" d="M29 39C95 78 208 91 291 57" />
            <path className="surf-wake-trail" d="M118 80C178 95 252 88 296 72" />
          </svg>
          <span className="surf-spray">
            {Array.from({ length: 4 }, (_, index) => <i key={index} style={{ '--spray-index': index }} />)}
          </span>
        </div>
      </div>
      <div className="wave-stage" aria-hidden="true">
        <img
          src={ASSETS.waveBorder}
          alt=""
          width="2172"
          height="414"
          fetchpriority="high"
        />
      </div>
    </section>
  );
}

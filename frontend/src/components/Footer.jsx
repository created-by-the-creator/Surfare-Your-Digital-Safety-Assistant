
import { ASSETS } from '../assets.js';
import {
  Compass,
  ArrowUpRight,
  ShieldCheck,
  ArrowUp
} from 'lucide-react';

import { useSiteTour } from './WelcomeExperience.jsx';
import { usePrivacyNotice } from '../privacy/PrivacyContext.jsx';
import './Footer.css';

const FOOTER_LINKS = [
  { href: '#top', label: 'Home' },
  { href: '#about', label: 'About Surfare' },
  { href: '#check', label: 'Safety Check' },
  { href: '#supported-content', label: 'Supported Content' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#golden-rules', label: 'Golden Rules' },
  { href: '#results', label: 'Understanding Results' },
  { href: '#risk-levels', label: 'Risk Levels' },
  { href: '#safety-tips', label: 'Online Safety Tips' },
  { href: '#privacy', label: 'Privacy & Security' },
  { href: '#faq', label: 'Frequently Asked Questions' },
  { href: '#contact', label: 'Contact Us' },
];

export default function Footer({ t }) {
  const startTour = useSiteTour();
  const { reviewNotice } = usePrivacyNotice();

  return (
    <footer className="site-footer" id="site-footer">

      {/* Decorative waves */}
      <div className="footer-wave-decoration" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="page-container footer-inner">

        <div className="footer-main">

          {/* BRAND */}
          <div className="footer-brand-block">

            <a
              className="footer-brand"
              href="#top"
              aria-label={t('nav.home')}
            >
              <img
                src={ASSETS.appIcon}
                alt=""
                width="44"
                height="44"
                decoding="async"
              />
              <span>Surfare</span>
            </a>

            <p className="footer-brand-description">
              Your Everyday Companion for Digital Safety.
              Helping you explore, verify, and protect yourself
              in the digital world.
            </p>

            <button
              className="tour-replay"
              type="button"
              data-tour-start
              onClick={startTour}
            >
              <Compass size={17} aria-hidden="true" />
              <span>{t('tour.replay')}</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </button>

          </div>

          {/* EXPLORE */}
          <nav
            className="footer-nav"
            aria-label="Explore"
          >
            <h2>Explore</h2>

            <ul>
              {FOOTER_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a href={href}>
                    <span>{label}</span>
                    <ArrowUpRight size={20} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* SAFETY MESSAGE */}
          <div className="footer-trust">

            <div className="footer-trust-icon">
              <ShieldCheck size={25} aria-hidden="true" />
            </div>

            <span className="footer-trust-label">
              YOUR DIGITAL SAFETY MATTERS
            </span>

            <h2>
              Think before you click.
              <span><br />Verify before you trust.</span>
            </h2>

            <p>
              Stay aware, stay informed, and make safer
              decisions every time you go online.
            </p>

            <a href="#check" className="footer-check-link">
              Start checking
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>

          </div>

        </div>

        {/* FOOTER BOTTOM */}
        <div className="footer-bottom">

          <div className="footer-copyright">
            <span>
              © {new Date().getFullYear()} Surfare
            </span>

            <span className="footer-bottom-dot">•</span>

            <span>{t('footer.note')}</span>
            <button className="footer-privacy-link" type="button" onClick={reviewNotice}>
              {t('notice.reopen')}
            </button>
          </div>

          <a
            href="#top"
            className="footer-back-top"
            aria-label="Back to top"
          >
            <ArrowUp size={17} />
          </a>

        </div>

      </div>
    </footer>
  );
}

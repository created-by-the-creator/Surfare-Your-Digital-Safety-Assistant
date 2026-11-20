import { ASSETS } from '../assets.js';

const STEPS = [1, 2, 3, 4, 5];

export default function HowItWorks({ t }) {
  return (
    <section className="how-section" id="how-it-works" aria-labelledby="how-title">
      <div className="page-container">
        <p className="section-eyebrow">{t('how.eyebrow')}</p>
        <h2 id="how-title">{t('how.title')}</h2>
        <div className="how-layout">
          <div className="how-mascot-wrap">
            <img
              className="how-mascot"
              src={ASSETS.surfyTablet}
              alt={t('how.imageAlt')}
              width="1000"
              height="1000"
              loading="lazy"
              decoding="async"
            />
          </div>
          <ol className="steps-list">
            {STEPS.map((step) => (
              <li className="step-card" key={step}>
                <span className={`step-number step-number-${step}`}>{step}</span>
                <div>
                  <h3>{t(`how.step.${step}.title`)}</h3>
                  <p>{t(`how.step.${step}.body`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

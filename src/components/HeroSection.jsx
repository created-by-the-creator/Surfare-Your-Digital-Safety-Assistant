import { useI18n } from '../modules/i18n/useI18n.js'

// Introductory banner above the checker.
export default function HeroSection() {
  const { t } = useI18n()
  return (
    <section className="hero-section">
      <div className="hero-content">
        <p className="hero-eyebrow">{t('hero.eyebrow')}</p>
        <h1 className="font-display font-black">{t('hero.headlineBefore')}<span>{t('hero.highlight')}</span></h1>
        <p className="hero-subtitle">{t('hero.subtitle')}</p>
      </div>
    </section>
  )
}

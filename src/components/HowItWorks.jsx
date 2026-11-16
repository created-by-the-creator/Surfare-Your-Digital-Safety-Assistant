import { ArrowRight, Eye, SearchCheck, ShieldCheck } from 'lucide-react'
import { useI18n } from '../modules/i18n/useI18n.js'

const steps = [
  { number: '01', icon: Eye, title: 'how.stepOneTitle', copy: 'how.stepOneCopy' },
  { number: '02', icon: SearchCheck, title: 'how.stepTwoTitle', copy: 'how.stepTwoCopy' },
  { number: '03', icon: ShieldCheck, title: 'how.stepThreeTitle', copy: 'how.stepThreeCopy' },
]

// Three-step overview of the intended checking experience.
export default function HowItWorks() {
  const { t } = useI18n()
  return (
    <section className="how-section" aria-labelledby="how-heading">
      <div className="section-heading-row">
        <div><p className="section-kicker">{t('how.kicker')}</p><h2 id="how-heading">{t('how.heading')}</h2></div>
        <ArrowRight className="section-arrow" size={24} aria-hidden="true" />
      </div>
      <div className="steps-grid grid grid-cols-1 md:grid-cols-3">
        {steps.map(({ number, icon: Icon, title, copy }) => (
          <article className="step-card" key={number}>
            <div className="step-icon"><Icon size={22} aria-hidden="true" /></div>
            <span className="step-number">{number}</span>
            <h3>{t(title)}</h3><p>{t(copy)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

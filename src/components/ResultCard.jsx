import { Check, Download, ShieldCheck, Sparkles } from 'lucide-react'
import Button from './ui/Button.jsx'
import Chip from './ui/Chip.jsx'
import { useI18n } from '../modules/i18n/useI18n.js'
import surfareMascot from '../assets/surfare-mascot.png'

// Renders the idle, loading, and data-driven demo result states.
export default function ResultCard({ result, isLoading, onNewCheck, demoStatus, onDemoChange }) {
  const { t } = useI18n()
  const status = result?.status
  const resultPath = status ? `result.states.${status}` : ''
  const downloadReport = () => {
    const reportText = `${t(`${resultPath}.title`)} — ${t(`${resultPath}.risk`)}\n${t(`${resultPath}.explanation.0`)}\n${t(`${resultPath}.explanation.1`)}`
    const file = new Blob([reportText], { type: 'text/plain' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = 'surfare-report.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="result-column" aria-labelledby="result-heading" aria-live="polite">
      <h2 className="result-heading font-display" id="result-heading">{t('result.heading')}</h2>
      <div className={`result-card ${isLoading ? 'result-loading' : ''} ${result ? `risk-${result.riskLevel}` : ''}`}>
        {import.meta.env.DEV && (
          <label className="demo-control">
            <span>{t('checker.demoResultLabel')}</span>
            <select value={demoStatus} onChange={(event) => onDemoChange(event.target.value)}>
              <option value="notAi">{t('checker.resultChoices.notAi')}</option>
              <option value="aiGenerated">{t('checker.resultChoices.aiGenerated')}</option>
              <option value="unclear">{t('checker.resultChoices.unclear')}</option>
            </select>
          </label>
        )}
        {isLoading ? (
          <div className="result-state result-loading-content">
            <img className="result-mascot" src={surfareMascot} alt="" />
            <ShieldCheck className="large-shield" size={40} aria-hidden="true" />
            <h3>{t('result.loadingTitle')}</h3>
            <p>{t('result.loadingCopy')}</p>
            <div className="progress-track" role="progressbar" aria-label={t('result.progressLabel')}><span /></div>
          </div>
        ) : !result ? (
          <div className="result-state result-idle">
            <ShieldCheck className="large-shield" size={46} aria-hidden="true" />
            <h3 className="font-display">{t('result.idleTitle')}</h3>
            <p>{t('result.idleCopy')}</p>
          </div>
        ) : (
          <div className="result-content">
            <div className="result-title-row">
              <h3 className="font-display">{t(`${resultPath}.title`)}</h3>
              <span className="risk-label">{t(`${resultPath}.risk`)}</span>
            </div>
            <div className="result-meta">
              <span className="ai-badge"><Sparkles size={13} aria-hidden="true" />{t('result.aiCheck')}</span>
              <span>{t(`${resultPath}.confidence`)}</span>
            </div>
            <div className="result-detail">
              <h4>{t('result.indicatorsTitle')}</h4>
              <div className="result-chips">
                {t(`${resultPath}.indicators`).map((indicator) => <Chip key={indicator}>{indicator}</Chip>)}
              </div>
            </div>
            <div className="result-detail">
              <h4>{t('result.explanationTitle')}</h4>
              <p>{t(`${resultPath}.explanation.0`)} {t(`${resultPath}.explanation.1`)}</p>
            </div>
            <div className="result-detail">
              <h4>{t('result.nextStepsTitle')}</h4>
              <ul className="next-steps-list">
                {t(`${resultPath}.steps`).map((step) => <li key={step}><Check size={14} aria-hidden="true" />{step}</li>)}
              </ul>
            </div>
            <div className="result-footer">
              <span>{t('result.team')}</span>
              <Button type="button" variant="report" onClick={downloadReport}>
                <Download size={15} aria-hidden="true" />{t('result.saveReport')}
              </Button>
            </div>
          </div>
        )}
      </div>
      {result && !isLoading && <Button type="button" variant="secondary" className="new-check-button" onClick={onNewCheck}>{t('result.newCheck')}</Button>}
    </section>
  )
}

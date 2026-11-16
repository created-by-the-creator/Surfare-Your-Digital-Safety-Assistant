import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import FeedbackForm from '../components/FeedbackForm.jsx'
import HeroSection from '../components/HeroSection.jsx'
import HowItWorks from '../components/HowItWorks.jsx'
import ImageTab from '../components/ImageTab.jsx'
import InputTabs from '../components/InputTabs.jsx'
import LinkTab from '../components/LinkTab.jsx'
import PrivacyNotice from '../components/PrivacyNotice.jsx'
import QRTab from '../components/QRTab.jsx'
import ResultCard from '../components/ResultCard.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import SurfyChat from '../components/SurfyChat.jsx'
import TextTab from '../components/TextTab.jsx'
import { analyzeContent } from '../services/analyzeService.js'
import { useI18n } from '../modules/i18n/useI18n.js'

// Coordinates the selected input, mock analysis, and report reset.
export default function Home() {
  const [activeTab, setActiveTab] = useState('text')
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [demoStatus, setDemoStatus] = useState('unclear')
  const [resetKey, setResetKey] = useState(0)
  const { t } = useI18n()

  async function handleAnalyze(input) {
    setIsLoading(true)
    setResult(null)
    try {
      const response = await analyzeContent(input, demoStatus)
      setResult(response)
    } finally {
      setIsLoading(false)
    }
  }

  function resetCheck() {
    setResult(null)
    setIsLoading(false)
    setActiveTab('text')
    setResetKey((current) => current + 1)
  }

  const inputProps = { onAnalyze: handleAnalyze, disabled: isLoading }

  return (
    <div className="app-shell" id="home">
      <SiteHeader />
      <HeroSection />
      <main>
        <div className="checker-wrap">
          <section className="checker-card grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(330px,.82fr)]">
            <div className="checker-input-column">
              <div className="checker-heading-row">
                <h2 className="font-display">{t('checker.heading')}</h2>
                <span className="heading-rule" aria-hidden="true" />
              </div>
              <InputTabs activeTab={activeTab} onChange={setActiveTab} />
              <div className="input-content" key={resetKey}>
                {activeTab === 'text' && <TextTab {...inputProps} />}
                {activeTab === 'image' && <ImageTab {...inputProps} />}
                {activeTab === 'qr' && <QRTab {...inputProps} />}
                {activeTab === 'link' && <LinkTab {...inputProps} />}
              </div>
            </div>
            <ResultCard
              result={result}
              isLoading={isLoading}
              onNewCheck={resetCheck}
              demoStatus={demoStatus}
              onDemoChange={setDemoStatus}
            />
          </section>
        </div>
        <div className="below-content">
          <HowItWorks />
          <PrivacyNotice />
          <div className="feedback-cta-wrap">
            <a className="button button-secondary" href="#feedback">{t('footer.feedbackLink')}<ArrowRight size={16} aria-hidden="true" /></a>
          </div>
          <div className="support-grid grid grid-cols-1 md:grid-cols-2">
            <SurfyChat />
            <FeedbackForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

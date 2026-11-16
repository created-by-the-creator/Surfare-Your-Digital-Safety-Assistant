import { useEffect, useState } from 'react'
import Home from './pages/Home.jsx'
import { useI18n } from './modules/i18n/useI18n.js'
import surfareMascot from './assets/surfare-mascot.png'

// Show the branded intro only on mobile-sized screens.
function App() {
  const { t } = useI18n()
  const [showSplash, setShowSplash] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  ))

  useEffect(() => {
    if (!showSplash) return undefined

    const timer = window.setTimeout(() => setShowSplash(false), 2000)
    return () => window.clearTimeout(timer)
  }, [showSplash])

  if (showSplash) {
    return (
      <main className="splash-screen" aria-label={t('brand')}>
        <div className="splash-brand">
          <img className="mascot-mark" src={surfareMascot} alt="" />
          <span>{t('brand')}</span>
          <span className="splash-loading" aria-hidden="true" />
        </div>
      </main>
    )
  }

  return <Home />
}

export default App

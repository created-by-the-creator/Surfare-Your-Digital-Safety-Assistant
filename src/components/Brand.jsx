import { useI18n } from '../modules/i18n/useI18n.js'
import surfareMascot from '../assets/surfare-mascot.png'

// Compact Surfare wordmark with the Surfy mascot.
export default function Brand() {
  const { t } = useI18n()
  return (
    <a className="brand font-display" href="#home" aria-label={t('accessibility.brandHome')}>
      <img className="brand-mascot" src={surfareMascot} alt="" />
      <span>{t('brand')}</span>
    </a>
  )
}

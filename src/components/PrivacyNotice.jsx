import { LockKeyhole } from 'lucide-react'
import { useI18n } from '../modules/i18n/useI18n.js'

// Briefly explains when online checks may share limited content details.
export default function PrivacyNotice() {
  const { t } = useI18n()
  return (
    <aside className="privacy-notice">
      <span className="privacy-icon"><LockKeyhole size={21} aria-hidden="true" /></span>
      <div>
        <h3>{t('how.privacyHeading')}</h3>
        <p>{t('how.privacyCopy')}</p>
      </div>
    </aside>
  )
}

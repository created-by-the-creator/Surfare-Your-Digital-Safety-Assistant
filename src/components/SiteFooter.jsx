import { useI18n } from '../modules/i18n/useI18n.js'

// Footer with a friendly reminder and in-page feedback link.
export default function SiteFooter() {
  const { t } = useI18n()
  return (
    <footer className="site-footer">
      <p className="footer-copy">{t('footer.copy')}</p>
      <a href="#feedback">{t('footer.feedbackLink')}</a>
      <p className="footer-rights">{t('footer.rights')}</p>
    </footer>
  )
}

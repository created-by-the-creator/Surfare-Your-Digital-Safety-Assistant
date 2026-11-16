import Brand from './Brand.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import OnlineStatusBadge from './OnlineStatusBadge.jsx'

// Shared site header with language and connectivity controls.
export default function SiteHeader() {
  return (
    <header className="site-header">
      <Brand />
      <div className="header-controls">
        <LanguageSwitcher />
        <OnlineStatusBadge />
      </div>
    </header>
  )
}

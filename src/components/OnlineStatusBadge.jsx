import { Wifi, WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../hooks/useOnlineStatus.js'
import { useI18n } from '../modules/i18n/useI18n.js'

// Shows the browser's current online state and explains the difference.
export default function OnlineStatusBadge() {
  const isOnline = useOnlineStatus()
  const { t } = useI18n()
  return (
    <div className={`connection-status ${isOnline ? 'is-online' : 'is-offline'}`}>
      <span className="status-pill">
        {isOnline ? <Wifi size={14} aria-hidden="true" /> : <WifiOff size={14} aria-hidden="true" />}
        {isOnline ? t('status.online') : t('status.offline')}
      </span>
      <span className="status-note">{isOnline ? t('status.onlineNote') : t('status.offlineNote')}</span>
    </div>
  )
}

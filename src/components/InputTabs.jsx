import { FileImage, Link2, ScanQrCode, Text } from 'lucide-react'
import { useI18n } from '../modules/i18n/useI18n.js'

const tabs = [
  { id: 'text', icon: Text, label: 'checker.textTab' },
  { id: 'image', icon: FileImage, label: 'checker.imageTab' },
  { id: 'qr', icon: ScanQrCode, label: 'checker.qrTab' },
  { id: 'link', icon: Link2, label: 'checker.linkTab' },
]

// Accessible tabs for choosing what type of content to check.
export default function InputTabs({ activeTab, onChange }) {
  const { t } = useI18n()
  return (
    <div className="input-tabs" role="tablist" aria-label={t('checker.heading')}>
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          className={`input-tab ${activeTab === id ? 'active' : ''}`}
          id={`tab-${id}`}
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          aria-controls={`panel-${id}`}
          onClick={() => onChange(id)}
        >
          <span className="tab-icon"><Icon size={19} aria-hidden="true" /></span>
          <span>{t(label)}</span>
        </button>
      ))}
    </div>
  )
}

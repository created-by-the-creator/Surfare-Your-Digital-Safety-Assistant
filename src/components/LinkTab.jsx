import { Link2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import Button from './ui/Button.jsx'
import Chip from './ui/Chip.jsx'
import { useI18n } from '../modules/i18n/useI18n.js'
import { isValidWebAddress } from '../utils/isValidWebAddress.js'

// Checks that a pasted link is a valid HTTP(S) URL before enabling submit.
export default function LinkTab({ onAnalyze, disabled }) {
  const [url, setUrl] = useState('')
  const { t } = useI18n()
  const isValid = isValidWebAddress(url.trim())

  function submit(event) {
    event.preventDefault()
    if (isValid) onAnalyze({ type: 'link', value: url.trim() })
  }

  return (
    <form className="tab-panel link-panel" id="panel-link" role="tabpanel" aria-labelledby="tab-link" onSubmit={submit}>
      <label className="field-label" htmlFor="link-input">{t('checker.linkLabel')}</label>
      <div className="url-input-wrap">
        <Link2 size={18} aria-hidden="true" />
        <input id="link-input" type="url" inputMode="url" autoComplete="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder={t('checker.linkPlaceholder')} />
      </div>
      <p className="helper-text">{t('checker.linkHint')}</p>
      <div className="link-chips">
        <Chip>{t('checker.dontOpen')}</Chip><Chip>{t('checker.privateCheck')}</Chip>
      </div>
      <Button type="submit" disabled={!isValid || disabled}>
        <ShieldCheck size={18} aria-hidden="true" />{t('checker.checkLink')}
      </Button>
    </form>
  )
}

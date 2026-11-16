import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import Button from './ui/Button.jsx'
import { useI18n } from '../modules/i18n/useI18n.js'

const TEXT_LIMIT = 12000

// Text checker with a hard character limit and a live counter.
export default function TextTab({ onAnalyze, disabled }) {
  const [text, setText] = useState('')
  const { t } = useI18n()

  function submit(event) {
    event.preventDefault()
    if (text.trim()) onAnalyze({ type: 'text', value: text.trim() })
  }

  return (
    <form className="tab-panel text-panel" id="panel-text" role="tabpanel" aria-labelledby="tab-text" onSubmit={submit}>
      <label className="field-label" htmlFor="message-text">{t('checker.pasteLabel')}</label>
      <textarea
        id="message-text"
        className="message-input"
        placeholder={t('checker.textPlaceholder')}
        value={text}
        maxLength={TEXT_LIMIT}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="field-meta">
        <span>{t('checker.languageHint')}</span>
        <span>{t('checker.characterCount').replace('{count}', text.length.toLocaleString())}</span>
      </div>
      <Button type="submit" disabled={!text.trim() || disabled}>
        <ShieldCheck size={18} aria-hidden="true" />
        {t('checker.check')}
      </Button>
    </form>
  )
}

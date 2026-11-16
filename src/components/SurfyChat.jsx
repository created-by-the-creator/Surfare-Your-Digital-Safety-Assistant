import { useState } from 'react'
import { MessageCircle, Waves } from 'lucide-react'
import { useI18n } from '../modules/i18n/useI18n.js'

const questions = [
  { question: 'chat.whyQuestion', answer: 'chat.whyAnswer' },
  { question: 'chat.nextQuestion', answer: 'chat.nextAnswer' },
  { question: 'chat.learnQuestion', answer: 'chat.learnAnswer' },
]

// Template-only guide chat; it does not accept or send free text.
export default function SurfyChat() {
  const [answerKey, setAnswerKey] = useState('')
  const { t } = useI18n()
  return (
    <section className="surfy-chat" aria-labelledby="chat-heading">
      <div className="chat-mascot" aria-hidden="true"><Waves size={22} /></div>
      <div className="chat-content">
        <h2 id="chat-heading">{t('chat.heading')}</h2>
        <p>{t('chat.intro')}</p>
        {answerKey && <div className="chat-answer" role="status">{t(answerKey)}</div>}
        <div className="chat-questions">
          {questions.map(({ question, answer }) => (
            <button type="button" key={question} onClick={() => setAnswerKey(answer)}>
              <MessageCircle size={14} aria-hidden="true" />{t(question)}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

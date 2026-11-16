import { Star } from 'lucide-react'
import { useState } from 'react'
import Button from './ui/Button.jsx'
import { useI18n } from '../modules/i18n/useI18n.js'

// Local feedback form placeholder; submissions are logged until a service is added.
export default function FeedbackForm() {
  const [rating, setRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const { t } = useI18n()

  function submitFeedback(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    console.log('Surfare feedback:', {
      name: formData.get('name') || '',
      rating,
      comment: formData.get('comment') || '',
    })
    setSubmitted(true)
    event.currentTarget.reset()
  }

  return (
    <section className="feedback-card" id="feedback" aria-labelledby="feedback-heading">
      <h2 id="feedback-heading">{t('feedback.heading')}</h2>
      <p>{t('feedback.copy')}</p>
      <form onSubmit={submitFeedback}>
        <label className="field-label" htmlFor="feedback-name">{t('feedback.nameLabel')}</label>
        <input id="feedback-name" name="name" type="text" placeholder={t('feedback.namePlaceholder')} />
        <fieldset className="rating-fieldset">
          <legend className="field-label">{t('feedback.ratingLabel')}</legend>
          <div className="star-rating" role="group" aria-label={t('accessibility.starRating')}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                type="button"
                key={value}
                aria-label={t('feedback.starLabel').replace('{count}', value)}
                aria-pressed={rating === value}
                onClick={() => setRating(value)}
              >
                <Star size={23} fill={value <= rating ? 'currentColor' : 'none'} aria-hidden="true" />
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field-label" htmlFor="feedback-comment">{t('feedback.commentLabel')}</label>
        <textarea id="feedback-comment" name="comment" rows="3" placeholder={t('feedback.commentPlaceholder')} />
        <Button type="submit">{t('feedback.submit')}</Button>
        {submitted && <p className="feedback-thanks" role="status">{t('feedback.thanks')}</p>}
      </form>
    </section>
  )
}

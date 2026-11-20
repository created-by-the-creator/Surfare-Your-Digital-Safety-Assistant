# Detector provenance and limits

This headless package transfers the current Surfare prototype's rules, provider prompts and compact SMS model without retraining or threshold changes. The original project is https://github.com/alvarKaixer/surfare-prototype . Its research scripts and historical benchmark reports are not required runtime dependencies and are not imported here.

## Offline model

The model in `lib/models/sms-model.json` was trained from:

1. Almeida, T. & Hidalgo, J. (2011), UCI SMS Spam Collection, DOI https://doi.org/10.24432/C5CC84 , CC BY 4.0.
2. Alexander / Yissuh (2023), Filipino-Spam-SMS-Detection-Model, https://github.com/Yissuh/Filipino-Spam-SMS-Detection-Model , BSD-3-Clause.

Attribution and the preserved BSD license are in `public/licenses/`. Preparation normalized Unicode, masked URLs/numbers for template grouping, removed duplicate normalized templates and conflicting labels, then assigned fixed SHA-256 train/validation/test partitions (70/15/15). Training used unigram/bigram features and naive Bayes coefficients. Runtime inference uses `lib/sms-features.js` and `lib/sms-model.js`.

Spam/ham labels do not establish verified fraud, personal danger or sender identity. The standalone classifier's prior 97.44% score on 860 held-out SMS labels is historical evidence, not a current full-app accuracy claim. Its raw frozen corpus is absent from this import. Development-informed rules were also informed by separate message data with noisy scam/spam categories; those data and any upstream models are not redistributed.

## Current policy

- Local patterns detect combined requests and context, threats, coercion, suspicious URLs and learned spam-like wording.
- Strong local High risk warnings skip AI; Suspicious and Insufficient evidence findings may receive opted-in contextual review.
- Multiple weak hints remain Suspicious without a stronger signal.
- Ordinary local non-matches abstain rather than certifying benign meaning.
- AI output must use supported categories and grounded source quotations. Stronger explicit danger and known reputation threats are preserved.
- No reputation match does not prove that a destination is safe.

## Evaluation scope

Automated regression tests use authored cases and mocked provider responses. Real OCR fixtures are synthetic screenshots, not a representative camera-image benchmark. Neither establishes population accuracy. The migration preserves behavior; it does not claim improved accuracy.

The English OCR language data can read many Latin-script Filipino words, but recognition mistakes require review. QR checks decode one payload and do not authenticate payment/contact/Wi-Fi data. URL rules do not inspect destination pages or redirect chains. Image metadata is unverified, can be edited or stripped, and cannot authenticate an image by its absence. Visual AI review is not a forensic detector.

Any overall accuracy claim requires a defined task and population, independently labeled untouched examples, complete online/offline pipeline evaluation, provider failures in the denominator, and per-language/task recall, false alarms, abstentions and uncertainty. Preserve source licenses and document overlap/leakage checks before using repository datasets for a new evaluation.

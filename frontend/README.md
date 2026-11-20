# Surfare

Surfare is an offline-first web app for checking suspicious messages, links, images, and QR codes. Detection runs locally; online URL lookup is optional and sends only a detected URL to the configured Worker.

## Run locally

```sh
npm install
npm run dev
npm test
npm run build
```

Copy `.env.example` to `.env.local` and fill in the EmailJS values only when feedback delivery is configured. The app works without those values; it displays a setup error rather than saving feedback.

## Optional Safe Browsing Worker

Deploy `worker/` as a Cloudflare Worker. Set `SAFE_BROWSING_API_KEY` as a Worker secret (`wrangler secret put SAFE_BROWSING_API_KEY`) and set `ALLOWED_ORIGIN` to the exact app origin. Configure `VITE_WORKER_URL` in the frontend environment to the deployed Worker URL. The Worker accepts only `POST /check-url` with a URL string, validates it, applies an isolate-local rate limit, and never logs submitted URLs.

## EmailJS feedback template

Set `VITE_EMAILJS_PUBLIC_KEY`, `VITE_EMAILJS_SERVICE_ID`, and `VITE_EMAILJS_TEMPLATE_ID`. The template should use `rating`, `rating_label`, `stars`, `topic`, `message`, `name`, `email`, `page`, and `sent_at`. Checked content is never included in the feedback payload.

## UI screenshots

Start the Vite server, then run `npm run shots` to capture development-only demo states and mobile/wide layouts under `artifacts/screenshots/`. Demo query values have no effect in production builds.

## References and images

App images are mapped in `src/assets.js` and stored under `public/assets/`. Four of the five supplied wireframe crops were available for the UI pass; the feedback-pop-up crop was not attached, so that layout follows the written specification.

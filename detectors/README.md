# Surfare detectors

Detection engine and optional API services for the Surfare UI. This folder is independent of React: it contains no screens, CSS, mascot assets or app shell. The existing repository UI is unchanged.

## Run without a UI

Requires Node.js 22.13+ and npm. From the repository root:

```sh
npm ci --prefix detectors
npm start --prefix detectors
```

The API listens at `http://127.0.0.1:8790`. Opening `/api/health` returns JSON. Local detection works without keys. To enable optional services, copy `detectors/.dev.vars.example` to `detectors/.dev.vars`, fill in server-side settings and restart. Existing secret files are not included in this import. Never expose keys through Vite variables or browser imports.

Example local request (PowerShell):

```powershell
Invoke-RestMethod http://127.0.0.1:8790/api/detect -Method Post -ContentType 'application/json' -Body '{"text":"GCash: Send your OTP now or your account will be blocked today.","kind":"message"}'
```

The returned object includes `level`, `summary`, `recommendation`, `indicators`, `urls` and `limitations`. Levels are exactly `High risk`, `Suspicious`, `Low risk`, and `Insufficient evidence`. These are categories, not probabilities. A UI can choose display labels without changing the API values.

## Connect the replacement UI

The UI team can import local functions directly. From a file in `src/pages/`:

```js
import { assessContent, checkContent } from '../../detectors/index.js'

const local = assessContent({ text: message, kind: 'message' })

// Defaults: local checks only, no network traffic.
const { assessment } = await checkContent({ text: message, kind: 'message' })
```

For online enhancement, first retrieve `/api/assess` and `/api/verify` configuration. Explain the selected destinations and obtain the user's sharing choice before enabling them. Then pass those choices explicitly:

```js
const config = await (await fetch('/api/assess')).json()
const links = await (await fetch('/api/verify')).json()
const { assessment, semantic, verification } = await checkContent(
  { text: message, kind: 'message' },
  {
    ai: userAllowedTextSharing && config.configured,
    provider: config.providerId,
    reputation: userAllowedGoogleUrlChecks && links.configured,
    online: navigator.onLine,
  },
)
```

AI is used for Insufficient evidence and Suspicious results; strong local High risk findings skip AI. Reputation checks may run concurrently. Provider failures remain explicit. An unverified URL or an ordinary local non-match does not become Low risk automatically.

During Vite development, the UI team should add this entry to the root `vite.config.js` so requests remain same-origin:

```js
server: {
  proxy: { '/api': 'http://127.0.0.1:8790' },
},
```

Run the root UI dev server and the detector server in separate terminals. `baseUrl` in `checkContent` can change a same-origin route prefix. Cross-origin browser access is deliberately not enabled; use a same-origin proxy in deployment as well. The Node server is a local development runner bound to loopback, not a production hosting setup.

## Images, OCR and QR

Browser-only exports are in `detectors/browser.js`. Import them through Vite or another browser bundler, rather than importing Node/server modules.

```js
import {
  bitmapCanvas, cropCanvas, rotateCanvas, ocrCanvas,
  createOcrWorker, recognizeImage, decodeQr,
  inspectImageProvenance, imageOriginVerdict, imageRequest,
} from '../../detectors/browser.js'

const canvas = bitmapCanvas(await createImageBitmap(file))
const qrText = await decodeQr(canvas)
if (qrText) {
  const result = assessContent({ text: qrText, kind: 'qr' })
}

const worker = await createOcrWorker()
try {
  const reading = await recognizeImage(worker, ocrCanvas(canvas), { retry: false })
  const result = assessContent({
    text: reading.text, kind: 'image', uncertain: reading.confidence < 65,
  })
} finally {
  await worker.terminate()
}
```

For better orientation/retry handling, `recognizeImage` accepts `prepareRotation`, `prepareRetry`, `onOrientation` and `onRetry` callbacks. Canvas preprocessing and rotation helpers are exported. The caller manages upload/camera acquisition, preview, crop selection, worker lifetime, progress, errors and correction of extracted text.

Prepare the local OCR files for the consuming Vite app:

```sh
npm run prepare:ocr --prefix detectors -- ../public/ocr
```

This writes generated files into the repository root's `public/ocr`. When wiring OCR, add `public/ocr/` to the root `.gitignore` and run this preparation step during deployment builds. The import itself does not add these generated assets or modify the root build. `createOcrWorker({ assetBase })` supports a different served path. Local processing works offline after the necessary application and OCR resources are available; offline page caching/service-worker registration belongs to the replacement app.

Inspect the original file metadata before any resizing:

```js
const metadata = inspectImageProvenance(new Uint8Array(await file.arrayBuffer()), file.type)
let verdict = imageOriginVerdict(metadata, null)
// Only if metadata has no explicit creation marker and the user opted into image sharing:
const visual = await imageRequest(canvas, config.providerId, 'origin', { consent: true })
verdict = imageOriginVerdict(metadata, visual)
```

`imageRequest` requires explicit consent and resizes the image before upload. Mode `content` is available as an optional reading fallback. Preserve and display the separate origin limitation: missing metadata does not prove authenticity, and visual cues are not forensic proof or a calibrated probability.

## API routes and hosting

| Route | Purpose |
| --- | --- |
| `GET /api/health` | Local server health |
| `POST /api/detect` | Local message/link/extracted-text assessment; no provider calls |
| `GET/POST /api/assess` | AI configuration and opted-in text analysis |
| `GET/POST /api/verify` | Google configuration and URL reputation |
| `GET/POST /api/image-assess` | Image review configuration and opted-in visual review |
| `/api/feedback` | Optional configured feedback submission/withdrawal |

`/api/detect` accepts nonempty text up to 12,000 characters, optional `kind` (`message`, `link`, `image`, `qr`), `urls` (up to ten addresses) and `uncertain` (boolean). It ignores caller-supplied provider/verification results. Image and QR routes assess extracted text; browser helpers perform decoding. Existing services enforce their own input bounds, consent and provider validation.

Production adapters are supplied in `api/` (Vercel) and `worker/` (Cloudflare). They are not automatically deployed from this subfolder. The hosting owner must route the replacement app's `/api/*` requests to the selected adapter, configure server secrets and run the relevant deployment. The Worker runs API-only without a static asset binding; it can also use an optional `ASSETS` binding. No hosting settings in the destination repository were changed.

## Optional feedback

The closed feedback vocabulary/validation lives in `lib/feedback.js`; encrypted browser queuing and withdrawal are exported from `client/feedback-store.js`. Storage uses `supabase/feedback.sql` and the separately configured server service. Nothing is submitted automatically by scanning. See [feedback setup](docs/FEEDBACK.md); descriptions of forms there refer to the prototype UI and must be implemented deliberately by the replacement UI team. The SQL migration has not been applied.

## Verification and migration notes

```sh
npm run check --prefix detectors
npm run test:ocr --prefix detectors
```

The import passed 193 automated checks and six real OCR checks on synthetic fixtures. Provider calls in regression tests are mocked; those pass counts are not accuracy measurements. Browser camera/editor flows, hosted adapters and a live feedback database have not been exercised in the replacement UI. The root CI workflow runs the detector checks separately; the root React lint configuration excludes this standalone package.

Detection rules, prompts and model coefficients were transferred unchanged. Three stale assertions from the prototype were updated to its existing documented policy: Suspicious findings may invoke AI; accumulated weak gift-card hints remain Suspicious until a stronger signal is present. The migration adds integration tests for opt-in networking, preserving warnings, request bounds, same-origin handling and the standalone API.

No prototype UI, private keys, raw datasets, generated accuracy reports or training artifacts are included. The compact SMS model and required third-party notices are included. [Model provenance and limits](docs/DETECTION.md) documents what the classifier measures. This import does not establish a new accuracy claim.

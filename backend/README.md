# Surfare Backend

This backend provides the local detection API and can also be deployed as a Cloudflare Worker.

## Local API

Requires Node.js 22.13 or newer.

```sh
npm install
npm run dev
```

The API is available at `http://127.0.0.1:8790`.

- `GET /api/health`
- `POST /api/detect`
- `GET/POST /api/assess`
- `GET/POST /api/verify`
- `GET/POST /api/image-assess`
- `POST /api/feedback`

## Cloudflare Worker

```sh
npm run worker:dev
npm run worker:deploy
```

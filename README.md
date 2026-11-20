# Surfare-Final

Surfare is an offline-first React and Vite digital safety application with a local Node detector API.

## Structure

- `frontend/` - React/Vite web application
- `backend/` - Local detector API, detection engine, datasets, optional services, and Cloudflare Worker
- `package.json` - npm workspace commands

## Run

```sh
npm install
npm run backend:dev
npm run dev
```

Open the frontend at `http://localhost:5173`. The Vite server proxies `/api/*` to `http://127.0.0.1:8790`.

## Validate

```sh
npm run backend:test
npm test
npm run build
```

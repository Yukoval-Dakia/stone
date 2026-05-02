# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

`Stone` is the Node.js/Express backend for the `Pine` frontend ("拜中心会" / center-believer app). Code comments, log strings, and user-facing error messages are written in Chinese — preserve that convention when editing.

Requires Node.js >= 18.

## Commands

```bash
npm install            # install dependencies
npm run dev            # development with nodemon (auto-reload)
npm start              # production: node src/index.js

docker build -t center-believer-backend .
docker run -p 5000:5000 center-believer-backend   # Dockerfile CMD is `npm run dev`
```

There is **no test suite** (`npm test` just exits 1) and **no linter** configured. Don't claim correctness based on tests that don't exist.

Deployment is automated: pushing to `main` triggers `.github/workflows/deploy.yml`, which runs `railway up` against Railway using `RAILWAY_TOKEN`.

## Required environment variables

Create `.env` in the repo root. The app boots without all of these but several routes will fail:

- `PORT` (default `5000`)
- `MONGODB_URI` (default `mongodb://mongodb:27017/center-believer`)
- `WP_URL` — only the **hostname** is extracted from this; actual requests go to `https://public-api.wordpress.com/rest/v1.1/sites/<hostname>/...`. Setting `WP_URL` to a private/internal WordPress URL will not work — it must resolve to a wordpress.com-hosted site.
- `CORS_ORIGINS` — comma-separated. If unset, falls back to a hardcoded list in `src/index.js` (GitHub Pages, localhost:3000, worship.yukovalstudios.com).
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — image uploads on `/api/scientists` will fail without these.
- `TURNSTILE_SECRET_KEY` / `RECAPTCHA_SECRET_KEY` — message posting falls back to public **test keys** if unset, which means anti-bot verification is effectively disabled. Always set real keys in production.

## Architecture

### Entry point is monolithic

`src/index.js` (~560 lines) does much more than wire up routers. It contains:
- Express bootstrap, CORS, request logging, OPTIONS preflight handling
- The MongoDB connect-with-retry loop (`connectWithRetry`) — **the HTTP server only starts after Mongo connects successfully**, and process signal handlers (`SIGINT`/`SIGTERM`/`uncaughtException`/`unhandledRejection`) are registered inside that `.then()` callback to avoid duplicate registration on reconnect.
- The ACG random-image system (see below).
- All WordPress proxy routes (`/api/wordpress/pages/:slug`, `/api/wordpress/posts`, `/api/wordpress/posts/:id`) and the `optimizeContent` cheerio helper that rewrites WP HTML (lazy-load images, external link `rel`/`target`, heading anchor IDs, responsive table wrappers).
- `/api/health`.

Only `/api/scientists` and `/api/messages` are split into `src/routes/`. When adding a route, follow that split pattern rather than appending to `index.js`.

### ACG random-image system

Used as a fallback `featured_image` when WordPress posts have none.

- The canonical list ships in `src/acg-images.json` (preloaded into `ACG_IMAGES`). `getRandomImage` picks from this static list — the GitHub-API fetch (`fetchACGImageList`) and 1-hour cache are warmed at boot but **not actually consumed by request handlers**. If you change image-selection behavior, edit `getRandomImage`, not the fetcher.
- URLs are rewritten via `convertToCDN` based on the `cf-ipcountry` header (set on `req.country` by middleware): `CN` → `cdn.jsdmirror.com/gh`, otherwise → `cdn.jsdelivr.net/gh`. Both also strip `/master/` from the path.

### Scientists route (`src/routes/scientists.js`)

Image handling has a dual path that every handler must respect:
- If `scientist.image` starts with `http`, treat it as an external URL and use it as-is for both `image` and `thumbnail`.
- Otherwise it is a Cloudinary `public_id`; generate URLs with `cloudinary.url(...)` and a 200×200 fill-cropped thumbnail.

POST/PATCH accept either a multipart `image` file (via `multer-storage-cloudinary`, 5MB cap, jpg/jpeg/png/gif) **or** a JSON body with `image` set to an `http(s)://` URL. PATCH and DELETE call `cloudinary.uploader.destroy` on the old `public_id` before replacing it — keep that cleanup when modifying these handlers.

### Messages route (`src/routes/messages.js`)

`verifyRecaptcha` distinguishes Turnstile from reCAPTCHA by **token length** (`< 100` chars → Turnstile). This is a heuristic, not a contract — don't change token-format assumptions on the client without updating this check. The same function name is used for both providers.

### Models

Mongoose models in `src/models/`. `Scientist` has a `pre('save')` hook that bumps `updatedAt`. `Message` exposes a static `getLatestMessages(limit=5)` used by `GET /api/messages`.

## Conventions

- Log liberally in Chinese with `console.log` / `console.error` — the existing handlers all do this and it's how the app is debugged in Railway logs.
- New routes should be mounted under `/api/...` in `src/index.js` and consume `req.country` (already populated by middleware) when geo-aware behavior is needed.
- The global error middleware specifically maps `'不允许的来源'` → 403; other errors → 500. Throw with that exact string for CORS-style rejections.

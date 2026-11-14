# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A small demo store (Login, Register, Products, Cart, Checkout, Orders) used as a target for test automation. Two independent Node packages, each with its own `package.json` and `node_modules`, plus a root `package.json` that only orchestrates them (its `postinstall` installs both; its scripts run both via `concurrently -k`, so one crashing stops the other):

- `api/` — Express + Mongoose REST API on port 3001
- `web/` — vanilla JS single-page app served by a tiny Express server on port 3000

The README holds the full endpoint table and request bodies; keep it in sync when routes change.

## Commands

Requires Node 18+. By default the API runs on an in-memory MongoDB (`mongodb-memory-server`, data wiped on every stop); `DB_MODE=mongo` (or `npm --prefix api run start:mongo`) uses a real MongoDB at `MONGO_URI` instead. The API exits on startup if it can't connect.

```bash
npm install && npm start                             # everything: installs api/ + web/, runs both (also dev, start:mongo, dev:mongo)
npm --prefix api install && npm --prefix api start   # API (or `npm --prefix api run dev` for node --watch)
npm --prefix web install && npm --prefix web start   # web app
curl http://localhost:3001/api/health                # API liveness check
```

`.claude/launch.json` defines `api` and `web` launch configs for these. There is no build step, linter, or test suite in the repo.

Config: API reads `PORT`, `DB_MODE` (`memory` default | `mongo`), `MONGO_URI` (default db `browserstack-lab`), `JWT_SECRET`, `WEB_ORIGIN` (CORS allow-origin, default `http://localhost:3000`) from `api/.env` via dotenv. Web reads `PORT` and `API_URL` from the process environment only (no dotenv). If you change either port, update `WEB_ORIGIN`/`API_URL` to match or CORS/fetches will break.

## Architecture

**API (`api/src`)**
- `db.js` picks the database from `DB_MODE` and stops the in-memory server on shutdown (SIGINT/SIGTERM). `server.js` connects through it, runs `seed.js` (idempotent upsert of the three products by `sku`) on every start, then listens. Routes are mounted under `/api/*`; unknown routes return `404 {error}`, thrown errors go to a generic `500 {error: 'Something went wrong'}` handler.
- All error responses use the shape `{ error: string }` — the web app displays `error` verbatim, so these messages are user-facing.
- Auth is stateless JWT (`middleware/auth.js`): `signToken` puts the user id in `sub` (8h expiry), `requireAuth` sets `req.userId`. Cart, checkout and orders routes are protected.
- One `Cart` document per user (unique `user`), items reference `Product`. `routes/cart.js` exports `loadCart` and `serialize` in addition to the router; `checkout.js` reuses them so cart totals are always computed from current product prices server-side (never trusted from the client). Quantities are integers 1–99, enforced in `parseQuantity`.
- Checkout snapshots `name`/`price`/`quantity` into the `Order` (so orders don't change if products do), then empties the cart. Payment is simulated; `paymentMethod` ∈ `credit-card | paypal | invoice`. The route defaults a missing `paymentMethod` to `credit-card`, while the `Order` schema default is `invoice`; the route's value is the one that applies.

**Web (`web/`)**
- `server.js` serves `public/` statically, a dynamic `/config.js` that sets `window.API_URL`, and falls back to `index.html` for any other path.
- `public/app.js` is the whole SPA: hash router (`#/login`, `#/products`, `#/cart`, `#/checkout`, `#/success`, `#/orders`, …) where each route is a function on the `views` object that writes `app.innerHTML`. Routes are flat names (the whole hash path is the `views` key, no params), so a new page is a new `views` key. Unknown routes redirect to `#/products`, and an error thrown by a view is shown as an error card. `PUBLIC` routes are only reachable logged out; everything else redirects to login without a token.
- Session token and user live in `localStorage`. A 401 from the `api()` helper clears the session and redirects to login only when a token was sent, so a failed login (also a 401) just shows its error message. The last order is passed to the success page via `sessionStorage.lastOrder`.
- Forms use `novalidate` and the shared `bindForm` helper, which disables the submit button during the request and writes thrown errors into the form's `.error` element — validation is done by the API, not the browser.
- Interpolate any dynamic value into templates through `esc()` to avoid XSS.

## Conventions

- Every interactive element carries a `data-testid` attribute for test automation. Add one to any new interactive element and don't rename existing ones — external tests depend on them.
- Product prices/names are illustrative demo data defined only in `api/src/seed.js`. Because the seed is an upsert by `sku`, edits there update existing products on the next API start; deleting an entry there does not remove it from the database.
- `TEST_ACCOUNTS.md` and `api/.env` are gitignored (local test credentials and config). Don't commit them.

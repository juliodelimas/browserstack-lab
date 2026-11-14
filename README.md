# BrowserStack Lab Store

A small demo store: **Login, Register, Products, Cart and Checkout**, backed by a REST API and MongoDB (in-memory by default, or a real instance).

```
api/   Express + Mongoose REST API  → http://localhost:3001
web/   Vanilla JS single-page app   → http://localhost:3000
```

## Run

Requires Node 18+. No database install needed by default.

```bash
npm install   # installs root, api/ and web/ dependencies
npm start     # starts API (in-memory DB) + web together; Ctrl+C stops both
```

Other root scripts: `npm run dev` (API with `node --watch`), `npm run start:mongo` / `npm run dev:mongo` (real MongoDB).
To run them separately: `npm --prefix api start` and `npm --prefix web start`.

Open http://localhost:3000. Products are seeded automatically on API start (database `browserstack-lab`).

### Database mode

| Mode | How | Data |
| --- | --- | --- |
| In-memory (default) | `npm start` / `npm run dev` | Throwaway MongoDB started inside the API process. Wiped every time the API stops. |
| Real MongoDB | `npm run start:mongo` / `npm run dev:mongo` (or `DB_MODE=mongo`) | Uses `MONGO_URI` (default `mongodb://127.0.0.1:27017/browserstack-lab`). Persists between runs. |

The in-memory mode downloads a MongoDB binary once (during `npm install` or on first start, cached in `~/.cache/mongodb-binaries`), so the first run needs internet access.

Config (optional, `api/.env`): `PORT`, `DB_MODE` (`memory` | `mongo`), `MONGO_URI`, `JWT_SECRET`, `WEB_ORIGIN`.
The web app reads `PORT` and `API_URL` from the environment.

## API

All cart/checkout/order routes need `Authorization: Bearer <token>`.

| Method | Path | Body | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | `{ name, email, password }` | Create account, returns `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | Returns `{ token, user }` |
| GET | `/api/auth/me` | | Current user |
| GET | `/api/products` | | List products |
| GET | `/api/products/:id` | | One product |
| GET | `/api/cart` | | `{ items, count, total }` |
| POST | `/api/cart/items` | `{ productId, quantity }` | Add to cart (adds to existing quantity) |
| PATCH | `/api/cart/items/:productId` | `{ quantity }` | Set quantity (1–99) |
| DELETE | `/api/cart/items/:productId` | | Remove item |
| POST | `/api/checkout` | `{ fullName, company?, address, city, zip, country, paymentMethod? }` | Creates order, empties cart |
| GET | `/api/orders` | | Your orders, newest first |

`paymentMethod` is one of `credit-card`, `paypal`, `invoice` — payment is simulated, no card data is collected.

## Products

Live ($39/mo), Automate ($129/mo), Percy ($199/mo). Prices are illustrative, for the demo only.

All interactive elements in the web app have `data-testid` attributes for test automation.

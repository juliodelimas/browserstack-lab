# BrowserStack Lab Store

A small demo store: **Login, Register, Products, Cart and Checkout**, backed by a REST API and a local MongoDB.

```
api/   Express + Mongoose REST API  → http://localhost:3001
web/   Vanilla JS single-page app   → http://localhost:3000
```

## Run

Requires Node 18+ and MongoDB on `mongodb://127.0.0.1:27017`.

```bash
cd api && npm install && npm start
cd web && npm install && npm start
```

Open http://localhost:3000. Products are seeded automatically on API start (database `browserstack-lab`).

Config (optional, `api/.env` — see `.env.example`): `PORT`, `MONGO_URI`, `JWT_SECRET`, `WEB_ORIGIN`.
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

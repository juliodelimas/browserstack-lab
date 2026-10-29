const API = window.API_URL || 'http://localhost:3001';
const app = document.getElementById('app');

// ---------- session ----------
const session = {
  get token() { return localStorage.getItem('token'); },
  get user() { return JSON.parse(localStorage.getItem('user') || 'null'); },
  save(token, user) { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); },
  clear() { localStorage.removeItem('token'); localStorage.removeItem('user'); },
};

// ---------- helpers ----------
async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (session.token) headers.Authorization = `Bearer ${session.token}`;
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && session.token) {
    session.clear();
    location.hash = '#/login';
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const money = (n) => `$${Number(n).toFixed(2)}`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add('hidden'), 2500);
}

function setCartCount(count) {
  document.getElementById('cart-count').textContent = count;
}

function renderNav() {
  const logged = !!session.token;
  document.getElementById('nav').classList.toggle('hidden', !logged);
  document.getElementById('user-name').textContent = logged ? `Hi, ${session.user?.name}` : '';
}

async function refreshCartCount() {
  try { setCartCount((await api('/api/cart')).count); } catch { /* ignore */ }
}

function bindForm(form, handler) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    const errorEl = form.querySelector('.error');
    errorEl.textContent = '';
    btn.disabled = true;
    try {
      await handler(Object.fromEntries(new FormData(form)));
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
}

// ---------- views ----------
const views = {
  login() {
    app.innerHTML = `
      <div class="card auth">
        <h1>Welcome back</h1>
        <p class="subtitle">Log in to continue shopping.</p>
        <form id="login-form" novalidate>
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="email" data-testid="login-email" />
          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="current-password" data-testid="login-password" />
          <button type="submit" class="full" data-testid="login-submit">Log in</button>
          <div class="error" data-testid="login-error"></div>
        </form>
        <p class="muted">No account? <a href="#/register" data-testid="go-register">Create one</a></p>
      </div>`;
    bindForm(document.getElementById('login-form'), async (data) => {
      const { token, user } = await api('/api/auth/login', { method: 'POST', body: data });
      session.save(token, user);
      location.hash = '#/products';
    });
  },

  register() {
    app.innerHTML = `
      <div class="card auth">
        <h1>Create account</h1>
        <p class="subtitle">It only takes a few seconds.</p>
        <form id="register-form" novalidate>
          <label for="name">Name</label>
          <input id="name" name="name" autocomplete="name" data-testid="register-name" />
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="email" data-testid="register-email" />
          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="new-password" placeholder="At least 6 characters" data-testid="register-password" />
          <button type="submit" class="full" data-testid="register-submit">Create account</button>
          <div class="error" data-testid="register-error"></div>
        </form>
        <p class="muted">Already registered? <a href="#/login" data-testid="go-login">Log in</a></p>
      </div>`;
    bindForm(document.getElementById('register-form'), async (data) => {
      const { token, user } = await api('/api/auth/register', { method: 'POST', body: data });
      session.save(token, user);
      toast('Account created!');
      location.hash = '#/products';
    });
  },

  async products() {
    app.innerHTML = `<h1>Products</h1><p class="subtitle">Pick the BrowserStack plans for your team.</p><div class="grid" id="products"></div>`;
    const products = await api('/api/products');
    document.getElementById('products').innerHTML = products.map((p) => `
      <div class="card product" data-testid="product-${esc(p.sku)}">
        <div class="icon">${esc(p.icon)}</div>
        <h2 data-testid="product-name">${esc(p.name)}</h2>
        <div class="tagline">${esc(p.tagline)}</div>
        <p>${esc(p.description)}</p>
        <div class="price" data-testid="product-price">${money(p.price)} <small>/ month</small></div>
        <div class="row">
          <input type="number" min="1" max="99" value="1" aria-label="Quantity for ${esc(p.name)}" data-testid="product-qty" />
          <button data-add="${p._id}" data-testid="add-to-cart">Add to cart</button>
        </div>
      </div>`).join('');

    document.querySelectorAll('[data-add]').forEach((btn) => btn.addEventListener('click', async () => {
      const quantity = Number(btn.parentElement.querySelector('input').value);
      btn.disabled = true;
      try {
        const cart = await api('/api/cart/items', { method: 'POST', body: { productId: btn.dataset.add, quantity } });
        setCartCount(cart.count);
        toast('Added to cart');
      } catch (err) {
        toast(err.message);
      } finally {
        btn.disabled = false;
      }
    }));
  },

  async cart() {
    const cart = await api('/api/cart');
    setCartCount(cart.count);
    if (!cart.items.length) {
      app.innerHTML = `
        <h1>Your cart</h1>
        <div class="card" data-testid="cart-empty"><p>Your cart is empty.</p><a class="btn" href="#/products">Browse products</a></div>`;
      return;
    }
    app.innerHTML = `
      <h1>Your cart</h1>
      <div class="card">
        <table data-testid="cart-table">
          <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead>
          <tbody>
            ${cart.items.map((i) => `
              <tr data-testid="cart-item">
                <td>${esc(i.icon)} ${esc(i.name)}</td>
                <td>${money(i.price)}</td>
                <td><input type="number" min="1" max="99" value="${i.quantity}" data-qty="${i.productId}" aria-label="Quantity" data-testid="cart-qty" /></td>
                <td data-testid="cart-subtotal">${money(i.subtotal)}</td>
                <td><button class="secondary" data-remove="${i.productId}" data-testid="cart-remove">Remove</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div class="total">Total: <strong data-testid="cart-total">${money(cart.total)}</strong> <span class="muted">/ month</span></div>
        <div class="actions">
          <a href="#/products">← Continue shopping</a>
          <a class="btn" href="#/checkout" data-testid="go-checkout">Proceed to checkout</a>
        </div>
      </div>`;

    document.querySelectorAll('[data-qty]').forEach((input) => input.addEventListener('change', async () => {
      try {
        await api(`/api/cart/items/${input.dataset.qty}`, { method: 'PATCH', body: { quantity: Number(input.value) } });
      } catch (err) {
        toast(err.message);
      }
      views.cart();
    }));
    document.querySelectorAll('[data-remove]').forEach((btn) => btn.addEventListener('click', async () => {
      await api(`/api/cart/items/${btn.dataset.remove}`, { method: 'DELETE' });
      toast('Item removed');
      views.cart();
    }));
  },

  async checkout() {
    const cart = await api('/api/cart');
    if (!cart.items.length) { location.hash = '#/cart'; return; }
    app.innerHTML = `
      <h1>Checkout</h1>
      <div class="checkout">
        <form id="checkout-form" class="card" novalidate>
          <h3>Billing details</h3>
          <label for="fullName">Full name *</label>
          <input id="fullName" name="fullName" value="${esc(session.user?.name)}" data-testid="checkout-fullname" />
          <label for="company">Company</label>
          <input id="company" name="company" data-testid="checkout-company" />
          <label for="address">Address *</label>
          <input id="address" name="address" data-testid="checkout-address" />
          <div class="two">
            <div><label for="city">City *</label><input id="city" name="city" data-testid="checkout-city" /></div>
            <div><label for="zip">ZIP code *</label><input id="zip" name="zip" data-testid="checkout-zip" /></div>
          </div>
          <label for="country">Country *</label>
          <input id="country" name="country" data-testid="checkout-country" />
          <label for="paymentMethod">Payment method</label>
          <select id="paymentMethod" name="paymentMethod" data-testid="checkout-payment">
            <option value="credit-card">Credit card (simulated)</option>
            <option value="paypal">PayPal (simulated)</option>
            <option value="invoice">Invoice</option>
          </select>
          <button type="submit" class="full" data-testid="place-order">Place order</button>
          <div class="error" data-testid="checkout-error"></div>
        </form>
        <div class="card">
          <h3>Order summary</h3>
          ${cart.items.map((i) => `<div class="summary-line"><span>${esc(i.name)} × ${i.quantity}</span><span>${money(i.subtotal)}</span></div>`).join('')}
          <hr />
          <div class="summary-line"><strong>Total</strong><strong data-testid="checkout-total">${money(cart.total)}</strong></div>
        </div>
      </div>`;
    bindForm(document.getElementById('checkout-form'), async (data) => {
      const order = await api('/api/checkout', { method: 'POST', body: data });
      setCartCount(0);
      sessionStorage.setItem('lastOrder', JSON.stringify(order));
      location.hash = '#/success';
    });
  },

  success() {
    const order = JSON.parse(sessionStorage.getItem('lastOrder') || 'null');
    if (!order) { location.hash = '#/orders'; return; }
    app.innerHTML = `
      <div class="card success" data-testid="order-success">
        <div class="check">✔</div>
        <h1>Thank you for your order!</h1>
        <p class="muted">Order <strong data-testid="order-id">#${esc(order._id.slice(-8).toUpperCase())}</strong> was confirmed.</p>
        <p>Total charged: <strong data-testid="order-total">${money(order.total)}</strong></p>
        <a class="btn" href="#/products">Back to products</a>
        <a class="btn" href="#/orders" style="margin-left:8px">View my orders</a>
      </div>`;
  },

  async orders() {
    const orders = await api('/api/orders');
    app.innerHTML = `<h1>My orders</h1>` + (orders.length ? orders.map((o) => `
      <div class="card order" data-testid="order">
        <div class="order-head">
          <strong>#${esc(o._id.slice(-8).toUpperCase())}</strong>
          <span class="muted">${new Date(o.createdAt).toLocaleString()} · ${esc(o.status)}</span>
        </div>
        ${o.items.map((i) => `<div class="summary-line"><span>${esc(i.name)} × ${i.quantity}</span><span>${money(i.price * i.quantity)}</span></div>`).join('')}
        <div class="summary-line"><strong>Total</strong><strong>${money(o.total)}</strong></div>
      </div>`).join('') : `<div class="card" data-testid="orders-empty">You have no orders yet.</div>`);
  },
};

// ---------- router ----------
const PUBLIC = ['login', 'register'];

async function router() {
  const route = location.hash.replace(/^#\//, '') || 'products';
  const logged = !!session.token;
  if (!views[route]) { location.hash = '#/products'; return; }
  if (!logged && !PUBLIC.includes(route)) { location.hash = '#/login'; return; }
  if (logged && PUBLIC.includes(route)) { location.hash = '#/products'; return; }

  renderNav();
  if (logged) refreshCartCount();
  try {
    await views[route]();
  } catch (err) {
    app.innerHTML = `<div class="card"><p class="error">${esc(err.message)}</p></div>`;
  }
}

document.getElementById('logout').addEventListener('click', () => {
  session.clear();
  location.hash = '#/login';
});
window.addEventListener('hashchange', router);
router();

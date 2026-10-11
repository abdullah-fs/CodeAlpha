const express = require('express');
const db = require('../db');
const router = express.Router();

// Build cart details (items + total) from the session cart
function getCartDetails(cart) {
  const items = [];
  let total = 0;
  for (const [id, qty] of Object.entries(cart || {})) {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!p) continue;
    const subtotal = p.price * qty;
    total += subtotal;
    items.push({ product: p, quantity: qty, subtotal });
  }
  return { items, total };
}

const cartCount = (cart) => Object.values(cart).reduce((a, b) => a + b, 0);
const wantsJson = (req) => (req.headers.accept || '').includes('application/json');

router.get('/', (req, res) => {
  const { items, total } = getCartDetails(req.session.cart);
  res.render('cart', { title: 'Your cart', items, total, error: req.query.error || null });
});

router.post('/add/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ ok: false, message: 'Product not found' });

  const cart = (req.session.cart = req.session.cart || {});
  const qty = Math.max(1, parseInt(req.body.quantity) || 1);
  const newQty = (cart[product.id] || 0) + qty;

  if (newQty > product.stock) {
    const message = `Only ${product.stock} in stock.`;
    if (wantsJson(req)) return res.status(400).json({ ok: false, message, count: cartCount(cart) });
    return res.redirect('/cart?error=' + encodeURIComponent(message));
  }

  cart[product.id] = newQty;
  if (wantsJson(req)) return res.json({ ok: true, message: 'Added to cart!', count: cartCount(cart) });
  res.redirect('/cart');
});

router.post('/update/:id', (req, res) => {
  const cart = (req.session.cart = req.session.cart || {});
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  const qty = parseInt(req.body.quantity);

  if (!product || isNaN(qty) || qty <= 0) {
    delete cart[req.params.id];
  } else if (qty > product.stock) {
    cart[product.id] = product.stock;
    return res.redirect('/cart?error=' + encodeURIComponent(`Only ${product.stock} of ${product.name} in stock.`));
  } else {
    cart[product.id] = qty;
  }
  res.redirect('/cart');
});

router.post('/remove/:id', (req, res) => {
  if (req.session.cart) delete req.session.cart[req.params.id];
  res.redirect('/cart');
});

router.getCartDetails = getCartDetails;
module.exports = router;

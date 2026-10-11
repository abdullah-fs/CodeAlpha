const express = require('express');
const db = require('../db');
const { requireLogin } = require('../middleware/auth');
const cartRouter = require('./cart');
const router = express.Router();

router.get('/checkout', requireLogin, (req, res) => {
  const { items, total } = cartRouter.getCartDetails(req.session.cart);
  if (items.length === 0) return res.redirect('/cart');
  res.render('checkout', { title: 'Checkout', items, total, error: null });
});

router.post('/checkout', requireLogin, (req, res) => {
  const { items, total } = cartRouter.getCartDetails(req.session.cart);
  const address = (req.body.address || '').trim();

  const fail = (error) => res.status(400).render('checkout', { title: 'Checkout', items, total, error });

  if (items.length === 0) return res.redirect('/cart');
  if (!address) return fail('Please enter a delivery address.');

  const placeOrder = db.transaction(() => {
    // Re-check stock inside the transaction
    for (const it of items) {
      const fresh = db.prepare('SELECT stock FROM products WHERE id = ?').get(it.product.id);
      if (!fresh || fresh.stock < it.quantity) {
        throw new Error(`Not enough stock for ${it.product.name}.`);
      }
    }
    const order = db
      .prepare('INSERT INTO orders (user_id, total, status, address) VALUES (?, ?, ?, ?)')
      .run(req.session.userId, total, 'Confirmed', address);

    const addItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
    );
    const reduceStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    for (const it of items) {
      addItem.run(order.lastInsertRowid, it.product.id, it.quantity, it.product.price);
      reduceStock.run(it.quantity, it.product.id);
    }
    return order.lastInsertRowid;
  });

  try {
    const orderId = placeOrder();
    req.session.cart = {};
    res.redirect('/orders/' + orderId + '?placed=1');
  } catch (err) {
    fail(err.message);
  }
});

router.get('/orders', requireLogin, (req, res) => {
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC')
    .all(req.session.userId);
  res.render('orders', { title: 'My orders', orders });
});

router.get('/orders/:id', requireLogin, (req, res) => {
  const order = db
    .prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.userId);
  if (!order) {
    return res.status(404).render('message', {
      title: 'Not found',
      heading: 'Order not found',
      text: 'This order does not exist.',
    });
  }
  const items = db
    .prepare(
      `SELECT oi.*, p.name, p.image FROM order_items oi
       JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`
    )
    .all(order.id);
  res.render('order', { title: 'Order #' + order.id, order, items, placed: req.query.placed === '1' });
});

module.exports = router;

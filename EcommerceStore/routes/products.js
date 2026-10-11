const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  const products = q
    ? db.prepare('SELECT * FROM products WHERE name LIKE ? OR description LIKE ? ORDER BY id').all(`%${q}%`, `%${q}%`)
    : db.prepare('SELECT * FROM products ORDER BY id').all();
  res.render('index', { title: 'Shop', products, q });
});

router.get('/product/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).render('message', {
      title: 'Not found',
      heading: 'Product not found',
      text: 'This product does not exist.',
    });
  }
  res.render('product', { title: product.name, product });
});

module.exports = router;

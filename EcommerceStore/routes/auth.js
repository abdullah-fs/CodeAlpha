const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

router.get('/register', (req, res) => {
  res.render('register', { title: 'Create account', error: null, form: {} });
});

router.post('/register', (req, res) => {
  const { name, email, password, confirm } = req.body;
  const form = { name, email };
  const fail = (error) => res.status(400).render('register', { title: 'Create account', error, form });

  if (!name || !email || !password) return fail('All fields are required.');
  if (password.length < 6) return fail('Password must be at least 6 characters.');
  if (password !== confirm) return fail('Passwords do not match.');

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (exists) return fail('An account with this email already exists.');

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
    .run(name.trim(), email.toLowerCase().trim(), hash);

  req.session.userId = result.lastInsertRowid;
  req.session.userName = name.trim();
  res.redirect('/');
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Log in', error: null });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase().trim());

  if (!user || !bcrypt.compareSync(password || '', user.password)) {
    return res.status(401).render('login', { title: 'Log in', error: 'Wrong email or password.' });
  }

  const returnTo = req.session.returnTo || '/';
  const cart = req.session.cart || {};
  req.session.regenerate((err) => {
    if (err) return res.redirect('/login');
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.cart = cart; // keep guest cart after login
    res.redirect(returnTo);
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

router.get('/register', (req, res) => {
  res.render('register', { title: 'Sign up', error: null, form: {} });
});

router.post('/register', (req, res) => {
  const { name = '', username = '', email = '', password = '', confirm = '' } = req.body;
  const form = { name, username, email };
  const fail = (error) => res.status(400).render('register', { title: 'Sign up', error, form });

  if (!name.trim() || !username.trim() || !email.trim() || !password) return fail('All fields are required.');
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
    return fail('Username must be 3-20 characters: letters, numbers or underscore.');
  }
  if (password.length < 6) return fail('Password must be at least 6 characters.');
  if (password !== confirm) return fail('Passwords do not match.');

  if (db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim())) {
    return fail('That username is taken.');
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim())) {
    return fail('An account with this email already exists.');
  }

  const result = db
    .prepare('INSERT INTO users (username, name, email, password) VALUES (?, ?, ?, ?)')
    .run(username.trim(), name.trim(), email.toLowerCase().trim(), bcrypt.hashSync(password, 10));

  req.session.userId = Number(result.lastInsertRowid);
  req.session.username = username.trim();
  req.session.name = name.trim();
  req.session.flash = 'Welcome! Follow a few people to fill your feed.';
  res.redirect('/people');
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Log in', error: null });
});

router.post('/login', (req, res) => {
  const id = (req.body.identifier || '').trim();
  const user = db
    .prepare('SELECT * FROM users WHERE username = ? OR email = ?')
    .get(id, id.toLowerCase());

  if (!user || !bcrypt.compareSync(req.body.password || '', user.password)) {
    return res.status(401).render('login', { title: 'Log in', error: 'Wrong username/email or password.' });
  }

  const returnTo = req.session.returnTo || '/';
  req.session.regenerate((err) => {
    if (err) return res.redirect('/login');
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.name = user.name;
    res.redirect(returnTo);
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;

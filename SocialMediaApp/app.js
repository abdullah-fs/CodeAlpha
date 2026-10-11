const express = require('express');
const session = require('express-session');
const path = require('path');
require('./db'); // creates tables + demo data

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
  })
);

// Template helpers
const COLORS = ['#4457e8', '#0f9d8a', '#d9622b', '#8b46c9', '#c2306b', '#2b8cd9', '#6a8f1f'];
app.locals.initials = (name) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
app.locals.avatarColor = (key) => {
  let h = 0;
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
};
app.locals.timeAgo = (s) => {
  const d = new Date(String(s).replace(' ', 'T') + 'Z');
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'just now';
  const m = Math.floor(sec / 60);
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h';
  const days = Math.floor(h / 24);
  if (days < 7) return days + 'd';
  return d.toLocaleDateString('en-GB');
};

// Current user + one-time flash message in every template
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId
    ? { id: req.session.userId, username: req.session.username, name: req.session.name }
    : null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.use('/', require('./routes/auth'));
app.use('/', require('./routes/posts'));
app.use('/', require('./routes/users'));

app.use((req, res) => {
  res.status(404).render('message', { title: 'Not found', heading: 'Page not found', text: 'This page does not exist.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('message', { title: 'Error', heading: 'Something went wrong', text: 'Please try again in a moment.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Social app running at http://localhost:${PORT}`));

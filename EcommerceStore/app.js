const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');

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
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 days
  })
);

// Make user + cart count available in every template
app.use((req, res, next) => {
  const cart = req.session.cart || {};
  res.locals.cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  res.locals.currentUser = req.session.userId
    ? { id: req.session.userId, name: req.session.userName }
    : null;
  next();
});

app.use('/', require('./routes/products'));
app.use('/', require('./routes/auth'));
app.use('/cart', require('./routes/cart'));
app.use('/', require('./routes/orders'));

app.use((req, res) => {
  res.status(404).render('message', {
    title: 'Page not found',
    heading: 'Page not found',
    text: 'The page you are looking for does not exist.',
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('message', {
    title: 'Error',
    heading: 'Something went wrong',
    text: 'Please try again in a moment.',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Store running at http://localhost:${PORT}`));

function requireLogin(req, res, next) {
  if (req.session.userId) return next();
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
}

module.exports = { requireLogin };

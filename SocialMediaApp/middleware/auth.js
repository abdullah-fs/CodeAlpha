const wantsJson = (req) => (req.headers.accept || '').includes('application/json');

function requireLogin(req, res, next) {
  if (req.session.userId) return next();
  if (wantsJson(req)) return res.status(401).json({ ok: false, message: 'Please log in first.', login: true });
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
}

module.exports = { requireLogin, wantsJson };

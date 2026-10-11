const express = require('express');
const db = require('../db');
const { requireLogin, wantsJson } = require('../middleware/auth');
const q = require('../lib/queries');
const router = express.Router();

// Everyone on the platform (with follow buttons)
router.get('/people', (req, res) => {
  const me = req.session.userId;
  const users = q.listUsers(me, me ? 'WHERE u.id != ?' : '', me ? [me] : []);
  res.render('people', { title: 'People', users, heading: 'People' });
});

// Edit own profile (must be before /u/:username)
router.get('/settings/profile', requireLogin, (req, res) => {
  const user = db.prepare('SELECT name, bio FROM users WHERE id = ?').get(req.session.userId);
  res.render('edit-profile', { title: 'Edit profile', user, error: null });
});

router.post('/settings/profile', requireLogin, (req, res) => {
  const name = (req.body.name || '').trim();
  const bio = (req.body.bio || '').trim();
  const fail = (error) => res.status(400).render('edit-profile', { title: 'Edit profile', user: { name, bio }, error });
  if (!name) return fail('Name cannot be empty.');
  if (name.length > 50) return fail('Name can be up to 50 characters.');
  if (bio.length > 160) return fail('Bio can be up to 160 characters.');

  db.prepare('UPDATE users SET name = ?, bio = ? WHERE id = ?').run(name, bio, req.session.userId);
  req.session.name = name;
  req.session.flash = 'Profile updated.';
  res.redirect('/u/' + req.session.username);
});

// Profile page
router.get('/u/:username', (req, res) => {
  const me = req.session.userId;
  const profile = q.getProfile(req.params.username);
  if (!profile) {
    return res.status(404).render('message', { title: 'Not found', heading: 'User not found', text: 'No user with that username.' });
  }
  const posts = q.getPosts(me, 'WHERE p.user_id = ?', [profile.id]);
  const isFollowing = me
    ? !!db.prepare('SELECT 1 AS x FROM followers WHERE follower_id = ? AND following_id = ?').get(me, profile.id)
    : false;
  res.render('profile', { title: profile.name, profile, posts, isMe: me === profile.id, isFollowing });
});

// Followers / following lists
router.get('/u/:username/followers', (req, res) => {
  const profile = q.getProfile(req.params.username);
  if (!profile) return res.redirect('/people');
  const users = q.listUsers(req.session.userId, 'WHERE u.id IN (SELECT follower_id FROM followers WHERE following_id = ?)', [profile.id]);
  res.render('people', { title: 'Followers', users, heading: `Followers of ${profile.name}`, back: profile });
});

router.get('/u/:username/following', (req, res) => {
  const profile = q.getProfile(req.params.username);
  if (!profile) return res.redirect('/people');
  const users = q.listUsers(req.session.userId, 'WHERE u.id IN (SELECT following_id FROM followers WHERE follower_id = ?)', [profile.id]);
  res.render('people', { title: 'Following', users, heading: `${profile.name} follows`, back: profile });
});

// Follow / unfollow (toggle)
router.post('/u/:username/follow', requireLogin, (req, res) => {
  const me = req.session.userId;
  const target = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!target) return res.status(404).json({ ok: false, message: 'User not found' });
  if (target.id === me) return res.status(400).json({ ok: false, message: 'You cannot follow yourself.' });

  const existing = db.prepare('SELECT 1 AS x FROM followers WHERE follower_id = ? AND following_id = ?').get(me, target.id);
  if (existing) db.prepare('DELETE FROM followers WHERE follower_id = ? AND following_id = ?').run(me, target.id);
  else db.prepare('INSERT INTO followers (follower_id, following_id) VALUES (?, ?)').run(me, target.id);

  const count = db.prepare('SELECT COUNT(*) AS c FROM followers WHERE following_id = ?').get(target.id).c;
  if (wantsJson(req)) return res.json({ ok: true, following: !existing, count });
  res.redirect(req.get('Referer') || '/people');
});

module.exports = router;

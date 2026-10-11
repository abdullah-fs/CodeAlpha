const express = require('express');
const db = require('../db');
const { requireLogin, wantsJson } = require('../middleware/auth');
const q = require('../lib/queries');
const router = express.Router();

const MAX_POST = 500;
const MAX_COMMENT = 300;

// Home: posts from people you follow (and yourself). Guests see everything.
router.get('/', (req, res) => {
  const me = req.session.userId;
  if (!me) {
    return res.render('feed', { title: 'Home', posts: q.getPosts(0), heading: 'Latest posts', mode: 'explore' });
  }
  const posts = q.getPosts(
    me,
    'WHERE p.user_id = ? OR p.user_id IN (SELECT following_id FROM followers WHERE follower_id = ?)',
    [me, me]
  );
  res.render('feed', { title: 'Home', posts, heading: 'Your feed', mode: 'home' });
});

router.get('/explore', (req, res) => {
  res.render('feed', { title: 'Explore', posts: q.getPosts(req.session.userId), heading: 'Everyone', mode: 'explore' });
});

// Create post
router.post('/posts', requireLogin, (req, res) => {
  const content = (req.body.content || '').trim();
  if (!content) req.session.flash = 'Write something before posting.';
  else if (content.length > MAX_POST) req.session.flash = `Posts can be up to ${MAX_POST} characters.`;
  else {
    db.prepare('INSERT INTO posts (user_id, content) VALUES (?, ?)').run(req.session.userId, content);
    req.session.flash = 'Posted!';
  }
  res.redirect(req.get('Referer') || '/');
});

// Single post + comments
router.get('/posts/:id', (req, res) => {
  const post = q.getPost(req.session.userId, req.params.id);
  if (!post) {
    return res.status(404).render('message', { title: 'Not found', heading: 'Post not found', text: 'This post does not exist or was deleted.' });
  }
  res.render('post', { title: `${post.name}'s post`, post, comments: q.getComments(post.id) });
});

// Delete own post (also removes its comments and likes)
router.post('/posts/:id/delete', requireLogin, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (post && post.user_id === req.session.userId) {
    db.transaction(() => {
      db.prepare('DELETE FROM likes WHERE post_id = ?').run(post.id);
      db.prepare('DELETE FROM comments WHERE post_id = ?').run(post.id);
      db.prepare('DELETE FROM posts WHERE id = ?').run(post.id);
    })();
    req.session.flash = 'Post deleted.';
  }
  const back = req.get('Referer') || '/';
  res.redirect(back.includes('/posts/' + req.params.id) ? '/' : back);
});

// Like / unlike (toggle)
router.post('/posts/:id/like', requireLogin, (req, res) => {
  const me = req.session.userId;
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ ok: false, message: 'Post not found' });

  const existing = db.prepare('SELECT 1 AS x FROM likes WHERE user_id = ? AND post_id = ?').get(me, post.id);
  if (existing) db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(me, post.id);
  else db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(me, post.id);

  const count = db.prepare('SELECT COUNT(*) AS c FROM likes WHERE post_id = ?').get(post.id).c;
  if (wantsJson(req)) return res.json({ ok: true, liked: !existing, count });
  res.redirect(req.get('Referer') || '/');
});

// Add comment
router.post('/posts/:id/comments', requireLogin, (req, res) => {
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.redirect('/');
  const content = (req.body.content || '').trim();
  if (!content) req.session.flash = 'Write a comment first.';
  else if (content.length > MAX_COMMENT) req.session.flash = `Comments can be up to ${MAX_COMMENT} characters.`;
  else db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)').run(post.id, req.session.userId, content);
  res.redirect('/posts/' + post.id);
});

// Delete comment (comment author or post author)
router.post('/comments/:id/delete', requireLogin, (req, res) => {
  const c = db
    .prepare('SELECT c.*, p.user_id AS post_owner FROM comments c JOIN posts p ON p.id = c.post_id WHERE c.id = ?')
    .get(req.params.id);
  if (c && (c.user_id === req.session.userId || c.post_owner === req.session.userId)) {
    db.prepare('DELETE FROM comments WHERE id = ?').run(c.id);
  }
  res.redirect(c ? '/posts/' + c.post_id : '/');
});

module.exports = router;

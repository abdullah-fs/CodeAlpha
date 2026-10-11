const db = require('../db');

const POST_SELECT = `
SELECT p.id, p.content, p.created_at, p.user_id, u.username, u.name,
  (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
  EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked
FROM posts p JOIN users u ON u.id = p.user_id`;

// where: extra SQL like "WHERE p.user_id = ?", params: values for it
function getPosts(viewerId, where = '', params = [], limit = 50) {
  return db
    .prepare(`${POST_SELECT} ${where} ORDER BY p.id DESC LIMIT ${limit}`)
    .all(viewerId || 0, ...params);
}

function getPost(viewerId, id) {
  return db.prepare(`${POST_SELECT} WHERE p.id = ?`).get(viewerId || 0, id);
}

function getProfile(username) {
  return db
    .prepare(
      `SELECT u.id, u.username, u.name, u.bio, u.created_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count,
        (SELECT COUNT(*) FROM followers WHERE following_id = u.id) AS follower_count,
        (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) AS following_count
       FROM users u WHERE u.username = ?`
    )
    .get(username);
}

function listUsers(viewerId, where = '', params = []) {
  return db
    .prepare(
      `SELECT u.id, u.username, u.name, u.bio,
        (SELECT COUNT(*) FROM followers WHERE following_id = u.id) AS follower_count,
        EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = u.id) AS is_following
       FROM users u ${where} ORDER BY u.id DESC`
    )
    .all(viewerId || 0, ...params);
}

function getComments(postId) {
  return db
    .prepare(
      `SELECT c.id, c.content, c.created_at, c.user_id, u.username, u.name
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ? ORDER BY c.id ASC`
    )
    .all(postId);
}

module.exports = { getPosts, getPost, getProfile, listUsers, getComments };

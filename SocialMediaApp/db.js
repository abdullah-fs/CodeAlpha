const { DatabaseSync } = require('node:sqlite'); // built into Node 22+, no install needed
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new DatabaseSync(path.join(__dirname, 'social.db'));
db.exec('PRAGMA foreign_keys = ON');

// Simple transaction helper (BEGIN / COMMIT / ROLLBACK)
db.transaction = (fn) => (...args) => {
  db.exec('BEGIN');
  try {
    const result = fn(...args);
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
};

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  bio TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS likes (
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (post_id) REFERENCES posts(id)
);

CREATE TABLE IF NOT EXISTS followers (
  follower_id INTEGER NOT NULL,
  following_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (following_id) REFERENCES users(id)
);
`);

// Demo data (only on first run) so the app does not look empty.
// Demo login: username "ali", "sara" or "usman", password "password123"
const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('password123', 10);
  const addUser = db.prepare('INSERT INTO users (username, name, email, password, bio) VALUES (?, ?, ?, ?, ?)');
  const addPost = db.prepare("INSERT INTO posts (user_id, content, created_at) VALUES (?, ?, datetime('now', ?))");
  const addComment = db.prepare("INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, datetime('now', ?))");
  const addLike = db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)');
  const addFollow = db.prepare('INSERT INTO followers (follower_id, following_id) VALUES (?, ?)');

  db.transaction(() => {
    addUser.run('ali', 'Ali Khan', 'ali@example.com', hash, 'Full stack learner. Coffee and code.');
    addUser.run('sara', 'Sara Ahmed', 'sara@example.com', hash, 'UI designer. I like clean layouts.');
    addUser.run('usman', 'Usman Tariq', 'usman@example.com', hash, 'Backend dev. Node.js and databases.');

    addPost.run(1, 'Just started my internship. First task: build a social media app!', '-5 hours');
    addPost.run(2, 'Good design is invisible. Spacing and alignment do most of the work.', '-3 hours');
    addPost.run(3, 'Tip: always run stock checks and writes inside one database transaction.', '-90 minutes');
    addPost.run(1, 'Anyone have a favourite way to structure Express routes?', '-20 minutes');

    addComment.run(1, 2, 'Congrats Ali! You will learn a lot.', '-4 hours');
    addComment.run(1, 3, 'Good luck. Ship small, ship often.', '-3 hours');
    addComment.run(4, 3, 'I split them by feature: auth, posts, users.', '-10 minutes');

    addLike.run(2, 1); addLike.run(3, 1); addLike.run(1, 2); addLike.run(3, 2); addLike.run(1, 3);

    addFollow.run(1, 2); addFollow.run(1, 3); addFollow.run(2, 1); addFollow.run(3, 1);
  })();
}

module.exports = db;

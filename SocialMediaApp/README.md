# Circle: Mini Social Media App

A mini social media platform built with **Node.js, Express, EJS and SQLite**.

## Features
- User registration and login (passwords hashed with bcrypt)
- User profiles (name, bio, post count, followers / following counts) and profile editing
- Posts (create, delete own posts)
- Comments on posts (delete own comments, or any comment on your own post)
- Like / unlike posts (updates instantly with JavaScript)
- Follow / unfollow users, followers and following lists
- Home feed with posts from people you follow, plus an Explore page with everyone's posts
- People page to discover users

## Tech stack
| Layer    | Tech                                   |
|----------|----------------------------------------|
| Frontend | HTML, CSS, JavaScript (EJS views)      |
| Backend  | Node.js, Express.js                    |
| Database | SQLite (built-in `node:sqlite`)        |
| Auth     | express-session, bcryptjs              |

## Requirements
Node.js 22.5 or newer. No Python or build tools needed.

## Run locally
```bash
npm install
npm start
```
Open http://localhost:3000

The database file (`social.db`) is created on first run with demo data.
Demo accounts: `ali`, `sara`, `usman` (password: `password123`).

## Database tables
- `users`: id, username, name, email, password (hash), bio, created_at
- `posts`: id, user_id, content, created_at
- `comments`: id, post_id, user_id, content, created_at
- `likes`: user_id, post_id
- `followers`: follower_id, following_id

## Project structure
```
app.js              server setup and template helpers
db.js               tables + demo data
lib/queries.js      shared SQL queries
middleware/auth.js  requireLogin
routes/             auth, posts (posts/comments/likes), users (profiles/follow)
views/              EJS templates
public/             css and js
```

## Deploy (Render)
Build command: `npm install`, start command: `npm start`. Set the env var `SESSION_SECRET`.

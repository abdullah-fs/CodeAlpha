# Techbazaar: Simple E-commerce Store

A basic full-stack e-commerce site built with **Node.js, Express, EJS and SQLite**.

## Features
- Product listing with search
- Product details page
- Shopping cart (session based, add / update / remove, AJAX "Added to cart" message)
- User registration and login (passwords hashed with bcrypt)
- Checkout and order processing (stock check and stock update inside one DB transaction)
- "My orders" history
- SQLite database storing users, products, orders and order items

## Tech stack
| Layer     | Tech                              |
|-----------|-----------------------------------|
| Frontend  | HTML, CSS, JavaScript (EJS views) |
| Backend   | Node.js, Express.js               |
| Database  | SQLite (built-in node:sqlite, Node 22+)           |
| Auth      | express-session, bcryptjs         |

## Requirements
Node.js 22.5 or newer (no Python / build tools needed).

## Run locally
```bash
npm install
npm start
```
Open http://localhost:3000

The database file (`shop.db`) is created automatically and seeded with 10 demo products on first run.

## Project structure
```
app.js              server setup
db.js               tables + demo data
middleware/auth.js  requireLogin
routes/             products, auth, cart, orders
views/              EJS templates
public/             css and js
```

## Database tables
- `users`: id, name, email, password (hash)
- `products`: id, name, description, price, image, stock
- `orders`: id, user_id, total, status, address, created_at
- `order_items`: id, order_id, product_id, quantity, price

## Deploy (Render)
Build command: `npm install`, start command: `npm start`. Set the env var `SESSION_SECRET`.

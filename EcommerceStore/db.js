const { DatabaseSync } = require('node:sqlite'); // built into Node 22+, no install needed
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'shop.db'));
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
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  image TEXT,
  stock INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`);

// Seed demo products (only if table is empty)
const count = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (count === 0) {
  const insert = db.prepare(
    'INSERT INTO products (name, description, price, image, stock) VALUES (?, ?, ?, ?, ?)'
  );
  const demo = [
    ['Wireless Headphones', 'Over-ear Bluetooth headphones with 30 hours of battery life and deep bass.', 59.99, 1, 25],
    ['Smart Watch', 'Tracks steps, heart rate and sleep. Water resistant with a bright AMOLED screen.', 89.5, 2, 15],
    ['Mechanical Keyboard', 'RGB backlit keyboard with tactile blue switches. Great for coding and gaming.', 49.0, 3, 30],
    ['Gaming Mouse', 'Ergonomic mouse with 16000 DPI sensor and 6 programmable buttons.', 24.99, 4, 40],
    ['Laptop Backpack', 'Water-resistant backpack that fits laptops up to 15.6 inches. USB charging port.', 34.0, 5, 20],
    ['Portable Speaker', 'Compact Bluetooth speaker with 12 hours playtime and a rugged design.', 29.99, 6, 35],
    ['Webcam 1080p', 'Full HD webcam with built-in microphone for calls and streaming.', 39.0, 7, 18],
    ['Power Bank 20000mAh', 'Fast-charging power bank with dual USB output. Charges a phone 5+ times.', 27.5, 8, 50],
    ['Desk Lamp', 'LED desk lamp with 3 colour modes and adjustable brightness.', 19.99, 9, 28],
    ['Phone Stand', 'Foldable aluminium stand, works with every phone and small tablet.', 9.99, 10, 60],
  ];
  const seed = db.transaction((rows) => {
    for (const [name, desc, price, n, stock] of rows) {
      insert.run(name, desc, price, `https://picsum.photos/seed/shop${n}/600/450`, stock);
    }
  });
  seed(demo);
}

module.exports = db;

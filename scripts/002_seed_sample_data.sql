-- Insert sample data for demonstration

-- Insert categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and gadgets'),
('Clothing', 'Apparel and fashion items'),
('Books', 'Books and educational materials'),
('Home & Garden', 'Home improvement and gardening supplies')
ON CONFLICT DO NOTHING;

-- Insert products
INSERT INTO products (name, description, price, category_id) 
SELECT 
  'Laptop Pro', 
  'High-performance laptop for professionals', 
  1299.99,
  c.id
FROM categories c WHERE c.name = 'Electronics'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, category_id) 
SELECT 
  'Wireless Headphones', 
  'Premium noise-canceling headphones', 
  299.99,
  c.id
FROM categories c WHERE c.name = 'Electronics'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, category_id) 
SELECT 
  'Cotton T-Shirt', 
  'Comfortable 100% cotton t-shirt', 
  24.99,
  c.id
FROM categories c WHERE c.name = 'Clothing'
ON CONFLICT DO NOTHING;

-- Insert sample users
INSERT INTO users (email, first_name, last_name) VALUES
('john.doe@example.com', 'John', 'Doe'),
('jane.smith@example.com', 'Jane', 'Smith'),
('bob.wilson@example.com', 'Bob', 'Wilson')
ON CONFLICT (email) DO NOTHING;

-- Insert sample orders
INSERT INTO orders (user_id, total_amount, status)
SELECT 
  u.id,
  1324.98,
  'completed'
FROM users u WHERE u.email = 'john.doe@example.com'
ON CONFLICT DO NOTHING;

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT 
  o.id,
  p.id,
  1,
  p.price
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON p.name = 'Laptop Pro'
WHERE u.email = 'john.doe@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT 
  o.id,
  p.id,
  1,
  p.price
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON p.name = 'Cotton T-Shirt'
WHERE u.email = 'john.doe@example.com'
ON CONFLICT DO NOTHING;

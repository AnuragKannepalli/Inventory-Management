/*
  # Inventory Management Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, product name)
      - `description` (text, product description)
      - `quantity` (integer, current stock)
      - `price` (decimal, unit price)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `inventory_transactions`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `quantity_change` (integer, positive for additions, negative for removals)
      - `transaction_type` (text, either 'addition' or 'removal')
      - `notes` (text, transaction details)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their data
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    quantity integer NOT NULL DEFAULT 0,
    price decimal(10,2) NOT NULL DEFAULT 0.00,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    quantity_change integer NOT NULL,
    transaction_type text NOT NULL CHECK (transaction_type IN ('addition', 'removal')),
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can perform all actions on products"
    ON products
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can perform all actions on inventory_transactions"
    ON inventory_transactions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
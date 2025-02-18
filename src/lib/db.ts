import { Pool } from 'pg';


// Create a new pool instance
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Inventory Management',
  password: '1234',
  port: 5432,
});
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export interface Product {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  product_id: string;
  quantity_change: number;
  transaction_type: 'addition' | 'removal';
  notes: string | null;
  created_at: string;
}

export const db = {
  async testConnection() {
    try {
      const result = await pool.query('SELECT NOW()');
      return { connected: true, timestamp: result.rows[0].now };
    } catch (error) {
      console.error('Database connection error:', error);
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown database error' 
      };
    }
  },

  async getProducts(): Promise<Product[]> {
    try {
      const result = await pool.query('SELECT * FROM products ORDER BY name');
      return result.rows;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  async addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> {
    try {
      const result = await pool.query(
        `INSERT INTO products (name, description, quantity, price)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [product.name, product.description, product.quantity, product.price]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error adding product:', error);
      return null;
    }
  },

  async updateProductQuantity(productId: string, newQuantity: number): Promise<Product | null> {
    try {
      const result = await pool.query(
        `UPDATE products
         SET quantity = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [productId, newQuantity]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating product quantity:', error);
      return null;
    }
  },

  async addTransaction(transaction: Omit<InventoryTransaction, 'id' | 'created_at'>): Promise<boolean> {
    try {
      await pool.query(
        `INSERT INTO inventory_transactions (product_id, quantity_change, transaction_type, notes)
         VALUES ($1, $2, $3, $4)`,
        [transaction.product_id, transaction.quantity_change, transaction.transaction_type, transaction.notes]
      );
      return true;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return false;
    }
  },
};
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
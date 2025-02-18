import React, { useState, useEffect } from 'react';
import { Package, Plus, Minus, RefreshCcw } from 'lucide-react';
import { db, Product } from './lib/db';
import toast, { Toaster } from 'react-hot-toast';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; timestamp?: string; error?: string }>();
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    quantity: ''
  });

  useEffect(() => {
    checkDatabaseConnection();
    fetchProducts();
  }, []);

  const checkDatabaseConnection = async () => {
    const status = await db.testConnection();
    setDbStatus(status);
    if (!status.connected) {
      toast.error(`Database connection failed: ${status.error}`);
    } else {
      toast.success('Database connected successfully');
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await db.getProducts();
      setProducts(data);
    } catch (error) {
      toast.error('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.addProduct({
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        quantity: parseInt(newProduct.quantity)
      });
      
      toast.success('Product added successfully');
      setNewProduct({ name: '', description: '', price: '', quantity: '' });
      fetchProducts();
    } catch (error) {
      toast.error('Error adding product');
    }
  };

  const handleUpdateQuantity = async (productId: string, change: number) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const newQuantity = product.quantity + change;
      if (newQuantity < 0) {
        toast.error('Quantity cannot be negative');
        return;
      }

      await db.updateProductQuantity(productId, newQuantity);
      await db.addTransaction({
        product_id: productId,
        quantity_change: change,
        transaction_type: change > 0 ? 'addition' : 'removal',
        notes: `Manual ${change > 0 ? 'addition' : 'removal'} of ${Math.abs(change)} units`
      });

      toast.success('Quantity updated successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Error updating quantity');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            </div>
            {dbStatus && (
              <div className={`text-sm ${dbStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
                {dbStatus.connected ? (
                  <span>Database Connected ✓</span>
                ) : (
                  <span>Database Disconnected ✗</span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Add Product Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input
              type="text"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
              className="border p-2 rounded"
              required
              step="0.01"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Initial Quantity"
                value={newProduct.quantity}
                onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: e.target.value }))}
                className="border p-2 rounded flex-1"
                required
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Products List */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Products</h2>
            <button
              onClick={fetchProducts}
              className="flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <RefreshCcw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
          
          {loading ? (
            <p className="text-center py-4">Loading...</p>
          ) : products.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No products found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                      <td className="px-6 py-4">{product.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${product.price.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{product.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateQuantity(product.id, -1)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Minus className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleUpdateQuantity(product.id, 1)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
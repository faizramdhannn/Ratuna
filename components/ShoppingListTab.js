'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Package } from 'lucide-react';

export default function ShoppingListTab({ onMessage }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([{
    item_shopping: '',
    quantity: '',
    unit: '',
    price: ''
  }]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/shopping-list');
      const data = await res.json();
      if (data.success) {
        // Group by shopping_id
        const grouped = {};
        data.data.forEach(item => {
          if (!grouped[item.shopping_id]) {
            grouped[item.shopping_id] = {
              shopping_id: item.shopping_id,
              shopping_date: item.shopping_date,
              items: [],
              total: 0
            };
          }
          // Price is already total, not price per unit
          const itemTotal = parseFloat(item.price);
          grouped[item.shopping_id].items.push({
            ...item,
            total: itemTotal
          });
          grouped[item.shopping_id].total += itemTotal;
        });
        
        // Convert to array and sort by date
        const historyArray = Object.values(grouped).sort((a, b) => 
          new Date(b.shopping_date) - new Date(a.shopping_date)
        );
        
        setHistory(historyArray);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const addItem = () => {
    setItems([...items, {
      item_shopping: '',
      quantity: '',
      unit: '',
      price: ''
    }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) {
      onMessage('error', 'Minimal 1 item harus ada');
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  const updateItem = (index, field, value) => {
    setItems(items.map((item, idx) => 
      idx === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async () => {
    const validItems = items.filter(item => 
      item.item_shopping && item.quantity && item.unit && item.price
    );

    if (validItems.length === 0) {
      onMessage('error', 'Semua field harus diisi untuk minimal 1 item');
      return;
    }

    if (validItems.length < items.length) {
      onMessage('error', 'Ada item yang belum lengkap. Hapus atau lengkapi semua item.');
      return;
    }

    setLoading(true);
    
    // Generate shopping_id ONCE for all items in this batch
    const shoppingId = `RTN-SHOP-${Date.now().toString(36).toUpperCase()}`;
    
    try {
      // Send all items with the SAME shopping_id
      for (const item of validItems) {
        const res = await fetch('/api/shopping-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopping_id: shoppingId, // Same ID for all items
            ...item
          })
        });
        
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Gagal menambahkan shopping list');
        }
      }

      onMessage('success', `${validItems.length} item shopping list berhasil ditambahkan dengan ID: ${shoppingId}`);
      
      // Reset form to single empty item
      setItems([{
        item_shopping: '',
        quantity: '',
        unit: '',
        price: ''
      }]);
      
      fetchHistory(); // Refresh history after adding
    } catch (error) {
      onMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Add Shopping List Form */}
      <div className="bg-white border-2 border-black rounded-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Tambah Shopping List</h2>
          <button
            onClick={addItem}
            className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item</span>
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-12 gap-3 px-2 text-sm font-medium text-gray-600">
            <div className="col-span-4">Nama Item</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-3">Total Harga</div>
            <div className="col-span-1"></div>
          </div>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-4">
                <input
                  type="text"
                  value={item.item_shopping}
                  onChange={(e) => updateItem(index, 'item_shopping', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  placeholder="Nama item"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  placeholder="Qty"
                  min="1"
                  step="0.01"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  value={item.unit}
                  onChange={(e) => updateItem(index, 'unit', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  placeholder="kg/pcs/box"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => updateItem(index, 'price', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  placeholder="Total harga"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <button
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-gray-200 pt-4 mb-4">
          <div className="flex justify-between items-center text-lg mb-2">
            <span className="font-medium">Total Items:</span>
            <span className="font-bold">{items.length}</span>
          </div>
          <div className="flex justify-between items-center text-xl">
            <span className="font-medium">Total Belanja:</span>
            <span className="font-bold text-green-600">
              Rp {items.reduce((sum, item) => {
                const price = parseFloat(item.price) || 0;
                return sum + price;
              }, 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-black text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Submit Shopping List'}
        </button>

        {items.length > 1 && (
          <p className="text-sm text-gray-500 mt-3 text-center">
            💡 Semua {items.length} item akan disimpan dengan Shopping ID yang sama
          </p>
        )}
      </div>

      {/* History Section - Always Visible */}
      <div className="bg-white border-2 border-black rounded-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">History Shopping List</h3>
          <button
            onClick={fetchHistory}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all text-sm font-medium"
          >
            Refresh History
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Belum ada history shopping list</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((shop, idx) => (
              <div key={idx} className="border-2 border-gray-200 rounded-lg p-4 hover:border-black transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg">{shop.shopping_id}</h4>
                    <p className="text-sm text-gray-600 flex items-center space-x-2 mt-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(shop.shopping_date)}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {shop.items.length} item{shop.items.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-xl font-bold text-green-600">
                      Rp {shop.total.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="space-y-2">
                    {shop.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{item.item_shopping}</span>
                          <span className="text-gray-500">
                            ({item.quantity} {item.unit})
                          </span>
                        </div>
                        <span className="font-bold">
                          Rp {item.total.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
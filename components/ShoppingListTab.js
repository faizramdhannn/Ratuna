'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Package, Filter } from 'lucide-react';

const SHOPPING_CATEGORIES = ['Karyawan', 'Bahan', 'Operasional', 'Marketing', 'Zakat'];

export default function ShoppingListTab({ onMessage }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([{
    item_shopping: '',
    category: '',
    quantity: '',
    unit: '',
    price: ''
  }]);
  const [history, setHistory] = useState([]);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [totalBelanja, setTotalBelanja] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState({});

  useEffect(() => {
    // Set default dates (last 7 days)
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(lastWeek.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    // Filter history whenever dates, category filter, or history changes
    if (startDate && endDate) {
      filterHistory();
    }
  }, [startDate, endDate, categoryFilter, history]);

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

  const filterHistory = () => {
    if (!startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = history.filter(shop => {
      const shopDate = new Date(shop.shopping_date);
      const isInDateRange = shopDate >= start && shopDate <= end;
      
      // Filter by category if not 'all'
      if (categoryFilter !== 'all') {
        const hasCategory = shop.items.some(item => item.category === categoryFilter);
        return isInDateRange && hasCategory;
      }
      
      return isInDateRange;
    });

    setFilteredHistory(filtered);
    
    // Calculate totals
    let total = 0;
    const catTotals = {
      Karyawan: 0,
      Bahan: 0,
      Operasional: 0
    };

    filtered.forEach(shop => {
      shop.items.forEach(item => {
        const itemTotal = parseFloat(item.price) || 0;
        
        // Only count if category filter matches or is 'all'
        if (categoryFilter === 'all' || item.category === categoryFilter) {
          total += itemTotal;
          
          if (item.category && catTotals.hasOwnProperty(item.category)) {
            catTotals[item.category] += itemTotal;
          }
        }
      });
    });

    setTotalBelanja(total);
    setCategoryTotals(catTotals);
  };

  const addItem = () => {
    setItems([...items, {
      item_shopping: '',
      category: '',
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
      item.item_shopping && item.category && item.quantity && item.unit && item.price
    );

    if (validItems.length === 0) {
      onMessage('error', 'Semua field termasuk category harus diisi untuk minimal 1 item');
      return;
    }

    if (validItems.length < items.length) {
      onMessage('error', 'Ada item yang belum lengkap. Hapus atau lengkapi semua item.');
      return;
    }

    setLoading(true);
    
    const shoppingId = `RTN-SHOP-${Date.now().toString(36).toUpperCase()}`;
    
    try {
      for (const item of validItems) {
        const res = await fetch('/api/shopping-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopping_id: shoppingId,
            ...item
          })
        });
        
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Gagal menambahkan shopping list');
        }
      }

      onMessage('success', `${validItems.length} item shopping list berhasil ditambahkan dengan ID: ${shoppingId}`);
      
      setItems([{
        item_shopping: '',
        category: '',
        quantity: '',
        unit: '',
        price: ''
      }]);
      
      fetchHistory();
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

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Karyawan':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Bahan':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Operasional':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
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
            <div className="col-span-3">Nama Item</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-1">Unit</div>
            <div className="col-span-3">Total Harga</div>
            <div className="col-span-1"></div>
          </div>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-3">
                <input
                  type="text"
                  value={item.item_shopping}
                  onChange={(e) => updateItem(index, 'item_shopping', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  placeholder="Nama item"
                />
              </div>
              <div className="col-span-2">
                <select
                  value={item.category}
                  onChange={(e) => updateItem(index, 'category', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                >
                  <option value="">Pilih Category</option>
                  {SHOPPING_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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
              <div className="col-span-1">
                <input
                  type="text"
                  value={item.unit}
                  onChange={(e) => updateItem(index, 'unit', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  placeholder="kg/pcs"
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

      {/* Filter & Summary Section */}
      <div className="bg-white border-2 border-black rounded-lg p-8">
        <div className="flex items-center space-x-2 mb-6">
          <Filter className="w-6 h-6" />
          <h3 className="text-xl font-bold">Filter & Ringkasan Belanja</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Filter Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
            >
              <option value="all">Semua Category</option>
              {SHOPPING_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <p className="text-sm text-blue-700 font-medium">Periode</p>
            </div>
            <p className="text-xs text-blue-600 mb-1">
              {formatDateShort(startDate)} - {formatDateShort(endDate)}
            </p>
            <p className="text-2xl font-bold text-blue-900">
              {filteredHistory.length} transaksi
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Package className="w-6 h-6 text-purple-600" />
              <p className="text-sm text-purple-700 font-medium">Total Item</p>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {filteredHistory.reduce((sum, shop) => {
                const itemCount = categoryFilter === 'all' 
                  ? shop.items.length 
                  : shop.items.filter(item => item.category === categoryFilter).length;
                return sum + itemCount;
              }, 0)} item
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-700 font-medium">Total Belanja</p>
            </div>
            <p className="text-xs text-green-600 mb-1">
              {categoryFilter !== 'all' ? categoryFilter : 'Semua'}
            </p>
            <p className="text-2xl font-bold text-green-900">
              Rp {totalBelanja.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        {categoryFilter === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 font-medium mb-1">Karyawan</p>
              <p className="text-xl font-bold text-blue-900">
                Rp {categoryTotals.Karyawan?.toLocaleString('id-ID') || '0'}
              </p>
            </div>
            <div className="border-2 border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 font-medium mb-1">Bahan</p>
              <p className="text-xl font-bold text-green-900">
                Rp {categoryTotals.Bahan?.toLocaleString('id-ID') || '0'}
              </p>
            </div>
            <div className="border-2 border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-700 font-medium mb-1">Operasional</p>
              <p className="text-xl font-bold text-purple-900">
                Rp {categoryTotals.Operasional?.toLocaleString('id-ID') || '0'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* History Section */}
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

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Tidak ada data shopping list untuk periode ini</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((shop, idx) => {
              const displayItems = categoryFilter === 'all' 
                ? shop.items 
                : shop.items.filter(item => item.category === categoryFilter);
              
              const displayTotal = displayItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);

              if (displayItems.length === 0) return null;

              return (
                <div key={idx} className="border-2 border-gray-200 rounded-lg p-4 hover:border-black transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{shop.shopping_id}</h4>
                      <p className="text-sm text-gray-600 flex items-center space-x-2 mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(shop.shopping_date)}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {displayItems.length} item{displayItems.length > 1 ? 's' : ''}
                        {categoryFilter !== 'all' && ` (${categoryFilter})`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-xl font-bold text-green-600">
                        Rp {displayTotal.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="space-y-2">
                      {displayItems.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex justify-between items-center text-sm">
                          <div className="flex items-center space-x-2 flex-1">
                            <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-medium">{item.item_shopping}</span>
                            <span className={`px-2 py-0.5 rounded text-xs border ${getCategoryColor(item.category)}`}>
                              {item.category || '-'}
                            </span>
                            <span className="text-gray-500">
                              ({item.quantity} {item.unit})
                            </span>
                          </div>
                          <span className="font-bold ml-2">
                            Rp {parseFloat(item.price || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
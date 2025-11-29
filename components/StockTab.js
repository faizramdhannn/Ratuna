'use client';

import { useState } from 'react';
import { Plus, Minus, Check, X } from 'lucide-react';

export default function StockTab({ stocks, currentUser, onRefresh, onMessage }) {
  const [loading, setLoading] = useState({});
  const [editingStock, setEditingStock] = useState(null);
  const [manualValue, setManualValue] = useState('');

  const handleStockChange = async (stock, newQuantity) => {
    if (newQuantity < 0) {
      onMessage('error', 'Stock tidak boleh negatif');
      return;
    }

    setLoading(prev => ({ ...prev, [stock.item_name]: true }));
    
    try {
      const res = await fetch('/api/stock', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: stock.item_name,
          quantity: newQuantity,
          rowIndex: stock._rowIndex
        })
      });
      
      const data = await res.json();
      if (data.success) {
        onMessage('success', `Stock ${stock.item_name} berhasil diupdate!`);
        setEditingStock(null);
        setManualValue('');
        onRefresh();
      } else {
        onMessage('error', data.error || 'Gagal mengupdate stock');
      }
    } catch (error) {
      onMessage('error', 'Terjadi kesalahan');
    } finally {
      setLoading(prev => ({ ...prev, [stock.item_name]: false }));
    }
  };

  const handleQuickChange = (stock, change) => {
    const currentQty = parseInt(stock.quantity || 0);
    const newQty = currentQty + change;
    handleStockChange(stock, newQty);
  };

  const handleManualSubmit = (stock) => {
    const newQty = parseInt(manualValue);
    if (isNaN(newQty)) {
      onMessage('error', 'Masukkan angka yang valid');
      return;
    }
    handleStockChange(stock, newQty);
  };

  const startEditing = (stock) => {
    setEditingStock(stock.item_name);
    setManualValue(stock.quantity || '0');
  };

  const cancelEditing = () => {
    setEditingStock(null);
    setManualValue('');
  };

  const isAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  return (
    <div className="bg-white border-2 border-black rounded-lg p-8">
      <h2 className="text-2xl font-bold mb-6">Stock Management</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-3 px-4 font-medium">Item Name</th>
              <th className="text-center py-3 px-4 font-medium">Quantity</th>
              {isAdmin && <th className="text-center py-3 px-4 font-medium w-80">Actions</th>}
              <th className="text-left py-3 px-4 font-medium">Last Updated</th>
              <th className="text-left py-3 px-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, idx) => {
              const qty = parseInt(stock.quantity || 0);
              const status = qty === 0 ? 'Out of Stock' : qty < 10 ? 'Low Stock' : 'Available';
              const statusColor = qty === 0 ? 'text-red-600' : qty < 10 ? 'text-yellow-600' : 'text-green-600';
              const isLoadingThis = loading[stock.item_name];
              const isEditing = editingStock === stock.item_name;
              
              return (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{stock.item_name}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center items-center">
                      <span className="text-xl font-bold">{qty}</span>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4">
                      {!isEditing ? (
                        <div className="flex justify-center">
                          <button
                            onClick={() => startEditing(stock)}
                            disabled={isLoadingThis}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Edit Stock
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          {/* Quick Actions */}
                          <button
                            onClick={() => handleQuickChange(stock, -10)}
                            disabled={isLoadingThis || qty < 10}
                            className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Kurangi 10"
                          >
                            -10
                          </button>
                          <button
                            onClick={() => handleQuickChange(stock, -1)}
                            disabled={isLoadingThis || qty === 0}
                            className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Kurangi 1"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          {/* Manual Input */}
                          <input
                            type="number"
                            value={manualValue}
                            onChange={(e) => setManualValue(e.target.value)}
                            className="w-20 px-2 py-1 border-2 border-gray-300 rounded text-center font-bold focus:border-blue-500 focus:outline-none"
                            min="0"
                            disabled={isLoadingThis}
                          />
                          
                          {/* Quick Actions */}
                          <button
                            onClick={() => handleQuickChange(stock, 1)}
                            disabled={isLoadingThis}
                            className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Tambah 1"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleQuickChange(stock, 10)}
                            disabled={isLoadingThis}
                            className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Tambah 10"
                          >
                            +10
                          </button>
                          
                          {/* Confirm/Cancel */}
                          <button
                            onClick={() => handleManualSubmit(stock)}
                            disabled={isLoadingThis}
                            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Simpan"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={isLoadingThis}
                            className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Batal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                  <td className="py-3 px-4 text-sm">
                    {stock.updated_at ? new Date(stock.updated_at).toLocaleString('id-ID') : '-'}
                  </td>
                  <td className={`py-3 px-4 font-medium ${statusColor}`}>{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
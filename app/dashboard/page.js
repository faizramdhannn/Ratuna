"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, ClipboardList, Boxes, Users, CheckCircle, XCircle } from 'lucide-react';
import OrderCard from '@/components/OrderCard';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('order');
  const [currentUser, setCurrentUser] = useState(null);
  const [masterItems, setMasterItems] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Order Cart State
  const [cart, setCart] = useState([]);
  const [cashierName, setCashierName] = useState('');

  // Form States
  const [masterItemForm, setMasterItemForm] = useState({
    item_name: '',
    hpp: '',
    operasional: '',
    worker: '',
    marketing: '',
    hpj: '',
    net_sales: ''
  });

  const [shoppingForm, setShoppingForm] = useState({
    item_shopping: '',
    quantity: '',
    price: ''
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchMasterItems();
    fetchStocks();
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'superadmin') {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      if (data.authenticated) {
        setCurrentUser(data.user);
        setCashierName(data.user.fullName);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchMasterItems = async () => {
    try {
      const res = await fetch('/api/master-items');
      const data = await res.json();
      if (data.success) setMasterItems(data.data);
    } catch (error) {
      console.error('Error fetching master items:', error);
    }
  };

  const fetchStocks = async () => {
    try {
      const res = await fetch('/api/stock');
      const data = await res.json();
      if (data.success) setStocks(data.data);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Cart Functions
  const addToCart = (item) => {
    const existingItem = cart.find(c => c.item.item_name === item.item_name);
    if (existingItem) {
      setCart(cart.map(c => 
        c.item.item_name === item.item_name 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, { item, quantity: 1 }]);
    }
    showMessage('success', `${item.item_name} ditambahkan ke keranjang`);
  };

  const updateQuantity = (itemName, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(cart.map(c => 
      c.item.item_name === itemName 
        ? { ...c, quantity: newQuantity }
        : c
    ));
  };

  const removeFromCart = (itemName) => {
    setCart(cart.filter(c => c.item.item_name !== itemName));
    showMessage('success', 'Item dihapus dari keranjang');
  };

  const calculateTotal = () => {
    return cart.reduce((sum, c) => sum + (c.item.hpj * c.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showMessage('error', 'Keranjang masih kosong');
      return;
    }

    if (!cashierName) {
      showMessage('error', 'Nama kasir harus diisi');
      return;
    }

    setLoading(true);
    try {
      for (const cartItem of cart) {
        const orderData = {
          item_name: cartItem.item.item_name,
          quantity_item: cartItem.quantity,
          total_amount: cartItem.item.hpj * cartItem.quantity,
          cashier_name: cashierName
        };

        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Gagal membuat order');
        }
      }

      showMessage('success', 'Checkout berhasil!');
      setCart([]);
      fetchStocks();
    } catch (error) {
      showMessage('error', error.message);
    }
    setLoading(false);
  };

  // Master Item Submit
  const handleMasterItemSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(masterItemForm)
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Master item berhasil ditambahkan!');
        setMasterItemForm({ item_name: '', hpp: '', operasional: '', worker: '', marketing: '', hpj: '', net_sales: '' });
        fetchMasterItems();
      } else {
        showMessage('error', data.error || 'Gagal menambahkan master item');
      }
    } catch (error) {
      showMessage('error', 'Terjadi kesalahan');
    }
    setLoading(false);
  };

  // Shopping List Submit
  const handleShoppingSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shoppingForm)
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Shopping list berhasil ditambahkan!');
        setShoppingForm({ item_shopping: '', quantity: '', price: '' });
      } else {
        showMessage('error', data.error || 'Gagal menambahkan shopping list');
      }
    } catch (error) {
      showMessage('error', 'Terjadi kesalahan');
    }
    setLoading(false);
  };

  // Approve/Reject User
  const handleUserAction = async (user, status, role) => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          username: user.username,
          full_name: user.full_name,
          role: role,
          status: status,
          rowIndex: user._rowIndex
        })
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', data.message);
        fetchUsers();
      } else {
        showMessage('error', data.error);
      }
    } catch (error) {
      showMessage('error', 'Terjadi kesalahan');
    }
    setLoading(false);
  };

  // Check permissions
  const canAccessTab = (tab) => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    if (currentUser.role === 'admin') return ['order', 'master', 'shopping', 'stock'].includes(tab);
    if (currentUser.role === 'worker') return tab === 'order';
    return false;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Message Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-black text-white' : 'bg-red-600 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {canAccessTab('order') && (
            <button
              onClick={() => setActiveTab('order')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'order' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Order</span>
            </button>
          )}
          {canAccessTab('master') && (
            <button
              onClick={() => setActiveTab('master')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'master' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Package className="w-5 h-5" />
              <span>Master Item</span>
            </button>
          )}
          {canAccessTab('shopping') && (
            <button
              onClick={() => setActiveTab('shopping')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'shopping' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              <span>Shopping List</span>
            </button>
          )}
          {canAccessTab('stock') && (
            <button
              onClick={() => setActiveTab('stock')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'stock' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Boxes className="w-5 h-5" />
              <span>Stock</span>
            </button>
          )}
          {canAccessTab('users') && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'users' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Users</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ORDER TAB */}
        {activeTab === 'order' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Item Selection */}
            <div className="lg:col-span-2">
              <div className="bg-white border-2 border-black rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Pilih Item</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {masterItems.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => addToCart(item)}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-black cursor-pointer transition-all hover:shadow-lg"
                    >
                      <h3 className="font-bold text-lg mb-2">{item.item_name}</h3>
                      <p className="text-2xl font-bold text-black">
                        Rp {parseInt(item.hpj || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Stock: {stocks.find(s => s.item_name === item.item_name)?.quantity || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart */}
            <div className="lg:col-span-1">
              <div className="bg-white border-2 border-black rounded-lg p-6 sticky top-4">
                <h2 className="text-2xl font-bold mb-4">Keranjang</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Nama Kasir</label>
                  <input
                    type="text"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                    placeholder="Nama kasir"
                  />
                </div>

                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Keranjang kosong</p>
                  ) : (
                    cart.map((cartItem, idx) => (
                      <OrderCard
                        key={idx}
                        item={cartItem.item}
                        quantity={cartItem.quantity}
                        onIncrease={() => updateQuantity(cartItem.item.item_name, cartItem.quantity + 1)}
                        onDecrease={() => updateQuantity(cartItem.item.item_name, cartItem.quantity - 1)}
                        onRemove={() => removeFromCart(cartItem.item.item_name)}
                      />
                    ))
                  )}
                </div>

                <div className="border-t-2 border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-medium">Total Item:</span>
                    <span className="text-lg font-bold">{cart.reduce((sum, c) => sum + c.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">Total:</span>
                    <span className="text-2xl font-bold">Rp {calculateTotal().toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading || cart.length === 0}
                  className="w-full bg-black text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Checkout'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'master' && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-black rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Tambah Master Item</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Item Name</label>
                  <input
                    type="text"
                    value={masterItemForm.item_name}
                    onChange={(e) => setMasterItemForm({...masterItemForm, item_name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">HPP</label>
                    <input
                      type="number"
                      value={masterItemForm.hpp}
                      onChange={(e) => setMasterItemForm({...masterItemForm, hpp: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Operasional</label>
                    <input
                      type="number"
                      value={masterItemForm.operasional}
                      onChange={(e) => setMasterItemForm({...masterItemForm, operasional: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Worker</label>
                    <input
                      type="number"
                      value={masterItemForm.worker}
                      onChange={(e) => setMasterItemForm({...masterItemForm, worker: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Marketing</label>
                    <input
                      type="number"
                      value={masterItemForm.marketing}
                      onChange={(e) => setMasterItemForm({...masterItemForm, marketing: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">HPJ</label>
                    <input
                      type="number"
                      value={masterItemForm.hpj}
                      onChange={(e) => setMasterItemForm({...masterItemForm, hpj: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Net Sales</label>
                    <input
                      type="number"
                      value={masterItemForm.net_sales}
                      onChange={(e) => setMasterItemForm({...masterItemForm, net_sales: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleMasterItemSubmit}
                  disabled={loading}
                  className="w-full bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Tambah Master Item'}
                </button>
              </div>
            </div>

            {/* Master Items List */}
            <div className="bg-white border-2 border-black rounded-lg p-8">
              <h3 className="text-xl font-bold mb-4">Daftar Master Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="text-left py-3 px-4 font-medium">Item Name</th>
                      <th className="text-left py-3 px-4 font-medium">HPP</th>
                      <th className="text-left py-3 px-4 font-medium">HPJ</th>
                      <th className="text-left py-3 px-4 font-medium">Net Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">{item.item_name}</td>
                        <td className="py-3 px-4">Rp {parseInt(item.hpp || 0).toLocaleString()}</td>
                        <td className="py-3 px-4">Rp {parseInt(item.hpj || 0).toLocaleString()}</td>
                        <td className="py-3 px-4">Rp {parseInt(item.net_sales || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SHOPPING LIST TAB */}
        {activeTab === 'shopping' && (
          <div className="bg-white border-2 border-black rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Tambah Shopping List</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Item Shopping</label>
                <input
                  type="text"
                  value={shoppingForm.item_shopping}
                  onChange={(e) => setShoppingForm({...shoppingForm, item_shopping: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <input
                    type="number"
                    value={shoppingForm.quantity}
                    onChange={(e) => setShoppingForm({...shoppingForm, quantity: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <input
                    type="number"
                    value={shoppingForm.price}
                    onChange={(e) => setShoppingForm({...shoppingForm, price: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleShoppingSubmit}
                disabled={loading}
                className="w-full bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Tambah Shopping List'}
              </button>
            </div>
          </div>
        )}

        {/* STOCK TAB */}
        {activeTab === 'stock' && (
          <div className="bg-white border-2 border-black rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Stock Overview</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-3 px-4 font-medium">Item Name</th>
                    <th className="text-left py-3 px-4 font-medium">Quantity</th>
                    <th className="text-left py-3 px-4 font-medium">Last Updated</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock, idx) => {
                    const qty = parseInt(stock.quantity || 0);
                    const status = qty === 0 ? 'Out of Stock' : qty < 10 ? 'Low Stock' : 'Available';
                    const statusColor = qty === 0 ? 'text-red-600' : qty < 10 ? 'text-yellow-600' : 'text-green-600';
                    
                    return (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{stock.item_name}</td>
                        <td className="py-3 px-4">{qty}</td>
                        <td className="py-3 px-4">{stock.updated_at ? new Date(stock.updated_at).toLocaleString() : '-'}</td>
                        <td className={`py-3 px-4 font-medium ${statusColor}`}>{status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB (SUPERADMIN ONLY) */}
        {activeTab === 'users' && currentUser?.role === 'superadmin' && (
          <div className="bg-white border-2 border-black rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">User Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-3 px-4 font-medium">Username</th>
                    <th className="text-left py-3 px-4 font-medium">Full Name</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Created</th>
                    <th className="text-center py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">{user.username}</td>
                      <td className="py-3 px-4">{user.full_name}</td>
                      <td className="py-3 px-4">
                        {user.status === 'pending' ? (
                          <select
                            defaultValue={user.role}
                            className="border-2 border-gray-300 rounded px-2 py-1 text-sm"
                            id={`role-${idx}`}
                          >
                            <option value="worker">Worker</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-200">
                            {user.role.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.status === 'approved' ? 'bg-green-200 text-green-800' :
                          user.status === 'rejected' ? 'bg-red-200 text-red-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {user.status === 'pending' && (
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => {
                                const roleSelect = document.getElementById(`role-${idx}`);
                                handleUserAction(user, 'approved', roleSelect.value);
                              }}
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUserAction(user, 'rejected', user.role)}
                              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
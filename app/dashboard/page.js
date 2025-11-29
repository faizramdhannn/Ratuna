"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, ClipboardList, Boxes, Users, List, BarChart3 } from 'lucide-react';
import OrderTab from '@/components/order/OrderTab';
import OrderListTab from '@/components/order/OrderListTab';
import MasterItemTab from '@/components/MasterItemTab';
import ShoppingListTab from '@/components/ShoppingListTab';
import StockTab from '@/components/StockTab';
import UsersTab from '@/components/UsersTab';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [currentUser, setCurrentUser] = useState(null);
  const [masterItems, setMasterItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCurrentUser();
    fetchMasterItems();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  useEffect(() => {
    window.refreshStocks = fetchStocks;
    return () => {
      delete window.refreshStocks;
    };
  }, []);

  const canAccessTab = (tab) => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    if (currentUser.role === 'admin') return ['analytics', 'order', 'orderlist', 'master', 'shopping', 'stock'].includes(tab);
    if (currentUser.role === 'worker') return ['order', 'orderlist'].includes(tab);
    return false;
  };

  return (
    <div className="min-h-screen bg-white">
      {message.text && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-black text-white' : 'bg-red-600 text-white'
        }`}>
          {message.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {canAccessTab('analytics') && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'analytics' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
          )}
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
          {canAccessTab('orderlist') && (
            <button
              onClick={() => setActiveTab('orderlist')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'orderlist' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <List className="w-5 h-5" />
              <span>Order List</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'analytics' && (
          <AnalyticsDashboard onMessage={showMessage} />
        )}

        {activeTab === 'order' && (
          <OrderTab
            masterItems={masterItems}
            stocks={stocks}
            categories={categories}
            currentUser={currentUser}
            onMessage={showMessage}
          />
        )}
        
        {activeTab === 'orderlist' && (
          <OrderListTab onMessage={showMessage} />
        )}
        
        {activeTab === 'master' && (
          <MasterItemTab
            masterItems={masterItems}
            categories={categories}
            onRefresh={fetchMasterItems}
            onMessage={showMessage}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingListTab onMessage={showMessage} />
        )}

        {activeTab === 'stock' && (
          <StockTab
            stocks={stocks}
            currentUser={currentUser}
            onRefresh={fetchStocks}
            onMessage={showMessage}
          />
        )}

        {activeTab === 'users' && currentUser?.role === 'superadmin' && (
          <UsersTab
            users={users}
            onRefresh={fetchUsers}
            onMessage={showMessage}
          />
        )}
      </div>
    </div>
  );
}
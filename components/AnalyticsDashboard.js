'use client';

import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, ShoppingCart, CreditCard, DollarSign, Package } from 'lucide-react';

export default function AnalyticsDashboard({ onMessage }) {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalItems: 0,
    averageOrder: 0,
    qrisRevenue: 0,
    cashRevenue: 0,
    qrisOrders: 0,
    cashOrders: 0,
    topItems: []
  });

  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(lastWeek.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchOrders();
    }
  }, [startDate, endDate, paymentFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      
      if (data.success) {
        const filteredOrders = filterOrders(data.data);
        setOrders(filteredOrders);
        calculateAnalytics(filteredOrders);
      }
    } catch (error) {
      onMessage('error', 'Gagal mengambil data orders');
    }
    setLoading(false);
  };

  const filterOrders = (ordersData) => {
    return ordersData.filter(order => {
      const orderDate = new Date(order.created_at);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      const isInDateRange = orderDate >= start && orderDate <= end;
      const matchesPayment = paymentFilter === 'all' || order.payment_method === paymentFilter;
      
      return isInDateRange && matchesPayment;
    });
  };

  const calculateAnalytics = (ordersData) => {
    const orderGroups = {};
    ordersData.forEach(order => {
      if (!orderGroups[order.order_id]) {
        orderGroups[order.order_id] = {
          order_id: order.order_id,
          payment_method: order.payment_method,
          items: [],
          total: 0
        };
      }
      orderGroups[order.order_id].items.push(order);
      orderGroups[order.order_id].total += parseInt(order.total_amount || 0);
    });

    const uniqueOrders = Object.values(orderGroups);
    
    const totalRevenue = uniqueOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = uniqueOrders.length;
    const totalItems = ordersData.reduce((sum, order) => sum + parseInt(order.quantity_item || 0), 0);
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const qrisOrders = uniqueOrders.filter(o => o.payment_method === 'QRIS');
    const cashOrders = uniqueOrders.filter(o => o.payment_method === 'Cash');
    const qrisRevenue = qrisOrders.reduce((sum, order) => sum + order.total, 0);
    const cashRevenue = cashOrders.reduce((sum, order) => sum + order.total, 0);
    
    const itemSales = {};
    ordersData.forEach(order => {
      if (!itemSales[order.item_name]) {
        itemSales[order.item_name] = {
          name: order.item_name,
          quantity: 0,
          revenue: 0
        };
      }
      itemSales[order.item_name].quantity += parseInt(order.quantity_item || 0);
      itemSales[order.item_name].revenue += parseInt(order.total_amount || 0);
    });
    
    const topItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    setAnalytics({
      totalRevenue,
      totalOrders,
      totalItems,
      averageOrder,
      qrisRevenue,
      cashRevenue,
      qrisOrders: qrisOrders.length,
      cashOrders: cashOrders.length,
      topItems
    });
  };

  const StatCard = ({ icon: Icon, label, value, color, subtitle }) => (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-black transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color || 'text-black'}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color === 'text-green-600' ? 'bg-green-100' : 
                                          color === 'text-blue-600' ? 'bg-blue-100' : 
                                          color === 'text-purple-600' ? 'bg-purple-100' : 
                                          'bg-gray-100'}`}>
          <Icon className={`w-6 h-6 ${color || 'text-gray-600'}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-black rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <label className="block text-sm font-medium mb-2">Metode Pembayaran</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
            >
              <option value="all">Semua</option>
              <option value="QRIS">QRIS</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="mt-4 w-full md:w-auto px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Penghasilan"
          value={`Rp ${analytics.totalRevenue.toLocaleString()}`}
          color="text-green-600"
        />
        
        <StatCard
          icon={ShoppingCart}
          label="Total Order"
          value={analytics.totalOrders}
          color="text-blue-600"
          subtitle={`${analytics.totalItems} items terjual`}
        />
        
        <StatCard
          icon={TrendingUp}
          label="Rata-rata Order"
          value={`Rp ${Math.round(analytics.averageOrder).toLocaleString()}`}
          color="text-purple-600"
        />
        
        <StatCard
          icon={Calendar}
          label="Periode"
          value={`${analytics.totalOrders} transaksi`}
          subtitle={`${startDate} s/d ${endDate}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-black transition-all">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">QRIS</h3>
              <p className="text-sm text-gray-600">{analytics.qrisOrders} transaksi</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            Rp {analytics.qrisRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {analytics.totalRevenue > 0 
              ? `${((analytics.qrisRevenue / analytics.totalRevenue) * 100).toFixed(1)}% dari total`
              : '0% dari total'}
          </p>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-black transition-all">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Cash</h3>
              <p className="text-sm text-gray-600">{analytics.cashOrders} transaksi</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">
            Rp {analytics.cashRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {analytics.totalRevenue > 0 
              ? `${((analytics.cashRevenue / analytics.totalRevenue) * 100).toFixed(1)}% dari total`
              : '0% dari total'}
          </p>
        </div>
      </div>

      <div className="bg-white border-2 border-black rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Package className="w-6 h-6" />
          <h3 className="text-xl font-bold">Top 5 Item Terlaris</h3>
        </div>
        
        {analytics.topItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Tidak ada data penjualan
          </div>
        ) : (
          <div className="space-y-3">
            {analytics.topItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-black text-white rounded-full font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.quantity} item terjual</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">Rp {item.revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Total Revenue</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
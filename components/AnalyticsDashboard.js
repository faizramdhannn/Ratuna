'use client';
import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, ShoppingCart, CreditCard, DollarSign, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';

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
    topItems: [],
    totalCosts: 0,
    totalProfit: 0,
    totalShoppingCosts: 0,
    shoppingByCategory: {
      Karyawan: 0,
      Bahan: 0,
      Operasional: 0,
      Marketing: 0,
      Zakat: 0
    },
    // Breakdown biaya dari master data
    totalHPP: 0,
    totalOperasional: 0,
    totalWorker: 0,
    totalMarketing: 0,
    totalNetSales: 0
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
        await calculateAnalytics(filteredOrders);
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

  const calculateAnalytics = async (ordersData) => {
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

    // Fetch master items untuk mendapatkan biaya per item
    let totalHPP = 0;
    let totalOperasional = 0;
    let totalWorker = 0;
    let totalMarketing = 0;
    let totalNetSales = 0;

    try {
      const masterRes = await fetch('/api/master-items');
      const masterData = await masterRes.json();
      
      if (masterData.success) {
        const masterItems = masterData.data;
        
        // Hitung biaya berdasarkan items yang terjual
        ordersData.forEach(order => {
          const masterItem = masterItems.find(m => m.item_name === order.item_name);
          if (masterItem) {
            const quantity = parseInt(order.quantity_item || 0);
            totalHPP += (parseFloat(masterItem.hpp || 0) * quantity);
            totalOperasional += (parseFloat(masterItem.operasional || 0) * quantity);
            totalWorker += (parseFloat(masterItem.worker || 0) * quantity);
            totalMarketing += (parseFloat(masterItem.marketing || 0) * quantity);
            totalNetSales += (parseFloat(masterItem.net_sales || 0) * quantity);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching master items:', error);
    }
    
    // Fetch shopping list data untuk total pengeluaran
    let totalShoppingCosts = 0;
    let shoppingByCategory = {
      Karyawan: 0,
      Bahan: 0,
      Operasional: 0,
      Marketing: 0,
      Zakat: 0
    };
    
    try {
      const shoppingRes = await fetch('/api/shopping-list');
      const shoppingData = await shoppingRes.json();
      
      if (shoppingData.success) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        // Filter shopping list berdasarkan tanggal yang sama dengan orders
        shoppingData.data
          .filter(item => {
            const itemDate = new Date(item.shopping_date);
            return itemDate >= start && itemDate <= end;
          })
          .forEach(item => {
            const price = parseFloat(item.price || 0);
            totalShoppingCosts += price;
            
            // Group by category
            if (item.category && shoppingByCategory.hasOwnProperty(item.category)) {
              shoppingByCategory[item.category] += price;
            }
          });
      }
    } catch (error) {
      console.error('Error fetching shopping list:', error);
    }
    
    // Total costs = total shopping list (sudah include semua biaya)
    const totalCosts = totalShoppingCosts;
    const totalProfit = totalRevenue - totalCosts;

    setAnalytics({
      totalRevenue,
      totalOrders,
      totalItems,
      averageOrder,
      qrisRevenue,
      cashRevenue,
      qrisOrders: qrisOrders.length,
      cashOrders: cashOrders.length,
      topItems,
      totalCosts,
      totalProfit,
      totalShoppingCosts,
      shoppingByCategory,
      totalHPP,
      totalOperasional,
      totalWorker,
      totalMarketing,
      totalNetSales
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const StatCard = ({ icon: Icon, label, value, color, subtitle }) => (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-black transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-600 mb-1">{label}</p>
          <p className={`text-xl font-bold ${color || 'text-black'}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${color === 'text-green-600' ? 'bg-green-100' : 
                                          color === 'text-blue-600' ? 'bg-blue-100' : 
                                          color === 'text-purple-600' ? 'bg-purple-100' : 
                                          'bg-gray-100'}`}>
          <Icon className={`w-5 h-5 ${color || 'text-gray-600'}`} />
        </div>
      </div>
    </div>
  );

  // Prepare data for bar chart - breakdown by shopping category
  const costBreakdownData = [
    { name: 'Karyawan', value: analytics.shoppingByCategory.Karyawan, color: '#2563eb', label: 'Biaya Karyawan' },
    { name: 'Bahan', value: analytics.shoppingByCategory.Bahan, color: '#059669', label: 'Biaya Bahan Baku' },
    { name: 'Operasional', value: analytics.shoppingByCategory.Operasional, color: '#ea580c', label: 'Biaya Operasional' },
    { name: 'Marketing', value: analytics.shoppingByCategory.Marketing, color: '#ca8a04', label: 'Biaya Marketing' },
    { name: 'Zakat', value: analytics.shoppingByCategory.Zakat, color: '#7c3aed', label: 'Zakat' }
  ].filter(item => item.value > 0);

  const totalCostSum = costBreakdownData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = totalCostSum > 0 ? ((data.value / totalCostSum) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white border-2 border-gray-300 rounded-lg p-3 shadow-lg">
          <p className="font-bold text-gray-900">{data.payload.name}</p>
          <p className="text-sm text-gray-600">Rp {data.value.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{percentage}% dari total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl text-center font-bold mb-4">Analytics Dashboard</h2>
        
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

      {/* BARIS 1: Diagram Bar Chart Breakdown Biaya dari Shopping List */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Breakdown Pengeluaran</h3>
          <div className="text-right">
            <p className="text-xs text-gray-600">Total Pengeluaran</p>
            <p className="text-xl font-bold">Rp {totalCostSum.toLocaleString()}</p>
          </div>
        </div>
        {costBreakdownData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Belum ada data biaya
          </div>
        ) : (
          <div className="w-full">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart 
                data={costBreakdownData} 
                layout="vertical"
                margin={{ top: 10, right: 60, left: 100, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => `Rp ${(value / 1000).toFixed(0)}k`}
                  style={{ fontSize: '11px', fill: '#6b7280' }}
                  tick={{ dy: 5 }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={90}
                  style={{ fontSize: '13px', fontWeight: '600', fill: '#374151' }}
                  tick={{ dx: -5 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                  {costBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Percentage Labels */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-4 border-t-2 border-gray-200">
              {costBreakdownData.map((item, idx) => {
                const percentage = totalCostSum > 0 ? ((item.value / totalCostSum) * 100).toFixed(1) : 0;
                return (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-4 h-4 rounded flex-shrink-0 mt-0.5" style={{ backgroundColor: item.color }}></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                      <p className="text-gray-600 text-xs">{percentage}% dari total</p>
                      <p className="text-gray-500 text-xs font-medium">Rp {item.value.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* BARIS BARU: Breakdown Biaya dari Master Data */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-6">Breakdown Biaya dari Penjualan (Master Data)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-lg p-5">
            <p className="text-sm text-red-700 font-medium mb-2">Total HPP</p>
            <p className="text-2xl font-bold text-red-900">
              Rp {analytics.totalHPP.toLocaleString()}
            </p>
            <p className="text-xs text-red-600 mt-1">
              Harga Pokok Penjualan
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg p-5">
            <p className="text-sm text-orange-700 font-medium mb-2">Total Operasional</p>
            <p className="text-2xl font-bold text-orange-900">
              Rp {analytics.totalOperasional.toLocaleString()}
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Biaya Operasional
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-5">
            <p className="text-sm text-blue-700 font-medium mb-2">Total Worker</p>
            <p className="text-2xl font-bold text-blue-900">
              Rp {analytics.totalWorker.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Biaya Karyawan
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-lg p-5">
            <p className="text-sm text-yellow-700 font-medium mb-2">Total Marketing</p>
            <p className="text-2xl font-bold text-yellow-900">
              Rp {analytics.totalMarketing.toLocaleString()}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Biaya Marketing
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-5">
            <p className="text-sm text-green-700 font-medium mb-2">Total Net Sales</p>
            <p className="text-2xl font-bold text-green-900">
              Rp {analytics.totalNetSales.toLocaleString()}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Penjualan Bersih
            </p>
          </div>
        </div>
        
        {/* Total dari Master Data */}
        <div className="mt-4 pt-4 border-t-2 border-gray-200">
          <div className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg">
            <span className="text-lg font-bold text-gray-800">Total Biaya dari Penjualan:</span>
            <span className="text-2xl font-bold text-gray-900">
              Rp {(analytics.totalHPP + analytics.totalOperasional + analytics.totalWorker + analytics.totalMarketing + analytics.totalNetSales).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* BARIS 2: Total Penghasilan, Total Order, Rata-rata Order, Periode */}
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
          subtitle={`${formatDateShort(startDate)} - ${formatDateShort(endDate)}`}
        />
      </div>

      {/* BARIS 3: QRIS dan Cash */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-black transition-all">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-base">QRIS</h3>
              <p className="text-xs text-gray-600">{analytics.qrisOrders} transaksi</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            Rp {analytics.qrisRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {analytics.totalRevenue > 0 
              ? `${((analytics.qrisRevenue / analytics.totalRevenue) * 100).toFixed(1)}% dari total`
              : '0% dari total'}
          </p>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-black transition-all">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-base">Cash</h3>
              <p className="text-xs text-gray-600">{analytics.cashOrders} transaksi</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">
            Rp {analytics.cashRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {analytics.totalRevenue > 0 
              ? `${((analytics.cashRevenue / analytics.totalRevenue) * 100).toFixed(1)}% dari total`
              : '0% dari total'}
          </p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Ringkasan Keuangan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
            <p className="text-xs text-green-700 mb-2 font-medium">Total Pendapatan</p>
            <p className="text-2xl font-bold text-green-900">
              Rp {analytics.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
            <p className="text-xs text-red-700 mb-2 font-medium">Total Pengeluaran</p>
            <p className="text-2xl font-bold text-red-900">
              Rp {analytics.totalCosts.toLocaleString()}
            </p>
          </div>
          <div className={`${analytics.totalProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border-2 rounded-lg p-4 text-center`}>
            <p className={`text-xs ${analytics.totalProfit >= 0 ? 'text-blue-700' : 'text-red-700'} mb-2 font-medium`}>
              Keuntungan Bersih
            </p>
            <p className={`text-2xl font-bold ${analytics.totalProfit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
              Rp {analytics.totalProfit.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {analytics.totalRevenue > 0 
                ? `${((analytics.totalProfit / analytics.totalRevenue) * 100).toFixed(1)}% profit margin`
                : '0% profit margin'}
            </p>
          </div>
        </div>
      </div>

      {/* Top Items Section */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
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
'use client';

import { useState, useEffect } from 'react';
import { Eye, X, Calendar, User, CreditCard, Package, FileText } from 'lucide-react';
import SearchBar from '../common/SearchBar';

export default function OrderListTab({ onMessage }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/list');
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      onMessage('error', 'Gagal mengambil data orders');
    }
    setLoading(false);
  };

  const fetchOrderDetail = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/list?orderId=${orderId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedOrder(data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      onMessage('error', 'Gagal mengambil detail order');
    }
  };

  const filteredOrders = orders.filter(order => 
    order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.cashier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="bg-white border-2 border-black rounded-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Daftar Order</h2>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all"
          >
            Refresh
          </button>
        </div>

        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari order (ID, Kasir, Customer)..."
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'Tidak ada order ditemukan' : 'Belum ada order'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order, idx) => (
              <div
                key={idx}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-black transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-bold text-lg">{order.order_id}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.payment_method === 'QRIS' 
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {order.payment_method}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>Kasir: {order.cashier_name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>Customer: {order.customer_name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Package className="w-4 h-4" />
                        <span>{order.total_items} item(s)</span>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm flex items-start space-x-2">
                        <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-800">{order.notes}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Total Pembayaran</p>
                        <p className="text-xl font-bold">
                          Rp {order.total_amount.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => fetchOrderDetail(order.order_id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Detail</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Detail Order</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Order Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order ID</p>
                  <p className="font-bold">{selectedOrder.order_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tanggal</p>
                  <p className="font-bold">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Kasir</p>
                  <p className="font-bold">{selectedOrder.cashier_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Customer</p>
                  <p className="font-bold">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Metode Pembayaran</p>
                  <p className="font-bold">{selectedOrder.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Item</p>
                  <p className="font-bold">{selectedOrder.total_items} item(s)</p>
                </div>
              </div>
              
              {selectedOrder.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2 flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Notes</span>
                  </p>
                  <p className="text-sm bg-white p-3 rounded border border-gray-200">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="mb-6">
              <h4 className="font-bold text-lg mb-3">Item yang Dibeli</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <div>
                      <p className="font-medium">{item.item_name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} x Rp {parseInt(item.price).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-bold">
                      Rp {parseInt(item.subtotal).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">Rp {selectedOrder.total_amount.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold">Rp {selectedOrder.total_amount.toLocaleString()}</span>
                  </div>
                </div>
                {selectedOrder.payment_method === 'Cash' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bayar</span>
                      <span>Rp {parseInt(selectedOrder.cash_paid).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Kembali</span>
                      <span className="text-green-600 font-medium">
                        Rp {parseInt(selectedOrder.change).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full mt-6 px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
'use client';

import { useState, useMemo, useRef } from 'react';
import SearchBar from '../common/SearchBar';
import CategoryFilter from '../common/CategoryFilter';
import MenuItemCard from './MenuItemCard';
import OrderCard from './OrderCard';
import PaymentModal from './PaymentModal';
import BillOrder from './BillOrder';
import { ShoppingCart, Printer, X } from 'lucide-react';

export default function OrderTab({ masterItems, stocks, categories, currentUser, onMessage }) {
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billData, setBillData] = useState(null);
  const billRef = useRef();

  const activeItems = masterItems.filter(item => item.status === 'active');

  const filteredItems = useMemo(() => {
    return activeItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeItems, selectedCategory, searchQuery]);

  const addToCart = (item) => {
    const stock = stocks.find(s => s.item_name === item.item_name);
    const currentQty = cart.find(c => c.item.item_name === item.item_name)?.quantity || 0;
    
    if (stock && parseInt(stock.quantity) <= currentQty) {
      onMessage('error', `Stock ${item.item_name} tidak mencukupi`);
      return;
    }

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
    onMessage('success', `${item.item_name} ditambahkan ke keranjang`);
  };

  const updateQuantity = (itemName, newQuantity) => {
    if (newQuantity < 1) return;
    
    const stock = stocks.find(s => s.item_name === itemName);
    if (stock && parseInt(stock.quantity) < newQuantity) {
      onMessage('error', `Stock tidak mencukupi. Tersedia: ${stock.quantity}`);
      return;
    }

    setCart(cart.map(c => 
      c.item.item_name === itemName 
        ? { ...c, quantity: newQuantity }
        : c
    ));
  };

  const removeFromCart = (itemName) => {
    setCart(cart.filter(c => c.item.item_name !== itemName));
    onMessage('success', 'Item dihapus dari keranjang');
  };

  const calculateTotal = () => {
    return cart.reduce((sum, c) => sum + (c.item.hpj * c.quantity), 0);
  };

  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      onMessage('error', 'Keranjang masih kosong');
      return;
    }

    if (!customerName.trim()) {
      onMessage('error', 'Nama customer harus diisi');
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async (paymentData) => {
    setLoading(true);
    
    const orderId = `RTN-${Date.now().toString(36).toUpperCase()}`;
    const totalAmount = calculateTotal();
    
    try {
      for (const cartItem of cart) {
        const orderData = {
          order_id: orderId,
          item_name: cartItem.item.item_name,
          quantity_item: cartItem.quantity,
          total_amount: cartItem.item.hpj * cartItem.quantity,
          cashier_name: currentUser.username,
          customer_name: customerName.trim(),
          payment_method: paymentData.paymentMethod,
          cash_paid: paymentData.cashPaid,
          change: paymentData.change,
          notes_order: paymentData.notes || ''
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

      const billInfo = {
        order_id: orderId,
        created_at: new Date().toISOString(),
        cashier_name: currentUser.username,
        customer_name: customerName.trim(),
        total_amount: totalAmount,
        payment_method: paymentData.paymentMethod,
        cash_paid: paymentData.cashPaid,
        change: paymentData.change,
        notes: paymentData.notes || ''
      };

      const billItems = cart.map(c => ({
        item_name: c.item.item_name,
        quantity: c.quantity,
        price: c.item.hpj,
        subtotal: c.item.hpj * c.quantity
      }));

      setBillData({ orderData: billInfo, items: billItems });

      onMessage('success', `Checkout berhasil! Order ID: ${orderId}`);
      
      setCart([]);
      setCustomerName('');
      setShowPaymentModal(false);
      setShowBillModal(true);
      
      if (window.refreshStocks) window.refreshStocks();
    } catch (error) {
      onMessage('error', error.message);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('bill-print-area');
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Bill</title>
        <style>
          @page { 
            size: 58mm auto; 
            margin: 0; 
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 9pt;
            line-height: 1.3;
            width: 58mm;
            padding: 3mm;
          }
          .bill-logo {
            text-align: center;
            margin-bottom: 3mm;
          }
          .logo-img {
            height: 35px;
            max-width: 50mm;
          }
          .bill-header {
            text-align: center;
            margin-bottom: 3mm;
          }
          .store-name {
            font-size: 13pt;
            font-weight: bold;
            margin-bottom: 2mm;
          }
          .store-address {
            font-size: 8pt;
            line-height: 1.3;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 2mm 0;
          }
          .info-table, .item-table, .total-table {
            width: 100%;
            border-collapse: collapse;
          }
          .info-table td, .item-table td, .total-table td {
            font-size: 8pt;
            padding: 1mm 0;
          }
          .info-label {
            width: 20mm;
            font-weight: 600;
          }
          .item-name {
            font-weight: bold;
            font-size: 9pt;
            margin-bottom: 1mm;
          }
          .item-subtotal {
            text-align: right;
            font-weight: 600;
          }
          .bill-notes {
            font-size: 8pt;
            padding: 2mm;
            background: #f5f5f5;
            margin: 2mm 0;
          }
          .total-main-row td {
            font-size: 11pt;
            font-weight: bold;
            padding: 2mm 0;
          }
          .text-right {
            text-align: right;
            font-weight: 600;
          }
          .bill-footer {
            text-align: center;
            font-size: 9pt;
            font-weight: bold;
            margin-top: 3mm;
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      onMessage('success', 'Bill berhasil dicetak!');
    }, 250);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="bg-white border-2 border-black rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Menu</h2>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cari menu..."
              />
            </div>

            <div className="mb-6">
              <CategoryFilter
                categories={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  Tidak ada menu ditemukan
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const stock = stocks.find(s => s.item_name === item.item_name);
                  const stockQty = parseInt(stock?.quantity || 0);

                  return (
                    <MenuItemCard
                      key={idx}
                      item={item}
                      stockQty={stockQty}
                      onClick={addToCart}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white border-2 border-black rounded-lg p-6 sticky top-4">
            <div className="flex items-center space-x-2 mb-4">
              <ShoppingCart className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Keranjang</h2>
            </div>
            
            <div className="mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Kasir</label>
                <input
                  type="text"
                  value={currentUser?.username || ''}
                  disabled
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Nama Customer *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  placeholder="Masukkan nama customer"
                />
              </div>
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
                <span className="text-2xl font-bold">Rp {calculateTotal().toLocaleString('id-ID')}</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutClick}
              disabled={loading || cart.length === 0}
              className="w-full bg-black text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          totalAmount={calculateTotal()}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handlePaymentConfirm}
          loading={loading}
        />
      )}

      {showBillModal && billData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 no-print">
              <h3 className="text-2xl font-bold">Bill Order</h3>
              <button
                onClick={() => setShowBillModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="border-2 border-gray-200 rounded-lg mb-6">
              <BillOrder 
                ref={billRef}
                orderData={billData.orderData}
                items={billData.items}
              />
            </div>

            <div className="flex space-x-3 no-print">
              <button
                onClick={() => setShowBillModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition-all"
              >
                Tutup
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-all flex items-center justify-center space-x-2"
              >
                <Printer className="w-5 h-5" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
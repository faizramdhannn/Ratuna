'use client';

import { forwardRef } from 'react';

const BillOrder = forwardRef(({ orderData, items }, ref) => {

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${dayName}, ${day} ${month} ${year} ${hours}:${minutes}`;
  };

  return (
    <div ref={ref} className="bg-white p-8 max-w-md mx-auto font-mono text-sm">
      {/* Logo */}
      <div className="flex justify-center mb-4">
        <img 
          src="/Logo_Ratuna.png" 
          alt="Ratuna Logo" 
          className="h-20 object-contain"
        />
      </div>

      {/* Store Info */}
      <div className="text-center mb-4 border-b-2 border-dashed border-gray-400 pb-4">
        <h1 className="font-bold text-lg mb-1">Ratuna</h1>
        <p className="text-xs leading-relaxed">
          Jl. Babakan Cichaeum No.73 RT 02 RW 21<br />
          Cimenyan, Kb.Bandung<br />
          No. Telp 088218639833
        </p>
      </div>

      {/* Order Info */}
      <div className="mb-4 pb-3 border-b-2 border-dashed border-gray-400">
        <div className="flex justify-between mb-1">
          <span>{formatDate(orderData.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir: {orderData.cashier_name}</span>
        </div>
        <div className="flex justify-between">
          <span>No: {orderData.order_id}</span>
        </div>
      </div>

      {/* Items */}
      <div className="mb-4 pb-3 border-b-2 border-dashed border-gray-400">
        {items.map((item, index) => (
          <div key={index} className="mb-3">
            <div className="flex justify-between font-bold">
              <span>{item.item_name}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>{item.quantity} x {parseInt(item.price).toLocaleString('id-ID')}</span>
              <span>Rp {parseInt(item.subtotal).toLocaleString('id-ID')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mb-4 pb-3 border-b-2 border-dashed border-gray-400">
        <div className="flex justify-between items-center">
          <span className="font-bold text-base">Total QTY: {items.reduce((sum, item) => sum + parseInt(item.quantity), 0)}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="font-bold text-base">Sub Total</span>
          <span className="font-bold">Rp {parseInt(orderData.total_amount).toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">Total</span>
          <span className="font-bold text-lg">Rp {parseInt(orderData.total_amount).toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span>Bayar ({orderData.payment_method})</span>
          <span>Rp {parseInt(orderData.payment_method === 'QRIS' ? orderData.total_amount : orderData.cash_paid).toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Kembali</span>
          <span>Rp {parseInt(orderData.change || 0).toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs">
        <p className="font-bold mb-2">Terimakasih Telah Berbelanja</p>
      </div>
    </div>
  );
});

BillOrder.displayName = 'BillOrder';

export default BillOrder;
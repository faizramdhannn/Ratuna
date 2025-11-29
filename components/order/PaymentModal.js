'use client';

import { useState } from 'react';

export default function PaymentModal({ totalAmount, onClose, onConfirm, loading }) {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cashAmount, setCashAmount] = useState('');
  const [notes, setNotes] = useState('');

  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    if (method === 'QRIS') {
      setCashAmount(totalAmount.toString());
    } else {
      setCashAmount('');
    }
  };

  const handleConfirm = () => {
    if (!paymentMethod) return;
    
    if (paymentMethod === 'Cash' && (!cashAmount || parseInt(cashAmount) < totalAmount)) {
      return;
    }

    const cashPaid = paymentMethod === 'Cash' ? parseInt(cashAmount) : totalAmount;
    const change = paymentMethod === 'Cash' ? cashPaid - totalAmount : 0;

    onConfirm({
      paymentMethod,
      cashPaid,
      change,
      notes: notes.trim()
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6 text-center">Pilih Metode Pembayaran</h3>
        
        {/* Total Amount */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-center">
          <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
          <p className="text-3xl font-bold">Rp {totalAmount.toLocaleString('id-ID')}</p>
        </div>

        <div className="space-y-4 mb-6">
          {/* QRIS Button */}
          <button
            onClick={() => handlePaymentMethodSelect('QRIS')}
            className={`w-full p-6 border-2 rounded-lg transition-all hover:border-black hover:shadow-lg ${
              paymentMethod === 'QRIS' ? 'border-black bg-gray-50' : 'border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg">QRIS</div>
                  <div className="text-sm text-gray-500">Scan QR Code</div>
                </div>
              </div>
              {paymentMethod === 'QRIS' && (
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>

          {/* Cash Button */}
          <button
            onClick={() => handlePaymentMethodSelect('Cash')}
            className={`w-full p-6 border-2 rounded-lg transition-all hover:border-black hover:shadow-lg ${
              paymentMethod === 'Cash' ? 'border-black bg-gray-50' : 'border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg">Tunai</div>
                  <div className="text-sm text-gray-500">Cash Payment</div>
                </div>
              </div>
              {paymentMethod === 'Cash' && (
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        </div>

        {/* Cash Input */}
        {paymentMethod === 'Cash' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium mb-2">Jumlah Uang</label>
            <input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-lg"
              placeholder={`Min: Rp ${totalAmount.toLocaleString('id-ID')}`}
              min={totalAmount}
            />
            {cashAmount && parseInt(cashAmount) >= totalAmount && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bayar:</span>
                  <span className="font-medium">Rp {parseInt(cashAmount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="text-green-600 font-bold">Kembali:</span>
                  <span className="text-green-600 font-bold">Rp {(parseInt(cashAmount) - totalAmount).toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Notes (Opsional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none resize-none"
            placeholder="Tambahkan catatan untuk order ini..."
            rows="3"
            maxLength="200"
          />
          <p className="text-xs text-gray-500 mt-1">{notes.length}/200 karakter</p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !paymentMethod || (paymentMethod === 'Cash' && (!cashAmount || parseInt(cashAmount) < totalAmount))}
            className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Bayar'}
          </button>
        </div>
      </div>
    </div>
  );
}
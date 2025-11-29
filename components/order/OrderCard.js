'use client';

import { Plus, Minus, Trash2 } from 'lucide-react';

export default function OrderCard({ item, quantity, onIncrease, onDecrease, onRemove }) {
  const total = (item.hpj || 0) * quantity;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-black transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg">{item.item_name}</h3>
          <p className="text-gray-600 text-sm">
            Rp {parseInt(item.hpj || 0).toLocaleString('id-ID')} / pcs
          </p>
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-1">
          <button
            onClick={onDecrease}
            disabled={quantity <= 1}
            className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-bold text-lg w-12 text-center">{quantity}</span>
          <button
            onClick={onIncrease}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">Total</p>
          <p className="font-bold text-lg">
            Rp {total.toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  );
}
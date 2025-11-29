export default function MenuItemCard({ item, stockQty, onClick }) {
  const isOutOfStock = stockQty === 0;

  return (
    <div
      onClick={() => !isOutOfStock && onClick(item)}
      className={`border-2 rounded-lg p-4 transition-all ${
        isOutOfStock 
          ? 'border-gray-200 opacity-50 cursor-not-allowed' 
          : 'border-gray-200 hover:border-black cursor-pointer hover:shadow-lg'
      }`}
    >
      <h3 className="font-bold text-lg mb-1 line-clamp-2">{item.item_name}</h3>
      <p className="text-xs text-gray-500 mb-2">{item.category}</p>
      <p className="text-xl font-bold text-black mb-1">
        Rp {parseInt(item.hpj || 0).toLocaleString('id-ID')}
      </p>
      <p className={`text-sm font-medium ${
        stockQty === 0 ? 'text-red-600' : 
        stockQty < 10 ? 'text-yellow-600' : 
        'text-green-600'
      }`}>
        Stock: {stockQty}
      </p>
      {isOutOfStock && (
        <div className="mt-2">
          <span className="inline-block px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded">
            HABIS
          </span>
        </div>
      )}
    </div>
  );
}
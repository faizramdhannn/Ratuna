export default function CategoryFilter({ categories, selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect('all')}
        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
          selected === 'all' 
            ? 'bg-black text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Semua
      </button>
      {categories.map((cat, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(cat.category_name)}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
            selected === cat.category_name 
              ? 'bg-black text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {cat.category_name}
        </button>
      ))}
    </div>
  );
}
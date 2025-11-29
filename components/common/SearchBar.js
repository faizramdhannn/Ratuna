import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = "Cari..." }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
      />
    </div>
  );
}
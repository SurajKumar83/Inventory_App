import { useState, useEffect } from 'react';

export default function SearchBar({ onSearch, placeholder = 'Search products...' }) {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, onSearch]);

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
      />
      <svg
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
    </div>
  );
}

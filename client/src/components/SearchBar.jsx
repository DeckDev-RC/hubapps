import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange }) => {
    return (
        <div className="relative max-w-2xl mx-auto mb-16 px-6">
            <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-apple-secondary" />
            </div>
            <input
                type="text"
                placeholder="Buscar aplicativos..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-14 pl-12 pr-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-apple-accent/50 focus:bg-white/10 transition-all text-lg placeholder:text-apple-secondary/50"
            />
        </div>
    );
};

export default SearchBar;

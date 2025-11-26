
import React, { useState, useEffect } from 'react';
import { LibraryItem } from '../types';
import { Button } from './Button';
import { LIBRARY_STORAGE_KEY, INITIAL_LIBRARY_DATA } from '../constants';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (item: LibraryItem) => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, onImport }) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    if (isOpen) {
      // Load from local storage or use initial data
      const savedLibrary = localStorage.getItem(LIBRARY_STORAGE_KEY);
      if (savedLibrary) {
        setItems(JSON.parse(savedLibrary));
      } else {
        setItems(INITIAL_LIBRARY_DATA as LibraryItem[]);
        localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(INITIAL_LIBRARY_DATA));
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['All', ...Array.from(new Set(items.map(item => item.category)))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-600 p-6 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-2xl font-bold">Community Library</h2>
            <p className="text-brand-100 text-sm">Discover and study notes shared by others</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                type="text" 
                placeholder="Search notes by title or description..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat 
                      ? 'bg-brand-600 text-white' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                    {item.category}
                  </div>
                  <span className="text-xs text-slate-400">{item.date}</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{item.description}</p>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {item.author.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-600">{item.author}</span>
                  </div>
                  <Button size="sm" onClick={() => onImport(item)} className="text-xs px-3 py-1.5">
                    Import Note
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No notes found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

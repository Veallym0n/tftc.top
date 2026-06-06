import React, { useEffect, useRef } from 'react';

interface SearchBarProps {
  isOpen: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
  resultCount: number | null;
  isGlobalSearching: boolean;
  onGlobalSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  isOpen,
  query,
  onQueryChange,
  onClose,
  resultCount,
  isGlobalSearching,
  onGlobalSearch,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-3 left-3 right-3 z-float pointer-events-auto animate-fade-in">
      <div className="flex items-center gap-2 bg-white border-2 border-memphis-dark rounded-xl shadow-memphis px-3 py-2.5">
        {/* Search icon */}
        <svg
          className="w-4 h-4 text-slate-400 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onGlobalSearch()}
          placeholder="GC码 / 名称 / 作者…"
          className="flex-1 text-sm font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-400 placeholder:font-normal min-w-0"
        />

        {/* Result count badge */}
        {resultCount != null && (
          <span className="shrink-0 text-xs font-black text-memphis-dark bg-memphis-yellow px-2 py-0.5 rounded-lg border-2 border-memphis-dark">
            {resultCount}
          </span>
        )}

        {/* Clear query */}
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="清除"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Global search button */}
        <button
          onClick={onGlobalSearch}
          disabled={!query.trim() || isGlobalSearching}
          title="搜索全部离线数据"
          className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border-2 transition-colors active:scale-95 ${
            isGlobalSearching
              ? 'border-memphis-dark bg-memphis-dark text-white cursor-wait'
              : query.trim()
              ? 'border-memphis-dark bg-memphis-blue text-white hover:bg-sky-400'
              : 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
          aria-label="全局搜索"
        >
          {isGlobalSearching ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7h16M4 12h10M4 17h7" />
            </svg>
          )}
        </button>

        {/* Close search bar */}
        <button
          onClick={onClose}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border-2 border-memphis-dark bg-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-colors active:scale-95"
          aria-label="关闭搜索"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SearchBar;

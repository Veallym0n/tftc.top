
import React, { useRef, useEffect } from 'react';
import { MapType } from '../../types';
import { MAP_LAYERS } from '../../constants';
import { IconMenu, IconLayers, IconLocate, IconExplore, IconSearch } from '../Icons';

interface MapControlsProps {
  mapType: MapType;
  onSetMapType: (type: MapType) => void;
  onOpenDrawer: () => void;
  isLocating: boolean;
  isFollowing: boolean;
  onToggleLocate: () => void;
  showLayerMenu: boolean;
  setShowLayerMenu: (show: boolean) => void;
  // Explore
  showExplore: boolean;
  isExploreMode: boolean;
  onToggleExplore: () => void;
  isSyncing: boolean;
  // Search
  isSearchOpen: boolean;
  onToggleSearch: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  onGlobalSearch: () => void;
  isGlobalSearching: boolean;
  resultCount: number | null;
  onCloseSearch: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  mapType,
  onSetMapType,
  onOpenDrawer,
  isLocating,
  isFollowing,
  onToggleLocate,
  showLayerMenu,
  setShowLayerMenu,
  showExplore,
  isExploreMode,
  onToggleExplore,
  isSyncing,
  isSearchOpen,
  onToggleSearch,
  query,
  onQueryChange,
  onGlobalSearch,
  isGlobalSearching,
  resultCount,
  onCloseSearch,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isSearchOpen]);
  return (
    <div className="absolute top-14 left-3 flex flex-col gap-3 pointer-events-auto z-float">
      {/* Menu Button */}
      <button 
        onClick={onOpenDrawer} 
        className="w-10 h-10 bg-white border-2 border-memphis-dark rounded-xl shadow-memphis flex items-center justify-center text-slate-700 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-memphis-lg active:translate-y-0.5 active:translate-x-0.5 active:shadow-memphis-sm transition-all duration-200"
        aria-label="Menu"
      >
        <IconMenu />
      </button>
      
      {/* Layers Button & Dropdown */}
      <div className="relative">
          <button 
            onClick={() => setShowLayerMenu(!showLayerMenu)} 
            className={`w-10 h-10 border-2 border-memphis-dark rounded-xl shadow-memphis flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-memphis-lg active:translate-y-0.5 active:translate-x-0.5 active:shadow-memphis-sm ${showLayerMenu ? 'bg-memphis-yellow text-slate-900' : 'bg-white text-slate-700'}`}
            aria-label="Map Layers"
          >
            <IconLayers />
          </button>
          
          {showLayerMenu && (
              <div className="absolute left-14 top-0 bg-white border-2 border-memphis-dark rounded-xl shadow-memphis w-48 py-2 text-sm animate-fade-in origin-top-left flex flex-col overflow-hidden">
                  <div className="px-4 py-2 text-xs font-black text-slate-900 uppercase tracking-wider border-b-2 border-slate-100 mb-1 bg-cream">
                      Map Style
                  </div>
                  {Object.entries(MAP_LAYERS).map(([key, config]) => (
                      <button 
                          key={key}
                          onClick={() => { onSetMapType(key as MapType); setShowLayerMenu(false); }}
                          className={`px-4 py-3 text-left hover:bg-memphis-blue hover:text-white flex items-center gap-3 transition-colors font-bold ${mapType === key ? 'text-memphis-blue bg-blue-50' : 'text-slate-600'}`}
                      >
                          <span className={`w-3 h-3 rounded-full border-2 border-memphis-dark ${mapType === key ? 'bg-memphis-blue' : 'bg-white'}`}></span>
                          {config.name}
                      </button>
                  ))}
              </div>
          )}
      </div>

      {/* Location Button */}
      <button 
        onClick={onToggleLocate} 
        className={`w-10 h-10 border-2 border-memphis-dark rounded-xl shadow-memphis flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-memphis-lg active:translate-y-0.5 active:translate-x-0.5 active:shadow-memphis-sm ${isLocating ? (isFollowing ? 'bg-memphis-blue text-white' : 'bg-sky-200 text-memphis-blue') : 'bg-white text-slate-700'}`}
        aria-label="Locate Me"
      >
        <IconLocate />
      </button>

      {/* Explore Button */}
      {showExplore && (
          <button 
            onClick={onToggleExplore}
            disabled={isSyncing} 
            className={`w-10 h-10 rounded-xl border-2 border-memphis-dark shadow-memphis flex items-center justify-center transition-all duration-200
              ${isSyncing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border-slate-300' 
                  : (isExploreMode 
                      ? 'bg-memphis-pink text-white hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-memphis-lg active:translate-y-0.5 active:translate-x-0.5 active:shadow-memphis-sm' // Active
                      : 'bg-white text-slate-700 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-memphis-lg active:translate-y-0.5 active:translate-x-0.5 active:shadow-memphis-sm' // Normal
                    )
              }
            `}
            aria-label="Explore Mode"
          >
            <div className={isSyncing ? 'animate-spin' : ''}>
                <IconExplore />
            </div>
          </button>
      )}

      {/* Search Button + inline search bar */}
      <div className="relative flex items-center gap-2">
        <button
          onClick={onToggleSearch}
          className={`w-10 h-10 border-2 border-memphis-dark rounded-xl shadow-memphis flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-memphis-lg active:translate-y-0.5 active:translate-x-0.5 active:shadow-memphis-sm ${(isSearchOpen || query.trim().length > 0) ? 'bg-memphis-pink text-white' : 'bg-white text-slate-700'}`}
          aria-label="Search"
        >
          <IconSearch />
        </button>

        {/* Inline search bar — slides in to the right */}
        {isSearchOpen && (
          <div className="flex items-center gap-1.5 bg-white border-2 border-memphis-dark rounded-xl shadow-memphis px-2.5 py-1.5 animate-fade-in">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onGlobalSearch()}
              placeholder="GC码 / 名称 / 作者"
              className="w-44 text-sm font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-400 placeholder:font-normal"
            />
            {resultCount != null && (
              <span className="text-xs font-black text-memphis-dark bg-memphis-yellow px-1.5 py-0.5 rounded-lg border-2 border-memphis-dark shrink-0">
                {resultCount}
              </span>
            )}
            {query && (
              <button
                onClick={() => onQueryChange('')}
                className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              onClick={onGlobalSearch}
              disabled={!query.trim() || isGlobalSearching}
              title="搜索全部离线数据"
              className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-lg border-2 transition-colors ${
                isGlobalSearching
                  ? 'border-memphis-dark bg-memphis-dark text-white cursor-wait'
                  : query.trim()
                  ? 'border-memphis-dark bg-memphis-blue text-white hover:bg-sky-400'
                  : 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              {isGlobalSearching ? (
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7h16M4 12h10M4 17h7" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapControls;


import React from 'react';
import { MapType } from '../../types';
import { MAP_LAYERS } from '../../constants';
import { IconMenu, IconLayers, IconLocate, IconExplore } from '../Icons';

interface MapControlsProps {
  mapType: MapType;
  onSetMapType: (type: MapType) => void;
  onOpenDrawer: () => void;
  isLocating: boolean;
  onToggleLocate: () => void;
  showLayerMenu: boolean;
  setShowLayerMenu: (show: boolean) => void;
  // Explore
  showExplore: boolean;
  isExploreMode: boolean;
  onToggleExplore: () => void;
  isSyncing: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({
  mapType,
  onSetMapType,
  onOpenDrawer,
  isLocating,
  onToggleLocate,
  showLayerMenu,
  setShowLayerMenu,
  showExplore,
  isExploreMode,
  onToggleExplore,
  isSyncing
}) => {
  return (
    <div className="absolute top-5 left-3 flex flex-col gap-3 pointer-events-auto z-float">
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
        className={`w-10 h-10 border-2 border-memphis-dark rounded-xl shadow-memphis flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-memphis-lg active:translate-y-0.5 active:translate-x-0.5 active:shadow-memphis-sm ${isLocating ? 'bg-memphis-blue text-white' : 'bg-white text-slate-700'}`}
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
    </div>
  );
};

export default MapControls;

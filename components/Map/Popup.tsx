
import React from 'react';
import { Geocache } from '../../types';
import { CONFIG } from '../../constants';
import { IconShare } from '../Icons';
import { openAppScheme } from '../../utils/geo';

interface PopupProps {
  cache: Geocache;
  lat: number;
  lng: number;
}

const Popup: React.FC<PopupProps> = ({ cache, lat, lng }) => {
  const containerName = CONFIG.containerTypes[cache.containerType] || 'Other';
  const typeConfig = CONFIG.cacheTypes[cache.geocacheType] || { name: 'Unknown', color: '#94a3b8' };
  
  // Format dates to YYYY-MM-DD
  const placedDate = cache.placedDate ? cache.placedDate.split(' ')[0] : '-';
  const foundDate = cache.lastFoundDate ? cache.lastFoundDate.split(' ')[0] : '-';

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `https://www.geocaching.com/geocache/${cache.code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        // Optional: show a toast or some feedback
      });
    }
  };

  const handleOpenApp = (app: 'amap' | 'baidu') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Use the original WGS84 coordinates (lat, lng) for conversion
    openAppScheme(lat, lng, cache.name, cache.code, app);
  };

  return (
    // Outer Container: Needs extra padding at bottom/right for the hard shadow to not get clipped by Leaflet's overflow handling if any
    <div className="pb-2 pr-2"> 
        <div className="bg-white w-[280px] font-sans text-slate-900 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.45)]">
          {/* Header Band */}
          <div 
            className="flex justify-between items-center px-3 py-2 border-b-2 border-black relative group" 
            style={{ backgroundColor: typeConfig.color }}
          >
            <span className="font-black text-white text-sm uppercase tracking-wider drop-shadow-md">
                {typeConfig.name}
            </span>
            
            <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-white/90 font-bold bg-black/20 px-1 rounded">
                    {cache.code}
                </span>
                
                {/* Share Button (Resized to be smaller) */}
                <button 
                  className="w-5 h-5 flex items-center justify-center bg-white/20 rounded hover:bg-white/40 text-white transition-colors js-map-action active:scale-95"
                  onClick={handleShare}
                  title="Copy Link"
                >
                   <div className="pointer-events-none transform scale-90">
                      <IconShare />
                   </div>
                </button>
            </div>
          </div>
          
          <div className="p-4 bg-white">
            {/* Title */}
            <a 
              href={`https://www.geocaching.com/geocache/${cache.code}`} 
              target="_blank" 
              rel="noreferrer" 
              className="block text-lg font-black text-slate-900 leading-tight mb-2 hover:underline decoration-2 underline-offset-2"
            >
              {cache.name}
            </a>

            {/* Owner */}
            <div className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-1">
                By <span className="text-black bg-slate-100 px-1 border border-black">
                <a href={`https://www.geocaching.com/p/?u=${cache.ownerUsername}`} target="_blank" rel="noreferer">
                {cache.ownerUsername}
                </a>
                </span>
            </div>

            {/* Stats Boxes (Memphis Style) */}
            <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center justify-center bg-memphis-yellow border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.45)]">
                    <span className="text-xs font-black">D: {cache.difficulty}</span>
                </div>
                <div className="flex items-center justify-center bg-memphis-green border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.45)]">
                    <span className="text-xs font-black">T: {cache.terrain}</span>
                </div>
                <div className="flex items-center justify-center bg-memphis-pink border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.45)]">
                    <span className="text-xs font-black uppercase">{containerName}</span>
                </div>
                {cache.favoritePoints > 0 && (
                    <div className="flex items-center justify-center bg-white border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.45)]">
                        <span className="text-xs font-black text-rose-500">♥ {cache.favoritePoints}</span>
                    </div>
                )}
            </div>

            {/* Dates (Subtle) */}
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-4 border-t-2 border-dashed border-slate-200 pt-2">
                <div>Placed: <span className="text-slate-600">{placedDate}</span></div>
                <div>Found: <span className="text-slate-600">{foundDate}</span></div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                className="py-2 bg-memphis-blue text-white rounded border-2 border-black font-black text-xs uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,0.45)] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.45)] hover:bg-sky-400 transition-all active:translate-y-0.5 active:shadow-none js-map-action"
                onClick={handleOpenApp('amap')}
              >
                高德 Amap
              </button>
              <button 
                className="py-2 bg-indigo-600 text-white rounded border-2 border-black font-black text-xs uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,0.45)] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.45)] hover:bg-indigo-700 transition-all active:translate-y-0.5 active:shadow-none js-map-action"
                onClick={handleOpenApp('baidu')}
              >
                百度 Baidu
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Popup;


import React from 'react';
import { Geocache } from '../../types';
import { CONFIG } from '../../constants';
import { IconShare } from '../Icons';
import { openAppScheme } from '../../utils/geo';
import { useMapStore } from '../../stores/useMapStore';

interface PopupProps {
  cache: Geocache;
  lat: number;
  lng: number;
}

const Popup: React.FC<PopupProps> = ({ cache, lat, lng }) => {
  const containerName = CONFIG.containerTypes[cache.containerType] || 'Other';
  const typeConfig = CONFIG.cacheTypes[cache.geocacheType] || { name: 'Unknown', color: '#94a3b8' };
  const openInApp = useMapStore((s) => s.settings.openInApp);
  const showToast = useMapStore((s) => s.showToast);
  const cacheUrl = openInApp
    ? `https://coord.info/${cache.code}`
    : `https://www.geocaching.com/geocache/${cache.code}`;
  
  // Format dates to YYYY-MM-DD
  const placedDate = cache.placedDate ? cache.placedDate.split(' ')[0] : '-';
  const foundDate = cache.lastFoundDate ? cache.lastFoundDate.split(' ')[0] : '-';

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `https://coord.info/${cache.code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('链接已复制');
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
            className="flex justify-between items-center px-3 py-1.5 border-b-2 border-black relative group" 
            style={{ backgroundColor: typeConfig.color }}
          >
            <span className="font-black text-white text-sm uppercase tracking-wider drop-shadow-md">
                {typeConfig.name}
            </span>
            
            <div className="flex items-center gap-2">
                <span className="bg-black/20 text-white text-[12px] px-1.5 py-0.5 rounded font-bold">
                    {cache.code}
                </span>
                
                {/* Share Button (Resized to be smaller) */}
                <button 
                  className="w-5 h-5 flex items-center justify-center bg-white/0 rounded hover:bg-white/40 text-white transition-colors js-map-action active:scale-95"
                  onClick={handleShare}
                  title="Copy Link"
                >
                   <div className="pointer-events-none transform scale-90">
                      <IconShare />
                   </div>
                </button>
            </div>
          </div>
          
          <div className="p-3.5 bg-white">
            {/* Title */}
            <a 
              href={cacheUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="block text-lg font-black text-slate-900 leading-tight mb-3 hover:underline decoration-2 underline-offset-42"
            >
              {cache.name}
            </a>

            {/* Owner */}
            <div className="text-sm  font-bold text-slate-500 mt-2 mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[12px] text-slate-400 tracking-wide">
                  By <span className="text-black px-1 italic tracking-wide border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] truncate max-w-32">
                  <a href={`https://www.geocaching.com/p/?u=${cache.ownerUsername}`} target="_blank" rel="noreferer">
                  {cache.ownerUsername}
                  </a>
                  </span>
                </div>
                <span className="bg-gray-50 border border-gray-200 px-1.5 py-0.5 text-[11px] font-bold italic text-gray-400">
                 {placedDate.toString().substring(0, 10)}
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

            {/* Dates + Action Buttons */}
            <div className="flex items-center justify-between border-t-2 border-dashed border-slate-200 pt-2 mb-0">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">
                  <div>Last Found </div>
                  <span className="text-slate-900 text-[11px] font-black">{foundDate.toString().substring(0, 10)}</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    className="px-2 py-1.5 bg-memphis-blue text-white border-2 border-black font-black text-[12px] uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,0.45)] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.45)] hover:bg-sky-400 transition-all active:translate-y-0.5 active:shadow-none js-map-action"
                    onClick={handleOpenApp('amap')}
                  >
                    高德地图
                  </button>
                  <button
                    className="px-2 py-1 bg-indigo-600 text-white border-2 border-black font-black text-[12px] uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,0.45)] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.45)] hover:bg-indigo-700 transition-all active:translate-y-0.5 active:shadow-none js-map-action"
                    onClick={handleOpenApp('baidu')}
                  >
                    百度地图
                  </button>
                </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Popup;


import React, { useState, useEffect, useRef } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Modal, defaultModalClasses } from '../../../libs/common/Modal';
import { cacheService } from '../../../services/cacheService';
import { Geocache } from '../../../types';
import { CONFIG } from '../../../constants';
import { eventService } from '../../../services/eventService';
import { useLanguageStore } from '../../../stores/useLanguageStore';

type SearchMode = 'CACHE' | 'LOG' | 'TRACKER' | 'IDLE';

const SearchCache = NiceModal.create(() => {
  const modal = useModal();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Geocache[]>([]);
  const [mode, setMode] = useState<SearchMode>('IDLE');
  const debounceRef = useRef<number | null>(null);
  
  const { t } = useLanguageStore();

  useEffect(() => {
      // Logic Analysis on Input Change
      const clean = input.trim().toUpperCase();
      
      if (!clean) {
          setMode('IDLE');
          setSuggestions([]);
          return;
      }

      // 1. Log URL (GL/TL)
      if (clean.startsWith('GL') || clean.startsWith('TL')) {
          setMode('LOG');
          setSuggestions([]);
          return;
      }

      // 2. Cache Autocomplete (GC)
      if (clean.startsWith('GC')) {
          setMode('CACHE');
          if (clean.length >= 4) {
              // Debounce search
              if (debounceRef.current) clearTimeout(debounceRef.current);
              debounceRef.current = window.setTimeout(async () => {
                 try {
                     const results = await cacheService.searchOfflineCachesByPrefix(clean);
                     setSuggestions(results);
                 } catch (e) {
                     console.error(e);
                     setSuggestions([]);
                 }
              }, 300);
          } else {
              setSuggestions([]);
          }
          return;
      }

      // 3. Fallback: Trackable (Anything else > 2 chars)
      if (clean.length > 2) {
          setMode('TRACKER');
          setSuggestions([]);
          return;
      }
      
      setMode('IDLE');
      setSuggestions([]);

  }, [input]);

  const handleJumpToCache = (cache: Geocache) => {
      eventService.emit('CACHE_SELECTED', cache);
      modal.remove();
      // Reset
      setInput('');
      setSuggestions([]);
  };

  const handleJumpToLog = () => {
      const code = input.trim().toUpperCase();
      window.open(`https://coord.info/${code}`, '_blank');
  };

  const handleJumpToTracker = () => {
      const code = input.trim().toUpperCase();
      window.open(`https://www.geocaching.com/track/details.aspx?tracker=${code}`, '_blank');
  };

  return (
    <Modal
      {...defaultModalClasses}
      isOpen={modal.visible}
      onClose={modal.remove}
      title={t('search.title')}
      footer={null} // No fixed footer, dynamic content
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase mb-1">{t('search.input.label')}</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('search.input.placeholder')}
            autoFocus
            className="w-full px-4 py-3 bg-cream border-2 border-memphis-dark rounded-xl focus:outline-none focus:ring-4 focus:ring-memphis-pink/20 transition-all font-mono text-lg uppercase placeholder:normal-case text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* --- UI State Rendering --- */}

        {/* 1. Log Mode */}
        {mode === 'LOG' && (
            <button
                onClick={handleJumpToLog}
                className="w-full py-4 bg-memphis-purple text-white font-bold rounded-xl border-2 border-memphis-dark shadow-memphis hover:bg-purple-500 hover:-translate-y-0.5 transition-all active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 animate-fade-in"
            >
                <span>📜</span> {t('search.btn.log')}
            </button>
        )}

        {/* 2. Tracker Mode */}
        {mode === 'TRACKER' && (
            <button
                onClick={handleJumpToTracker}
                className="w-full py-4 bg-memphis-green text-white font-bold rounded-xl border-2 border-memphis-dark shadow-memphis hover:bg-emerald-500 hover:-translate-y-0.5 transition-all active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 animate-fade-in"
            >
                <span>🏷️</span> {t('search.btn.tracker')}
            </button>
        )}

        {/* 3. Cache Mode (Autocomplete List) */}
        {mode === 'CACHE' && (
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto no-scrollbar -mx-2 px-2 pb-2">
                {input.length < 4 && (
                    <div className="text-center text-slate-400 text-sm font-bold py-4 animate-fade-in">
                        {t('search.type_more')}
                    </div>
                )}

                {input.length >= 4 && suggestions.length === 0 && (
                    <div className="text-center text-slate-400 text-sm font-bold py-4 animate-fade-in">
                        {t('search.empty')}
                    </div>
                )}

                {suggestions.map((cache) => (
                    <div 
                        key={cache.code}
                        onClick={() => handleJumpToCache(cache)}
                        className="bg-white rounded-xl border-2 border-memphis-dark shadow-memphis-sm p-3 cursor-pointer hover:bg-memphis-yellow hover:text-slate-900 transition-all animate-fade-in group active:scale-[0.98]"
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-mono text-xs font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded group-hover:bg-black">{cache.code}</span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-slate-800">
                                {CONFIG.cacheTypes[cache.geocacheType]?.name}
                            </span>
                        </div>
                        <div className="font-bold text-slate-800 text-sm leading-tight truncate">
                            {cache.name}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </Modal>
  );
});

export default SearchCache;

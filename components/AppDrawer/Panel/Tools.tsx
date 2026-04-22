
import React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import SmartCoords from '../Tools/SmartCoords';
import SearchCache from '../Tools/SearchCache';
import LocalOfflineFilterModal from '../../../features/filterSphere/LocalOfflineFilterModal';
import { useLanguageStore } from '../../../stores/useLanguageStore';

const Tools: React.FC = () => {
  const { t } = useLanguageStore();

  return (
    <div className="animate-fade-in space-y-4">
      <div className="text-xs font-black text-slate-400 mb-3 px-1 uppercase tracking-wider">{t('tools.title')}</div>
      
      <div className="grid gap-3">
        {/* Smart Coordinates Tool */}
        <button
          onClick={() => NiceModal.show(SmartCoords)}
          className="w-full flex items-center p-3 bg-white rounded-xl border-2 border-memphis-dark shadow-none hover:shadow-memphis hover:-translate-y-0.5 transition-all text-left group active:translate-y-0.5 active:shadow-none"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-4 shrink-0 bg-memphis-purple text-white border-2 border-memphis-dark transform -rotate-3 group-hover:rotate-0 transition-transform">
            🧭
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm group-hover:text-memphis-purple transition-colors">{t('tools.smart.title')}</div>
            <div className="text-xs text-slate-500 font-medium">{t('tools.smart.desc')}</div>
          </div>
        </button>

        {/* Search Cache Tool */}
        <button
          onClick={() => NiceModal.show(SearchCache)}
          className="w-full flex items-center p-3 bg-white rounded-xl border-2 border-memphis-dark shadow-none hover:shadow-memphis hover:-translate-y-0.5 transition-all text-left group active:translate-y-0.5 active:shadow-none"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-4 shrink-0 bg-memphis-blue text-white border-2 border-memphis-dark transform rotate-2 group-hover:rotate-0 transition-transform">
            🔍
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm group-hover:text-memphis-blue transition-colors">{t('tools.search.title')}</div>
            <div className="text-xs text-slate-500 font-medium">{t('tools.search.desc')}</div>
          </div>
        </button>

        <button
          onClick={() => NiceModal.show(LocalOfflineFilterModal)}
          className="w-full flex items-center p-3 bg-white rounded-xl border-2 border-memphis-dark shadow-none hover:shadow-memphis hover:-translate-y-0.5 transition-all text-left group active:translate-y-0.5 active:shadow-none"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-4 shrink-0 bg-memphis-yellow text-slate-900 border-2 border-memphis-dark transform -rotate-2 group-hover:rotate-0 transition-transform">
            🧪
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm group-hover:text-yellow-700 transition-colors">{t('tools.filter.title')}</div>
            <div className="text-xs text-slate-500 font-medium">{t('tools.filter.desc')}</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Tools;

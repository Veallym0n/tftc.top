import { useState } from 'react';
import NiceModal from '@ebay/nice-modal-react';

let filterLabModalPromise: Promise<typeof import('./FilterLabModal')> | null =
  null;

const loadFilterLabModal = () => {
  filterLabModalPromise ??= import('./FilterLabModal');
  return filterLabModalPromise;
};

export const FilterLabToolButton = () => {
  const [isFilterLabLoading, setIsFilterLabLoading] = useState(false);

  const handleOpenFilterLab = async () => {
    if (isFilterLabLoading) {
      return;
    }

    setIsFilterLabLoading(true);
    try {
      const { default: FilterLabModal } = await loadFilterLabModal();
      void NiceModal.show(FilterLabModal);
    } catch (error) {
      filterLabModalPromise = null;
      console.error('Failed to load Filter Lab', error);
    } finally {
      setIsFilterLabLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpenFilterLab}
      disabled={isFilterLabLoading}
      aria-busy={isFilterLabLoading}
      className="w-full flex items-center p-3 bg-white rounded-xl border-2 border-memphis-dark shadow-none hover:shadow-memphis hover:-translate-y-0.5 transition-all text-left group active:translate-y-0.5 active:shadow-none disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-4 shrink-0 bg-memphis-yellow text-slate-900 border-2 border-memphis-dark transform -rotate-2 group-hover:rotate-0 transition-transform">
        🧪
      </div>
      <div>
        <div className="font-bold text-slate-800 text-sm group-hover:text-yellow-700 transition-colors">
          筛选实验室
        </div>
        <div className="text-xs text-slate-500 font-medium">
          离线缓存规则筛选
        </div>
      </div>
    </button>
  );
};


import React, { useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Modal, defaultModalClasses } from '../../../libs/common/Modal';
import { useSyncStore } from '../../../stores/useSyncStore';
import { cacheService } from '../../../services/cacheService';
import { useLanguageStore } from '../../../stores/useLanguageStore';

interface CacheManagerModalProps {
  onCacheCleared?: () => void;
}

const CacheManagerModal = NiceModal.create(({ onCacheCleared }: CacheManagerModalProps) => {
  const modal = useModal();
  const { offlineMeta } = useSyncStore();
  const { t } = useLanguageStore();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleExportGpx = async () => {
    setLoading(true);
    try {
      await cacheService.exportOfflineGpx();
      showToast('GPX exported successfully');
    } catch (e: any) {
      showToast('Export failed: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to delete all offline map data?')) return;
    setLoading(true);
    try {
      await cacheService.clearOfflineData();
      showToast('Offline cache cleared');
      if (onCacheCleared) onCacheCleared(); // Notify parent to clear map
      modal.remove(); // Close modal on success
    } catch (e: any) {
      showToast('Error: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      {...defaultModalClasses}
      isOpen={modal.visible}
      onClose={modal.remove}
      title={t('settings.cache.title')}
      footer={
         <div className="w-full flex justify-between items-center">
             <div className="text-xs text-slate-400 font-bold">{toast}</div>
             <button onClick={modal.remove} className="px-4 py-2 text-slate-600 font-bold border-2 border-transparent hover:border-slate-200 rounded-lg transition-all">Close</button>
         </div>
      }
    >
       <div className="text-center py-2 relative">
           {loading && (
               <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
                   <div className="w-8 h-8 border-4 border-slate-200 border-t-memphis-blue rounded-full animate-spin"></div>
               </div>
           )}

           <div className="text-4xl mb-4 bg-memphis-yellow w-16 h-16 rounded-full flex items-center justify-center border-2 border-black mx-auto shadow-memphis-sm">📦</div>
           {offlineMeta.count > 0 ? (
               <>
                  <div className="text-2xl font-bold text-slate-800 mb-1">{offlineMeta.count.toLocaleString()}</div>
                  <div className="text-sm text-slate-500 mb-6">Caches Stored Offline</div>
                  <div className="bg-white rounded-xl p-3 mb-6 border-2 border-black shadow-memphis-sm">
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Last Synced</div>
                      <div className="font-mono font-bold text-slate-700">{offlineMeta.lastSync}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                      <button 
                          onClick={handleExportGpx}
                          disabled={loading}
                          className="py-3 bg-memphis-blue text-white font-bold rounded-xl border-2 border-black shadow-memphis hover:translate-y-px hover:shadow-memphis-sm transition-all flex items-center justify-center gap-2 active:translate-y-1 active:shadow-none disabled:opacity-50"
                      >
                          <span>⬇️</span> GPX
                      </button>
                      <button 
                          onClick={handleClearCache}
                          disabled={loading}
                          className="py-3 bg-red-400 text-white font-bold rounded-xl border-2 border-black shadow-memphis hover:translate-y-px hover:shadow-memphis-sm transition-all flex items-center justify-center gap-2 active:translate-y-1 active:shadow-none disabled:opacity-50"
                      >
                           <span>🗑️</span> Delete
                      </button>
                  </div>
               </>
           ) : (
               <div className="text-slate-500 py-4 font-bold">No offline data found.</div>
           )}
       </div>
    </Modal>
  );
});

export default CacheManagerModal;

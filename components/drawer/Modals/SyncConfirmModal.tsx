
import React, { useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Modal, defaultModalClasses } from '../../modals/Modal';
import { IconDownload } from '../../Icons';
import { useCacheStore } from '../../../stores/useCacheStore';
import { useAppStore } from '../../../stores/useAppStore';
import { cacheService } from '../../../services/cacheService';

interface SyncConfirmModalProps {
  onConfirm: (shouldUpdate: boolean) => void;
}

const SyncConfirmModal = NiceModal.create(({ onConfirm }: SyncConfirmModalProps) => {
  const modal = useModal();
  const { offlineMeta } = useCacheStore();
  const showToast = useAppStore((s) => s.showToast);
  const [busy, setBusy] = useState(false);

  const handleConfirm = (val: boolean) => {
    onConfirm(val);
    modal.remove();
  };

  const handleExportGpx = async () => {
    setBusy(true);
    try {
      await cacheService.exportOfflineGpx();
      showToast('GPX 已导出');
    } catch (e: any) {
      showToast('导出失败: ' + (e.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      {...defaultModalClasses}
      isOpen={modal.visible}
      onClose={modal.remove}
      title="离线数据管理"
      footer={
        <div className="flex gap-2 w-full">
          <button
            onClick={() => handleConfirm(false)}
            className="flex-1 px-4 py-2 border-2 border-black text-slate-700 font-bold rounded-xl hover:bg-slate-50 shadow-memphis-sm transition-all active:shadow-none active:translate-y-0.5"
          >
            使用缓存
          </button>
          <button
            onClick={() => handleConfirm(true)}
            className="flex-1 px-4 py-2 bg-memphis-green text-white font-bold rounded-xl border-2 border-black shadow-memphis hover:bg-emerald-400 transition-all active:shadow-none active:translate-y-0.5"
          >
            更新数据
          </button>
        </div>
      }
    >
      <div className="text-slate-600 leading-relaxed font-medium space-y-4">
        <div>
          <p className="mb-2">
            已缓存 <strong className="text-black bg-memphis-yellow px-1 border border-black rounded">{offlineMeta.count.toLocaleString()}</strong> 个藏点
          </p>
          <p className="text-sm text-slate-500">
            上次同步: {offlineMeta.lastSync}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            更新将从服务器重新下载最新数据，使用缓存将直接加载已有数据。
          </p>
        </div>

        <div className="border-t-2 border-slate-100 pt-3 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">导出数据</span>
          <button
            onClick={handleExportGpx}
            disabled={busy}
            title="导出 GPX"
            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-memphis-blue hover:bg-blue-50 rounded-lg border-2 border-transparent hover:border-memphis-dark transition-all disabled:opacity-30"
          >
            <IconDownload />
          </button>
        </div>
      </div>
    </Modal>
  );
});

export default SyncConfirmModal;

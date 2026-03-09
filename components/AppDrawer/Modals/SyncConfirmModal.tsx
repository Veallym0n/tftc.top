
import React from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Modal, defaultModalClasses } from '../../../libs/common/Modal';
import { useSyncStore } from '../../../stores/useSyncStore';

interface SyncConfirmModalProps {
  onConfirm: (shouldUpdate: boolean) => void;
}

const SyncConfirmModal = NiceModal.create(({ onConfirm }: SyncConfirmModalProps) => {
  const modal = useModal();
  const { offlineMeta } = useSyncStore();

  const handleConfirm = (val: boolean) => {
      onConfirm(val);
      modal.remove();
  };

  return (
    <Modal
       {...defaultModalClasses}
       isOpen={modal.visible}
       onClose={modal.remove}
       title="Update Offline Data"
       footer={
           <div className="flex gap-2 w-full">
              <button 
                onClick={() => handleConfirm(false)} 
                className="flex-1 px-4 py-2 border-2 border-black text-slate-700 font-bold rounded-xl hover:bg-slate-50 shadow-memphis-sm transition-all active:shadow-none active:translate-y-0.5"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleConfirm(true)} 
                className="flex-1 px-4 py-2 bg-memphis-green text-white font-bold rounded-xl border-2 border-black shadow-memphis hover:bg-emerald-400 transition-all active:shadow-none active:translate-y-0.5"
              >
                Update
              </button>
           </div>
       }
    >
        <div className="text-slate-600 leading-relaxed font-medium">
            <p className="mb-4">
                You have <strong className="text-black bg-memphis-yellow px-1 border border-black rounded">{offlineMeta.count.toLocaleString()}</strong> caches saved offline from <strong>{offlineMeta.lastSync}</strong>.
            </p>
            <p className="text-sm text-slate-500">
                Do you want to re-download the database? This will overwrite your existing local data.
            </p>
        </div>
    </Modal>
  );
});

export default SyncConfirmModal;

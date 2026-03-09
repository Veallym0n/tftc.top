
import React from 'react';
import { StoredGpx } from '../../../types';
import { IconTrash, IconDownload, IconSettings } from '../../Icons';
import { useSyncStore } from '../../../stores/useSyncStore';
import { useLanguageStore } from '../../../stores/useLanguageStore';

interface DatasetProps {
  gpxFiles: StoredGpx[];
  onLoadGpx: (gpx: StoredGpx) => void;
  onDeleteGpx: (id: number) => void;
  onFetchData: (type: string) => void;
}

const DataGroup = ({ title, items }: { title: string, items: any[] }) => (
  <div>
    <div className="text-xs font-black text-slate-400 mb-3 px-1 uppercase tracking-wider">{title}</div>
    <div className="grid gap-3">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={item.onClick}
          disabled={item.disabled}
          className={`w-full flex items-center p-3 bg-white rounded-xl border-2 border-memphis-dark transition-all text-left group ${item.disabled ? 'opacity-70 cursor-wait bg-slate-100' : 'hover:-translate-y-0.5 hover:shadow-memphis active:translate-y-0.5 active:shadow-none'}`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-4 shrink-0 border-2 border-memphis-dark ${item.color || 'bg-slate-100'}`}>
            {item.icon}
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm">{item.label}</div>
            <div className="text-xs text-slate-500 font-medium">{item.desc}</div>
          </div>
        </button>
      ))}
    </div>
  </div>
);

export const Dataset: React.FC<DatasetProps> = ({
  gpxFiles,
  onLoadGpx,
  onDeleteGpx,
  onFetchData
}) => {
  // Read state from Store
  const { status: syncStatus, offlineMeta } = useSyncStore();
  const { t } = useLanguageStore();

  // Determine description text based on state
  let loadAllDesc = t('data.heavy.none');
  let loadAllIcon: React.ReactNode = '📦';
  let loadAllColor = 'bg-slate-200 text-slate-600';
  let isSyncing = false;

  if (syncStatus === 'loading cache') {
    loadAllDesc = t('data.heavy.loading');
    loadAllIcon = <IconDownload />;
    loadAllColor = 'bg-memphis-blue text-white';
    isSyncing = true;
  } else if (syncStatus === 'processing cache data') {
    loadAllDesc = t('data.heavy.processing');
    loadAllIcon = <IconSettings />;
    loadAllColor = 'bg-memphis-yellow text-slate-900';
    isSyncing = true;
  } else if (offlineMeta.lastSync) {
    loadAllDesc = t('data.heavy.cached', { date: offlineMeta.lastSync, count: offlineMeta.count });
    loadAllIcon = '⚡';
    loadAllColor = 'bg-memphis-purple text-white';
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* GPX Files Section */}
      {gpxFiles.length > 0 && (
        <div>
          <div className="text-xs font-black text-slate-400 mb-3 px-1 uppercase tracking-wider">{t('data.gpx.title')}</div>
          <div className="grid gap-3">
            {gpxFiles.map((gpx) => (
              <div key={gpx.id} className="w-full flex items-center p-3 bg-white rounded-xl border-2 border-memphis-dark shadow-memphis hover:translate-x-1 hover:shadow-memphis-sm transition-all text-left group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-4 shrink-0 bg-orange-100 text-orange-600 border-2 border-memphis-dark">
                  📂
                </div>
                <div className="flex-1 min-w-0" onClick={() => onLoadGpx(gpx)}>
                  <div className="font-bold text-slate-800 text-sm truncate cursor-pointer">{gpx.name}</div>
                  <div className="text-xs text-slate-500 font-medium">{gpx.count} caches • {new Date(gpx.timestamp).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteGpx(gpx.id); }}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500 rounded-lg border-2 border-transparent hover:border-memphis-dark transition-all"
                >
                  <IconTrash />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataGroup title={t('data.disc.title')} items={[
        { label: t('data.disc.published'), desc: t('data.disc.published.desc'), icon: '🆕', color: 'bg-memphis-green text-white', onClick: () => onFetchData('by_published') },
        { label: t('data.disc.found'), desc: t('data.disc.found.desc'), icon: '🎯', color: 'bg-memphis-blue text-white', onClick: () => onFetchData('by_found') },
        { label: t('data.disc.history'), desc: t('data.disc.history.desc'), icon: '📅', color: 'bg-memphis-yellow text-slate-900', onClick: () => onFetchData('by_today') },
      ]} />
      <DataGroup title={t('data.spec.title')} items={[
        { label: t('data.spec.events'), desc: t('data.spec.events.desc'), icon: '🎪', color: 'bg-memphis-pink text-white', onClick: () => onFetchData('by_event') },
        { label: t('data.spec.ftf'), desc: t('data.spec.ftf.desc'), icon: '👑', color: 'bg-memphis-purple text-white', onClick: () => onFetchData('by_ftf') },
      ]} />
      <DataGroup title={t('data.heavy.title')} items={[
        {
          label: t('data.heavy.load'),
          desc: loadAllDesc,
          icon: loadAllIcon,
          color: loadAllColor,
          onClick: isSyncing ? undefined : () => onFetchData('all'),
          disabled: isSyncing
        },
      ]} />
    </div>
  );
};

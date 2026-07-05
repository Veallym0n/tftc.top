
import React from 'react';
import { StoredGpx } from '../../../types';
import { IconTrash, IconDownload, IconSettings } from '../../Icons';
import { useCacheStore } from '../../../stores/useCacheStore';
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
  const { syncStatus, offlineMeta } = useCacheStore();

  // Determine description text based on state
  let loadAllDesc: string = '约 10MB 数据下载';
  let loadAllIcon: React.ReactNode = '📦';
  let loadAllColor = 'bg-slate-200 text-slate-600';
  let isSyncing = false;

  if (syncStatus === 'loading cache') {
    loadAllDesc = '正在下载...';
    loadAllIcon = <IconDownload />;
    loadAllColor = 'bg-memphis-blue text-white';
    isSyncing = true;
  } else if (syncStatus === 'processing cache data') {
    loadAllDesc = '正在处理数据...';
    loadAllIcon = <IconSettings />;
    loadAllColor = 'bg-memphis-yellow text-slate-900';
    isSyncing = true;
  } else if (offlineMeta.lastSync) {
    loadAllDesc = `已缓存: ${offlineMeta.lastSync}, ${offlineMeta.count} 个藏点`;
    loadAllIcon = '⚡';
    loadAllColor = 'bg-memphis-purple text-white';
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* GPX Files Section */}
      {gpxFiles.length > 0 && (
        <div>
          <div className="text-xs font-black text-slate-400 mb-3 px-1 uppercase tracking-wider">GPX 轨迹</div>
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

      <DataGroup title="发现缓存" items={[
        { label: '最新发布', desc: '查看最近发布的藏点', icon: '🆕', color: 'bg-memphis-green text-white', onClick: () => onFetchData('by_published') },
        { label: '最近被找到', desc: '查看最近被发现的藏点', icon: '🎯', color: 'bg-memphis-blue text-white', onClick: () => onFetchData('by_found') },
        { label: '历史发现', desc: '查看今天被发现的藏点', icon: '📅', color: 'bg-memphis-yellow text-slate-900', onClick: () => onFetchData('by_today') },
      ]} />
      <DataGroup title="精选缓存" items={[
        { label: '活动缓存', desc: '当前活动期间的特殊藏点', icon: '🎪', color: 'bg-memphis-pink text-white', onClick: () => onFetchData('by_current_event') },
        { label: '等待首签 (FTF)', desc: '还没有被FTF的藏点', icon: '👑', color: 'bg-memphis-purple text-white', onClick: () => onFetchData('by_ftf') },
      ]} />
      {/* 全量数据 */}
      <div>
        <div className="text-xs font-black text-slate-400 mb-3 px-1 uppercase tracking-wider">全量数据</div>
        <button
          onClick={isSyncing ? undefined : () => onFetchData('all')}
          disabled={isSyncing}
          className={`w-full flex items-center p-3 bg-white rounded-xl border-2 border-memphis-dark transition-all text-left ${isSyncing ? 'opacity-70 cursor-wait bg-slate-100' : 'hover:-translate-y-0.5 hover:shadow-memphis active:translate-y-0.5 active:shadow-none'}`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-4 shrink-0 border-2 border-memphis-dark ${loadAllColor}`}>
            {loadAllIcon}
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm">下载完整数据库</div>
            <div className="text-xs text-slate-500 font-medium">{loadAllDesc}</div>
          </div>
        </button>
      </div>
    </div>
  );
};

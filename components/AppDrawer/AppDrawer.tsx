
import React from 'react';
import { IconClose, IconData, IconTools, IconSettings, IconLinks, IconInfo } from '../Icons';
import { MapType, StoredGpx } from '../../types';
import { Dataset } from './Panel/Dataset';
import Settings from './Panel/Settings';
import Links from './Panel/Links';
import About from './Panel/About';
import Tools from './Panel/Tools';
import { useLanguageStore } from '../../stores/useLanguageStore';

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'data' | 'tools' | 'settings' | 'links' | 'about';
  setActiveTab: (tab: 'data' | 'tools' | 'settings' | 'links' | 'about') => void;
  onFetchData: (type: string) => void;
  settings: {
    showCircles: boolean;
    customPinsEnabled: boolean;
    autoSync: boolean;
    mapType: MapType;
    exploreRadius: number;
  };
  onToggleSetting: (key: 'showCircles' | 'customPinsEnabled' | 'autoSync', val: boolean) => void;
  onChangeRadius: (val: number) => void;
  // GPX Props
  gpxFiles: StoredGpx[];
  onLoadGpx: (gpx: StoredGpx) => void;
  onDeleteGpx: (id: number) => void;
  // Cache Manager
  onOpenCacheManager: () => void;
}

const AppDrawer: React.FC<AppDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onFetchData,
  settings,
  onToggleSetting,
  onChangeRadius,
  gpxFiles,
  onLoadGpx,
  onDeleteGpx,
  onOpenCacheManager
}) => {
  const { t } = useLanguageStore();

  const tabs = [
    { id: 'data', label: t('tab.data'), icon: <IconData />, color: 'bg-memphis-yellow', textClass: 'text-yellow-700' },
    { id: 'tools', label: t('tab.tools'), icon: <IconTools />, color: 'bg-memphis-pink', textClass: 'text-pink-700' },
    { id: 'settings', label: t('tab.settings'), icon: <IconSettings />, color: 'bg-memphis-blue', textClass: 'text-cyan-700' },
    { id: 'links', label: t('tab.links'), icon: <IconLinks />, color: 'bg-memphis-green', textClass: 'text-emerald-700' },
    { id: 'about', label: t('tab.about'), icon: <IconInfo />, color: 'bg-memphis-purple', textClass: 'text-purple-700' },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-memphis-dark/20 backdrop-blur-sm transition-opacity duration-300 z-overlay ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer Container */}
      <div className={`fixed bottom-0 left-0 right-0 bg-cream rounded-t-3xl border-t-2 border-x-2 border-memphis-dark h-[60vh] flex flex-col transition-transform duration-300 cubic-bezier(0.32, 0.72, 0, 1) z-drawer ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>

        {/* 1. Header (Fixed Top) */}
        <div className="flex justify-between items-center px-6 py-4 bg-white rounded-t-3xl border-b-2 border-memphis-dark shrink-0">
          <h3 className="font-black text-xl text-slate-900 flex items-center gap-2 tracking-tight">
            TFTC
            <span className="text-xs font-bold text-white bg-memphis-purple px-2 py-0.5 rounded-lg border-2 border-memphis-dark shadow-memphis-sm transform -rotate-2">top</span>
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-red-100 text-red-500 border-2 border-memphis-dark hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors shadow-memphis-sm active:shadow-none active:translate-y-0.5">
            <IconClose />
          </button>
        </div>

        {/* 2. Scrollable Content (Middle) */}
        <div className="flex-1 overflow-y-auto p-6 bg-cream">
          {activeTab === 'data' && (
            <Dataset
              gpxFiles={gpxFiles}
              onLoadGpx={onLoadGpx}
              onDeleteGpx={onDeleteGpx}
              onFetchData={onFetchData}
            />
          )}

          {activeTab === 'tools' && <Tools />}

          {activeTab === 'settings' && (
            <Settings
              settings={settings}
              onToggleSetting={onToggleSetting}
              onChangeRadius={onChangeRadius}
              onOpenCacheManager={onOpenCacheManager}
            />
          )}

          {activeTab === 'links' && <Links />}

          {activeTab === 'about' && <About />}
        </div>

        {/* 3. Navigation Bar (Fixed Bottom) */}
        <div className="shrink-0 bg-white border-t-2 border-memphis-dark pb-safe">
            <div className="flex justify-around items-stretch h-16">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative group overflow-hidden
                                ${isActive ? `${tab.color} bg-opacity-10` : 'bg-white hover:bg-slate-50'}
                            `}
                        >
                            {/* Icon */}
                            <div className={`transition-transform duration-200 ${isActive ? `scale-110 -translate-y-0.5 ${tab.textClass}` : 'text-slate-400 group-hover:text-slate-600'}`}>
                                {tab.icon}
                            </div>
                            
                            {/* Label */}
                            <span className={`text-[10px] font-bold tracking-wide transition-colors ${isActive ? tab.textClass : 'text-slate-400'}`}>
                                {tab.label}
                            </span>
                            
                            {/* Right Separator (Except last) */}
                            {tab.id !== 'about' && (
                                <div className="absolute right-0 top-3 bottom-3 w-px bg-slate-100"></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
      </div>
    </>
  );
};

export default AppDrawer;

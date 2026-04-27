import React from 'react';
import { CONFIG } from '../../../constants';
import { MapType } from '../../../types';
import { IconDownload } from '../../Icons';
import { useLanguageStore } from '../../../stores/useLanguageStore';

interface SettingsProps {
  settings: {
    showCircles: boolean;
    customPinsEnabled: boolean;
    autoSync: boolean;
    clusterEnabled: boolean;
    mapType: MapType;
    exploreRadius: number;
  };
  onToggleSetting: (key: 'showCircles' | 'customPinsEnabled' | 'autoSync' | 'clusterEnabled', val: boolean) => void;
  onChangeRadius: (val: number) => void;
  onOpenCacheManager: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  settings,
  onToggleSetting,
  onChangeRadius,
  onOpenCacheManager
}) => {
  const { lang, setLang, t } = useLanguageStore();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white rounded-2xl p-4 border-2 border-memphis-dark shadow-memphis space-y-4">
        
        {/* Language Switcher */}
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>
            <div className="pr-4">
                <div className="font-bold text-slate-800 text-sm">{t('settings.lang')}</div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">{t('settings.lang.desc')}</div>
            </div>
            <div className="flex items-center gap-2 bg-cream rounded-lg p-1 border-2 border-memphis-dark">
                <div className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${lang === 'en' ? 'bg-memphis-blue text-white shadow-sm' : 'text-slate-400'}`}>EN</div>
                <div className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${lang === 'zh' ? 'bg-memphis-pink text-white shadow-sm' : 'text-slate-400'}`}>中文</div>
            </div>
        </div>

        <div className="w-full h-0.5 bg-slate-100"></div>

        {CONFIG.settingsMenu.map((item, index) => (
          <React.Fragment key={item.id}>
            <SettingToggle
              label={t(`settings.${item.id}.title`)}
              desc={t(`settings.${item.id}.desc`)}
              checked={(settings as any)[item.id]}
              onChange={(v) => onToggleSetting(item.id as any, v)}
            />
            {index < CONFIG.settingsMenu.length - 1 && <div className="w-full h-0.5 bg-slate-100"></div>}
          </React.Fragment>
        ))}

        <div className="w-full h-0.5 bg-slate-100"></div>

        {/* Explore Radius Slider */}
        <div className="pt-1">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="font-bold text-slate-800 text-sm">{t('settings.radius')}</div>
              <div className="text-xs text-slate-500 font-medium">{t('settings.radius.desc')}</div>
            </div>
            <div className="text-slate-900 font-bold text-sm bg-memphis-yellow border-2 border-memphis-dark px-2 py-1 rounded-md min-w-[3rem] text-center shadow-memphis-sm">
              {settings.exploreRadius} km
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="25"
            value={settings.exploreRadius}
            onChange={(e) => onChangeRadius(Number(e.target.value))}
            className="w-full h-4 bg-slate-200 rounded-full appearance-none cursor-pointer accent-memphis-blue border-2 border-memphis-dark"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1 font-bold">
            <span>1km</span>
            <span>25km</span>
          </div>
        </div>

        <div className="w-full h-0.5 bg-slate-100"></div>

        {/* Cache Manager */}
        <div onClick={onOpenCacheManager} className="flex justify-between items-center cursor-pointer py-1 active:opacity-60 group">
          <div className="pr-4">
            <div className="font-bold text-slate-800 text-sm group-hover:text-memphis-blue transition-colors">{t('settings.cache.title')}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">{t('settings.cache.desc')}</div>
          </div>
          <div className="text-slate-400 group-hover:text-memphis-blue transition-colors bg-cream p-2 rounded-lg border-2 border-transparent group-hover:border-memphis-dark">
            <IconDownload />
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingToggle = ({ label, desc, checked, onChange }: { label: string, desc: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex justify-between items-center cursor-pointer group" onClick={() => onChange(!checked)}>
    <div className="pr-4">
      <div className="font-bold text-slate-800 text-sm">{label}</div>
      <div className="text-xs text-slate-500 mt-0.5 font-medium">{desc}</div>
    </div>
    <div className={`w-14 h-8 rounded-full transition-colors duration-300 relative shrink-0 border-2 border-memphis-dark ${checked ? 'bg-memphis-green' : 'bg-slate-200'}`}>
      <div className={`absolute top-0.5 left-0.5 bg-white w-6 h-6 rounded-full border-2 border-memphis-dark shadow-sm transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </div>
  </div>
);

export default Settings;
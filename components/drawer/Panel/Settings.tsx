import React from 'react';
import { getConfig } from '../../../config';
interface SettingsProps {
  settings: Record<string, boolean | number | string>;
  onToggleSetting: (key: string, val: boolean) => void;
  onChangeRadius: (val: number) => void;
}

const Settings: React.FC<SettingsProps> = ({
  settings,
  onToggleSetting,
  onChangeRadius,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white rounded-2xl p-4 border-2 border-memphis-dark shadow-memphis space-y-4">
        
        {getConfig().settingsMenu.map((item, index) => (
          <React.Fragment key={item.id}>
            {index === 0 && <div className="w-full h-0.5 bg-slate-100 -mt-2"></div>}
            <SettingToggle
              label={item.label}
              desc={item.desc}
              checked={!!settings[item.id]}
              onChange={(v) => onToggleSetting(item.id, v)}
            />
            {index < getConfig().settingsMenu.length - 1 && <div className="w-full h-0.5 bg-slate-100"></div>}
          </React.Fragment>
        ))}

        <div className="w-full h-0.5 bg-slate-100"></div>

        {/* Explore Radius Slider */}
        {(() => {
          const cfg = getConfig().settingsMenu.find(m => m.id === 'exploreRadius');
          return (
            <div className="pt-1">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="font-bold text-slate-800 text-sm">{cfg?.label}</div>
                  <div className="text-xs text-slate-500 font-medium">{cfg?.desc}</div>
                </div>
                <div className="text-slate-900 font-bold text-sm bg-memphis-yellow border-2 border-memphis-dark px-2 py-1 rounded-md min-w-[3rem] text-center shadow-memphis-sm">
                  {settings.exploreRadius} km
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={settings.exploreRadius as number}
                onChange={(e) => onChangeRadius(Number(e.target.value))}
                className="w-full h-4 bg-slate-200 rounded-full appearance-none cursor-pointer accent-memphis-blue border-2 border-memphis-dark"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1 font-bold">
                <span>1km</span>
                <span>25km</span>
              </div>
            </div>
          );
        })()}

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
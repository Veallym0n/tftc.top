
import React, { useState, useEffect } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Modal, defaultModalClasses } from '../../../libs/common/Modal';
import { openAppScheme, formatDMM, toDMM } from '../../../utils/geo'; 
import { useLanguageStore } from '../../../stores/useLanguageStore';
import { eventService } from '../../../services/eventService';
import { useMapStore } from '../../../stores/useMapStore'; // Import Store
import { IconLocate } from '../../Icons';

function toDMS(val: number, isLat: boolean) {
  const dir = val >= 0 ? (isLat ? 'N' : 'E') : (isLat ? 'S' : 'W');
  const abs = Math.abs(val);
  const deg = Math.floor(abs);
  const minFull = (abs - deg) * 60;
  const min = Math.floor(minFull);
  const sec = (minFull - min) * 60;
  return `${dir} ${deg}° ${min}' ${sec.toFixed(2)}"`;
}

function localFormatDMS(lat: number, lng: number) {
  return `${toDMS(lat, true)} ${toDMS(lng, false)}`;
}

function formatDD(lat: number, lng: number) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

interface SmartCoordsProps {
  // If provided, the tool starts in "Result" mode for these coordinates
  externalTarget?: { lat: number; lng: number; name?: string } | null;
}

const SmartCoords = NiceModal.create(({ externalTarget }: SmartCoordsProps) => {
  const modal = useModal();
  const [input, setInput] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const { t } = useLanguageStore();
  const { addTempPin } = useMapStore(); // Access action
  
  // Auto-parse when input changes
  useEffect(() => {
    if (externalTarget) {
        setCoords({ lat: externalTarget.lat, lng: externalTarget.lng });
    } else {
        const result = parseInputString(input);
        setCoords(result);
    }
  }, [input, externalTarget]);

  const targetName = externalTarget?.name || t('smart.target.name');

  const handleLaunchBaidu = () => {
    if (!coords) return;
    openAppScheme(coords.lat, coords.lng, targetName, 'TFTC-TOOL', 'baidu');
  };

  const handleLaunchAmap = () => {
    if (!coords) return;
    openAppScheme(coords.lat, coords.lng, targetName, 'TFTC-TOOL', 'amap');
  };

  const handleLocateOnMap = () => {
    if (!coords) return;
    modal.remove();

    // 1. Fly to location (Move map)
    eventService.emit('MAP_FLY_TO', { lat: coords.lat, lng: coords.lng });

    // 2. Wait for fly animation (1.6s) then add pin
    setTimeout(() => {
        // Use user input or default text as note
        const note = input ? input.trim() : "Smart Coord Location";
        const id = addTempPin(coords.lat, coords.lng, note);
        
        // 3. Open Popup
        setTimeout(() => {
            eventService.emit('MAP_FLY_TO', { lat: coords.lat, lng: coords.lng, pinId: id });
        }, 50);
    }, 1600);
  };

  return (
    <Modal
      {...defaultModalClasses}
      isOpen={modal.visible}
      onClose={modal.remove}
      title={externalTarget ? targetName : t('smart.title')}
      footer={null}
    >
      <div className="space-y-4">
        {/* Only show input if NOT in external target mode */}
        {!externalTarget && (
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">{t('smart.input.label')}</label>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('smart.input.placeholder')}
                className="w-full h-12 px-3 py-2 bg-cream border-2 border-memphis-dark rounded-xl focus:outline-none focus:ring-4 focus:ring-memphis-pink/20 transition-all font-mono text-sm resize-none text-slate-800 placeholder:text-slate-400"
              />
              <div className="text-[10px] text-slate-400 mt-1 text-right font-bold">
                 {t('smart.hint')}
              </div>
            </div>
        )}

        {/* Action Buttons Row (Only if Coords Valid) */}
        {coords && (
           <div className="flex items-center justify-end gap-3 pb-2 border-b-2 border-slate-100 animate-fade-in">
              {/* Optional Label for structure */}
              <span className="text-xs font-black text-slate-300 uppercase mr-auto tracking-widest">Actions</span>

              <button 
                onClick={handleLocateOnMap}
                title="Locate on Map"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border-2 border-memphis-dark text-slate-700 hover:bg-memphis-yellow shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-0.5 transition-all"
              >
                <IconLocate />
              </button>
              <button 
                onClick={handleLaunchAmap}
                title={t('smart.btn.amap')}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-memphis-blue border-2 border-memphis-dark text-white font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:bg-sky-400 active:shadow-none active:translate-y-0.5 transition-all"
              >
                高
              </button>
              <button 
                onClick={handleLaunchBaidu}
                title={t('smart.btn.baidu')}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 border-2 border-memphis-dark text-white font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:bg-indigo-700 active:shadow-none active:translate-y-0.5 transition-all"
              >
                百
              </button>
           </div>
        )}

        {/* Results */}
        {coords ? (
          <div className="space-y-4 animate-fade-in">
            <ResultRow 
                label="Decimal Degrees (DD)" 
                value={formatDD(coords.lat, coords.lng)} 
                headerClass="bg-memphis-yellow text-slate-900"
            />
            <ResultRow 
                label="Deg Dec Min (DMM)" 
                value={formatDMM(coords.lat, coords.lng)} 
                headerClass="bg-memphis-pink text-white" 
            />
            <ResultRow 
                label="Deg Min Sec (DMS)" 
                value={localFormatDMS(coords.lat, coords.lng)} 
                headerClass="bg-memphis-purple text-white" 
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-slate-300 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
             <div className="text-2xl mb-2 grayscale opacity-50">📡</div>
             <div className="text-xs font-bold">{t('smart.waiting')}</div>
          </div>
        )}
      </div>
    </Modal>
  );
});

const ResultRow = ({ label, value, headerClass }: { label: string, value: string, headerClass: string }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="bg-white rounded-xl border-2 border-memphis-dark shadow-memphis-sm overflow-hidden group hover:-translate-y-0.5 hover:shadow-memphis transition-all">
            {/* Header Title Bar */}
            <div className={`px-3 py-1.5 border-b-2 border-memphis-dark ${headerClass} flex justify-between items-center`}>
                <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
                <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-black/20"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-black/20"></div>
                </div>
            </div>
            
            {/* Content Body */}
            <div className="p-3 flex items-center justify-between gap-3 bg-white">
                <div className="font-mono text-slate-800 text-sm break-all font-bold">{value}</div>
                
                <div className="flex gap-2 shrink-0">
                    {/* Copy Button */}
                    <button 
                        onClick={handleCopy}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-cream border-2 border-memphis-dark text-slate-500 hover:text-white hover:bg-memphis-green transition-all active:scale-95 active:shadow-inner"
                        title="Copy"
                    >
                        {copied ? (
                            <span className="font-bold text-sm">✓</span>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Parsing Logic ---

function parseInputString(input: string): { lat: number, lng: number } | null {
    if (!input || input.trim().length < 5) return null;
    
    // Normalize: Upper case, replace typical separators with space
    const text = input.trim().toUpperCase().replace(/[,;]/g, ' ').replace(/\s+/g, ' ');

    let lat: number | null = null;
    let lng: number | null = null;

    // Regex Patterns
    
    // 1. DMM (Geocaching Standard): N 40 04.753 E 116 18.334
    // Supports formats: N40 4.753 E116 18.334, 40 4.753 N ...
    const dmmRegex = /([NS])?\s*(\d+)\s+[°]?\s*(\d+(\.\d+)?)\s*[']?\s*([NS])?\s*([EW])?\s*(\d+)\s+[°]?\s*(\d+(\.\d+)?)\s*[']?\s*([EW])?/;
    const dmmMatch = text.match(dmmRegex);
    
    if (dmmMatch) {
        return parseByTokens(text);
    }

    // 2. DMS: N 40 04 45 E 116 18 20
    const dmsRegex = /(\d+)\s+[°]?\s*(\d+)\s+[']?\s*(\d+(\.\d+)?)\s*["]?/;
    if (dmsRegex.test(text)) {
        return parseByTokens(text);
    }

    // 3. DD: 40.0792 116.3055
    const ddRegex = /(-?\d+\.\d+)\s+(-?\d+\.\d+)/;
    const ddMatch = text.match(ddRegex);
    if (ddMatch) {
        const v1 = parseFloat(ddMatch[1]);
        const v2 = parseFloat(ddMatch[2]);
        if (Math.abs(v1) <= 90 && Math.abs(v2) <= 180) return { lat: v1, lng: v2 };
        if (Math.abs(v2) <= 90 && Math.abs(v1) <= 180) return { lat: v2, lng: v1 }; 
    }

    return parseByTokens(text);
}

function parseByTokens(text: string): { lat: number, lng: number } | null {
    const numbers = text.match(/(\d+(\.\d+)?)/g);
    const dirs = text.match(/[NSEW]/g);

    if (!numbers || numbers.length < 2) return null;

    // Case A: DMM (Degrees + Minutes) -> Need 4 numbers
    if (numbers.length >= 4 && dirs && dirs.length >= 1) {
        const d1 = parseFloat(numbers[0]);
        const m1 = parseFloat(numbers[1]);
        const d2 = parseFloat(numbers[2]);
        const m2 = parseFloat(numbers[3]);
        
        let val1 = d1 + m1 / 60;
        let val2 = d2 + m2 / 60;

        let finalLat = val1;
        let finalLng = val2;

        if (text.includes('S')) finalLat = -Math.abs(finalLat);
        if (text.includes('N')) finalLat = Math.abs(finalLat);
        if (text.includes('W')) finalLng = -Math.abs(finalLng);
        if (text.includes('E')) finalLng = Math.abs(finalLng);

        if (Math.abs(finalLat) > 90 && Math.abs(finalLng) <= 90) {
            [finalLat, finalLng] = [finalLng, finalLat];
        }

        if(Math.abs(finalLat) <= 90 && Math.abs(finalLng) <= 180) {
            return { lat: finalLat, lng: finalLng };
        }
    }

    // Case B: DMS (Deg Min Sec) -> Need 6 numbers
    if (numbers.length >= 6) {
        const d1 = parseFloat(numbers[0]);
        const m1 = parseFloat(numbers[1]);
        const s1 = parseFloat(numbers[2]);
        
        const d2 = parseFloat(numbers[3]);
        const m2 = parseFloat(numbers[4]);
        const s2 = parseFloat(numbers[5]);

        let val1 = d1 + m1/60 + s1/3600;
        let val2 = d2 + m2/60 + s2/3600;

        let finalLat = val1;
        let finalLng = val2;

        if (text.includes('S')) finalLat = -Math.abs(finalLat);
        if (text.includes('W')) finalLng = -Math.abs(finalLng);

        if (Math.abs(finalLat) > 90 && Math.abs(finalLng) <= 90) {
            [finalLat, finalLng] = [finalLng, finalLat];
        }

        return { lat: finalLat, lng: finalLng };
    }

    return null;
}

export default SmartCoords;

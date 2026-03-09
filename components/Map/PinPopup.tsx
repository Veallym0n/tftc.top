import React, { useState } from 'react';
import { UserPin } from '../../types';
import { formatDMM } from '../../utils/geo';
import { useMapStore } from '../../stores/useMapStore';

interface PinPopupProps {
  pin: UserPin;
  onDelete: () => void;
  onUpdate: (note: string) => void;
}

const PinPopup: React.FC<PinPopupProps> = ({ pin, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(!pin.note);
  const [note, setNote] = useState(pin.note || '');

  const dateStr = pin.create_at ? new Date(pin.create_at).toLocaleString() : '';
  const dmmStr = formatDMM(pin.lat, pin.lng);
  const ddStr = `${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      useMapStore.getState().showToast('Coordinates copied!');
    }).catch(err => console.error(err));
  };

  return (
    <div className="pb-2 w-[250px]">
      <div className="bg-white font-sans text-slate-900 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.45)] p-3">
        <div className="font-black text-xs uppercase tracking-wider mb-2 text-memphis-pink">Custom Pin</div>
        
        {!isEditing ? (
          <div>
            <div className="w-full min-h-[40px] max-h-[100px] overflow-y-auto bg-slate-50 border-2 border-slate-200 rounded-lg p-2 text-xs mb-3 text-slate-700 whitespace-pre-wrap leading-relaxed">
              {pin.note}
            </div>
            <div className="flex justify-between gap-2">
              <button 
                onClick={onDelete}
                className="flex-1 py-1.5 bg-red-400 text-white text-xs font-black border-2 border-black rounded hover:bg-red-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.45)] active:shadow-none active:translate-y-0.5 transition-all"
              >
                Delete
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className="flex-1 py-1.5 bg-memphis-blue text-white text-xs font-black border-2 border-black rounded hover:bg-sky-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.45)] active:shadow-none active:translate-y-0.5 transition-all"
              >
                Update
              </button>
            </div>
          </div>
        ) : (
          <div>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-20 bg-cream border-2 border-black rounded-lg p-2 text-xs mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-memphis-blue placeholder-slate-400" 
              placeholder="Add a note..."
            />
            <div className="flex justify-between gap-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-1.5 bg-slate-200 text-slate-500 text-xs font-black border-2 border-black rounded hover:bg-slate-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.45)] active:shadow-none active:translate-y-0.5 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onUpdate(note);
                  setIsEditing(false);
                }}
                className="flex-1 py-1.5 bg-memphis-green text-white text-xs font-black border-2 border-black rounded hover:bg-emerald-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.45)] active:shadow-none active:translate-y-0.5 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 text-center font-mono font-bold border-t border-dashed border-slate-200 pt-1">
            <div 
              className="text-xs text-slate-700 hover:text-memphis-blue cursor-pointer transition-colors" 
              onClick={() => handleCopy(dmmStr)}
              title="Click to copy"
            >
              {dmmStr}
            </div>
            <div 
              className="text-[9px] text-slate-300 font-normal mt-0.5 hover:text-memphis-blue cursor-pointer transition-colors" 
              onClick={() => handleCopy(ddStr)}
              title="Click to copy"
            >
              {ddStr}
            </div>
            {dateStr && <div className="text-[9px] text-slate-200 font-normal mt-0.5">{dateStr}</div>}
        </div>
      </div>
    </div>
  );
};

export default PinPopup;

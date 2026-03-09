import React from 'react';
import { useMapStore } from '../stores/useMapStore';

const GlobalOverlays: React.FC = () => {
  const { toastMsg, loading } = useMapStore();

  const isVisible = !!toastMsg || loading;
  const displayMsg = toastMsg || (loading ? 'Loading...' : 'Ready');

  return (
    <>
      {/* Toast */}
      <div
        className={`absolute top-20 left-1/2 -translate-x-1/2 bg-memphis-dark text-white px-6 py-3 rounded-xl border-2 border-black shadow-memphis transition-all duration-300 pointer-events-none z-overlay flex items-center gap-3 ${
          isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
        }`}
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-white/30 border-t-memphis-yellow rounded-full animate-spin"></div>
        )}
        <span className="font-bold">{displayMsg}</span>
      </div>
    </>
  );
};

export default GlobalOverlays;

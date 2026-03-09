import React from 'react';

const About: React.FC = () => {
  return (
    <div className="text-center animate-fade-in pt-4">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl mx-auto shadow-lg shadow-blue-200 flex items-center justify-center text-4xl mb-6">
        🗺️
      </div>
      <h3 className="font-bold text-slate-800 text-2xl mb-2">TFTC.top</h3>
      <p className="text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed">
        Visualizing geocaches across China with automatic coordinate correction.
      </p>

      <div className="bg-slate-50 rounded-2xl p-6 text-left text-sm text-slate-600 space-y-4 border border-slate-100">
        <div>
          <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Source</div>
          <p>Data provided by <a href="https://tftc.top" className="text-blue-500 hover:underline">tftc.top</a> API.</p>
        </div>
        <div>
          <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Disclaimer</div>
          <p className="text-xs opacity-70">This is a third-party open source tool. Not affiliated with Geocaching HQ.</p>
        </div>
      </div>
      <div className="mt-8 text-xs text-slate-300 font-mono">v1.2.0</div>
    </div>
  );
};

export default About;
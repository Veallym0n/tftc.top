import React from 'react';
import { CONFIG } from '../../../constants';

const Links: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-3 animate-fade-in">
      {CONFIG.links.map((link, i) => (
        <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group">
          <span className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-xl mr-4 group-hover:bg-blue-50 group-hover:scale-110 transition-all">{link.icon}</span>
          <span className="font-semibold text-slate-700 group-hover:text-blue-600">{link.name}</span>
          <span className="ml-auto text-slate-300 group-hover:translate-x-1 transition-transform">→</span>
        </a>
      ))}
    </div>
  );
};

export default Links;
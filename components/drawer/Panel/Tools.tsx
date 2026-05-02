
import React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import SmartCoords from '../Tools/SmartCoords';
import Compass from '../Tools/Compass';
import CacheFilter from '../Tools/CacheFilter';
import FilterLabModal from '../../../features/filterSphere/FilterLabModal';

const Tools: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="text-xs font-black text-slate-400 mb-3 px-1 uppercase tracking-wider">工具</div>
      
      <div className="grid gap-3">
        {/* Smart Coordinates Tool */}
        <button
          onClick={() => NiceModal.show(SmartCoords)}
          className="w-full flex items-center p-3 bg-white rounded-xl border-2 border-memphis-dark shadow-none hover:shadow-memphis hover:-translate-y-0.5 transition-all text-left group active:translate-y-0.5 active:shadow-none"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-4 shrink-0 bg-memphis-purple text-white border-2 border-memphis-dark transform -rotate-3 group-hover:rotate-0 transition-transform">
            🧭
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm group-hover:text-memphis-purple transition-colors">智能坐标</div>
            <div className="text-xs text-slate-500 font-medium">解析、转换与导航坐标</div>
          </div>
        </button>

        <button
          onClick={() => NiceModal.show(FilterLabModal)}
          className="w-full flex items-center p-3 bg-white rounded-xl border-2 border-memphis-dark shadow-none hover:shadow-memphis hover:-translate-y-0.5 transition-all text-left group active:translate-y-0.5 active:shadow-none"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-4 shrink-0 bg-memphis-yellow text-slate-900 border-2 border-memphis-dark transform -rotate-2 group-hover:rotate-0 transition-transform">
            🧪
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm group-hover:text-yellow-700 transition-colors">筛选实验室</div>
            <div className="text-xs text-slate-500 font-medium">离线缓存规则筛选</div>
          </div>
        </button>

        {/* Compass Tool */}
        <button
          onClick={() => NiceModal.show(Compass)}
          className="w-full flex items-center p-3 bg-white rounded-xl border-2 border-memphis-dark shadow-none hover:shadow-memphis hover:-translate-y-0.5 transition-all text-left group active:translate-y-0.5 active:shadow-none"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-4 shrink-0 bg-memphis-green text-white border-2 border-memphis-dark transform -rotate-2 group-hover:rotate-0 transition-transform">
            🧭
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm group-hover:text-memphis-green transition-colors">指南针</div>
            <div className="text-xs text-slate-500 font-medium">实时方位 &amp; GPS 坐标</div>
          </div>
        </button>

        {/* Cache Filter Tool */}
        {/* 开发中
        <button
          onClick={() => NiceModal.show(CacheFilter)}
          className="w-full flex items-center p-3 bg-white rounded-xl border-2 border-memphis-dark shadow-none hover:shadow-memphis hover:-translate-y-0.5 transition-all text-left group active:translate-y-0.5 active:shadow-none"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-4 shrink-0 bg-memphis-yellow text-memphis-dark border-2 border-memphis-dark transform rotate-1 group-hover:rotate-0 transition-transform">
            🔧
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm group-hover:text-memphis-yellow transition-colors">条件筛选工具</div>
            <div className="text-xs text-slate-500 font-medium">生成自定义筛选条件</div>
          </div>
        </button>
        */}
      </div>
    </div>
  );
};

export default Tools;

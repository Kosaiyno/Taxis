import React from 'react';
import { useFloorPlanStore } from '../../store/floorplanStore';
import { formatArea } from '../../utils/geometry';
import { Bot, Sparkles } from 'lucide-react';

export const BottomStatusBar: React.FC = () => {
  const { plot, rooms, openings, fixtures, gridSnap } = useFloorPlanStore();
  const totalBuiltArea = rooms.reduce((acc, r) => acc + r.width * r.height, 0);

  return (
    <footer className="h-7 bg-[#070a10] border-t border-white/[0.06] px-4 hidden sm:flex items-center justify-between text-[11px] text-slate-400 select-none z-20 font-mono">
      {/* Metrics */}
      <div className="flex items-center gap-3">
        <span className="text-slate-200 font-semibold">{rooms.length} zones</span>
        <span className="text-white/10">•</span>
        <span className="text-amber-400 font-bold">{formatArea(totalBuiltArea, plot.unit)} active</span>
        <span className="text-white/10">•</span>
        <span>{openings.length} doors & openings</span>
        <span className="text-white/10">•</span>
        <span>{fixtures.length} shapes & objects</span>
      </div>

      {/* Snap & WebMCP status */}
      <div className="flex items-center gap-3 text-[10px]">
        <span className={gridSnap ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
          Snap: {gridSnap ? '10cm' : 'OFF'}
        </span>
        <span className="text-white/10">•</span>
        <div className="flex items-center gap-1.5 text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20 shadow-sm">
          <Bot className="w-3 h-3 text-amber-400" />
          <span className="font-semibold">26 WebMCP Tools Active</span>
          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
        </div>
        <span className="text-white/10">•</span>
        <span className="text-slate-500 font-sans font-bold tracking-wider uppercase text-[9px]">
          TAXIS SPATIAL ENGINE
        </span>
      </div>
    </footer>
  );
};

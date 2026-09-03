import React from 'react';
import { useFloorPlanStore } from '../../store/floorplanStore';
import { formatArea } from '../../utils/geometry';
import { Bot, Sparkles } from 'lucide-react';

export const BottomStatusBar: React.FC = () => {
  const { plot, rooms, openings, fixtures, gridSnap } = useFloorPlanStore();
  const totalBuiltArea = rooms.reduce((acc, r) => acc + r.width * r.height, 0);

  return (
    <footer className="h-7 bg-[#120c0a] border-t border-[#3d302a] px-4 hidden sm:flex items-center justify-between text-[11px] text-[#b08968] select-none z-20 font-mono">
      {/* Metrics */}
      <div className="flex items-center gap-3">
        <span className="text-[#f5ebe0] font-semibold">{rooms.length} zones</span>
        <span className="text-[#3d302a]">•</span>
        <span className="text-[#c99a6e] font-bold">{formatArea(totalBuiltArea, plot.unit)} active</span>
        <span className="text-[#3d302a]">•</span>
        <span>{openings.length} doors & openings</span>
        <span className="text-[#3d302a]">•</span>
        <span>{fixtures.length} shapes & objects</span>
      </div>

      {/* Snap & WebMCP status */}
      <div className="flex items-center gap-3 text-[10px]">
        <span className={gridSnap ? 'text-emerald-400 font-medium' : 'text-[#8d7b68]'}>
          Snap: {gridSnap ? '10cm' : 'OFF'}
        </span>
        <span className="text-[#3d302a]">•</span>
        <div className="flex items-center gap-1.5 text-[#c99a6e] bg-[#c99a6e]/15 px-2.5 py-0.5 rounded-full border border-[#c99a6e]/30 shadow-sm">
          <Bot className="w-3 h-3 text-[#c99a6e]" />
          <span className="font-semibold">63 WebMCP Tools Active</span>
          <Sparkles className="w-2.5 h-2.5 text-[#c99a6e]" />
        </div>
        <span className="text-[#3d302a]">•</span>
        <span className="text-[#8d7b68] font-sans font-bold tracking-wider uppercase text-[9px]">
          TAXIS SPATIAL ENGINE
        </span>
      </div>
    </footer>
  );
};

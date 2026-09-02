import React from 'react';
import { useFloorPlanStore } from '../../store/floorplanStore';
import { formatArea } from '../../utils/geometry';
import { Bot } from 'lucide-react';

export const BottomStatusBar: React.FC = () => {
  const { plot, rooms, openings, fixtures, gridSnap } = useFloorPlanStore();
  const totalBuiltArea = rooms.reduce((acc, r) => acc + r.width * r.height, 0);

  return (
    <footer className="h-6 bg-[#15100e] border-t border-[#3d302a] px-3 flex items-center justify-between text-[11px] text-[#b08968] select-none z-20 font-mono">
      {/* Metrics */}
      <div className="flex items-center gap-3">
        <span>{rooms.length} rooms</span>
        <span className="text-[#3d302a]">|</span>
        <span className="text-[#c99a6e] font-semibold">{formatArea(totalBuiltArea, plot.unit)}</span>
        <span className="text-[#3d302a]">|</span>
        <span>{openings.length} doors & windows</span>
        <span className="text-[#3d302a]">|</span>
        <span>{fixtures.length} objects</span>
      </div>

      {/* Snap & WebMCP status */}
      <div className="flex items-center gap-3 text-[10px]">
        <span className={gridSnap ? 'text-emerald-400' : 'text-[#8d7b68]'}>
          Snap: {gridSnap ? '10cm' : 'OFF'}
        </span>
        <span className="text-[#3d302a]">|</span>
        <div className="flex items-center gap-1 text-[#c99a6e] bg-[#c99a6e]/10 px-1.5 py-0.5 rounded border border-[#c99a6e]/30">
          <Bot className="w-3 h-3 text-[#c99a6e]" />
          <span>18 WebMCP Tools Active</span>
        </div>
      </div>
    </footer>
  );
};

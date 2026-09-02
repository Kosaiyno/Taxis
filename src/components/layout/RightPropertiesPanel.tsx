import React from 'react';
import {
  RotateCw,
  Copy,
  Trash2,
  Tag,
  Building2,
  Shapes,
} from 'lucide-react';
import { useFloorPlanStore } from '../../store/floorplanStore';
import { SHAPE_GEOMETRIES } from '../../utils/defaultPresets';

export const RightPropertiesPanel: React.FC = () => {
  const {
    rooms,
    openings,
    fixtures,
    plot,
    selectedId,
    selectedType,
    updateRoom,
    updateFixture,
    rotateFixture,
    cloneFixture,
    deleteFixture,
    rotateRoom,
    cloneRoom,
    deleteRoom,
    deleteOpening,
  } = useFloorPlanStore();

  const selectedRoom = selectedType === 'room' ? rooms.find((r) => r.id === selectedId) : null;
  const selectedFixture = selectedType === 'fixture' ? fixtures.find((f) => f.id === selectedId) : null;
  const selectedOpening = selectedType === 'opening' ? openings.find((o) => o.id === selectedId) : null;

  // Calculate overall metrics
  const totalBuiltArea = rooms.reduce((acc, r) => acc + r.width * r.height, 0);
  const plotArea = plot.width * plot.height;
  const coverageRatio = plotArea > 0 ? (totalBuiltArea / plotArea) * 100 : 0;

  return (
    <aside className="w-80 bg-[#1c1512] border-l border-[#3d302a] flex flex-col z-20 select-none shadow-xl text-xs text-[#e6ccb2] overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-3 border-b border-[#3d302a] flex items-center justify-between bg-[#15100e]">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#c99a6e]" />
          <span className="font-bold text-[#f5ebe0] text-xs uppercase tracking-wider">
            {selectedType ? `${selectedType} Inspector` : 'Spatial Inspector'}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {/* --- 1. SELECTED FIXTURE / SHAPE INSPECTOR --- */}
        {selectedFixture && (
          <div className="space-y-3.5 bg-[#261e1b]/60 border border-[#3d302a] rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#b08968] uppercase tracking-wider">
                Object & Shape Config
              </span>
              <span className="text-[9px] bg-[#15100e] text-[#c99a6e] font-mono px-1.5 py-0.5 rounded border border-[#3d302a]">
                {selectedFixture.geometry || 'rectangle'}
              </span>
            </div>

            {/* Rename Input */}
            <div>
              <label className="block text-[10px] text-[#8d7b68] mb-1 font-semibold">Label / Name:</label>
              <input
                type="text"
                value={selectedFixture.name}
                onChange={(e) => updateFixture(selectedFixture.id, { name: e.target.value })}
                className="w-full bg-[#15100e] border border-[#3d302a] rounded-lg px-2.5 py-1.5 text-xs text-[#f5ebe0] focus:outline-none focus:border-[#c99a6e]"
                placeholder="Name this object..."
              />
            </div>

            {/* Shape Geometry Selector */}
            <div>
              <label className="block text-[10px] text-[#8d7b68] mb-1.5 font-semibold flex items-center gap-1">
                <Shapes className="w-3 h-3 text-[#c99a6e]" />
                <span>Geometry Form:</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {SHAPE_GEOMETRIES.map((geom) => (
                  <button
                    key={geom.id}
                    onClick={() => updateFixture(selectedFixture.id, { geometry: geom.id })}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold transition text-center border ${
                      (selectedFixture.geometry || 'rectangle') === geom.id
                        ? 'bg-[#c99a6e] text-[#1c1512] border-[#c99a6e] font-bold shadow'
                        : 'bg-[#15100e] border-[#3d302a] text-[#b08968] hover:text-[#f5ebe0]'
                    }`}
                  >
                    {geom.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Width & Depth Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#8d7b68] mb-1">Width (m):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  value={selectedFixture.width}
                  onChange={(e) => updateFixture(selectedFixture.id, { width: parseFloat(e.target.value) || 0.5 })}
                  className="w-full bg-[#15100e] border border-[#3d302a] rounded-lg px-2.5 py-1 text-xs text-[#f5ebe0] font-mono focus:outline-none focus:border-[#c99a6e]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8d7b68] mb-1">Length / Depth (m):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  value={selectedFixture.height}
                  onChange={(e) => updateFixture(selectedFixture.id, { height: parseFloat(e.target.value) || 0.5 })}
                  className="w-full bg-[#15100e] border border-[#3d302a] rounded-lg px-2.5 py-1 text-xs text-[#f5ebe0] font-mono focus:outline-none focus:border-[#c99a6e]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#3d302a]">
              <button
                onClick={() => rotateFixture(selectedFixture.id)}
                className="flex-1 py-1.5 bg-[#15100e] hover:bg-[#322723] text-[#e6ccb2] rounded-lg border border-[#3d302a] flex items-center justify-center gap-1 transition text-[11px]"
              >
                <RotateCw className="w-3 h-3 text-[#c99a6e]" />
                <span>Rot 90°</span>
              </button>
              <button
                onClick={() => cloneFixture(selectedFixture.id)}
                className="flex-1 py-1.5 bg-[#15100e] hover:bg-[#322723] text-[#e6ccb2] rounded-lg border border-[#3d302a] flex items-center justify-center gap-1 transition text-[11px]"
              >
                <Copy className="w-3 h-3 text-[#c99a6e]" />
                <span>Clone</span>
              </button>
              <button
                onClick={() => deleteFixture(selectedFixture.id)}
                className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg border border-rose-800/50 transition"
                title="Delete Object"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* --- 2. SELECTED ROOM / ZONE INSPECTOR --- */}
        {selectedRoom && (
          <div className="space-y-3.5 bg-[#261e1b]/60 border border-[#3d302a] rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#b08968] uppercase tracking-wider">
                Space Zone Config
              </span>
              <span className="text-[9px] bg-[#15100e] text-[#c99a6e] font-mono px-1.5 py-0.5 rounded border border-[#3d302a]">
                {(selectedRoom.width * selectedRoom.height).toFixed(1)} m²
              </span>
            </div>

            {/* Rename Input */}
            <div>
              <label className="block text-[10px] text-[#8d7b68] mb-1 font-semibold">Zone / Room Name:</label>
              <input
                type="text"
                value={selectedRoom.name}
                onChange={(e) => updateRoom(selectedRoom.id, { name: e.target.value })}
                className="w-full bg-[#15100e] border border-[#3d302a] rounded-lg px-2.5 py-1.5 text-xs text-[#f5ebe0] focus:outline-none focus:border-[#c99a6e]"
              />
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#8d7b68] mb-1">Width (m):</label>
                <input
                  type="number"
                  step="0.25"
                  min="1"
                  value={selectedRoom.width}
                  onChange={(e) => updateRoom(selectedRoom.id, { width: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-[#15100e] border border-[#3d302a] rounded-lg px-2.5 py-1 text-xs text-[#f5ebe0] font-mono focus:outline-none focus:border-[#c99a6e]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8d7b68] mb-1">Length (m):</label>
                <input
                  type="number"
                  step="0.25"
                  min="1"
                  value={selectedRoom.height}
                  onChange={(e) => updateRoom(selectedRoom.id, { height: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-[#15100e] border border-[#3d302a] rounded-lg px-2.5 py-1 text-xs text-[#f5ebe0] font-mono focus:outline-none focus:border-[#c99a6e]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#3d302a]">
              <button
                onClick={() => rotateRoom(selectedRoom.id)}
                className="flex-1 py-1.5 bg-[#15100e] hover:bg-[#322723] text-[#e6ccb2] rounded-lg border border-[#3d302a] flex items-center justify-center gap-1 transition text-[11px]"
              >
                <RotateCw className="w-3 h-3 text-[#c99a6e]" />
                <span>Rotate</span>
              </button>
              <button
                onClick={() => cloneRoom(selectedRoom.id)}
                className="flex-1 py-1.5 bg-[#15100e] hover:bg-[#322723] text-[#e6ccb2] rounded-lg border border-[#3d302a] flex items-center justify-center gap-1 transition text-[11px]"
              >
                <Copy className="w-3 h-3 text-[#c99a6e]" />
                <span>Clone</span>
              </button>
              <button
                onClick={() => deleteRoom(selectedRoom.id)}
                className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg border border-rose-800/50 transition"
                title="Delete Space"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* --- 3. SELECTED OPENING INSPECTOR --- */}
        {selectedOpening && (
          <div className="space-y-3 bg-[#261e1b]/60 border border-[#3d302a] rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#b08968] uppercase tracking-wider">
                Door / Window
              </span>
              <button
                onClick={() => deleteOpening(selectedOpening.id)}
                className="text-rose-400 hover:text-rose-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xs text-[#f5ebe0]">
              <div>Type: <span className="font-semibold text-[#c99a6e]">{selectedOpening.type}</span></div>
              <div>Wall: <span className="font-mono">{selectedOpening.wall}</span></div>
              <div>Width: <span className="font-mono">{selectedOpening.width}m</span></div>
            </div>
          </div>
        )}

        {/* --- 4. GLOBAL VENUE & PLOT METRICS --- */}
        <div className="bg-[#261e1b]/40 border border-[#3d302a] rounded-xl p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#b08968] uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-[#c99a6e]" />
            <span>Venue & Land Statistics</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#15100e] p-2 rounded-lg border border-[#3d302a]">
              <div className="text-[10px] text-[#8d7b68]">Total Footprint</div>
              <div className="font-mono font-bold text-[#f5ebe0] text-sm">
                {plot.width} × {plot.height} {plot.unit}
              </div>
            </div>
            <div className="bg-[#15100e] p-2 rounded-lg border border-[#3d302a]">
              <div className="text-[10px] text-[#8d7b68]">Total Area</div>
              <div className="font-mono font-bold text-[#f5ebe0] text-sm">
                {plotArea.toFixed(1)} {plot.unit}²
              </div>
            </div>
            <div className="bg-[#15100e] p-2 rounded-lg border border-[#3d302a]">
              <div className="text-[10px] text-[#8d7b68]">Active Usable Space</div>
              <div className="font-mono font-bold text-[#c99a6e] text-sm">
                {totalBuiltArea.toFixed(1)} {plot.unit}²
              </div>
            </div>
            <div className="bg-[#15100e] p-2 rounded-lg border border-[#3d302a]">
              <div className="text-[10px] text-[#8d7b68]">Space Utilization</div>
              <div className="font-mono font-bold text-emerald-400 text-sm">
                {coverageRatio.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Breakdown List */}
          {rooms.length > 0 && (
            <div className="pt-2 border-t border-[#3d302a] space-y-1">
              <div className="text-[10px] text-[#8d7b68] uppercase font-semibold">
                Spaces Breakdown ({rooms.length})
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                {rooms.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-[11px] bg-[#15100e] px-2 py-1 rounded border border-[#3d302a]"
                  >
                    <span className="text-[#f5ebe0] truncate">{r.name}</span>
                    <span className="font-mono text-[#b08968]">
                      {(r.width * r.height).toFixed(1)} m²
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

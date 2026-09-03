import React from 'react';
import {
  RotateCw,
  Copy,
  Trash2,
  Tag,
  Building2,
  Shapes,
  Maximize2,
  Sliders,
  Compass,
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
    addFixtureVertex,
    removeFixtureVertex,
    rotateRoom,
    cloneRoom,
    deleteRoom,
    setRoomWallRadius,
    addRoomVertex,
    removeRoomVertex,
    moveOpening,
    flipOpeningSwing,
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
    <aside className="w-80 bg-[#0d121d]/90 backdrop-blur-2xl border-l border-white/[0.08] flex flex-col z-20 select-none shadow-2xl text-xs text-slate-300 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-slate-100 text-xs uppercase tracking-wider">
            {selectedType ? `${selectedType} Inspector` : 'Spatial Inspector'}
          </span>
        </div>
        {selectedType && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
            Active
          </span>
        )}
      </div>

      <div className="p-3.5 space-y-4">
        {/* --- 1. SELECTED FIXTURE / SHAPE INSPECTOR --- */}
        {selectedFixture && (
          <div className="space-y-3.5 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Object & Shape Config
              </span>
              <span className="text-[9px] bg-slate-900 text-amber-400 font-mono px-2 py-0.5 rounded-md border border-white/10">
                {selectedFixture.geometry || 'rectangle'}
              </span>
            </div>

            {/* Rename Input */}
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Label / Name:</label>
              <input
                type="text"
                value={selectedFixture.name}
                onChange={(e) => updateFixture(selectedFixture.id, { name: e.target.value })}
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400/70 transition"
                placeholder="Name this object..."
              />
            </div>

            {/* Shape Geometry Selector */}
            <div>
              <label className="block text-[10px] text-slate-400 mb-1.5 font-semibold flex items-center gap-1">
                <Shapes className="w-3.5 h-3.5 text-amber-400" />
                <span>Remodel Geometry:</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {SHAPE_GEOMETRIES.map((geom) => (
                  <button
                    key={geom.id}
                    onClick={() => updateFixture(selectedFixture.id, { geometry: geom.id, vertices: undefined })}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-semibold transition text-center border ${
                      (selectedFixture.geometry || 'rectangle') === geom.id
                        ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-md'
                        : 'bg-slate-900/60 border-white/[0.08] text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    {geom.label.split(' ')[0]}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <button
                  onClick={() => addFixtureVertex(selectedFixture.id)}
                  className="flex-1 py-1.5 px-2 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-[10px] font-semibold rounded-xl border border-amber-400/30 transition flex items-center justify-center gap-1"
                >
                  <span>+ Add Corner Point</span>
                </button>
                <button
                  onClick={() => {
                    const verts = selectedFixture.vertices;
                    if (verts && verts.length > 3) {
                      removeFixtureVertex(selectedFixture.id, verts.length - 1);
                    }
                  }}
                  className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-[10px] font-semibold rounded-xl border border-white/10 transition"
                  title="Remove last corner point"
                >
                  <span>- Point</span>
                </button>
              </div>
            </div>

            {/* Width & Depth Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Width (m):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  value={selectedFixture.width}
                  onChange={(e) => updateFixture(selectedFixture.id, { width: parseFloat(e.target.value) || 0.5 })}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400/70"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Length / Depth (m):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  value={selectedFixture.height}
                  onChange={(e) => updateFixture(selectedFixture.id, { height: parseFloat(e.target.value) || 0.5 })}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400/70"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => rotateFixture(selectedFixture.id)}
                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition text-[11px] font-medium"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Rot 90°</span>
              </button>
              <button
                onClick={() => cloneFixture(selectedFixture.id)}
                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition text-[11px] font-medium"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Clone</span>
              </button>
              <button
                onClick={() => deleteFixture(selectedFixture.id)}
                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition"
                title="Delete Object"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- 2. SELECTED ROOM / ZONE INSPECTOR --- */}
        {selectedRoom && (
          <div className="space-y-3.5 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Space Zone Config
              </span>
              <span className="text-[9px] bg-sky-500/10 text-sky-300 font-mono px-2 py-0.5 rounded-md border border-sky-500/20">
                {(selectedRoom.width * selectedRoom.height).toFixed(1)} m²
              </span>
            </div>

            {/* Rename Input */}
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Zone / Room Name:</label>
              <input
                type="text"
                value={selectedRoom.name}
                onChange={(e) => updateRoom(selectedRoom.id, { name: e.target.value })}
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400/70 transition"
              />
            </div>

            {/* Outer Wall Curvature / Radius */}
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-white/[0.06] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-300">
                <span className="font-semibold flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-amber-400" />
                  <span>Wall Curvature (Radius):</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">{(selectedRoom.wallRadius ?? 0).toFixed(1)}m</span>
              </div>
              <input
                type="range"
                min="0"
                max="3.0"
                step="0.1"
                value={selectedRoom.wallRadius ?? 0}
                onChange={(e) => setRoomWallRadius(selectedRoom.id, parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[9px] text-slate-500">
                <span>0.0m (Sharp 90°)</span>
                <span>3.0m (Smooth Curved)</span>
              </div>
            </div>

            {/* Custom Polygon Wall Corners */}
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 font-semibold flex items-center gap-1">
                <Maximize2 className="w-3 h-3 text-sky-400" />
                <span>Wall Corner Points ({selectedRoom.vertices?.length || 4} Corners):</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => addRoomVertex(selectedRoom.id)}
                  className="flex-1 py-1.5 px-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-[10px] font-semibold rounded-xl border border-sky-500/30 transition"
                >
                  + Add Wall Corner
                </button>
                <button
                  onClick={() => {
                    const verts = selectedRoom.vertices;
                    if (verts && verts.length > 3) {
                      removeRoomVertex(selectedRoom.id, verts.length - 1);
                    }
                  }}
                  className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-[10px] font-semibold rounded-xl border border-white/10 transition"
                  title="Remove last wall corner point"
                >
                  - Corner
                </button>
              </div>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Width (m):</label>
                <input
                  type="number"
                  step="0.25"
                  min="1"
                  value={selectedRoom.width}
                  onChange={(e) => updateRoom(selectedRoom.id, { width: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-400/70"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Length (m):</label>
                <input
                  type="number"
                  step="0.25"
                  min="1"
                  value={selectedRoom.height}
                  onChange={(e) => updateRoom(selectedRoom.id, { height: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-400/70"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => rotateRoom(selectedRoom.id)}
                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition text-[11px] font-medium"
              >
                <RotateCw className="w-3.5 h-3.5 text-sky-400" />
                <span>Rotate</span>
              </button>
              <button
                onClick={() => cloneRoom(selectedRoom.id)}
                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition text-[11px] font-medium"
              >
                <Copy className="w-3.5 h-3.5 text-sky-400" />
                <span>Clone</span>
              </button>
              <button
                onClick={() => deleteRoom(selectedRoom.id)}
                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition"
                title="Delete Space"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- 3. SELECTED OPENING INSPECTOR (DOORS & WINDOWS) --- */}
        {selectedOpening && (
          <div className="space-y-3.5 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Door / Window Position
              </span>
              <button
                onClick={() => deleteOpening(selectedOpening.id)}
                className="text-rose-400 hover:text-rose-300 transition"
                title="Delete Opening"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Wall Selector Buttons */}
            <div>
              <label className="block text-[10px] text-slate-400 mb-1.5 font-semibold flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Attach to Wall:</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['north', 'south', 'west', 'east'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => moveOpening(selectedOpening.id, selectedOpening.offset, w)}
                    className={`py-1.5 text-[10px] font-bold uppercase rounded-xl border transition ${
                      selectedOpening.wall === w
                        ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md font-bold'
                        : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Position Slider along Wall */}
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-white/[0.06] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-300">
                <span className="font-semibold">Offset Along Wall:</span>
                <span className="font-mono text-amber-400 font-bold">{selectedOpening.offset.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="0.1"
                max={Math.max(
                  1.0,
                  (selectedOpening.wall === 'north' || selectedOpening.wall === 'south'
                    ? (rooms.find((r) => r.id === selectedOpening.roomId)?.width ?? 5)
                    : (rooms.find((r) => r.id === selectedOpening.roomId)?.height ?? 5)) -
                    selectedOpening.width -
                    0.1
                )}
                step="0.05"
                value={selectedOpening.offset}
                onChange={(e) => moveOpening(selectedOpening.id, parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Flip Swing Direction */}
            <button
              onClick={() => flipOpeningSwing(selectedOpening.id)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-white/10 transition flex items-center justify-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Flip Swing Direction ({selectedOpening.swingDirection || 'inside'})</span>
            </button>
          </div>
        )}

        {/* --- 4. GLOBAL VENUE & PLOT METRICS --- */}
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Venue & Land Statistics</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/[0.06]">
              <div className="text-[10px] text-slate-400">Total Footprint</div>
              <div className="font-mono font-bold text-slate-100 text-sm mt-0.5">
                {plot.width} × {plot.height} {plot.unit}
              </div>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/[0.06]">
              <div className="text-[10px] text-slate-400">Total Area</div>
              <div className="font-mono font-bold text-slate-100 text-sm mt-0.5">
                {plotArea.toFixed(1)} {plot.unit}²
              </div>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/[0.06]">
              <div className="text-[10px] text-slate-400">Active Usable Space</div>
              <div className="font-mono font-bold text-amber-400 text-sm mt-0.5">
                {totalBuiltArea.toFixed(1)} {plot.unit}²
              </div>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/[0.06]">
              <div className="text-[10px] text-slate-400">Space Utilization</div>
              <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                {coverageRatio.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Breakdown List */}
          {rooms.length > 0 && (
            <div className="pt-2 border-t border-white/[0.08] space-y-1.5">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                Spaces Breakdown ({rooms.length})
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                {rooms.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-[11px] bg-slate-950/60 px-2.5 py-1.5 rounded-xl border border-white/[0.06]"
                  >
                    <span className="text-slate-200 truncate font-medium">{r.name}</span>
                    <span className="font-mono text-slate-400 text-[10px]">
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

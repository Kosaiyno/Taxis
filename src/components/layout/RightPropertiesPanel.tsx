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
    <aside className="w-80 bg-[#18110e]/95 backdrop-blur-2xl border-l border-[#3d302a] flex flex-col z-20 select-none shadow-2xl text-xs text-[#e6ccb2] overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-3.5 border-b border-[#3d302a] flex items-center justify-between bg-[#1c1512]">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#c99a6e]" />
          <span className="font-bold text-[#f5ebe0] text-xs uppercase tracking-wider">
            {selectedType ? `${selectedType} Inspector` : 'Spatial Inspector'}
          </span>
        </div>
        {selectedType && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#c99a6e]/15 text-[#c99a6e] border border-[#c99a6e]/30 font-bold">
            Active
          </span>
        )}
      </div>

      <div className="p-3.5 space-y-4">
        {/* --- 1. SELECTED FIXTURE / SHAPE INSPECTOR --- */}
        {selectedFixture && (
          <div className="space-y-3.5 bg-[#261e1b]/70 border border-[#3d302a] rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#b08968] uppercase tracking-wider">
                Object & Shape Config
              </span>
              <span className="text-[9px] bg-[#1c1512] text-[#c99a6e] font-mono px-2 py-0.5 rounded-md border border-[#3d302a]">
                {selectedFixture.geometry || 'rectangle'}
              </span>
            </div>

            {/* Rename Input */}
            <div>
              <label className="block text-[10px] text-[#b08968] mb-1 font-semibold">Label / Name:</label>
              <input
                type="text"
                value={selectedFixture.name}
                onChange={(e) => updateFixture(selectedFixture.id, { name: e.target.value })}
                className="w-full bg-[#1c1512] border border-[#3d302a] rounded-xl px-3 py-2 text-xs text-[#f5ebe0] focus:outline-none focus:border-[#c99a6e] transition"
                placeholder="Name this object..."
              />
            </div>

            {/* Shape Geometry Selector */}
            <div>
              <label className="block text-[10px] text-[#b08968] mb-1.5 font-semibold flex items-center gap-1">
                <Shapes className="w-3.5 h-3.5 text-[#c99a6e]" />
                <span>Remodel Geometry:</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {SHAPE_GEOMETRIES.map((geom) => (
                  <button
                    key={geom.id}
                    onClick={() => updateFixture(selectedFixture.id, { geometry: geom.id, vertices: undefined })}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-semibold transition text-center border ${
                      (selectedFixture.geometry || 'rectangle') === geom.id
                        ? 'bg-[#c99a6e] text-[#18110e] border-[#c99a6e] font-black shadow-md'
                        : 'bg-[#1c1512] border-[#3d302a] text-[#b08968] hover:text-[#f5ebe0] hover:bg-[#322723]'
                    }`}
                  >
                    {geom.label.split(' ')[0]}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <button
                  onClick={() => addFixtureVertex(selectedFixture.id)}
                  className="flex-1 py-1.5 px-2 bg-[#c99a6e]/15 hover:bg-[#c99a6e]/25 text-[#ddb892] text-[10px] font-semibold rounded-xl border border-[#c99a6e]/30 transition flex items-center justify-center gap-1"
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
                  className="py-1.5 px-2.5 bg-[#1c1512] hover:bg-[#322723] text-[#b08968] hover:text-rose-400 text-[10px] font-semibold rounded-xl border border-[#3d302a] transition"
                  title="Remove last corner point"
                >
                  <span>- Point</span>
                </button>
              </div>
            </div>

            {/* Width & Depth Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#b08968] mb-1">Width (m):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  value={selectedFixture.width}
                  onChange={(e) => updateFixture(selectedFixture.id, { width: parseFloat(e.target.value) || 0.5 })}
                  className="w-full bg-[#1c1512] border border-[#3d302a] rounded-xl px-2.5 py-1.5 text-xs text-[#f5ebe0] font-mono focus:outline-none focus:border-[#c99a6e]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#b08968] mb-1">Length / Depth (m):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  value={selectedFixture.height}
                  onChange={(e) => updateFixture(selectedFixture.id, { height: parseFloat(e.target.value) || 0.5 })}
                  className="w-full bg-[#1c1512] border border-[#3d302a] rounded-xl px-2.5 py-1.5 text-xs text-[#f5ebe0] font-mono focus:outline-none focus:border-[#c99a6e]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#3d302a]">
              <button
                onClick={() => rotateFixture(selectedFixture.id)}
                className="flex-1 py-1.5 bg-[#1c1512] hover:bg-[#322723] text-[#e6ccb2] rounded-xl border border-[#3d302a] flex items-center justify-center gap-1.5 transition text-[11px] font-medium"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#c99a6e]" />
                <span>Rot 90°</span>
              </button>
              <button
                onClick={() => cloneFixture(selectedFixture.id)}
                className="flex-1 py-1.5 bg-[#1c1512] hover:bg-[#322723] text-[#e6ccb2] rounded-xl border border-[#3d302a] flex items-center justify-center gap-1.5 transition text-[11px] font-medium"
              >
                <Copy className="w-3.5 h-3.5 text-[#c99a6e]" />
                <span>Clone</span>
              </button>
              <button
                onClick={() => deleteFixture(selectedFixture.id)}
                className="p-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-xl border border-rose-500/30 transition"
                title="Delete Object"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- 2. SELECTED ROOM / ZONE INSPECTOR --- */}
        {selectedRoom && (
          <div className="space-y-3.5 bg-[#261e1b]/70 border border-[#3d302a] rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#b08968] uppercase tracking-wider">
                Space Zone Config
              </span>
              <span className="text-[9px] bg-[#c99a6e]/15 text-[#c99a6e] font-mono px-2 py-0.5 rounded-md border border-[#c99a6e]/30 font-bold">
                {(selectedRoom.width * selectedRoom.height).toFixed(1)} m²
              </span>
            </div>

            {/* Rename Input */}
            <div>
              <label className="block text-[10px] text-[#b08968] mb-1 font-semibold">Zone / Room Name:</label>
              <input
                type="text"
                value={selectedRoom.name}
                onChange={(e) => updateRoom(selectedRoom.id, { name: e.target.value })}
                className="w-full bg-[#1c1512] border border-[#3d302a] rounded-xl px-3 py-2 text-xs text-[#f5ebe0] focus:outline-none focus:border-[#c99a6e] transition"
              />
            </div>

            {/* Outer Wall Curvature / Radius */}
            <div className="bg-[#1c1512] p-2.5 rounded-xl border border-[#3d302a] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-[#e6ccb2]">
                <span className="font-semibold flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-[#c99a6e]" />
                  <span>Wall Curvature (Radius):</span>
                </span>
                <span className="font-mono text-[#c99a6e] font-bold">{(selectedRoom.wallRadius ?? 0).toFixed(1)}m</span>
              </div>
              <input
                type="range"
                min="0"
                max="3.0"
                step="0.1"
                value={selectedRoom.wallRadius ?? 0}
                onChange={(e) => setRoomWallRadius(selectedRoom.id, parseFloat(e.target.value))}
                className="w-full accent-[#c99a6e] cursor-pointer"
              />
              <div className="flex items-center justify-between text-[9px] text-[#8d7b68]">
                <span>0.0m (Sharp 90°)</span>
                <span>3.0m (Smooth Curved)</span>
              </div>
            </div>

            {/* Custom Polygon Wall Corners */}
            <div>
              <label className="block text-[10px] text-[#b08968] mb-1 font-semibold flex items-center gap-1">
                <Maximize2 className="w-3 h-3 text-[#c99a6e]" />
                <span>Wall Corner Points ({selectedRoom.vertices?.length || 4} Corners):</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => addRoomVertex(selectedRoom.id)}
                  className="flex-1 py-1.5 px-2 bg-[#c99a6e]/15 hover:bg-[#c99a6e]/25 text-[#ddb892] text-[10px] font-semibold rounded-xl border border-[#c99a6e]/30 transition"
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
                  className="py-1.5 px-2.5 bg-[#1c1512] hover:bg-[#322723] text-[#b08968] hover:text-rose-400 text-[10px] font-semibold rounded-xl border border-[#3d302a] transition"
                  title="Remove last wall corner point"
                >
                  - Corner
                </button>
              </div>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#b08968] mb-1">Width (m):</label>
                <input
                  type="number"
                  step="0.25"
                  min="1"
                  value={selectedRoom.width}
                  onChange={(e) => updateRoom(selectedRoom.id, { width: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-[#1c1512] border border-[#3d302a] rounded-xl px-2.5 py-1.5 text-xs text-[#f5ebe0] font-mono focus:outline-none focus:border-[#c99a6e]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#b08968] mb-1">Length (m):</label>
                <input
                  type="number"
                  step="0.25"
                  min="1"
                  value={selectedRoom.height}
                  onChange={(e) => updateRoom(selectedRoom.id, { height: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-[#1c1512] border border-[#3d302a] rounded-xl px-2.5 py-1.5 text-xs text-[#f5ebe0] font-mono focus:outline-none focus:border-[#c99a6e]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#3d302a]">
              <button
                onClick={() => rotateRoom(selectedRoom.id)}
                className="flex-1 py-1.5 bg-[#1c1512] hover:bg-[#322723] text-[#e6ccb2] rounded-xl border border-[#3d302a] flex items-center justify-center gap-1.5 transition text-[11px] font-medium"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#c99a6e]" />
                <span>Rotate</span>
              </button>
              <button
                onClick={() => cloneRoom(selectedRoom.id)}
                className="flex-1 py-1.5 bg-[#1c1512] hover:bg-[#322723] text-[#e6ccb2] rounded-xl border border-[#3d302a] flex items-center justify-center gap-1.5 transition text-[11px] font-medium"
              >
                <Copy className="w-3.5 h-3.5 text-[#c99a6e]" />
                <span>Clone</span>
              </button>
              <button
                onClick={() => deleteRoom(selectedRoom.id)}
                className="p-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-xl border border-rose-500/30 transition"
                title="Delete Space"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- 3. SELECTED OPENING INSPECTOR (DOORS & WINDOWS) --- */}
        {selectedOpening && (
          <div className="space-y-3.5 bg-[#261e1b]/70 border border-[#3d302a] rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#b08968] uppercase tracking-wider">
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
              <label className="block text-[10px] text-[#b08968] mb-1.5 font-semibold flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-[#c99a6e]" />
                <span>Attach to Wall:</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['north', 'south', 'west', 'east'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => moveOpening(selectedOpening.id, selectedOpening.offset, w)}
                    className={`py-1.5 text-[10px] font-bold uppercase rounded-xl border transition ${
                      selectedOpening.wall === w
                        ? 'bg-[#c99a6e] text-[#18110e] border-[#c99a6e] shadow-md font-black'
                        : 'bg-[#1c1512] border-[#3d302a] text-[#b08968] hover:text-[#f5ebe0]'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Position Slider along Wall */}
            <div className="bg-[#1c1512] p-2.5 rounded-xl border border-[#3d302a] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-[#e6ccb2]">
                <span className="font-semibold">Offset Along Wall:</span>
                <span className="font-mono text-[#c99a6e] font-bold">{selectedOpening.offset.toFixed(2)}m</span>
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
                className="w-full accent-[#c99a6e] cursor-pointer"
              />
            </div>

            {/* Flip Swing Direction */}
            <button
              onClick={() => flipOpeningSwing(selectedOpening.id)}
              className="w-full py-2 bg-[#1c1512] hover:bg-[#322723] text-[#e6ccb2] text-xs font-semibold rounded-xl border border-[#3d302a] transition flex items-center justify-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#c99a6e]" />
              <span>Flip Swing Direction ({selectedOpening.swingDirection || 'inside'})</span>
            </button>
          </div>
        )}

        {/* --- 4. GLOBAL VENUE & PLOT METRICS --- */}
        <div className="bg-[#261e1b]/40 border border-[#3d302a] rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#b08968] uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-[#c99a6e]" />
            <span>Venue & Land Statistics</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#1c1512] p-2.5 rounded-xl border border-[#3d302a]">
              <div className="text-[10px] text-[#b08968]">Total Footprint</div>
              <div className="font-mono font-bold text-[#f5ebe0] text-sm mt-0.5">
                {plot.width} × {plot.height} {plot.unit}
              </div>
            </div>
            <div className="bg-[#1c1512] p-2.5 rounded-xl border border-[#3d302a]">
              <div className="text-[10px] text-[#b08968]">Total Area</div>
              <div className="font-mono font-bold text-[#f5ebe0] text-sm mt-0.5">
                {plotArea.toFixed(1)} {plot.unit}²
              </div>
            </div>
            <div className="bg-[#1c1512] p-2.5 rounded-xl border border-[#3d302a]">
              <div className="text-[10px] text-[#b08968]">Active Usable Space</div>
              <div className="font-mono font-bold text-[#c99a6e] text-sm mt-0.5">
                {totalBuiltArea.toFixed(1)} {plot.unit}²
              </div>
            </div>
            <div className="bg-[#1c1512] p-2.5 rounded-xl border border-[#3d302a]">
              <div className="text-[10px] text-[#b08968]">Space Utilization</div>
              <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                {coverageRatio.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Breakdown List */}
          {rooms.length > 0 && (
            <div className="pt-2 border-t border-[#3d302a] space-y-1.5">
              <div className="text-[10px] text-[#b08968] uppercase font-semibold">
                Spaces Breakdown ({rooms.length})
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                {rooms.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-[11px] bg-[#1c1512] px-2.5 py-1.5 rounded-xl border border-[#3d302a]"
                  >
                    <span className="text-[#f5ebe0] truncate font-medium">{r.name}</span>
                    <span className="font-mono text-[#b08968] text-[10px]">
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

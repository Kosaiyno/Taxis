import React from 'react';
import {
  Trash2,
  Palette,
  RotateCw,
  Copy,
} from 'lucide-react';
import { useFloorPlanStore } from '../../store/floorplanStore';
import { RoomType, OpeningType, WallOrientation } from '../../types/floorplan';
import { ROOM_PRESETS, OPENING_PRESETS } from '../../utils/defaultPresets';
import { formatArea } from '../../utils/geometry';

export const RightPropertiesPanel: React.FC = () => {
  const {
    selectedId,
    selectedType,
    rooms,
    openings,
    fixtures,
    plot,
    updateRoom,
    deleteRoom,
    cloneRoom,
    updateOpening,
    deleteOpening,
    updateFixture,
    deleteFixture,
    rotateFixture,
    cloneFixture,
    selectItem,
  } = useFloorPlanStore();

  const selectedRoom = selectedType === 'room' ? rooms.find((r) => r.id === selectedId) : null;
  const selectedOpening = selectedType === 'opening' ? openings.find((o) => o.id === selectedId) : null;
  const selectedFixture = selectedType === 'fixture' ? fixtures.find((f) => f.id === selectedId) : null;

  const totalPlotArea = plot.width * plot.height;
  const totalBuiltArea = rooms.reduce((acc, r) => acc + r.width * r.height, 0);
  const plotCoveragePercent = Math.min(100, Math.round((totalBuiltArea / totalPlotArea) * 100));

  return (
    <aside className="w-72 bg-[#1c1512] border-l border-[#3d302a] flex flex-col z-20 select-none shadow-xl text-[#e6ccb2]">
      {/* Header */}
      <div className="p-3 border-b border-[#3d302a] flex items-center justify-between bg-[#15100e]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#c99a6e]" />
          <h2 className="text-xs font-bold tracking-wider text-[#e6ccb2] uppercase">
            {selectedRoom
              ? 'Room Inspector'
              : selectedOpening
              ? 'Opening Inspector'
              : selectedFixture
              ? 'Object Inspector'
              : 'Plot & Metrics'}
          </h2>
        </div>

        {selectedId && (
          <button
            onClick={() => selectItem(null, null)}
            className="text-[11px] text-[#b08968] hover:text-[#e6ccb2] px-2 py-0.5 rounded hover:bg-[#261e1b] transition"
          >
            Deselect
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar text-xs">
        {/* ROOM PROPERTIES */}
        {selectedRoom && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[#b08968] font-medium mb-1">Room Label</label>
              <input
                type="text"
                value={selectedRoom.name}
                onChange={(e) => updateRoom(selectedRoom.id, { name: e.target.value })}
                className="w-full bg-[#261e1b] border border-[#3d302a] rounded-lg px-3 py-1.5 text-[#f5ebe0] font-semibold focus:outline-none focus:border-[#c99a6e]"
              />
            </div>

            <div>
              <label className="block text-[#b08968] font-medium mb-1">Room Category</label>
              <select
                value={selectedRoom.type}
                onChange={(e) => {
                  const newType = e.target.value as RoomType;
                  const preset = ROOM_PRESETS[newType];
                  updateRoom(selectedRoom.id, {
                    type: newType,
                    color: preset?.color || selectedRoom.color,
                    floorTexture: preset?.floorTexture || selectedRoom.floorTexture,
                  });
                }}
                className="w-full bg-[#261e1b] border border-[#3d302a] rounded-lg px-3 py-1.5 text-[#f5ebe0] focus:outline-none focus:border-[#c99a6e]"
              >
                {Object.entries(ROOM_PRESETS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-2.5 p-3 bg-[#15100e] rounded-xl border border-[#3d302a]">
              <div>
                <label className="block text-[#b08968] font-mono text-[10px] mb-1">Width ({plot.unit})</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="30.0"
                  value={selectedRoom.width}
                  onChange={(e) => updateRoom(selectedRoom.id, { width: parseFloat(e.target.value) || 1.0 })}
                  className="w-full bg-[#261e1b] border border-[#3d302a] rounded-lg px-2 py-1 text-[#f5ebe0] font-mono text-center focus:outline-none focus:border-[#c99a6e]"
                />
              </div>

              <div>
                <label className="block text-[#b08968] font-mono text-[10px] mb-1">Length ({plot.unit})</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="30.0"
                  value={selectedRoom.height}
                  onChange={(e) => updateRoom(selectedRoom.id, { height: parseFloat(e.target.value) || 1.0 })}
                  className="w-full bg-[#261e1b] border border-[#3d302a] rounded-lg px-2 py-1 text-[#f5ebe0] font-mono text-center focus:outline-none focus:border-[#c99a6e]"
                />
              </div>

              <div className="col-span-2 pt-1.5 border-t border-[#3d302a] flex items-center justify-between">
                <span className="text-[#b08968] font-medium">Area:</span>
                <span className="font-mono font-bold text-[#c99a6e] text-sm">
                  {formatArea(selectedRoom.width * selectedRoom.height, plot.unit)}
                </span>
              </div>
            </div>

            {/* Position */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#15100e] rounded-xl border border-[#3d302a]">
              <div>
                <label className="block text-[#b08968] font-mono text-[10px] mb-1">X Offset</label>
                <input
                  type="number"
                  step="0.1"
                  value={selectedRoom.x}
                  onChange={(e) => updateRoom(selectedRoom.id, { x: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#261e1b] border border-[#3d302a] rounded-lg px-2 py-1 text-[#f5ebe0] font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-[#b08968] font-mono text-[10px] mb-1">Y Offset</label>
                <input
                  type="number"
                  step="0.1"
                  value={selectedRoom.y}
                  onChange={(e) => updateRoom(selectedRoom.id, { y: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#261e1b] border border-[#3d302a] rounded-lg px-2 py-1 text-[#f5ebe0] font-mono text-center"
                />
              </div>
            </div>

            {/* Color Swatch */}
            <div>
              <label className="block text-[#b08968] font-medium mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>Sandy Floor Tone</span>
              </label>
              <div className="flex items-center gap-1.5">
                {['#eddcc9', '#f3e6d8', '#f5ebe0', '#eae0d2', '#ebd9c3', '#e5ded6', '#e2ddd7'].map((c) => (
                  <button
                    key={c}
                    onClick={() => updateRoom(selectedRoom.id, { color: c })}
                    className={`w-6 h-6 rounded-md border transition ${
                      selectedRoom.color === c ? 'border-[#c99a6e] scale-110 shadow' : 'border-[#3d302a]'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => cloneRoom(selectedRoom.id)}
                className="py-2 px-3 bg-[#261e1b] hover:bg-[#322723] text-[#e6ccb2] font-semibold rounded-xl border border-[#3d302a] transition flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-[#c99a6e]" />
                <span>Duplicate</span>
              </button>

              <button
                onClick={() => deleteRoom(selectedRoom.id)}
                className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-xl border border-rose-500/30 transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* OPENING PROPERTIES */}
        {selectedOpening && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[#b08968] font-medium mb-1">Opening Type</label>
              <select
                value={selectedOpening.type}
                onChange={(e) => updateOpening(selectedOpening.id, { type: e.target.value as OpeningType })}
                className="w-full bg-[#261e1b] border border-[#3d302a] rounded-lg px-3 py-1.5 text-[#f5ebe0] focus:outline-none"
              >
                {Object.entries(OPENING_PRESETS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#b08968] font-medium mb-1">Wall Orientation</label>
              <select
                value={selectedOpening.wall}
                onChange={(e) => updateOpening(selectedOpening.id, { wall: e.target.value as WallOrientation })}
                className="w-full bg-[#261e1b] border border-[#3d302a] rounded-lg px-3 py-1.5 text-[#f5ebe0] focus:outline-none"
              >
                <option value="north">North (Top)</option>
                <option value="south">South (Bottom)</option>
                <option value="west">West (Left)</option>
                <option value="east">East (Right)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-3 bg-[#15100e] rounded-xl border border-[#3d302a]">
              <div>
                <label className="block text-[#b08968] font-mono text-[10px] mb-1">Width ({plot.unit})</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="4.0"
                  value={selectedOpening.width}
                  onChange={(e) => updateOpening(selectedOpening.id, { width: parseFloat(e.target.value) || 0.9 })}
                  className="w-full bg-[#261e1b] border border-[#3d302a] rounded-lg px-2 py-1 text-[#f5ebe0] font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-[#b08968] font-mono text-[10px] mb-1">Wall Offset</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={selectedOpening.offset}
                  onChange={(e) => updateOpening(selectedOpening.id, { offset: parseFloat(e.target.value) || 0.5 })}
                  className="w-full bg-[#261e1b] border border-[#3d302a] rounded-lg px-2 py-1 text-[#f5ebe0] font-mono text-center"
                />
              </div>
            </div>

            <button
              onClick={() => deleteOpening(selectedOpening.id)}
              className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-xl border border-rose-500/30 transition flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Opening</span>
            </button>
          </div>
        )}

        {/* FIXTURE PROPERTIES */}
        {selectedFixture && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[#b08968] font-medium mb-1">Object Name</label>
              <input
                type="text"
                value={selectedFixture.name}
                onChange={(e) => updateFixture(selectedFixture.id, { name: e.target.value })}
                className="w-full bg-[#261e1b] border border-[#3d302a] rounded-lg px-3 py-1.5 text-[#f5ebe0] font-semibold focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-3 bg-[#15100e] rounded-xl border border-[#3d302a]">
              <div>
                <label className="block text-[#b08968] font-mono text-[10px] mb-1">Width ({plot.unit})</label>
                <input
                  type="number"
                  step="0.05"
                  value={selectedFixture.width}
                  onChange={(e) => updateFixture(selectedFixture.id, { width: parseFloat(e.target.value) || 0.5 })}
                  className="w-full bg-[#261e1b] border border-[#3d302a] rounded-lg px-2 py-1 text-[#f5ebe0] font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-[#b08968] font-mono text-[10px] mb-1">Length ({plot.unit})</label>
                <input
                  type="number"
                  step="0.05"
                  value={selectedFixture.height}
                  onChange={(e) => updateFixture(selectedFixture.id, { height: parseFloat(e.target.value) || 0.5 })}
                  className="w-full bg-[#261e1b] border border-[#3d302a] rounded-lg px-2 py-1 text-[#f5ebe0] font-mono text-center"
                />
              </div>
            </div>

            <div className="p-2.5 bg-[#15100e] rounded-xl border border-[#3d302a] flex items-center justify-between">
              <div>
                <span className="text-[#b08968] font-medium block">Rotation</span>
                <span className="font-mono text-[#c99a6e] font-bold">{selectedFixture.rotation}°</span>
              </div>
              <button
                onClick={() => rotateFixture(selectedFixture.id)}
                className="px-2.5 py-1 bg-[#261e1b] hover:bg-[#322723] text-[#e6ccb2] rounded-lg border border-[#3d302a] flex items-center gap-1 transition"
              >
                <RotateCw className="w-3 h-3 text-[#c99a6e]" />
                <span>+90°</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => cloneFixture(selectedFixture.id)}
                className="py-2 px-3 bg-[#261e1b] hover:bg-[#322723] text-[#e6ccb2] font-semibold rounded-xl border border-[#3d302a] transition flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-[#c99a6e]" />
                <span>Duplicate</span>
              </button>

              <button
                onClick={() => deleteFixture(selectedFixture.id)}
                className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-xl border border-rose-500/30 transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* DEFAULT OVERVIEW */}
        {!selectedRoom && !selectedOpening && !selectedFixture && (
          <div className="space-y-3.5">
            <div className="p-3 bg-[#15100e] rounded-xl border border-[#3d302a] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[#f5ebe0] font-bold">Land Plot</span>
                <span className="font-mono text-[#c99a6e] font-semibold">
                  {plot.width} × {plot.height} {plot.unit}
                </span>
              </div>

              <div className="h-px bg-[#3d302a]" />

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#b08968]">Total Land:</span>
                  <span className="font-mono text-[#f5ebe0] font-bold">{formatArea(totalPlotArea, plot.unit)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#b08968]">Living Space:</span>
                  <span className="font-mono text-[#c99a6e] font-bold">{formatArea(totalBuiltArea, plot.unit)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#b08968]">Coverage:</span>
                  <span className="font-mono text-emerald-400 font-bold">{plotCoveragePercent}%</span>
                </div>
              </div>

              <div className="w-full bg-[#261e1b] rounded-full h-2 overflow-hidden border border-[#3d302a]">
                <div
                  className="bg-gradient-to-r from-[#c99a6e] to-emerald-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, plotCoveragePercent)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="text-[#b08968] font-bold text-[11px] mb-2 uppercase tracking-wider">
                Rooms List ({rooms.length})
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => selectItem(room.id, 'room')}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#261e1b]/80 hover:bg-[#322723] border border-[#3d302a] cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: room.color }} />
                      <span className="font-medium text-[#f5ebe0]">{room.name}</span>
                    </div>
                    <span className="font-mono text-[#b08968] text-[10px]">
                      {formatArea(room.width * room.height, plot.unit)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

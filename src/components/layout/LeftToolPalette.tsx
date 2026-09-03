import React, { useState } from 'react';
import {
  Plus,
  DoorOpen,
  AppWindow,
  ChevronDown,
  Maximize2,
  Compass,
} from 'lucide-react';
import { useFloorPlanStore } from '../../store/floorplanStore';
import {
  SPACE_CATEGORIES,
  ROOM_PRESETS,
  OPENING_PRESETS,
  FIXTURE_PRESETS,
  SHAPE_GEOMETRIES,
} from '../../utils/defaultPresets';
import {
  SpaceCategory,
  RoomType,
  OpeningType,
  FixtureType,
  ShapeGeometry,
} from '../../types/floorplan';

export const LeftToolPalette: React.FC = () => {
  const {
    rooms,
    selectedId,
    addRoom,
    addOpening,
    addFixture,
  } = useFloorPlanStore();

  const [activeTab, setActiveTab] = useState<'spaces' | 'shapes' | 'openings' | 'objects'>('spaces');
  const [selectedCategory, setSelectedCategory] = useState<SpaceCategory>('commercial_office');

  const handleAddRoom = (type: RoomType) => {
    addRoom({ type });
  };

  const handleAddShape = (geometry: ShapeGeometry) => {
    const targetRoomId = selectedId || rooms[0]?.id || 'canvas';
    addFixture({
      roomId: targetRoomId,
      type: 'custom_shape',
      name: `${geometry.toUpperCase()} Entity`,
      width: geometry === 'circle' ? 2.5 : geometry === 'l_shape' ? 3.0 : 2.5,
      height: geometry === 'circle' ? 2.5 : geometry === 'l_shape' ? 2.5 : 2.0,
      x: 1.5,
      y: 1.5,
      geometry,
    });
  };

  const handleAddOpening = (type: OpeningType) => {
    const targetRoomId = selectedId && rooms.some((r) => r.id === selectedId) ? selectedId : rooms[0]?.id;
    if (targetRoomId) {
      addOpening({
        roomId: targetRoomId,
        type,
        wall: 'south',
        offset: 1.0,
      });
    } else {
      const newRoomId = addRoom({ type: 'open_workspace' });
      addOpening({
        roomId: newRoomId,
        type,
        wall: 'south',
        offset: 1.0,
      });
    }
  };

  const handleAddFixture = (type: FixtureType) => {
    const targetRoomId = selectedId || rooms[0]?.id || 'canvas';
    const config = FIXTURE_PRESETS[type];
    addFixture({
      roomId: targetRoomId,
      type,
      name: config?.name || 'Object',
      width: config?.defaultWidth || 2.0,
      height: config?.defaultHeight || 1.0,
      geometry: config?.defaultGeometry || 'rectangle',
      x: 1.0,
      y: 1.0,
    });
  };

  const categoryRooms = Object.entries(ROOM_PRESETS).filter(
    ([, config]) => config.category === selectedCategory || config.type === 'custom'
  );

  const categoryFixtures = Object.entries(FIXTURE_PRESETS).filter(
    ([, config]) => config.category === selectedCategory || config.category === 'residential' || config.type === 'custom_shape'
  );

  return (
    <aside className="w-72 bg-[#0d121d]/90 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col z-20 select-none shadow-2xl text-slate-300">
      {/* Space Type Selector Dropdown */}
      <div className="p-3 bg-white/[0.02] border-b border-white/[0.08]">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Space Archetype:
          </label>
          <span className="text-[9px] bg-amber-400/10 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-400/20">
            {SPACE_CATEGORIES.find((c) => c.id === selectedCategory)?.label}
          </span>
        </div>
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as SpaceCategory)}
            className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-slate-100 text-xs font-semibold appearance-none focus:outline-none focus:border-amber-400/70 cursor-pointer pr-8 shadow-sm transition"
          >
            {SPACE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-100">
                {cat.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-amber-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* 4 Navigation Tabs */}
      <div className="grid grid-cols-4 p-1.5 bg-slate-950/50 border-b border-white/[0.08] gap-1 text-center">
        {(['spaces', 'shapes', 'openings', 'objects'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-1.5 text-[10px] font-bold rounded-xl transition uppercase ${
              activeTab === tab
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
            }`}
          >
            {tab === 'openings' ? 'DOORS' : tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {/* SPACES TAB */}
        {activeTab === 'spaces' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {SPACE_CATEGORIES.find((c) => c.id === selectedCategory)?.label} Zones
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {categoryRooms.length} available
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {categoryRooms.map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleAddRoom(key as RoomType)}
                  className="p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-amber-400/40 rounded-2xl flex items-center justify-between transition group text-left shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3.5 h-3.5 rounded-md border border-white/20 shadow-sm"
                      style={{ backgroundColor: config.color }}
                    />
                    <div>
                      <div className="font-semibold text-slate-100 text-xs group-hover:text-amber-300 transition-colors">
                        {config.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {config.defaultWidth}m × {config.defaultHeight}m (
                        {(config.defaultWidth * config.defaultHeight).toFixed(1)} m²)
                      </div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-amber-300 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GEOMETRIC SHAPES TAB */}
        {activeTab === 'shapes' && (
          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Remodelable Geometries
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Drag corner points on the canvas to reshape into any custom form.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SHAPE_GEOMETRIES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => handleAddShape(shape.id)}
                  className="p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-amber-400/40 rounded-2xl flex flex-col items-center justify-center gap-2 transition group text-center shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {shape.id === 'circle' && <div className="w-5 h-5 rounded-full border-2 border-amber-400" />}
                    {shape.id === 'rectangle' && <div className="w-5 h-4 border-2 border-amber-400 rounded-sm" />}
                    {shape.id === 'l_shape' && <div className="w-5 h-5 border-t-2 border-l-2 border-b-2 border-amber-400" />}
                    {shape.id === 'u_shape' && <div className="w-5 h-4 border-l-2 border-b-2 border-r-2 border-amber-400" />}
                    {shape.id === 't_shape' && <div className="w-5 h-5 border-t-2 border-l-0 border-r-0 border-amber-400 relative after:content-[''] after:absolute after:left-1/2 after:top-0 after:w-0.5 after:h-5 after:bg-amber-400" />}
                    {shape.id === 'v_shape' && <div className="w-5 h-4 border-b-2 border-l-2 border-amber-400 rotate-45 transform origin-center" />}
                  </div>
                  <div className="font-semibold text-slate-100 text-[11px]">{shape.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* OPENINGS TAB (DOORS & WINDOWS) */}
        {activeTab === 'openings' && (
          <div className="space-y-4">
            {/* Direct placement tip */}
            <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] flex items-start gap-2.5">
              <Compass className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>Wall Snapping:</strong> Click below to add a door, or click directly on any room wall in the canvas! Dragging across walls smoothly hops to adjacent walls.
              </span>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Doors & Access Points
              </div>
              <div className="space-y-2">
                {Object.entries(OPENING_PRESETS)
                  .filter(([k]) => k.includes('door'))
                  .map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleAddOpening(key as OpeningType)}
                      className="w-full p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-amber-400/40 rounded-2xl flex items-center justify-between transition group text-left shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400">
                          <DoorOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 text-xs group-hover:text-amber-300 transition-colors">
                            {config.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{config.defaultWidth}m standard</div>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-slate-400 group-hover:text-amber-300 transition-colors" />
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Windows
              </div>
              <div className="space-y-2">
                {Object.entries(OPENING_PRESETS)
                  .filter(([k]) => k.includes('window'))
                  .map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleAddOpening(key as OpeningType)}
                      className="w-full p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-sky-400/40 rounded-2xl flex items-center justify-between transition group text-left shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                          <AppWindow className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 text-xs group-hover:text-sky-300 transition-colors">
                            {config.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{config.defaultWidth}m standard</div>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-slate-400 group-hover:text-sky-300 transition-colors" />
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* OBJECTS TAB */}
        {activeTab === 'objects' && (
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {SPACE_CATEGORIES.find((c) => c.id === selectedCategory)?.label} Objects ({categoryFixtures.length})
            </div>
            <div className="grid grid-cols-1 gap-2">
              {categoryFixtures.map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleAddFixture(key as FixtureType)}
                  className="p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-amber-400/40 rounded-2xl flex items-center justify-between transition group text-left shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100 text-xs group-hover:text-amber-300 transition-colors">
                        {config.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {config.defaultWidth}m × {config.defaultHeight}m
                      </div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-amber-300 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

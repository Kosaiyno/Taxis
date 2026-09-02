import React, { useState } from 'react';
import {
  DoorOpen,
  AppWindow,
  Layers,
  Plus,
  ChevronDown,
  Shapes,
  Maximize2,
} from 'lucide-react';
import { useFloorPlanStore } from '../../store/floorplanStore';
import { RoomType, OpeningType, FixtureType, SpaceCategory, ShapeGeometry } from '../../types/floorplan';
import {
  ROOM_PRESETS,
  OPENING_PRESETS,
  FIXTURE_PRESETS,
  SPACE_CATEGORIES,
  SHAPE_GEOMETRIES,
} from '../../utils/defaultPresets';

export const LeftToolPalette: React.FC = () => {
  const { addRoom, addOpening, addFixture, rooms, selectedId } = useFloorPlanStore();
  const [activeTab, setActiveTab] = useState<'spaces' | 'shapes' | 'openings' | 'objects'>('spaces');
  const [selectedCategory, setSelectedCategory] = useState<SpaceCategory>('residential');

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
    const targetRoomId = selectedId || rooms[0]?.id;
    if (targetRoomId) {
      addOpening({
        roomId: targetRoomId,
        type,
        wall: 'south',
        offset: 1.0,
      });
    } else {
      alert('Please select or create a space zone first to attach a door or window.');
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

  // Filter templates and fixtures by current space category
  const categoryRooms = Object.entries(ROOM_PRESETS).filter(
    ([, config]) => config.category === selectedCategory || config.type === 'custom'
  );

  const categoryFixtures = Object.entries(FIXTURE_PRESETS).filter(
    ([, config]) => config.category === selectedCategory || config.category === 'residential' || config.type === 'custom_shape'
  );

  return (
    <aside className="w-72 bg-[#1c1512] border-r border-[#3d302a] flex flex-col z-20 select-none shadow-xl text-[#e6ccb2]">
      {/* Space Type Selector Dropdown */}
      <div className="p-2.5 bg-[#15100e] border-b border-[#3d302a]">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-bold text-[#8d7b68] uppercase tracking-wider">
            Space Archetype:
          </label>
          <span className="text-[9px] bg-[#261e1b] text-[#c99a6e] font-mono px-1.5 py-0.2 rounded border border-[#3d302a]">
            {SPACE_CATEGORIES.find((c) => c.id === selectedCategory)?.label}
          </span>
        </div>
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as SpaceCategory)}
            className="w-full bg-[#261e1b] border border-[#3d302a] rounded-xl px-3 py-2 text-[#f5ebe0] text-xs font-semibold appearance-none focus:outline-none focus:border-[#c99a6e] cursor-pointer pr-8"
          >
            {SPACE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-[#c99a6e] absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* 4 Navigation Tabs */}
      <div className="grid grid-cols-4 p-1.5 bg-[#181210] border-b border-[#3d302a] gap-1 text-center">
        <button
          onClick={() => setActiveTab('spaces')}
          className={`py-1.5 text-[11px] font-bold rounded-lg transition ${
            activeTab === 'spaces'
              ? 'bg-[#261e1b] text-[#c99a6e] border border-[#3d302a] shadow'
              : 'text-[#8d7b68] hover:text-[#e6ccb2]'
          }`}
        >
          SPACES
        </button>
        <button
          onClick={() => setActiveTab('shapes')}
          className={`py-1.5 text-[11px] font-bold rounded-lg transition ${
            activeTab === 'shapes'
              ? 'bg-[#261e1b] text-[#c99a6e] border border-[#3d302a] shadow'
              : 'text-[#8d7b68] hover:text-[#e6ccb2]'
          }`}
        >
          SHAPES
        </button>
        <button
          onClick={() => setActiveTab('openings')}
          className={`py-1.5 text-[11px] font-bold rounded-lg transition ${
            activeTab === 'openings'
              ? 'bg-[#261e1b] text-[#c99a6e] border border-[#3d302a] shadow'
              : 'text-[#8d7b68] hover:text-[#e6ccb2]'
          }`}
        >
          DOORS
        </button>
        <button
          onClick={() => setActiveTab('objects')}
          className={`py-1.5 text-[11px] font-bold rounded-lg transition ${
            activeTab === 'objects'
              ? 'bg-[#261e1b] text-[#c99a6e] border border-[#3d302a] shadow'
              : 'text-[#8d7b68] hover:text-[#e6ccb2]'
          }`}
        >
          OBJECTS
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs">
        {/* SPACES TAB */}
        {activeTab === 'spaces' && (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-[#b08968] uppercase tracking-wider mb-2">
                {SPACE_CATEGORIES.find((c) => c.id === selectedCategory)?.label} Templates
              </div>
              <div className="grid grid-cols-2 gap-2">
                {categoryRooms.map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => handleAddRoom(config.type)}
                    className="p-3 bg-[#261e1b]/80 hover:bg-[#322723] border border-[#3d302a] hover:border-[#c99a6e]/50 rounded-xl flex flex-col items-center justify-center gap-1.5 transition group text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#c99a6e]/10 text-[#c99a6e] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="font-semibold text-[#f5ebe0] group-hover:text-white text-[11px] line-clamp-1">
                      {config.name}
                    </div>
                    <div className="text-[10px] text-[#b08968] font-mono">
                      {config.defaultWidth}m × {config.defaultHeight}m
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GENERIC GEOMETRIC SHAPES TAB */}
        {activeTab === 'shapes' && (
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-[#b08968] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Parametric Shapes</span>
              <Shapes className="w-3.5 h-3.5 text-[#c99a6e]" />
            </div>
            <p className="text-[10px] text-[#8d7b68] leading-tight mb-2">
              Drop generic geometric entities and reshape, rotate, or rename them to anything (e.g. stages, custom counters, booths, equipment).
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SHAPE_GEOMETRIES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => handleAddShape(shape.id)}
                  className="p-2.5 bg-[#261e1b]/80 hover:bg-[#322723] border border-[#3d302a] hover:border-[#c99a6e] rounded-xl flex flex-col items-center justify-center gap-1.5 transition group text-center"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#c99a6e]/10 text-[#c99a6e] flex items-center justify-center group-hover:scale-110 transition-transform">
                    {shape.id === 'circle' && <div className="w-5 h-5 rounded-full border-2 border-[#c99a6e]" />}
                    {shape.id === 'rectangle' && <div className="w-5 h-4 border-2 border-[#c99a6e] rounded-sm" />}
                    {shape.id === 'l_shape' && <div className="w-5 h-5 border-t-2 border-l-2 border-b-2 border-[#c99a6e]" />}
                    {shape.id === 'u_shape' && <div className="w-5 h-4 border-l-2 border-b-2 border-r-2 border-[#c99a6e]" />}
                    {shape.id === 't_shape' && <div className="w-5 h-5 border-t-2 border-l-0 border-r-0 border-[#c99a6e] relative after:content-[''] after:absolute after:left-1/2 after:top-0 after:w-0.5 after:h-5 after:bg-[#c99a6e]" />}
                    {shape.id === 'v_shape' && <div className="w-5 h-4 border-b-2 border-l-2 border-[#c99a6e] rotate-45 transform origin-center" />}
                  </div>
                  <div className="font-semibold text-[#f5ebe0] text-[11px]">{shape.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* OPENINGS TAB (DOORS & WINDOWS) */}
        {activeTab === 'openings' && (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-[#b08968] uppercase tracking-wider mb-2">
                Doors & Access Points
              </div>
              <div className="space-y-2">
                {Object.entries(OPENING_PRESETS)
                  .filter(([k]) => k.includes('door'))
                  .map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleAddOpening(key as OpeningType)}
                      className="w-full p-2.5 bg-[#261e1b]/80 hover:bg-[#322723] border border-[#3d302a] rounded-xl flex items-center justify-between transition text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <DoorOpen className="w-4 h-4 text-[#c99a6e]" />
                        <div>
                          <div className="font-semibold text-[#f5ebe0]">{config.name}</div>
                          <div className="text-[10px] text-[#b08968] font-mono">{config.defaultWidth}m wide</div>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-[#b08968]" />
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-[#b08968] uppercase tracking-wider mb-2">
                Windows
              </div>
              <div className="space-y-2">
                {Object.entries(OPENING_PRESETS)
                  .filter(([k]) => k.includes('window'))
                  .map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleAddOpening(key as OpeningType)}
                      className="w-full p-2.5 bg-[#261e1b]/80 hover:bg-[#322723] border border-[#3d302a] rounded-xl flex items-center justify-between transition text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <AppWindow className="w-4 h-4 text-[#0284c7]" />
                        <div>
                          <div className="font-semibold text-[#f5ebe0]">{config.name}</div>
                          <div className="text-[10px] text-[#b08968] font-mono">{config.defaultWidth}m wide</div>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-[#b08968]" />
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* OBJECTS TAB */}
        {activeTab === 'objects' && (
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-[#b08968] uppercase tracking-wider mb-1">
              {SPACE_CATEGORIES.find((c) => c.id === selectedCategory)?.label} Objects ({categoryFixtures.length})
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {categoryFixtures.map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleAddFixture(key as FixtureType)}
                  className="p-2 bg-[#261e1b]/80 hover:bg-[#322723] border border-[#3d302a] rounded-xl flex items-center justify-between transition text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#c99a6e]/10 text-[#c99a6e] flex items-center justify-center">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#f5ebe0] text-[11px]">{config.name}</div>
                      <div className="text-[10px] text-[#b08968] font-mono">
                        {config.defaultWidth}m × {config.defaultHeight}m
                      </div>
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-[#b08968]" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

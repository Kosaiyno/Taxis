import React, { useState } from 'react';
import {
  DoorOpen,
  AppWindow,
  Layers,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { useFloorPlanStore } from '../../store/floorplanStore';
import { RoomType, OpeningType, FixtureType, SpaceCategory } from '../../types/floorplan';
import {
  ROOM_PRESETS,
  OPENING_PRESETS,
  FIXTURE_PRESETS,
  SPACE_CATEGORIES,
} from '../../utils/defaultPresets';

export const LeftToolPalette: React.FC = () => {
  const { addRoom, addOpening, addFixture, rooms, selectedId } = useFloorPlanStore();
  const [activeTab, setActiveTab] = useState<'rooms' | 'build' | 'objects'>('rooms');
  const [selectedCategory, setSelectedCategory] = useState<SpaceCategory>('residential');

  const handleAddRoom = (type: RoomType) => {
    addRoom({ type });
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
      alert('Please select or add a room first to attach a door or window.');
    }
  };

  const handleAddFixture = (type: FixtureType) => {
    const targetRoomId = selectedId || rooms[0]?.id;
    if (targetRoomId) {
      addFixture({
        roomId: targetRoomId,
        type,
        x: 1.0,
        y: 1.0,
      });
    } else {
      alert('Please select or add a room first to place furniture.');
    }
  };

  // Filter templates and fixtures by current space category
  const categoryRooms = Object.entries(ROOM_PRESETS).filter(
    ([, config]) => config.category === selectedCategory || config.type === 'custom'
  );

  const categoryFixtures = Object.entries(FIXTURE_PRESETS).filter(
    ([, config]) => config.category === selectedCategory || config.category === 'residential'
  );

  return (
    <aside className="w-72 bg-[#1c1512] border-r border-[#3d302a] flex flex-col z-20 select-none shadow-xl text-[#e6ccb2]">
      {/* Space Type Selector Dropdown */}
      <div className="p-2.5 bg-[#15100e] border-b border-[#3d302a]">
        <label className="block text-[10px] font-bold text-[#8d7b68] uppercase tracking-wider mb-1">
          Space Archetype / Mode:
        </label>
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

      {/* Top 3 Navigation Tabs */}
      <div className="grid grid-cols-3 p-2 bg-[#181210] border-b border-[#3d302a] gap-1">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`py-2 text-xs font-bold rounded-lg transition text-center ${
            activeTab === 'rooms'
              ? 'bg-[#261e1b] text-[#c99a6e] border border-[#3d302a] shadow'
              : 'text-[#8d7b68] hover:text-[#e6ccb2]'
          }`}
        >
          SPACES
        </button>
        <button
          onClick={() => setActiveTab('build')}
          className={`py-2 text-xs font-bold rounded-lg transition text-center ${
            activeTab === 'build'
              ? 'bg-[#261e1b] text-[#c99a6e] border border-[#3d302a] shadow'
              : 'text-[#8d7b68] hover:text-[#e6ccb2]'
          }`}
        >
          DOORS
        </button>
        <button
          onClick={() => setActiveTab('objects')}
          className={`py-2 text-xs font-bold rounded-lg transition text-center ${
            activeTab === 'objects'
              ? 'bg-[#261e1b] text-[#c99a6e] border border-[#3d302a] shadow'
              : 'text-[#8d7b68] hover:text-[#e6ccb2]'
          }`}
        >
          OBJECTS
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs">
        {/* ROOMS & SPACES TAB */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-[#b08968] uppercase tracking-wider mb-2">
                Room Shapes
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAddRoom('custom')}
                  className="p-3 bg-[#261e1b]/80 hover:bg-[#322723] border border-[#3d302a] rounded-xl flex flex-col items-center justify-center gap-1.5 transition group"
                >
                  <div className="w-7 h-7 border-2 border-[#b08968] group-hover:border-[#c99a6e] rounded-sm" />
                  <span className="text-[11px] font-semibold text-[#e6ccb2]">Rectangle</span>
                </button>
                <button
                  onClick={() => handleAddRoom('living_room')}
                  className="p-3 bg-[#261e1b]/80 hover:bg-[#322723] border border-[#3d302a] rounded-xl flex flex-col items-center justify-center gap-1.5 transition group"
                >
                  <div className="w-7 h-7 border-t-2 border-l-2 border-b-2 border-[#b08968] group-hover:border-[#c99a6e]" />
                  <span className="text-[11px] font-semibold text-[#e6ccb2]">L-Shape</span>
                </button>
              </div>
            </div>

            {/* Specialized Space Templates */}
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

        {/* BUILD TAB (DOORS & WINDOWS) */}
        {activeTab === 'build' && (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-[#b08968] uppercase tracking-wider mb-2">
                Doors & Openings
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

        {/* OBJECTS TAB (CATEGORY-FILTERED FURNITURE) */}
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
                      <Layers className="w-3.5 h-3.5" />
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

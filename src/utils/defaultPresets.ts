import { Room, RoomType, Opening, Fixture, FixtureType, OpeningType } from '../types/floorplan';

export interface RoomPresetConfig {
  name: string;
  type: RoomType;
  defaultWidth: number; // in meters
  defaultHeight: number; // in meters
  color: string;
  floorTexture: 'wood' | 'tile' | 'concrete' | 'carpet' | 'grass' | 'plain';
  iconName: string;
}

// Warm Sandy Brown / Oak / Light Birch Architectural Tones
export const ROOM_PRESETS: Record<RoomType, RoomPresetConfig> = {
  living_room: {
    name: 'Living Room',
    type: 'living_room',
    defaultWidth: 5.5,
    defaultHeight: 4.5,
    color: '#eddcc9', // Sandy oak
    floorTexture: 'wood',
    iconName: 'Sofa',
  },
  master_bedroom: {
    name: 'Master Bedroom',
    type: 'master_bedroom',
    defaultWidth: 4.5,
    defaultHeight: 4.0,
    color: '#f3e6d8', // Light birch
    floorTexture: 'wood',
    iconName: 'BedDouble',
  },
  bedroom: {
    name: 'Bedroom',
    type: 'bedroom',
    defaultWidth: 3.8,
    defaultHeight: 3.4,
    color: '#f5ebe0', // Warm cream sand
    floorTexture: 'wood',
    iconName: 'Bed',
  },
  kitchen: {
    name: 'Kitchen',
    type: 'kitchen',
    defaultWidth: 4.0,
    defaultHeight: 3.2,
    color: '#eae0d2', // Sandy porcelain
    floorTexture: 'tile',
    iconName: 'Utensils',
  },
  dining_room: {
    name: 'Dining Room',
    type: 'dining_room',
    defaultWidth: 4.0,
    defaultHeight: 3.2,
    color: '#ebd9c3', // Warm golden sand
    floorTexture: 'wood',
    iconName: 'Coffee',
  },
  bathroom: {
    name: 'Bathroom',
    type: 'bathroom',
    defaultWidth: 2.4,
    defaultHeight: 2.0,
    color: '#e5ded6', // Sandstone tile
    floorTexture: 'tile',
    iconName: 'Bath',
  },
  office: {
    name: 'Office / Study',
    type: 'office',
    defaultWidth: 3.4,
    defaultHeight: 3.0,
    color: '#f2e8dc', // Light sand
    floorTexture: 'wood',
    iconName: 'Briefcase',
  },
  garage: {
    name: 'Garage',
    type: 'garage',
    defaultWidth: 6.0,
    defaultHeight: 4.0,
    color: '#e2ddd7', // Polished concrete sand
    floorTexture: 'concrete',
    iconName: 'Car',
  },
  hallway: {
    name: 'Hallway',
    type: 'hallway',
    defaultWidth: 4.0,
    defaultHeight: 1.5,
    color: '#f7efe6',
    floorTexture: 'wood',
    iconName: 'Footprints',
  },
  balcony: {
    name: 'Balcony / Patio',
    type: 'balcony',
    defaultWidth: 3.5,
    defaultHeight: 2.0,
    color: '#ebe3d8',
    floorTexture: 'tile',
    iconName: 'Sun',
  },
  patio: {
    name: 'Terrace',
    type: 'patio',
    defaultWidth: 4.0,
    defaultHeight: 3.0,
    color: '#f0e6da',
    floorTexture: 'concrete',
    iconName: 'Umbrella',
  },
  laundry: {
    name: 'Laundry',
    type: 'laundry',
    defaultWidth: 2.2,
    defaultHeight: 1.8,
    color: '#e8e1d7',
    floorTexture: 'tile',
    iconName: 'Shirt',
  },
  custom: {
    name: 'Custom Room',
    type: 'custom',
    defaultWidth: 3.5,
    defaultHeight: 3.0,
    color: '#f5ebe0',
    floorTexture: 'wood',
    iconName: 'Square',
  },
};

export interface OpeningPresetConfig {
  name: string;
  type: OpeningType;
  defaultWidth: number;
}

export const OPENING_PRESETS: Record<OpeningType, OpeningPresetConfig> = {
  single_door: { name: 'Single Door (90cm)', type: 'single_door', defaultWidth: 0.9 },
  double_door: { name: 'Double Door (150cm)', type: 'double_door', defaultWidth: 1.5 },
  sliding_door: { name: 'Sliding Door (180cm)', type: 'sliding_door', defaultWidth: 1.8 },
  pocket_door: { name: 'Pocket Door (90cm)', type: 'pocket_door', defaultWidth: 0.9 },
  window: { name: 'Standard Window (120cm)', type: 'window', defaultWidth: 1.2 },
  bay_window: { name: 'Large Window (200cm)', type: 'bay_window', defaultWidth: 2.0 },
};

export interface FixturePresetConfig {
  name: string;
  type: FixtureType;
  defaultWidth: number;
  defaultHeight: number;
  color: string;
}

export const FIXTURE_PRESETS: Record<FixtureType, FixturePresetConfig> = {
  stairs: { name: 'Stairs', type: 'stairs', defaultWidth: 1.0, defaultHeight: 2.8, color: '#b08968' },
  sofa: { name: 'Sofa', type: 'sofa', defaultWidth: 2.4, defaultHeight: 1.1, color: '#c99a6e' },
  dining_table: { name: 'Dining Table', type: 'dining_table', defaultWidth: 1.8, defaultHeight: 1.0, color: '#b08968' },
  kitchen_counter: { name: 'Kitchen Counter', type: 'kitchen_counter', defaultWidth: 2.6, defaultHeight: 0.6, color: '#8d7b68' },
  kitchen_island: { name: 'Kitchen Island', type: 'kitchen_island', defaultWidth: 1.8, defaultHeight: 0.9, color: '#9c8170' },
  bed_king: { name: 'King Bed', type: 'bed_king', defaultWidth: 2.2, defaultHeight: 2.0, color: '#bf9b7a' },
  bed_single: { name: 'Single Bed', type: 'bed_single', defaultWidth: 1.2, defaultHeight: 1.9, color: '#bf9b7a' },
  wardrobe: { name: 'Wardrobe', type: 'wardrobe', defaultWidth: 1.8, defaultHeight: 0.6, color: '#a67c52' },
  desk: { name: 'Work Desk', type: 'desk', defaultWidth: 1.4, defaultHeight: 0.7, color: '#b08968' },
  sink: { name: 'Vanity Sink', type: 'sink', defaultWidth: 0.8, defaultHeight: 0.5, color: '#d5bdaf' },
  toilet: { name: 'Toilet', type: 'toilet', defaultWidth: 0.5, defaultHeight: 0.7, color: '#e3d5ca' },
  shower: { name: 'Shower', type: 'shower', defaultWidth: 1.0, defaultHeight: 1.0, color: '#d5bdaf' },
  bathtub: { name: 'Bathtub', type: 'bathtub', defaultWidth: 1.7, defaultHeight: 0.8, color: '#e3d5ca' },
  car: { name: 'Vehicle', type: 'car', defaultWidth: 1.8, defaultHeight: 4.5, color: '#7f8c8d' },
};

/**
 * Initial starter project with clean sandy brown warm architecture
 */
export const DEFAULT_INITIAL_PROJECT = {
  projectName: 'My House Plan',
  plot: {
    width: 16.0,
    height: 14.0,
    unit: 'm' as const,
    setbackNorth: 2.0,
    setbackSouth: 2.0,
    setbackEast: 1.5,
    setbackWest: 1.5,
  },
  rooms: [
    {
      id: 'room-1',
      name: 'Main Living Room',
      type: 'living_room' as RoomType,
      x: 3.0,
      y: 2.5,
      width: 5.5,
      height: 4.2,
      color: '#eddcc9',
      floorTexture: 'wood' as const,
    },
    {
      id: 'room-2',
      name: 'Master Bedroom',
      type: 'master_bedroom' as RoomType,
      x: 8.5,
      y: 2.5,
      width: 4.5,
      height: 4.2,
      color: '#f3e6d8',
      floorTexture: 'wood' as const,
    },
    {
      id: 'room-3',
      name: 'Kitchen & Dining',
      type: 'kitchen' as RoomType,
      x: 3.0,
      y: 6.7,
      width: 5.5,
      height: 3.5,
      color: '#eae0d2',
      floorTexture: 'tile' as const,
    },
    {
      id: 'room-4',
      name: 'Bathroom',
      type: 'bathroom' as RoomType,
      x: 8.5,
      y: 6.7,
      width: 2.6,
      height: 3.5,
      color: '#e5ded6',
      floorTexture: 'tile' as const,
    },
  ] as Room[],
  openings: [
    {
      id: 'op-front-door',
      roomId: 'room-1',
      type: 'double_door' as OpeningType,
      wall: 'south' as const,
      offset: 2.0,
      width: 1.5,
      swingDirection: 'inside' as const,
    },
    {
      id: 'op-living-window',
      roomId: 'room-1',
      type: 'bay_window' as OpeningType,
      wall: 'north' as const,
      offset: 1.5,
      width: 2.2,
    },
    {
      id: 'op-bed-window',
      roomId: 'room-2',
      type: 'window' as OpeningType,
      wall: 'north' as const,
      offset: 1.5,
      width: 1.4,
    },
    {
      id: 'op-bed-door',
      roomId: 'room-2',
      type: 'single_door' as OpeningType,
      wall: 'west' as const,
      offset: 2.0,
      width: 0.9,
    },
  ] as Opening[],
  fixtures: [
    {
      id: 'fix-sofa',
      roomId: 'room-1',
      type: 'sofa' as FixtureType,
      name: 'Sofa',
      x: 1.5,
      y: 2.2,
      width: 2.4,
      height: 1.1,
      rotation: 0,
    },
    {
      id: 'fix-table',
      roomId: 'room-1',
      type: 'dining_table' as FixtureType,
      name: 'Coffee Table',
      x: 1.8,
      y: 1.2,
      width: 1.6,
      height: 0.8,
      rotation: 0,
    },
    {
      id: 'fix-stairs',
      roomId: 'room-1',
      type: 'stairs' as FixtureType,
      name: 'Stairs',
      x: 0.3,
      y: 0.3,
      width: 1.0,
      height: 2.6,
      rotation: 0,
    },
    {
      id: 'fix-bed',
      roomId: 'room-2',
      type: 'bed_king' as FixtureType,
      name: 'King Bed',
      x: 1.2,
      y: 1.2,
      width: 2.2,
      height: 2.0,
      rotation: 0,
    },
    {
      id: 'fix-toilet',
      roomId: 'room-4',
      type: 'toilet' as FixtureType,
      name: 'Toilet',
      x: 0.4,
      y: 2.3,
      width: 0.5,
      height: 0.7,
      rotation: 0,
    },
    {
      id: 'fix-shower',
      roomId: 'room-4',
      type: 'shower' as FixtureType,
      name: 'Shower',
      x: 1.3,
      y: 0.3,
      width: 1.0,
      height: 1.0,
      rotation: 0,
    },
  ] as Fixture[],
};

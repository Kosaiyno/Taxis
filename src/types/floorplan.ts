export type Unit = 'm' | 'ft';

export type RoomType =
  | 'bedroom'
  | 'master_bedroom'
  | 'bathroom'
  | 'kitchen'
  | 'living_room'
  | 'dining_room'
  | 'garage'
  | 'hallway'
  | 'office'
  | 'balcony'
  | 'patio'
  | 'laundry'
  | 'custom';

export type OpeningType = 'single_door' | 'double_door' | 'sliding_door' | 'pocket_door' | 'window' | 'bay_window';

export type WallOrientation = 'north' | 'south' | 'east' | 'west';

export type FixtureType =
  | 'stairs'
  | 'kitchen_counter'
  | 'kitchen_island'
  | 'sink'
  | 'toilet'
  | 'shower'
  | 'bathtub'
  | 'bed_king'
  | 'bed_single'
  | 'wardrobe'
  | 'sofa'
  | 'dining_table'
  | 'car'
  | 'desk';

export interface PlotDimensions {
  width: number; // in meters (or feet if unit is ft)
  height: number;
  unit: Unit;
  setbackNorth?: number;
  setbackSouth?: number;
  setbackEast?: number;
  setbackWest?: number;
}

export interface Opening {
  id: string;
  roomId: string;
  type: OpeningType;
  wall: WallOrientation;
  offset: number; // Distance from the start corner of that wall in meters
  width: number; // Width of opening in meters (e.g. 0.9m for standard door, 1.5m for window)
  swingDirection?: 'inside' | 'outside' | 'left' | 'right';
}

export interface Fixture {
  id: string;
  roomId: string;
  type: FixtureType;
  name: string;
  x: number; // Relative x offset in room (meters)
  y: number; // Relative y offset in room (meters)
  width: number; // in meters
  height: number; // in meters
  rotation: number; // 0, 90, 180, 270
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  x: number; // x coordinate on plot in meters
  y: number; // y coordinate on plot in meters
  width: number; // width in meters
  height: number; // height in meters
  color: string;
  floorTexture?: 'wood' | 'tile' | 'concrete' | 'carpet' | 'grass' | 'plain';
  wallColor?: string;
  wallThickness?: number; // e.g. 0.15m (15cm)
}

export interface FloorPlanState {
  projectName: string;
  plot: PlotDimensions;
  rooms: Room[];
  openings: Opening[];
  fixtures: Fixture[];
  selectedId: string | null;
  selectedType: 'room' | 'opening' | 'fixture' | 'plot' | null;
  activeTool: 'select' | 'room' | 'wall' | 'door' | 'window' | 'stairs' | 'fixture';
  activeRoomPreset?: RoomType;
  activeOpeningPreset?: OpeningType;
  activeFixturePreset?: FixtureType;
  gridSnap: boolean;
  gridSnapSize: number; // in meters, e.g. 0.1m (10cm) or 0.25m
  showDimensions: boolean;
  showGrid: boolean;
  zoom: number;
  pan: { x: number; y: number };
  viewMode: '2d' | 'blueprint' | 'color';
}

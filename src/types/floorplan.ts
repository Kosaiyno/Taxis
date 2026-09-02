export type Unit = 'm' | 'ft';

export type SpaceCategory =
  | 'residential'
  | 'commercial_office'
  | 'cafe_restaurant'
  | 'retail_store'
  | 'clinic_wellness'
  | 'studio_workshop';

export type RoomType =
  // Residential
  | 'bedroom'
  | 'master_bedroom'
  | 'bathroom'
  | 'kitchen'
  | 'living_room'
  | 'dining_room'
  | 'garage'
  | 'hallway'
  | 'balcony'
  | 'patio'
  | 'laundry'
  // Commercial & Office
  | 'office'
  | 'open_workspace'
  | 'conference_room'
  | 'executive_office'
  | 'reception_lobby'
  | 'breakroom'
  | 'phone_booth'
  // Cafe & Restaurant
  | 'cafe_dining'
  | 'espresso_bar'
  | 'commercial_kitchen'
  // Retail
  | 'retail_showroom'
  | 'fitting_room'
  | 'stockroom'
  // Clinic & Health
  | 'exam_room'
  | 'consultation_room'
  | 'waiting_lounge'
  // Studio & Workshop
  | 'creative_studio'
  | 'maker_workshop'
  | 'storage_unit'
  | 'custom';

export type OpeningType = 'single_door' | 'double_door' | 'sliding_door' | 'pocket_door' | 'window' | 'bay_window';

export type WallOrientation = 'north' | 'south' | 'east' | 'west';

export type FixtureType =
  // Standard & Living
  | 'stairs'
  | 'sofa'
  | 'bed_king'
  | 'bed_single'
  | 'wardrobe'
  | 'dining_table'
  | 'desk'
  // Kitchen & Sanitary
  | 'kitchen_counter'
  | 'kitchen_island'
  | 'sink'
  | 'toilet'
  | 'shower'
  | 'bathtub'
  | 'car'
  // Commercial & Office
  | 'executive_desk'
  | 'conference_table'
  | 'workstation_cluster'
  | 'reception_desk'
  | 'office_chair'
  // Cafe & Restaurant
  | 'espresso_bar'
  | 'dining_booth'
  | 'bar_counter'
  | 'restaurant_table'
  | 'pos_terminal'
  // Retail & Boutique
  | 'clothing_rack'
  | 'display_shelving'
  | 'checkout_counter'
  // Clinic & Wellness
  | 'exam_bed'
  | 'doctor_desk'
  | 'waiting_chairs'
  // Studio & Workshop
  | 'workbench'
  | 'storage_racks';

export interface PlotDimensions {
  width: number; // in meters
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
  offset: number; // in meters
  width: number; // in meters
  swingDirection?: 'inside' | 'outside' | 'left' | 'right';
}

export interface Fixture {
  id: string;
  roomId: string;
  type: FixtureType;
  name: string;
  x: number; // offset in meters inside room
  y: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  x: number; // in meters
  y: number;
  width: number;
  height: number;
  color?: string;
  floorTexture?: 'wood' | 'tile' | 'concrete' | 'carpet' | 'grass' | 'plain';
}

export interface FloorPlanState {
  projectName: string;
  plot: PlotDimensions;
  rooms: Room[];
  openings: Opening[];
  fixtures: Fixture[];
  selectedId: string | null;
  selectedType: 'room' | 'opening' | 'fixture' | 'plot' | null;
  activeTool: 'select' | 'room' | 'wall' | 'door' | 'window' | 'stairs' | 'fixture' | 'pan';
  activeCategory?: SpaceCategory;
  activeRoomPreset?: RoomType;
  activeOpeningPreset?: OpeningType;
  activeFixturePreset?: FixtureType;
  gridSnap: boolean;
  gridSnapSize: number; // 0.1m, 0.25m, 0.5m
  showDimensions: boolean;
  showGrid: boolean;
  zoom: number;
  pan: { x: number; y: number };
  viewMode: '2d' | 'blueprint' | 'color';
}

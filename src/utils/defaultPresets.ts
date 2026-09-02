import {
  Room,
  RoomType,
  Opening,
  Fixture,
  FixtureType,
  OpeningType,
  SpaceCategory,
  ShapeGeometry,
} from '../types/floorplan';

export interface RoomPresetConfig {
  name: string;
  type: RoomType;
  category: SpaceCategory;
  defaultWidth: number; // in meters
  defaultHeight: number; // in meters
  color: string;
  floorTexture: 'wood' | 'tile' | 'concrete' | 'carpet' | 'grass' | 'plain';
  iconName: string;
  itemCount: string;
}

export interface FixturePresetConfig {
  name: string;
  type: FixtureType;
  category: SpaceCategory;
  defaultWidth: number;
  defaultHeight: number;
  iconName: string;
  defaultGeometry?: ShapeGeometry;
}

export const SPACE_CATEGORIES: Array<{ id: SpaceCategory; label: string; icon: string }> = [
  { id: 'residential', label: 'Home & Living', icon: 'Home' },
  { id: 'commercial_office', label: 'Office & Co-Working', icon: 'Briefcase' },
  { id: 'events_exhibition', label: 'Events & Expo Halls', icon: 'Sparkles' },
  { id: 'cafe_restaurant', label: 'Cafe & Dining', icon: 'Coffee' },
  { id: 'retail_store', label: 'Retail & Boutique', icon: 'ShoppingBag' },
  { id: 'clinic_wellness', label: 'Clinic & Wellness', icon: 'Activity' },
  { id: 'studio_workshop', label: 'Studio & Production', icon: 'Film' },
];

export const SHAPE_GEOMETRIES: Array<{ id: ShapeGeometry; label: string; icon: string; description: string }> = [
  { id: 'rectangle', label: 'Rectangle / Box', icon: 'Square', description: 'Standard 4-sided parametric box' },
  { id: 'circle', label: 'Circle / Round', icon: 'Circle', description: 'Round banquet, stage, or pillar' },
  { id: 'l_shape', label: 'L-Shape', icon: 'CornerDownRight', description: 'L-shaped desk, booth, or counter' },
  { id: 'u_shape', label: 'U-Shape', icon: 'MoveVertical', description: 'U-shaped booth, seating, or counter' },
  { id: 't_shape', label: 'T-Shape', icon: 'Split', description: 'T-shaped conference desk or runway' },
  { id: 'v_shape', label: 'V-Shape', icon: 'ChevronDown', description: 'V-shaped keynote stage or angled booth' },
];

export function getDefaultVerticesForGeometry(geom: ShapeGeometry, w: number, h: number): Array<{ x: number; y: number }> {
  switch (geom) {
    case 'v_shape':
      return [
        { x: 0, y: 0 },
        { x: w / 2, y: h * 0.3 },
        { x: w, y: 0 },
        { x: w, y: h * 0.4 },
        { x: w / 2, y: h },
        { x: 0, y: h * 0.4 },
      ];
    case 'l_shape':
      return [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h * 0.4 },
        { x: w * 0.4, y: h * 0.4 },
        { x: w * 0.4, y: h },
        { x: 0, y: h },
      ];
    case 'u_shape':
      return [
        { x: 0, y: 0 },
        { x: w * 0.3, y: 0 },
        { x: w * 0.3, y: h * 0.6 },
        { x: w * 0.7, y: h * 0.6 },
        { x: w * 0.7, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ];
    case 't_shape':
      return [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h * 0.35 },
        { x: w * 0.65, y: h * 0.35 },
        { x: w * 0.65, y: h },
        { x: w * 0.35, y: h },
        { x: w * 0.35, y: h * 0.35 },
        { x: 0, y: h * 0.35 },
      ];
    case 'rectangle':
    case 'circle':
    default:
      return [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ];
  }
}

export const ROOM_PRESETS: Record<RoomType, RoomPresetConfig> = {
  // --- RESIDENTIAL ---
  living_room: {
    name: 'Living Room',
    type: 'living_room',
    category: 'residential',
    defaultWidth: 5.5,
    defaultHeight: 4.5,
    color: '#eddcc9',
    floorTexture: 'wood',
    iconName: 'Sofa',
    itemCount: '4 items',
  },
  master_bedroom: {
    name: 'Master Bedroom',
    type: 'master_bedroom',
    category: 'residential',
    defaultWidth: 4.5,
    defaultHeight: 4.0,
    color: '#f3e6d8',
    floorTexture: 'wood',
    iconName: 'BedDouble',
    itemCount: '3 items',
  },
  bedroom: {
    name: 'Bedroom',
    type: 'bedroom',
    category: 'residential',
    defaultWidth: 3.8,
    defaultHeight: 3.4,
    color: '#f5ebe0',
    floorTexture: 'wood',
    iconName: 'Bed',
    itemCount: '3 items',
  },
  kitchen: {
    name: 'Kitchen',
    type: 'kitchen',
    category: 'residential',
    defaultWidth: 4.0,
    defaultHeight: 3.2,
    color: '#eae0d2',
    floorTexture: 'tile',
    iconName: 'Utensils',
    itemCount: '3 items',
  },
  dining_room: {
    name: 'Dining Room',
    type: 'dining_room',
    category: 'residential',
    defaultWidth: 4.0,
    defaultHeight: 3.2,
    color: '#ebd9c3',
    floorTexture: 'wood',
    iconName: 'Coffee',
    itemCount: '4 items',
  },
  bathroom: {
    name: 'Bathroom',
    type: 'bathroom',
    category: 'residential',
    defaultWidth: 2.4,
    defaultHeight: 2.0,
    color: '#e5ded6',
    floorTexture: 'tile',
    iconName: 'Bath',
    itemCount: '3 items',
  },
  garage: {
    name: 'Garage / Parking',
    type: 'garage',
    category: 'residential',
    defaultWidth: 6.0,
    defaultHeight: 6.0,
    color: '#ded6ce',
    floorTexture: 'concrete',
    iconName: 'Car',
    itemCount: '2 cars',
  },
  hallway: {
    name: 'Corridor / Hallway',
    type: 'hallway',
    category: 'residential',
    defaultWidth: 1.5,
    defaultHeight: 5.0,
    color: '#f2e8dc',
    floorTexture: 'wood',
    iconName: 'Compass',
    itemCount: 'Walkway',
  },
  balcony: {
    name: 'Balcony',
    type: 'balcony',
    category: 'residential',
    defaultWidth: 3.5,
    defaultHeight: 1.5,
    color: '#dcd3ca',
    floorTexture: 'tile',
    iconName: 'Sun',
    itemCount: 'Outdoor',
  },
  patio: {
    name: 'Patio & Terrace',
    type: 'patio',
    category: 'residential',
    defaultWidth: 5.0,
    defaultHeight: 4.0,
    color: '#e6ded7',
    floorTexture: 'grass',
    iconName: 'Trees',
    itemCount: 'Outdoor',
  },
  laundry: {
    name: 'Laundry Room',
    type: 'laundry',
    category: 'residential',
    defaultWidth: 2.2,
    defaultHeight: 2.0,
    color: '#e5ded6',
    floorTexture: 'tile',
    iconName: 'Shirt',
    itemCount: '2 items',
  },

  // --- EVENTS & EXPO HALLS ---
  exhibition_hall: {
    name: 'Main Expo Floor',
    type: 'exhibition_hall',
    category: 'events_exhibition',
    defaultWidth: 30.0,
    defaultHeight: 20.0,
    color: '#ebd9c3',
    floorTexture: 'concrete',
    iconName: 'Grid',
    itemCount: '40 Booths',
  },
  keynote_auditorium: {
    name: 'Keynote Stage Hall',
    type: 'keynote_auditorium',
    category: 'events_exhibition',
    defaultWidth: 16.0,
    defaultHeight: 12.0,
    color: '#f3e6d8',
    floorTexture: 'carpet',
    iconName: 'Presentation',
    itemCount: 'Main Stage',
  },
  vip_lounge: {
    name: 'VIP & Sponsor Lounge',
    type: 'vip_lounge',
    category: 'events_exhibition',
    defaultWidth: 8.0,
    defaultHeight: 6.0,
    color: '#eddcc9',
    floorTexture: 'carpet',
    iconName: 'Sparkles',
    itemCount: 'Seating',
  },
  banquet_hall: {
    name: 'Gala Banquet Ballroom',
    type: 'banquet_hall',
    category: 'events_exhibition',
    defaultWidth: 18.0,
    defaultHeight: 14.0,
    color: '#f5ebe0',
    floorTexture: 'wood',
    iconName: 'Wine',
    itemCount: '120 Guests',
  },
  backstage_greenroom: {
    name: 'Green Room / Crew AV',
    type: 'backstage_greenroom',
    category: 'events_exhibition',
    defaultWidth: 5.0,
    defaultHeight: 4.0,
    color: '#ded6ce',
    floorTexture: 'carpet',
    iconName: 'Radio',
    itemCount: 'Crew Setup',
  },
  film_studio_stage: {
    name: 'Production Soundstage',
    type: 'film_studio_stage',
    category: 'studio_workshop',
    defaultWidth: 14.0,
    defaultHeight: 10.0,
    color: '#ded6ce',
    floorTexture: 'concrete',
    iconName: 'Film',
    itemCount: 'Cameras & AV',
  },

  // --- COMMERCIAL & OFFICE ---
  open_workspace: {
    name: 'Open Work Floor',
    type: 'open_workspace',
    category: 'commercial_office',
    defaultWidth: 8.0,
    defaultHeight: 6.0,
    color: '#ebd9c3',
    floorTexture: 'carpet',
    iconName: 'Users',
    itemCount: '8 desks',
  },
  conference_room: {
    name: 'Meeting / Boardroom',
    type: 'conference_room',
    category: 'commercial_office',
    defaultWidth: 5.5,
    defaultHeight: 4.0,
    color: '#f3e6d8',
    floorTexture: 'carpet',
    iconName: 'Presentation',
    itemCount: '10 seats',
  },
  executive_office: {
    name: 'Private Office',
    type: 'executive_office',
    category: 'commercial_office',
    defaultWidth: 4.0,
    defaultHeight: 3.5,
    color: '#eddcc9',
    floorTexture: 'wood',
    iconName: 'Briefcase',
    itemCount: '1 desk',
  },
  reception_lobby: {
    name: 'Reception & Lobby',
    type: 'reception_lobby',
    category: 'commercial_office',
    defaultWidth: 5.0,
    defaultHeight: 4.0,
    color: '#e5ded6',
    floorTexture: 'tile',
    iconName: 'Building',
    itemCount: 'Lounge',
  },
  breakroom: {
    name: 'Breakroom / Kitchenette',
    type: 'breakroom',
    category: 'commercial_office',
    defaultWidth: 4.0,
    defaultHeight: 3.5,
    color: '#eae0d2',
    floorTexture: 'tile',
    iconName: 'Coffee',
    itemCount: 'Dining',
  },
  phone_booth: {
    name: 'Privacy Pod / Booth',
    type: 'phone_booth',
    category: 'commercial_office',
    defaultWidth: 1.5,
    defaultHeight: 1.5,
    color: '#ded6ce',
    floorTexture: 'carpet',
    iconName: 'PhoneCall',
    itemCount: '1 seat',
  },
  office: {
    name: 'Study / Office',
    type: 'office',
    category: 'commercial_office',
    defaultWidth: 3.8,
    defaultHeight: 3.2,
    color: '#eddcc9',
    floorTexture: 'wood',
    iconName: 'Briefcase',
    itemCount: '2 items',
  },

  // --- CAFE & RESTAURANT ---
  cafe_dining: {
    name: 'Dining & Seating Hall',
    type: 'cafe_dining',
    category: 'cafe_restaurant',
    defaultWidth: 7.5,
    defaultHeight: 6.0,
    color: '#ebd9c3',
    floorTexture: 'wood',
    iconName: 'Utensils',
    itemCount: '24 seats',
  },
  espresso_bar: {
    name: 'Bar & Service Counter',
    type: 'espresso_bar',
    category: 'cafe_restaurant',
    defaultWidth: 5.0,
    defaultHeight: 2.5,
    color: '#eddcc9',
    floorTexture: 'tile',
    iconName: 'Coffee',
    itemCount: 'Counter',
  },
  commercial_kitchen: {
    name: 'Commercial Kitchen',
    type: 'commercial_kitchen',
    category: 'cafe_restaurant',
    defaultWidth: 5.0,
    defaultHeight: 4.0,
    color: '#e5ded6',
    floorTexture: 'tile',
    iconName: 'Flame',
    itemCount: 'Prep Line',
  },

  // --- RETAIL & STORE ---
  retail_showroom: {
    name: 'Showroom & Racks',
    type: 'retail_showroom',
    category: 'retail_store',
    defaultWidth: 8.0,
    defaultHeight: 6.0,
    color: '#f5ebe0',
    floorTexture: 'wood',
    iconName: 'ShoppingBag',
    itemCount: 'Displays',
  },
  fitting_room: {
    name: 'Fitting Rooms (x3)',
    type: 'fitting_room',
    category: 'retail_store',
    defaultWidth: 3.6,
    defaultHeight: 1.5,
    color: '#ded6ce',
    floorTexture: 'carpet',
    iconName: 'Sparkles',
    itemCount: '3 Cabins',
  },
  stockroom: {
    name: 'Stockroom & Storage',
    type: 'stockroom',
    category: 'retail_store',
    defaultWidth: 4.5,
    defaultHeight: 3.5,
    color: '#ded6ce',
    floorTexture: 'concrete',
    iconName: 'Boxes',
    itemCount: 'Shelving',
  },

  // --- CLINIC & WELLNESS ---
  exam_room: {
    name: 'Examination Room',
    type: 'exam_room',
    category: 'clinic_wellness',
    defaultWidth: 3.5,
    defaultHeight: 3.0,
    color: '#e5ded6',
    floorTexture: 'tile',
    iconName: 'Activity',
    itemCount: 'Bed & Desk',
  },
  consultation_room: {
    name: 'Doctor Consultation',
    type: 'consultation_room',
    category: 'clinic_wellness',
    defaultWidth: 4.0,
    defaultHeight: 3.5,
    color: '#f3e6d8',
    floorTexture: 'wood',
    iconName: 'Stethoscope',
    itemCount: 'Doctor Desk',
  },
  waiting_lounge: {
    name: 'Patient Waiting Lounge',
    type: 'waiting_lounge',
    category: 'clinic_wellness',
    defaultWidth: 5.0,
    defaultHeight: 3.5,
    color: '#eddcc9',
    floorTexture: 'tile',
    iconName: 'Users',
    itemCount: '8 chairs',
  },

  // --- STUDIO & WORKSHOP ---
  creative_studio: {
    name: 'Creative Studio / Loft',
    type: 'creative_studio',
    category: 'studio_workshop',
    defaultWidth: 7.0,
    defaultHeight: 5.0,
    color: '#f3e6d8',
    floorTexture: 'wood',
    iconName: 'PenTool',
    itemCount: 'Open Space',
  },
  maker_workshop: {
    name: 'Maker / Wood Workshop',
    type: 'maker_workshop',
    category: 'studio_workshop',
    defaultWidth: 6.0,
    defaultHeight: 4.5,
    color: '#ded6ce',
    floorTexture: 'concrete',
    iconName: 'Hammer',
    itemCount: 'Workbenches',
  },
  storage_unit: {
    name: 'Storage / Warehouse Unit',
    type: 'storage_unit',
    category: 'studio_workshop',
    defaultWidth: 5.0,
    defaultHeight: 4.0,
    color: '#ded6ce',
    floorTexture: 'concrete',
    iconName: 'Package',
    itemCount: 'Racks',
  },

  // Custom
  custom: {
    name: 'Custom Zone / Shape',
    type: 'custom',
    category: 'residential',
    defaultWidth: 4.0,
    defaultHeight: 4.0,
    color: '#eddcc9',
    floorTexture: 'wood',
    iconName: 'Square',
    itemCount: 'Custom',
  },
};

export const FIXTURE_PRESETS: Record<FixtureType, FixturePresetConfig> = {
  // Generic Geometric Entity
  custom_shape: { name: 'Generic Shape Entity', type: 'custom_shape', category: 'residential', defaultWidth: 2.0, defaultHeight: 2.0, iconName: 'Square', defaultGeometry: 'rectangle' },

  // Events & Exhibition
  booth_standard: { name: 'Standard Expo Booth (3x3)', type: 'booth_standard', category: 'events_exhibition', defaultWidth: 3.0, defaultHeight: 3.0, iconName: 'Grid' },
  booth_sponsor: { name: 'Gold Sponsor Island Booth (6x6)', type: 'booth_sponsor', category: 'events_exhibition', defaultWidth: 6.0, defaultHeight: 6.0, iconName: 'Sparkles' },
  keynote_stage: { name: 'Keynote Main Stage (8x4)', type: 'keynote_stage', category: 'events_exhibition', defaultWidth: 8.0, defaultHeight: 4.0, iconName: 'Presentation' },
  stage_v_shape: { name: 'V-Shaped Angular Stage', type: 'stage_v_shape', category: 'events_exhibition', defaultWidth: 7.0, defaultHeight: 4.5, iconName: 'ChevronDown', defaultGeometry: 'v_shape' },
  round_banquet_table: { name: 'Round Banquet Table (10-Pax)', type: 'round_banquet_table', category: 'events_exhibition', defaultWidth: 2.2, defaultHeight: 2.2, iconName: 'Circle', defaultGeometry: 'circle' },
  av_console: { name: 'AV & Sound Tech Rig', type: 'av_console', category: 'events_exhibition', defaultWidth: 2.4, defaultHeight: 1.2, iconName: 'Radio' },
  camera_rig: { name: 'Studio Camera & Lighting Position', type: 'camera_rig', category: 'events_exhibition', defaultWidth: 1.5, defaultHeight: 1.5, iconName: 'Camera', defaultGeometry: 'circle' },
  registration_counter: { name: 'L-Shaped Registration Desk', type: 'registration_counter', category: 'events_exhibition', defaultWidth: 3.2, defaultHeight: 2.0, iconName: 'CornerDownRight', defaultGeometry: 'l_shape' },
  lighting_truss: { name: 'Overhead Truss / Rigging', type: 'lighting_truss', category: 'events_exhibition', defaultWidth: 6.0, defaultHeight: 0.6, iconName: 'MoveHorizontal' },

  // Residential
  sofa: { name: 'Living Sofa (3-Seat)', type: 'sofa', category: 'residential', defaultWidth: 2.2, defaultHeight: 0.9, iconName: 'Sofa' },
  bed_king: { name: 'King Size Bed', type: 'bed_king', category: 'residential', defaultWidth: 2.0, defaultHeight: 2.0, iconName: 'BedDouble' },
  bed_single: { name: 'Single Twin Bed', type: 'bed_single', category: 'residential', defaultWidth: 1.1, defaultHeight: 1.9, iconName: 'Bed' },
  dining_table: { name: 'Dining Table (6-Seat)', type: 'dining_table', category: 'residential', defaultWidth: 1.8, defaultHeight: 0.9, iconName: 'Table' },
  desk: { name: 'Standard Study Desk', type: 'desk', category: 'residential', defaultWidth: 1.4, defaultHeight: 0.7, iconName: 'Laptop' },
  wardrobe: { name: 'Built-in Wardrobe Closet', type: 'wardrobe', category: 'residential', defaultWidth: 2.0, defaultHeight: 0.6, iconName: 'DoorClosed' },
  stairs: { name: 'Access Stairs (Straight)', type: 'stairs', category: 'residential', defaultWidth: 1.0, defaultHeight: 2.8, iconName: 'MoveUpRight' },
  kitchen_counter: { name: 'Kitchen Counter Prep', type: 'kitchen_counter', category: 'residential', defaultWidth: 2.4, defaultHeight: 0.6, iconName: 'Layers' },
  kitchen_island: { name: 'Kitchen Island Table', type: 'kitchen_island', category: 'residential', defaultWidth: 2.0, defaultHeight: 1.0, iconName: 'Square' },
  sink: { name: 'Sanitary Sink Vanity', type: 'sink', category: 'residential', defaultWidth: 0.8, defaultHeight: 0.5, iconName: 'Droplet' },
  toilet: { name: 'WC Toilet Suite', type: 'toilet', category: 'residential', defaultWidth: 0.5, defaultHeight: 0.7, iconName: 'CircleDot' },
  shower: { name: 'Shower Enclosure', type: 'shower', category: 'residential', defaultWidth: 1.0, defaultHeight: 1.0, iconName: 'ShowerHead' },
  bathtub: { name: 'Full Bathtub', type: 'bathtub', category: 'residential', defaultWidth: 1.7, defaultHeight: 0.8, iconName: 'Bath' },
  car: { name: 'Sedan / SUV Vehicle', type: 'car', category: 'residential', defaultWidth: 1.9, defaultHeight: 4.8, iconName: 'Car' },

  // Commercial & Office
  executive_desk: { name: 'Executive L-Desk', type: 'executive_desk', category: 'commercial_office', defaultWidth: 2.0, defaultHeight: 1.6, iconName: 'Briefcase', defaultGeometry: 'l_shape' },
  conference_table: { name: 'Conference Board Table', type: 'conference_table', category: 'commercial_office', defaultWidth: 3.5, defaultHeight: 1.2, iconName: 'Presentation' },
  workstation_cluster: { name: 'Workstation Pod (4 Desks)', type: 'workstation_cluster', category: 'commercial_office', defaultWidth: 2.8, defaultHeight: 2.4, iconName: 'Users' },
  reception_desk: { name: 'Curved Reception Counter', type: 'reception_desk', category: 'commercial_office', defaultWidth: 2.4, defaultHeight: 1.0, iconName: 'Building', defaultGeometry: 'u_shape' },
  office_chair: { name: 'Ergonomic Task Chair', type: 'office_chair', category: 'commercial_office', defaultWidth: 0.6, defaultHeight: 0.6, iconName: 'Smile', defaultGeometry: 'circle' },

  // Cafe & Restaurant
  espresso_bar: { name: 'Commercial Espresso Bar', type: 'espresso_bar', category: 'cafe_restaurant', defaultWidth: 3.5, defaultHeight: 0.9, iconName: 'Coffee' },
  dining_booth: { name: 'Dining Booth Bench (U-Shape)', type: 'dining_booth', category: 'cafe_restaurant', defaultWidth: 1.8, defaultHeight: 1.4, iconName: 'Armchair', defaultGeometry: 'u_shape' },
  bar_counter: { name: 'Bar Stool Counter (L-Shape)', type: 'bar_counter', category: 'cafe_restaurant', defaultWidth: 3.2, defaultHeight: 1.6, iconName: 'GlassWater', defaultGeometry: 'l_shape' },
  restaurant_table: { name: 'Round Bistro Table', type: 'restaurant_table', category: 'cafe_restaurant', defaultWidth: 1.0, defaultHeight: 1.0, iconName: 'Utensils', defaultGeometry: 'circle' },
  pos_terminal: { name: 'POS Cash Register', type: 'pos_terminal', category: 'cafe_restaurant', defaultWidth: 0.8, defaultHeight: 0.6, iconName: 'CreditCard' },

  // Retail
  clothing_rack: { name: 'Apparel Display Rack', type: 'clothing_rack', category: 'retail_store', defaultWidth: 1.6, defaultHeight: 0.6, iconName: 'Tag' },
  display_shelving: { name: 'Gondola Retail Shelving', type: 'display_shelving', category: 'retail_store', defaultWidth: 2.2, defaultHeight: 0.8, iconName: 'Grid' },
  checkout_counter: { name: 'Retail Cash Wrap Counter (L-Shape)', type: 'checkout_counter', category: 'retail_store', defaultWidth: 2.4, defaultHeight: 1.4, iconName: 'Receipt', defaultGeometry: 'l_shape' },

  // Clinic
  exam_bed: { name: 'Medical Exam / Massage Bed', type: 'exam_bed', category: 'clinic_wellness', defaultWidth: 2.0, defaultHeight: 0.7, iconName: 'Activity' },
  doctor_desk: { name: 'Doctor Consultation Desk', type: 'doctor_desk', category: 'clinic_wellness', defaultWidth: 1.6, defaultHeight: 0.8, iconName: 'Stethoscope' },
  waiting_chairs: { name: 'Waiting Row Chairs (x4)', type: 'waiting_chairs', category: 'clinic_wellness', defaultWidth: 2.2, defaultHeight: 0.6, iconName: 'Users' },

  // Studio & Workshop
  workbench: { name: 'Heavy Duty Workbench', type: 'workbench', category: 'studio_workshop', defaultWidth: 2.2, defaultHeight: 0.9, iconName: 'Hammer' },
  storage_racks: { name: 'Industrial Pallet Rack', type: 'storage_racks', category: 'studio_workshop', defaultWidth: 2.5, defaultHeight: 1.0, iconName: 'Package' },
};

export const OPENING_PRESETS: Record<
  OpeningType,
  { name: string; defaultWidth: number; iconName: string; category: string }
> = {
  single_door: { name: 'Single Swing Door', defaultWidth: 0.9, iconName: 'DoorClosed', category: 'standard' },
  double_door: { name: 'Double Entry Door', defaultWidth: 1.6, iconName: 'DoorOpen', category: 'entry' },
  sliding_door: { name: 'Sliding Glass Door', defaultWidth: 2.0, iconName: 'MoveHorizontal', category: 'patio' },
  pocket_door: { name: 'Pocket Space-Saver Door', defaultWidth: 0.85, iconName: 'Minimize2', category: 'interior' },
  window: { name: 'Standard Casement Window', defaultWidth: 1.2, iconName: 'AppWindow', category: 'window' },
  bay_window: { name: 'Panoramic Bay Window', defaultWidth: 2.2, iconName: 'Maximize2', category: 'window' },
};

export const DEFAULT_INITIAL_PROJECT = {
  projectName: 'My Taxis Spatial Plan',
  plot: {
    width: 16.0,
    height: 14.0,
    unit: 'm' as const,
    setbackNorth: 2.0,
    setbackSouth: 2.0,
    setbackEast: 1.5,
    setbackWest: 1.5,
  },
  rooms: [] as Room[],
  openings: [] as Opening[],
  fixtures: [] as Fixture[],
};

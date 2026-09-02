# FloorCraft (WebMCP Floor Plan Designer) — Project Roadmap & Tracker

## 📌 Project Vision
A crisp, browser-based 2D architectural floor-plan designer for everyday people who bought a plot of land and want to map out room layouts, dimensions (bedrooms, bathrooms, kitchen, garage, stairs, windows/doors) before speaking with an architect.

**The WebMCP Architecture:**
```
Human User                    AI Agent (ChatGPT / Chrome)
    │                                      │
    ▼                                      ▼
Frontend UI (Canvas/Grid) ──► Shared Structured State ◄── WebMCP Tools (document.modelContext)
                                (Single Source of Truth)
```

---

## 🏗️ Build Status & Progress

### Phase 1: Frontend & Structured State (COMPLETED ✅)
- [x] **1.1 Setup Project Scaffold**: Vite + React 18 + TypeScript + Tailwind CSS + Lucide Icons + Canvas/SVG rendering.
- [x] **1.2 Structured State Engine (`src/store/floorplanStore.ts`)**:
  - Plot dimensions (width, height, scale, units: meters / feet).
  - Rooms array: `{ id, name, type, x, y, width, height, color }`.
  - Doors & Windows (openings on walls): `{ id, roomId, wall, offset, width, type }`.
  - Fixtures & Furniture: `{ id, roomId, type, x, y, rotation, width, height }`.
- [x] **1.3 Interactive Canvas (`src/components/canvas/FloorPlanCanvas.tsx`)**:
  - Architectural grid (metric / imperial grid with 0.25m / 1.0m lines).
  - Drag-and-drop room creation and repositioning with automatic adjacent wall-snapping.
  - Interactive 8-point corner/edge resize handles with live dimension callouts (e.g. `4.20m × 3.80m`).
  - Architectural door swing arcs & double-glass window representations.
  - Pan & Zoom controls.
- [x] **1.4 UI Panels & Controls**:
  - **Top Navigation Bar (`TopNavbar.tsx`)**: Plot size controls, Unit toggle ($m$ / $ft$), View mode (2D CAD, Blueprint, Architect Color), Undo/Redo, Zoom, Grid/Snap/Dimension toggles, Export.
  - **Left Room / Fixture Palette (`LeftToolPalette.tsx`)**: Quick room presets (Master Bed, Bed, Bath, Kitchen, Living, Dining, Garage, Hallway, Office, Balcony, Laundry), Doors, Windows, and Fixtures.
  - **Right Properties Inspector (`RightPropertiesPanel.tsx`)**: Selected item dimensions, position, label, room type, color swatch, openings list, delete buttons, plus land coverage metrics.
  - **Bottom Stats Bar (`BottomStatusBar.tsx`)**: Total plot area, built-up area ($m^2$), plot coverage ratio (%), room count tally.
- [x] **1.5 Export Engine (`ExportModal.tsx`)**:
  - High-res PNG blueprint image export.
  - Vector SVG CAD blueprint export.
  - JSON project file save & architectural specification text copy.

---

### Phase 2: WebMCP Middle Layer (COMPLETED ✅)
- [x] **2.1 ModelContext Tool Registration (`src/webmcp/registerFloorplanTools.ts`)**:
  - Automatic registration on `document.modelContext.registerTool`.
- [x] **2.2 Core WebMCP Tools**:
  - `get_floorplan_state` (`readOnlyHint: true`): Returns current plot, room layout, bounding boxes, areas, and available space.
  - `set_plot_dimensions({ width, height, unit })`: Configures the land size.
  - `add_room({ name, type, width, height, x?, y?, color? })`: Spawns and places rooms.
  - `resize_room({ room_name_or_id, width, height })`: Precision dimensional adjustment.
  - `move_room({ room_name_or_id, x?, y?, adjacent_to?, position? })`: Repositions room or snaps it adjacent to another room.
  - `delete_room({ room_name_or_id })`: Removes room and attached fixtures.
  - `add_door({ room_name_or_id, wall, offset, width })`: Places doors on specific walls.
  - `add_window({ room_name_or_id, wall, offset, width })`: Places windows on walls.
  - `add_fixture({ room_name_or_id, type, x, y, rotation })`: Places furniture/fixtures.
  - `auto_arrange_floorplan({ rooms })`: Algorithmic packing of required rooms into the plot without overlap.
  - `clear_floorplan()`: Resets layout.
- [x] **2.3 In-App WebMCP Live Inspector & Simulator (`WebMCPSimulatorModal.tsx`)**:
  - Interactive console allowing prompt execution with live JSON input/output logs.

---

### Phase 3: Deployment & Submission (Next Steps)
- [ ] **3.1 Deployment**: Deploy to Vercel / Cloudflare Pages with public live URL.
- [ ] **3.2 Demo Preparation**:
  - 3-minute video recording showing:
    1. Human sketching the plot and placing initial rooms.
    2. Agent executing natural language spatial commands via WebMCP.
    3. Human tweaking and resizing.
    4. Exporting the finished blueprint.
- [ ] **3.3 Public GitHub Repository**:
  - Clean open-source license (MIT).
  - Detailed README with architecture diagrams, WebMCP tool specs, and testing instructions.
- [ ] **3.4 Devpost Submission**: Final text description and URL submission before deadline.

---

## 📁 Key Files Index
- Project Root: `C:\Users\user\.gemini\antigravity\scratch\floorcraft-webmcp`
- State Store: `src/store/floorplanStore.ts`
- WebMCP Layer: `src/webmcp/registerFloorplanTools.ts`
- Canvas Component: `src/components/canvas/FloorPlanCanvas.tsx`
- Inspector / UI: `src/components/panels/RightPropertiesPanel.tsx`
- Dev Server: `http://localhost:5173/`

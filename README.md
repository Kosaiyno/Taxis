# Taxis: Design physical spaces with your agent.

> You design the space yourself, or let your agent handle the tedious spatial work. Both of you can edit the same plan.

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
[![WebMCP: Active](https://img.shields.io/badge/WebMCP-26%20Spatial%20Tools-success.svg)](src/webmcp/registerFloorplanTools.ts)
[![Engine: React 18 + Vite](https://img.shields.io/badge/Built%20With-React%2018%20%2B%20TypeScript-blue.svg)](package.json)

---

## 🌟 Overview

Spatial design has traditionally been trapped between two extremes: complex, intimidating CAD software with steep learning curves, or AI image generators that hallucinate impossible floor plans with missing walls and fake dimensions.

**Taxis** is a collaborative spatial planning engine built from the ground up for **Human-Agent Pair Programming in physical space**. Instead of generating static pixels, Taxis represents every room, wall, door, fixture, and custom shape as high-precision geometric entities. 

Whether you are laying out a residential home, an open-concept commercial office, an exhibition hall with 40 sponsor booths, or an espresso bar, **you and your AI agent operate on the exact same live spatial state**.

---

## ⚡ Core Principles: Human & Agent Parity

In Taxis, **anything the agent can do, the human can do — and vice versa**:

1. **📐 Reshape and Remodel Anything**:
   - Objects and spaces are generic geometric entities: **Rectangle, Circle, L-shape, U-shape, T-shape, V-shape, or Custom Polygon**.
   - Remodel corner vertices directly on the canvas with smooth drag points, or ask your agent: *"Make this desk an L-shape"* or *"Remodel the booth for Sponsor A into a V-shape"*.
2. **🔄 Wall Curvature & Corner Remodeling**:
   - Outer walls are not locked to rigid 90° boxes. Adjust outer wall curvature radius (from sharp corners to smooth curved arcs) or drag individual wall corner points.
3. **🏷️ Custom Naming Everywhere**:
   - Name and label any space, booth, desk, camera position, or shape to whatever you want. Both the inspector UI and WebMCP tools support custom labels.
4. **🚪 Flexible 360° Perimeter Openings**:
   - Doors and windows slide seamlessly across all four walls (North, South, East, West) with customizable widths and flip swing directions.
5. **☕ Architectural Studio Aesthetic**:
   - High-contrast black-and-white drafting aesthetic on the canvas with continuous infinite grid lines, paired with a warm roasted espresso & crema interface.

---

## 🏢 Versatile Space Domains

Taxis adapts to any physical environment:

- **🏠 Residential & Living**: Master bedrooms, attached ensuites, chef's kitchens, dining rooms, laundry, garages, and balconies.
- **💼 Commercial Offices**: Open-plan workstation clusters, executive boardrooms, conference tables, breakout areas, and reception desks.
- **🎪 Events & Exhibitions**: Exhibition halls, standard & sponsor booths, keynote stages, registration desks, and AV lighting trusses.
- **☕ Cafes & Hospitality**: Espresso bars, dining booths, commercial kitchens, bar counters, and POS stations.
- **🎬 Studios & Sets**: Film studio stages, multi-angle camera positions, lighting stands, and audio consoles.
- **🛍️ Retail & Boutiques**: Showroom floors, display shelving, fitting rooms, and checkout counters.
- **🏥 Wellness & Clinics**: Examination rooms, consultation offices, and patient waiting lounges.

---

## 🤖 WebMCP Native Implementation

Taxis natively registers **26 structured spatial tools** on the browser's `document.modelContext` adhering directly to the **Web Model Context Protocol (WebMCP)** specification:

```javascript
document.modelContext.registerTool({
  name: "add_room",
  description: "Adds a new room or zone to the floor plan with precision dimensions",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Display name (e.g. Master Bedroom, Open Office)" },
      type: { type: "string", description: "Zone category preset" },
      width: { type: "number", description: "Width in meters" },
      height: { type: "number", description: "Length/depth in meters" },
      x: { type: "number", description: "Optional X position" },
      y: { type: "number", description: "Optional Y position" }
    },
    required: ["width", "height"]
  },
  execute: async (input) => {
    // Live update to shared spatial store
    return { success: true, roomId: newId };
  }
});
```

*(A fallback interface is simultaneously exposed on `window.__WEBMCP_TOOLS__` for headless testing and external runners).*

---

## 🛠️ Complete WebMCP Spatial Tool Catalog

| Category | Tool | Description |
| :--- | :--- | :--- |
| **Zoning & State** | `get_floorplan_state` | Reads plot dimensions, all rooms, coordinates, square meterage, and plot coverage |
| | `set_plot_dimensions` | Configures property boundaries, dimensions, setbacks, and units (m / ft) |
| | `calculate_plot_compliance` | Evaluates Floor Area Ratio (FAR) and zoning site coverage compliance |
| | `clear_floorplan` | Clears all zones and elements for a clean drawing board |
| **Spaces & Walls** | `add_room` | Adds spaces with custom dimensions and automatic non-overlapping placement |
| | `resize_room` | Precision dimensional resizing (e.g. 5m × 4m) |
| | `move_room` | Positions spaces directly by coordinates or relative placement (*beside / above / below*) |
| | `rotate_room` | Rotates space orientation by 90° |
| | `duplicate_room` | Clones a space and its internal layout |
| | `delete_room` | Removes a space and attached elements |
| | `curve_room_walls` | Adjusts outer wall corner curvature radius (0.0m to 3.0m) |
| | `remodel_room_walls` | Reshapes room walls into custom multi-corner polygons |
| | `add_room_wall_corner` | Adds a new corner vertex point along the room wall perimeter |
| | `remove_room_wall_corner` | Removes a wall corner point |
| | `auto_arrange_floorplan` | Intelligent spatial packing algorithm for multiple spaces |
| **Doors & Windows** | `add_door` | Attaches single, double, sliding, or pocket doors to any wall |
| | `move_opening` | Slides openings along wall perimeter (360° rotation across all walls) |
| | `flip_door_swing` | Toggles swing direction between inside and outside |
| | `add_window` | Places standard, double, or bay windows on any wall |
| **Shapes & Objects** | `add_fixture` | Places furniture, equipment, booths, stages, or custom geometric entities |
| | `resize_fixture` | Resizes width and height with proportional vertex scaling |
| | `rotate_fixture` | Rotates objects and shapes in 90° increments |
| | `update_fixture` | Customizes name, dimensions, or geometry shape preset |
| | `remodel_fixture_shape` | Sets geometric shape: `rectangle`, `circle`, `l_shape`, `u_shape`, `t_shape`, `v_shape`, `polygon` |
| | `add_fixture_vertex` | Adds a custom polygon corner point for detailed freeform modeling |
| | `delete_fixture` | Deletes specific objects, shapes, or equipment |

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### 1. Clone & Install
```bash
git clone https://github.com/Kosaiyno/Taxis.git
cd Taxis
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 3. Build for Production
```bash
npm run build
```
The optimized production bundle will be built in the `dist/` directory.

---

## 🤖 Testing WebMCP with an AI Agent

### In Google Chrome (Native WebMCP Testing):
1. Navigate to `chrome://flags` in Google Chrome.
2. Enable the **`#enable-webmcp-testing`** flag and relaunch Chrome.
3. Open your running instance of Taxis (`http://localhost:5173`).
4. Open Chrome DevTools (`F12` or `Ctrl+Shift+I`) and navigate to the **Console**:

```javascript
// 1. Inspect registered WebMCP tools
const tools = await document.modelContext.getTools();
console.table(tools.map(t => ({ name: t.name, description: t.description })));

// 2. Clear canvas
await document.modelContext.executeTool("clear_floorplan", {});

// 3. Build a spatial layout
await document.modelContext.executeTool("add_room", {
  name: "Conference Boardroom",
  type: "conference_room",
  width: 6.0,
  height: 4.5
});

// 4. Place an L-shaped reception desk
await document.modelContext.executeTool("add_fixture", {
  name: "Front Reception",
  type: "custom_shape",
  geometry: "l_shape",
  width: 2.5,
  height: 2.0
});
```

---

## 📄 License

This project is open source and licensed under the [MIT License](LICENSE).


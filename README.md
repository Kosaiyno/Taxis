# Taxis: Design physical spaces with your agent.

> You design the space yourself, or let your agent handle the tedious spatial work. Both of you can edit the same plan.

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
[![WebMCP: Active](https://img.shields.io/badge/WebMCP-63%20Spatial%20Tools-success.svg)](src/webmcp/registerFloorplanTools.ts)
[![Engine: React 18 + Vite](https://img.shields.io/badge/Built%20With-React%2018%20%2B%20TypeScript-blue.svg)](package.json)

---

## 🌟 Overview

Spatial design has traditionally been trapped between two extremes: complex, intimidating CAD software with steep learning curves, or AI image generators that hallucinate impossible floor plans with missing walls and fake dimensions.

**Taxis** is a collaborative spatial planning engine built from the ground up for **Human-Agent Pair Programming in physical space**. Instead of generating static pixels, Taxis represents every room, wall, door, fixture, and custom shape as high-precision geometric entities. 

Whether you are laying out a residential home, an open-concept commercial office, an exhibition hall with 40 sponsor booths, or an espresso bar, **you and your AI agent operate on the exact same live spatial state**.

---

## 🏛️ What's in a Name? The Etymology of *Taxis*

**Taxis** takes its name from the Ancient Greek **τάξις** (*táxis*), derived from the verb *τάσσω* (*tássō* — "to arrange, set in order, assign to a rightful place or station").

In classical Greek philosophy, architecture, and mathematics, *táxis* stood for:
- **Intentional Arrangement**: The deliberate, proportional distribution and ordering of physical parts into an organic whole.
- **Order Over Chaos**: The act of giving structure, geometry, and purpose to an empty space.
- **Rightful Station**: Ensuring every wall, portal, corridor, and furnishing occupies its mathematically and functionally optimal position.
- **The Root of Coherence**: It is the etymological root of modern words like **taxonomy** (the systematic organization of categories), **syntax** (harmonious arrangement of components), and **tactics** (strategic deployment in space).

We chose the name **Taxis** because creating physical environments is not about hallucinating random pixels—it is the art and science of **arranging order, purpose, and harmony between human architects and autonomous agent intelligence**.

---

## ⚡ Core Principles: Human & Agent Parity

In Taxis, **anything the agent can do, the human can do — and vice versa**:

1. **📐 Reshape and Remodel Anything**:
   - Drag corners, convert rectangles into multi-point polygons, curve exterior walls with custom radiuses, or remodel individual vertices directly.
2. **🎨 Materials and Color Assignment**:
   - Assign rich architectural materials and tint colors (terracotta, forest sage, warm charcoal, deep navy, champagne amber, rose, espresso) to any zone or object.
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

Taxis natively registers **63 structured spatial tools** on the browser's `document.modelContext` adhering directly to the **Web Model Context Protocol (WebMCP)** specification:

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

## 🛠️ Complete WebMCP Spatial Tool Suite (63 Tools)

### 1. Architectural Validation & Connectivity
| Tool | Description |
| :--- | :--- |
| `validate_floorplan` | Evaluates room overlaps, out-of-bounds walls, isolated rooms with 0 doors, circulation bottlenecks, and true gross built vs landscape coverage |
| `get_connectivity_graph` | Builds topological adjacency and doorway routing graph (accessible paths, exterior entrances, isolated clusters) |
| `calculate_setbacks` | Evaluates front (6m), rear (3m), and side (3m) setbacks and flags wall encroachments (Abuja FCDA / standard) |
| `calculate_plot_compliance` | Evaluates gross conditioned built footprint vs open site landscaping, FAR, and zoning limits |

### 2. Doors & Openings (Full Lifecycle)
| Tool | Description |
| :--- | :--- |
| `add_door` | Attaches single, double, sliding, pocket, or bifold door to any wall |
| `delete_door` | Deletes a door by ID or clears doors in a room (optionally filtered by wall) |
| `move_door` | Repositions a door along its wall or moves it to another wall |
| `resize_door` | Changes door opening width in meters (e.g. 0.8m, 0.9m, 1.2m, 1.8m) |
| `set_door_type` | Updates door type (`single_door`, `double_door`, `sliding_door`, `pocket_door`, `bifold_door`, `opening_archway`) |
| `flip_door_swing` | Toggles swing direction between inside and outside |
| `clear_redundant_doors` | Automatically prunes stacked or duplicate doors, restoring clean circulation |
| `add_window` | Places standard or bay windows on any wall |
| `delete_window` | Deletes a window by ID or removes windows in a room |
| `move_window` | Repositions a window along its wall or moves it to another wall |
| `resize_window` | Changes window width in meters |
| `delete_opening` | General tool to remove any opening by ID or clear openings in a room |

### 3. Spaces, Walls & Zones
| Tool | Description |
| :--- | :--- |
| `add_room` | Adds a new room with custom dimensions and intelligent non-overlapping placement |
| `resize_room` | Changes room width and depth with precision |
| `move_room` | Moves room to exact coordinates or relative placement (*beside / above / below*) |
| `rotate_room` | Rotates space orientation by 90° |
| `set_room_type` | Changes architectural type (bedroom, master_bedroom, ensuite_bathroom, corridor, bq, parking, garden, etc.) |
| `set_room_color` | Assigns an architectural tint color to any room or zone |
| `curve_room_walls` | Adjusts outer wall corner curvature radius (0.0m sharp to 3.0m curved) |
| `remodel_room_walls` | Reshapes room walls into custom multi-corner polygons |
| `add_room_wall_corner` | Adds a new corner vertex point along room wall perimeter |
| `remove_room_wall_corner`| Removes a corner vertex point |
| `duplicate_room` | Clones a space and its internal layout |
| `delete_room` | Deletes a space and attached elements |
| `auto_arrange_floorplan` | Automatic geometric packing algorithm for multiple spaces |

### 4. Shapes, Objects & Materials
| Tool | Description |
| :--- | :--- |
| `add_fixture` | Places furniture, equipment, or fixtures into a room with optional color |
| `add_custom_shape` | Adds parametric shape entities (rectangle, circle, L-shape, U-shape, T-shape, V-shape) |
| `set_object_color` | Assigns color/material (hex or named: emerald, blue, gold, dark, rose, amber, teal, slate) |
| `set_fixture_position_absolute` | Places site shapes or furniture directly on plot coordinates, decoupling from room offsets |
| `resize_fixture` | Precision dimensional resizing with vertex scaling |
| `rotate_fixture` | Rotates objects and shapes in 90° increments |
| `reshape_object` | Remodels shape geometry, dimensions, rotation, color, or label |
| `delete_custom_shape` | Dedicated deletion tool for custom shapes and site entities |
| `delete_fixture` | Deletes specific furniture items or fixtures |
| `add_fixture_vertex` | Adds a vertex point for freeform polygon remodeling |
| `batch_create_grid_layout` | Instantly generates matrices of booths, desks, tables, or seats |

### 5. Project State, Selection & Camera
| Tool | Description |
| :--- | :--- |
| `get_floorplan_state` | Complete state inspection: plot size, all rooms, openings, fixtures, areas, coverage |
| `select_element` | Highlights and selects any room, object, or opening in the UI inspector |
| `get_selected_element` | Returns data of the currently highlighted element |
| `set_archetype` | Switches space category (residential, commercial_office, events, cafe, retail, clinic, studio) |
| `get_archetypes` | Lists all available space archetypes |
| `set_project_name` | Updates project title |
| `set_units` / `get_units`| Toggles meters (m) vs feet (ft) and inspects grid settings |
| `set_metadata` / `get_metadata` | Sets site address, zoning jurisdiction (Abuja FCDA), title type (C-of-O), setbacks, client notes |
| `center_plot` | Re-centers the plot in the canvas viewport |
| `set_zoom` | Adjusts zoom factor (e.g. 0.8x, 1.0x, 1.5x) |
| `undo` / `redo` | Reverses or re-applies spatial actions |
| `clear_floorplan` | Clears canvas for a clean drafting board |
| `export_project` | Exports vector SVG blueprint markup or JSON data state |
| `save_project` | Returns verified JSON state snapshot with timestamp |
| `render_plan_snapshot` | Returns instant standalone SVG vector blueprint markup string |

### 6. Projects Library & Named Layouts
| Tool | Description |
| :--- | :--- |
| `save_project_as` | Saves the current floor plan layout to the project library with a custom name and optional notes |
| `list_saved_projects` | Lists all saved floor plan layouts stored in the project library |
| `load_saved_project` | Loads a previously saved floor plan layout from the library onto the active canvas |
| `delete_saved_project` | Deletes a saved layout from the project library |

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

// 4. Place an L-shaped reception desk with custom color
await document.modelContext.executeTool("add_fixture", {
  name: "Front Reception",
  type: "custom_shape",
  geometry: "l_shape",
  color: "emerald",
  width: 2.5,
  height: 2.0
});

// 5. Change color of an existing object
await document.modelContext.executeTool("set_object_color", {
  object_name_or_id: "Front Reception",
  color: "gold"
});
```

---

## 📄 License

This project is open source and licensed under the [MIT License](LICENSE).


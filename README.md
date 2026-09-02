# 🏡 FloorCraft — 2D Floor Plan Designer (WebMCP)

> A modern, browser-based 2D architectural floor plan designer that exposes **18 structured spatial tools** to AI agents via the **Web Model Context Protocol (WebMCP)** on `document.modelContext`.

---

## 🌟 Overview

FloorCraft allows everyday homeowners and designers to sketch, modify, and layout residential homes before meeting with an architect. 

Instead of an AI hallucinating an image of a floor plan, **the human remains the designer while the AI agent becomes the high-speed spatial operator** through WebMCP tools (`add_room`, `resize_room`, `move_room`, `add_door`, `add_fixture`, `calculate_plot_compliance`, etc.).

---

## 🚀 Key Features

* **📐 Structured Floor Plan Engine**: Every wall, room, door, window, and furniture item is represented as high-precision geometric data, not static pixels.
* **🖐️ Complete Canvas Manipulation**:
  * **Rooms**: 8-point resize handles, automatic wall-to-wall snapping, rotation, and duplication.
  * **Doors & Windows**: Drag & slide smoothly along walls, width resizing, swing direction flipping.
  * **Furniture & Objects**: Move, stretch, rotate (+90°), duplicate, and delete with collision checks.
* **☕ Architectural Studio Aesthetic**: Warm espresso and natural wood-brown theme with high-contrast sandy oak parquet floor fills.
* **🤖 18 Native WebMCP Tools**: Full two-way communication on `document.modelContext` and `window.__WEBMCP_TOOLS__`.
* **📄 Vector & CAD Export**: Export vector SVG blueprints, high-resolution PNG renders, and JSON state files.

---

## 🛠️ Registered WebMCP Spatial Tools

| Category | Tool | Description |
| :--- | :--- | :--- |
| **Zoning & State** | `get_floorplan_state` | Reads plot dimensions, all rooms, square meterage, and coverage ratio |
| | `set_plot_dimensions` | Adjusts land plot boundaries & setbacks |
| | `calculate_plot_compliance` | Evaluates Floor Area Ratio (FAR) & zoning compliance |
| | `clear_floorplan` | Clears canvas for a blank plot |
| **Rooms** | `add_room` | Adds rooms with custom dimensions and automatic smart adjacent placement |
| | `resize_room` | Precision dimensional resizing (e.g. 4m × 4m) |
| | `move_room` | Direct or relative placement (*beside / above / below*) |
| | `rotate_room` | Rotates room orientation by 90° |
| | `duplicate_room` | Clones room and attached elements |
| | `delete_room` | Deletes room and attached elements |
| | `auto_arrange_floorplan` | Multi-room layout packing algorithm |
| **Openings** | `add_door` | Adds single, double, sliding, or pocket doors |
| | `flip_door_swing` | Toggles swing direction between inside/outside |
| | `add_window` | Places standard or bay windows on specific walls |
| **Furniture** | `add_fixture` | Places beds, sofas, stairs, kitchen islands, sanitary suites |
| | `resize_fixture` | Stretches furniture with rotation coordinate projection |
| | `rotate_fixture` | Rotates furniture in 90° increments |
| | `delete_fixture` | Deletes specific furniture objects |

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🤖 Testing with an AI Agent

### In Google Chrome (with WebMCP flag):
1. Enable `#enable-webmcp-testing` in `chrome://flags` and relaunch.
2. Open `http://localhost:5173`.
3. In DevTools Console:
```javascript
// Inspect tools
const tools = await document.modelContext.getTools();
console.log(tools);

// Execute tool
await document.modelContext.executeTool("add_room", {
  name: "Master Suite",
  type: "master_bedroom",
  width: 4.5,
  height: 4.0
});
```

---

## 📄 License
MIT

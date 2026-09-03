import { FloorPlanState } from '../types/floorplan';

/**
 * Generates clean, standalone vector SVG blueprint markup of the floor plan
 */
export function generateSvgBlueprint(state: FloorPlanState): string {
  const { plot, rooms, openings, fixtures, projectName } = state;
  const SCALE = 50; // 50px per meter
  const margin = 60;
  const svgWidth = Math.round(plot.width * SCALE + margin * 2);
  const svgHeight = Math.round(plot.height * SCALE + margin * 2);

  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" style="background-color: #ffffff; font-family: 'Inter', -apple-system, sans-serif;">\n`;

  // Defs & Grid
  svg += `  <defs>\n`;
  svg += `    <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">\n`;
  svg += `      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#f1f5f9" stroke-width="0.8"/>\n`;
  svg += `    </pattern>\n`;
  svg += `  </defs>\n`;

  // Background Grid
  svg += `  <rect width="100%" height="100%" fill="url(#grid)" />\n`;

  // Title Block
  svg += `  <g transform="translate(${margin}, 35)">\n`;
  svg += `    <text x="0" y="0" font-size="16" font-weight="800" fill="#111827">${projectName || 'Architectural Floor Plan'}</text>\n`;
  svg += `    <text x="0" y="16" font-size="10" font-weight="600" fill="#64748b">PLOT: ${plot.width}m × ${plot.height}m (${(plot.width * plot.height).toFixed(1)} m²) | SCALE 1:50 | TAXIS SPATIAL BLUEPRINT</text>\n`;
  svg += `  </g>\n`;

  // World Origin
  svg += `  <g transform="translate(${margin}, ${margin})">\n`;

  // 1. Plot Boundary
  svg += `    <!-- Plot Boundary -->\n`;
  svg += `    <rect x="0" y="0" width="${plot.width * SCALE}" height="${plot.height * SCALE}" fill="#f8fafc" stroke="#334155" stroke-width="2" stroke-dasharray="6 4" />\n`;

  // 2. Rooms
  svg += `    <!-- Rooms -->\n`;
  for (const r of rooms) {
    const rx = r.x * SCALE;
    const ry = r.y * SCALE;
    const rw = r.width * SCALE;
    const rh = r.height * SCALE;

    const fill = r.color ? r.color : '#ffffff';
    const fillOpacity = r.color ? 0.25 : 0.95;

    svg += `    <g transform="translate(${rx}, ${ry})">\n`;
    svg += `      <rect x="0" y="0" width="${rw}" height="${rh}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="#111827" stroke-width="7" stroke-linejoin="round" />\n`;
    svg += `      <text x="${rw / 2}" y="${rh / 2 - 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#111827">${r.name}</text>\n`;
    svg += `      <text x="${rw / 2}" y="${rh / 2 + 12}" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">${(r.width * r.height).toFixed(1)} m²</text>\n`;
    svg += `    </g>\n`;
  }

  // 3. Openings (Doors & Windows)
  svg += `    <!-- Openings -->\n`;
  for (const op of openings) {
    const room = rooms.find((r) => r.id === op.roomId);
    if (!room) continue;

    const rx = room.x * SCALE;
    const ry = room.y * SCALE;
    const rw = room.width * SCALE;
    const rh = room.height * SCALE;
    const opWidth = (op.width || 0.9) * SCALE;
    const opOffset = op.offset * SCALE;

    const isDoor = op.type.includes('door');

    if (op.wall === 'north') {
      const x = rx + opOffset;
      const y = ry;
      if (isDoor) {
        svg += `    <rect x="${x}" y="${y - 4}" width="${opWidth}" height="8" fill="#ffffff" stroke="none" />\n`;
        svg += `    <line x1="${x}" y1="${y}" x2="${x + opWidth}" y2="${y}" stroke="#10b981" stroke-width="3" />\n`;
        svg += `    <path d="M ${x} ${y} A ${opWidth} ${opWidth} 0 0 1 ${x + opWidth} ${y - opWidth}" fill="none" stroke="#10b981" stroke-width="1.2" stroke-dasharray="2 2" />\n`;
      } else {
        svg += `    <rect x="${x}" y="${y - 3}" width="${opWidth}" height="6" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" />\n`;
      }
    } else if (op.wall === 'south') {
      const x = rx + opOffset;
      const y = ry + rh;
      if (isDoor) {
        svg += `    <rect x="${x}" y="${y - 4}" width="${opWidth}" height="8" fill="#ffffff" stroke="none" />\n`;
        svg += `    <line x1="${x}" y1="${y}" x2="${x + opWidth}" y2="${y}" stroke="#10b981" stroke-width="3" />\n`;
        svg += `    <path d="M ${x} ${y} A ${opWidth} ${opWidth} 0 0 0 ${x + opWidth} ${y + opWidth}" fill="none" stroke="#10b981" stroke-width="1.2" stroke-dasharray="2 2" />\n`;
      } else {
        svg += `    <rect x="${x}" y="${y - 3}" width="${opWidth}" height="6" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" />\n`;
      }
    } else if (op.wall === 'west') {
      const x = rx;
      const y = ry + opOffset;
      if (isDoor) {
        svg += `    <rect x="${x - 4}" y="${y}" width="8" height="${opWidth}" fill="#ffffff" stroke="none" />\n`;
        svg += `    <line x1="${x}" y1="${y}" x2="${x}" y2="${y + opWidth}" stroke="#10b981" stroke-width="3" />\n`;
      } else {
        svg += `    <rect x="${x - 3}" y="${y}" width="6" height="${opWidth}" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" />\n`;
      }
    } else if (op.wall === 'east') {
      const x = rx + rw;
      const y = ry + opOffset;
      if (isDoor) {
        svg += `    <rect x="${x - 4}" y="${y}" width="8" height="${opWidth}" fill="#ffffff" stroke="none" />\n`;
        svg += `    <line x1="${x}" y1="${y}" x2="${x}" y2="${y + opWidth}" stroke="#10b981" stroke-width="3" />\n`;
      } else {
        svg += `    <rect x="${x - 3}" y="${y}" width="6" height="${opWidth}" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" />\n`;
      }
    }
  }

  // 4. Fixtures & Shapes
  svg += `    <!-- Fixtures -->\n`;
  for (const fix of fixtures) {
    const room = rooms.find((r) => r.id === fix.roomId);
    const baseX = room ? room.x + fix.x : fix.x;
    const baseY = room ? room.y + fix.y : fix.y;

    const fx = baseX * SCALE;
    const fy = baseY * SCALE;
    const fw = fix.width * SCALE;
    const fh = fix.height * SCALE;
    const color = fix.customColor || '#f8fafc';

    svg += `    <g transform="translate(${fx}, ${fy}) rotate(${fix.rotation || 0})">\n`;
    if (fix.geometry === 'circle') {
      svg += `      <circle cx="${fw / 2}" cy="${fh / 2}" r="${Math.min(fw, fh) / 2}" fill="${color}" stroke="#1e293b" stroke-width="1.5" />\n`;
    } else {
      svg += `      <rect x="0" y="0" width="${fw}" height="${fh}" rx="3" fill="${color}" stroke="#1e293b" stroke-width="1.5" />\n`;
    }
    svg += `      <text x="${fw / 2}" y="${fh / 2 + 3}" text-anchor="middle" font-size="9" font-weight="700" fill="#1e293b">${fix.name}</text>\n`;
    svg += `    </g>\n`;
  }

  svg += `  </g>\n`;
  svg += `</svg>\n`;

  return svg;
}

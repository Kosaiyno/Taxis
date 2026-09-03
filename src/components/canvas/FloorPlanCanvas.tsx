import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFloorPlanStore } from '../../store/floorplanStore';
import { Room, Opening, Fixture, WallOrientation } from '../../types/floorplan';
import { snapToGrid, snapToAdjacentRooms, formatDimension } from '../../utils/geometry';
import { getDefaultVerticesForGeometry } from '../../utils/defaultPresets';

const SCALE = 60; // 1 meter = 60 pixels at zoom 1.0

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export const FloorPlanCanvas: React.FC = () => {
  const {
    plot,
    rooms,
    openings,
    fixtures,
    selectedId,
    selectedType,
    selectItem,
    updateRoom,
    updateFixture,
    moveOpening,
    resizeOpening,
    flipOpeningSwing,
    moveFixture,
    rotateFixture,
    cloneFixture,
    deleteFixture,
    updateFixtureVertex,
    addFixtureVertex,
    setRoomWallRadius,
    updateRoomVertex,
    addRoomVertex,
    activeTool,
    activeOpeningPreset,
    setActiveTool,
    addOpening,
    deleteOpening,
    rotateRoom,
    cloneRoom,
    deleteRoom,
    recordHistory,
    zoom,
    setZoom,
    pan,
    setPan,
    gridSnap,
    gridSnapSize,
    showDimensions,
    showGrid,
  } = useFloorPlanStore();

  const containerRef = useRef<HTMLDivElement>(null);

  // Panning
  const [isPanning, setIsPanning] = useState(false);
  const [startPanMouse, setStartPanMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [startPanOffset, setStartPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Room Drag & Resize
  const [draggingRoomId, setDraggingRoomId] = useState<string | null>(null);
  const [dragStartMouse, setDragStartMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragStartRoomPos, setDragStartRoomPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [resizingRoomId, setResizingRoomId] = useState<string | null>(null);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [resizeStartBox, setResizeStartBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Fixture Drag & Resize
  const [draggingFixtureId, setDraggingFixtureId] = useState<string | null>(null);
  const [dragStartFixturePos, setDragStartFixturePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizingFixtureId, setResizingFixtureId] = useState<string | null>(null);
  const [fixtureResizeHandle, setFixtureResizeHandle] = useState<'se' | 'e' | 's' | null>(null);
  const [resizeFixtureStart, setResizeFixtureStart] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Room Vertex Drag Remodeling
  const [draggingRoomVertex, setDraggingRoomVertex] = useState<{ roomId: string; index: number } | null>(null);
  const [dragStartRoomVertexPos, setDragStartRoomVertexPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Vertex Drag Remodeling (Fixtures)
  const [draggingVertex, setDraggingVertex] = useState<{ fixtureId: string; index: number } | null>(null);
  const [dragStartVertexPos, setDragStartVertexPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Opening (Door/Window) Drag & Resize
  const [draggingOpeningId, setDraggingOpeningId] = useState<string | null>(null);

  const [resizingOpeningId, setResizingOpeningId] = useState<string | null>(null);
  const [resizeOpeningStartWidth, setResizeOpeningStartWidth] = useState<number>(0);

  // Center main plot in the middle of the viewport
  const centerPlot = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const plotWidthPx = plot.width * SCALE * zoom;
        const plotHeightPx = plot.height * SCALE * zoom;
        setPan({
          x: Math.round((rect.width - plotWidthPx) / 2),
          y: Math.round((rect.height - plotHeightPx) / 2),
        });
      }
    }
  }, [plot.width, plot.height, zoom, setPan]);

  useEffect(() => {
    const timer = setTimeout(centerPlot, 100);
    window.addEventListener('resize', centerPlot);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', centerPlot);
    };
  }, [centerPlot]);

  // Keyboard Shortcuts (Delete, Ctrl+D Duplicate, R Rotate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        if (selectedType === 'fixture') deleteFixture(selectedId);
        else if (selectedType === 'opening') deleteOpening(selectedId);
        else if (selectedType === 'room') deleteRoom(selectedId);
      }

      if ((e.key === 'r' || e.key === 'R') && selectedId) {
        if (selectedType === 'fixture') rotateFixture(selectedId);
        else if (selectedType === 'room') rotateRoom(selectedId);
        else if (selectedType === 'opening') flipOpeningSwing(selectedId);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId) {
        e.preventDefault();
        if (selectedType === 'fixture') cloneFixture(selectedId);
        else if (selectedType === 'room') cloneRoom(selectedId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedType]);

  // Zoom via Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((prev) => Math.max(0.4, Math.min(3.0, prev + zoomDelta)));
  };

  // Background Mouse Down (Pan & Deselect)
  const handleMouseDownBackground = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setStartPanMouse({ x: e.clientX, y: e.clientY });
      setStartPanOffset({ ...pan });
      selectItem(null, null);
    }
  };

  // Room Drag Start
  const handleMouseDownRoom = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    selectItem(room.id, 'room');
    setDraggingRoomId(room.id);
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    setDragStartRoomPos({ x: room.x, y: room.y });
  };

  // Room Resize Handle Start
  const handleMouseDownRoomHandle = (e: React.MouseEvent, roomId: string, handle: ResizeHandle) => {
    e.stopPropagation();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    setResizingRoomId(roomId);
    setActiveHandle(handle);
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    setResizeStartBox({ x: room.x, y: room.y, width: room.width, height: room.height });
  };

  // Room Vertex Drag Handle Start (Curved/Polygon Wall Reshaping)
  const handleMouseDownRoomVertex = (e: React.MouseEvent | React.TouchEvent, roomId: string, index: number, v: { x: number; y: number }) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingRoomVertex({ roomId, index });
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStartMouse({ x: clientX, y: clientY });
    setDragStartRoomVertexPos({ x: v.x, y: v.y });
  };

  // Fixture Drag Start
  const handleMouseDownFixture = (e: React.MouseEvent, fix: Fixture) => {
    e.stopPropagation();
    selectItem(fix.id, 'fixture');
    setDraggingFixtureId(fix.id);
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    setDragStartFixturePos({ x: fix.x, y: fix.y });
  };

  // Fixture Bounding-Box Resize Handle Start
  const handleMouseDownFixtureResize = (
    e: React.MouseEvent,
    fixtureId: string,
    handle: 'se' | 'e' | 's',
    fix: Fixture
  ) => {
    e.stopPropagation();
    setResizingFixtureId(fixtureId);
    setFixtureResizeHandle(handle);
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    setResizeFixtureStart({ width: fix.width, height: fix.height });
  };

  // Vertex Drag Handle Start
  const handleMouseDownVertex = (e: React.MouseEvent, fixtureId: string, index: number, v: { x: number; y: number }) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingVertex({ fixtureId, index });
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    setDragStartVertexPos({ x: v.x, y: v.y });
  };

  // Opening Drag Start (Sliding along wall)
  const handleMouseDownOpening = (e: React.MouseEvent, op: Opening) => {
    e.stopPropagation();
    selectItem(op.id, 'opening');
    setDraggingOpeningId(op.id);
    setDragStartMouse({ x: e.clientX, y: e.clientY });
  };

  // Opening Resize Width Start
  const handleMouseDownOpeningResize = (e: React.MouseEvent, op: Opening) => {
    e.stopPropagation();
    setResizingOpeningId(op.id);
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    setResizeOpeningStartWidth(op.width);
  };

  // MOUSE MOVE
  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Pan Canvas
    if (isPanning) {
      setPan({
        x: startPanOffset.x + (e.clientX - startPanMouse.x),
        y: startPanOffset.y + (e.clientY - startPanMouse.y),
      });
      return;
    }

    // 2. Drag Fixture
    if (draggingFixtureId) {
      const dx = (e.clientX - dragStartMouse.x) / (SCALE * zoom);
      const dy = (e.clientY - dragStartMouse.y) / (SCALE * zoom);

      let targetX = dragStartFixturePos.x + dx;
      let targetY = dragStartFixturePos.y + dy;

      if (gridSnap) {
        targetX = snapToGrid(targetX, gridSnapSize);
        targetY = snapToGrid(targetY, gridSnapSize);
      }

      moveFixture(draggingFixtureId, Math.max(0, targetX), Math.max(0, targetY));
      return;
    }

    // 2b. Resize Fixture (Width & Height Scaling)
    if (resizingFixtureId && fixtureResizeHandle) {
      const fix = fixtures.find((f) => f.id === resizingFixtureId);
      if (fix) {
        const rad = ((fix.rotation || 0) * Math.PI) / 180;
        const rawDx = (e.clientX - dragStartMouse.x) / (SCALE * zoom);
        const rawDy = (e.clientY - dragStartMouse.y) / (SCALE * zoom);
        const localDx = rawDx * Math.cos(rad) + rawDy * Math.sin(rad);
        const localDy = -rawDx * Math.sin(rad) + rawDy * Math.cos(rad);

        let newW = resizeFixtureStart.width;
        let newH = resizeFixtureStart.height;

        if (fixtureResizeHandle === 'se' || fixtureResizeHandle === 'e') {
          newW = Math.max(0.3, resizeFixtureStart.width + localDx);
        }
        if (fixtureResizeHandle === 'se' || fixtureResizeHandle === 's') {
          newH = Math.max(0.3, resizeFixtureStart.height + localDy);
        }

        if (gridSnap) {
          newW = snapToGrid(newW, 0.05);
          newH = snapToGrid(newH, 0.05);
        }

        const scaleX = fix.width > 0 ? newW / fix.width : 1;
        const scaleY = fix.height > 0 ? newH / fix.height : 1;
        const newVerts = fix.vertices
          ? fix.vertices.map((v) => ({ x: v.x * scaleX, y: v.y * scaleY }))
          : undefined;

        updateFixture(resizingFixtureId, {
          width: newW,
          height: newH,
          ...(newVerts ? { vertices: newVerts } : {}),
        });
      }
      return;
    }

    // 2c. Drag Polygon Vertex Point (Remodeling)
    if (draggingVertex) {
      const dx = (e.clientX - dragStartMouse.x) / (SCALE * zoom);
      const dy = (e.clientY - dragStartMouse.y) / (SCALE * zoom);

      let targetVx = dragStartVertexPos.x + dx;
      let targetVy = dragStartVertexPos.y + dy;

      if (gridSnap) {
        targetVx = snapToGrid(targetVx, 0.05);
        targetVy = snapToGrid(targetVy, 0.05);
      }

      updateFixtureVertex(draggingVertex.fixtureId, draggingVertex.index, Math.max(0, targetVx), Math.max(0, targetVy));
      return;
    }

    // 2c. Drag Room Wall Corner Point (Wall Reshaping)
    if (draggingRoomVertex) {
      const dx = (e.clientX - dragStartMouse.x) / (SCALE * zoom);
      const dy = (e.clientY - dragStartMouse.y) / (SCALE * zoom);

      let targetVx = dragStartRoomVertexPos.x + dx;
      let targetVy = dragStartRoomVertexPos.y + dy;

      if (gridSnap) {
        targetVx = snapToGrid(targetVx, 0.05);
        targetVy = snapToGrid(targetVy, 0.05);
      }

      updateRoomVertex(draggingRoomVertex.roomId, draggingRoomVertex.index, Math.max(0, targetVx), Math.max(0, targetVy));
      return;
    }

    // 4. Slide Opening Along Wall (Smooth 360° perimeter sliding across all walls)
    if (draggingOpeningId) {
      const opening = openings.find((o) => o.id === draggingOpeningId);
      const room = rooms.find((r) => r.id === opening?.roomId);
      if (opening && room && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseCanvasX = (e.clientX - rect.left - pan.x) / zoom;
        const mouseCanvasY = (e.clientY - rect.top - pan.y) / zoom;

        // Relative to room in meters
        const rx = (mouseCanvasX / SCALE) - room.x;
        const ry = (mouseCanvasY / SCALE) - room.y;

        // Distance to the 4 walls
        const distNorth = Math.abs(ry);
        const distSouth = Math.abs(ry - room.height);
        const distWest = Math.abs(rx);
        const distEast = Math.abs(rx - room.width);

        const minDist = Math.min(distNorth, distSouth, distWest, distEast);

        let targetWall: WallOrientation = opening.wall;
        let targetOffset = opening.offset;

        if (minDist === distNorth) {
          targetWall = 'north';
          targetOffset = Math.max(0.1, Math.min(room.width - opening.width - 0.1, rx));
        } else if (minDist === distSouth) {
          targetWall = 'south';
          targetOffset = Math.max(0.1, Math.min(room.width - opening.width - 0.1, rx));
        } else if (minDist === distWest) {
          targetWall = 'west';
          targetOffset = Math.max(0.1, Math.min(room.height - opening.width - 0.1, ry));
        } else {
          targetWall = 'east';
          targetOffset = Math.max(0.1, Math.min(room.height - opening.width - 0.1, ry));
        }

        if (gridSnap) {
          targetOffset = snapToGrid(targetOffset, 0.05);
        }

        moveOpening(draggingOpeningId, targetOffset, targetWall);
      }
      return;
    }

    // 5. Resize Opening Width
    if (resizingOpeningId) {
      const opening = openings.find((o) => o.id === resizingOpeningId);
      if (opening) {
        const isHorizontal = opening.wall === 'north' || opening.wall === 'south';
        const delta = isHorizontal
          ? (e.clientX - dragStartMouse.x) / (SCALE * zoom)
          : (e.clientY - dragStartMouse.y) / (SCALE * zoom);

        let newWidth = Math.max(0.6, Math.min(3.5, resizeOpeningStartWidth + delta));
        if (gridSnap) newWidth = snapToGrid(newWidth, 0.05);

        resizeOpening(resizingOpeningId, newWidth);
      }
      return;
    }

    // 6. Drag Room
    if (draggingRoomId) {
      const dxMeters = (e.clientX - dragStartMouse.x) / (SCALE * zoom);
      const dyMeters = (e.clientY - dragStartMouse.y) / (SCALE * zoom);

      let targetX = dragStartRoomPos.x + dxMeters;
      let targetY = dragStartRoomPos.y + dyMeters;

      if (gridSnap) {
        targetX = snapToGrid(targetX, gridSnapSize);
        targetY = snapToGrid(targetY, gridSnapSize);
      }

      const targetRoom = rooms.find((r) => r.id === draggingRoomId);
      if (targetRoom && gridSnap) {
        const otherRooms = rooms.filter((r) => r.id !== draggingRoomId);
        const snapped = snapToAdjacentRooms(
          { x: targetX, y: targetY, width: targetRoom.width, height: targetRoom.height },
          otherRooms,
          0.25
        );
        targetX = snapped.x;
        targetY = snapped.y;
      }

      updateRoom(draggingRoomId, { x: Math.max(0, targetX), y: Math.max(0, targetY) });
      return;
    }

    // 7. Resize Room
    if (resizingRoomId && activeHandle) {
      const dxMeters = (e.clientX - dragStartMouse.x) / (SCALE * zoom);
      const dyMeters = (e.clientY - dragStartMouse.y) / (SCALE * zoom);

      let newX = resizeStartBox.x;
      let newY = resizeStartBox.y;
      let newW = resizeStartBox.width;
      let newH = resizeStartBox.height;

      if (activeHandle.includes('e')) newW = Math.max(1.0, resizeStartBox.width + dxMeters);
      if (activeHandle.includes('w')) {
        const potW = resizeStartBox.width - dxMeters;
        if (potW >= 1.0) {
          newX = resizeStartBox.x + dxMeters;
          newW = potW;
        }
      }
      if (activeHandle.includes('s')) newH = Math.max(1.0, resizeStartBox.height + dyMeters);
      if (activeHandle.includes('n')) {
        const potH = resizeStartBox.height - dyMeters;
        if (potH >= 1.0) {
          newY = resizeStartBox.y + dyMeters;
          newH = potH;
        }
      }

      if (gridSnap) {
        newX = snapToGrid(newX, gridSnapSize);
        newY = snapToGrid(newY, gridSnapSize);
        newW = snapToGrid(newW, gridSnapSize);
        newH = snapToGrid(newH, gridSnapSize);
      }

      updateRoom(resizingRoomId, { x: newX, y: newY, width: newW, height: newH });
    }
  };

  // MOUSE UP
  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (draggingRoomId) {
      setDraggingRoomId(null);
      recordHistory();
    }
    if (resizingRoomId) {
      setResizingRoomId(null);
      setActiveHandle(null);
      recordHistory();
    }
    if (draggingFixtureId) {
      setDraggingFixtureId(null);
      recordHistory();
    }
    if (resizingFixtureId) {
      setResizingFixtureId(null);
      setFixtureResizeHandle(null);
      recordHistory();
    }
    if (draggingVertex) {
      setDraggingVertex(null);
      recordHistory();
    }
    if (draggingRoomVertex) {
      setDraggingRoomVertex(null);
      recordHistory();
    }
    if (draggingOpeningId) {
      setDraggingOpeningId(null);
      recordHistory();
    }
    if (resizingOpeningId) {
      setResizingOpeningId(null);
      recordHistory();
    }
  };

  // Render Doors & Windows
  const renderOpenings = (room: Room) => {
    const roomOpenings = openings.filter((o) => o.roomId === room.id);

    return roomOpenings.map((op) => {
      const isSelected = selectedId === op.id;
      const isDoor = op.type.includes('door');
      const openingWidthPx = op.width * SCALE;
      const offsetPx = op.offset * SCALE;

      let x = 0;
      let y = 0;
      let rotation = 0;

      switch (op.wall) {
        case 'north':
          x = offsetPx;
          y = 0;
          rotation = 0;
          break;
        case 'south':
          x = offsetPx;
          y = room.height * SCALE;
          rotation = 180;
          break;
        case 'west':
          x = 0;
          y = offsetPx;
          rotation = 270;
          break;
        case 'east':
          x = room.width * SCALE;
          y = offsetPx;
          rotation = 90;
          break;
      }

      return (
        <g
          key={op.id}
          transform={`translate(${x}, ${y}) rotate(${rotation})`}
          onMouseDown={(e) => handleMouseDownOpening(e, op)}
          className="cursor-grab active:cursor-grabbing group"
        >
          {/* Wall Cutout */}
          <rect
            x={0}
            y={-8}
            width={openingWidthPx}
            height={16}
            fill="#ffffff"
            stroke={isSelected ? '#c99a6e' : 'none'}
            strokeWidth={2}
          />

          {isDoor ? (
            <g>
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={op.swingDirection === 'outside' ? -openingWidthPx : openingWidthPx}
                stroke={isSelected ? '#c99a6e' : '#111827'}
                strokeWidth={3}
              />
              <path
                d={
                  op.swingDirection === 'outside'
                    ? `M 0 ${-openingWidthPx} A ${openingWidthPx} ${openingWidthPx} 0 0 1 ${openingWidthPx} 0`
                    : `M 0 ${openingWidthPx} A ${openingWidthPx} ${openingWidthPx} 0 0 0 ${openingWidthPx} 0`
                }
                fill="none"
                stroke={isSelected ? '#c99a6e' : '#111827'}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            </g>
          ) : (
            <g>
              <line x1={0} y1={-3} x2={openingWidthPx} y2={-3} stroke={isSelected ? '#c99a6e' : '#111827'} strokeWidth={2} />
              <line x1={0} y1={3} x2={openingWidthPx} y2={3} stroke={isSelected ? '#c99a6e' : '#111827'} strokeWidth={2} />
              <line x1={0} y1={-8} x2={0} y2={8} stroke="#111827" strokeWidth={2} />
              <line x1={openingWidthPx} y1={-8} x2={openingWidthPx} y2={8} stroke="#111827" strokeWidth={2} />
            </g>
          )}

          {/* Width Resize Handle on end of opening */}
          {isSelected && (
            <g>
              <circle
                cx={openingWidthPx}
                cy={0}
                r={6}
                fill="#c99a6e"
                stroke="#ffffff"
                strokeWidth={2}
                className="cursor-ew-resize hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDownOpeningResize(e, op)}
              />

              {/* Floating Quick Action Pill for Door/Window */}
              <g
                transform={`translate(${openingWidthPx / 2}, -22)`}
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto"
              >
                <rect x={-32} y={-10} width={64} height={20} rx={5} fill="#261e1b" stroke="#3d302a" />
                {isDoor && (
                  <text
                    x={-16}
                    y={3}
                    textAnchor="middle"
                    fill="#e6ccb2"
                    fontSize="9"
                    fontWeight="bold"
                    className="cursor-pointer hover:fill-amber-300"
                    onClick={() => flipOpeningSwing(op.id)}
                  >
                    FLIP
                  </text>
                )}
                <text
                  x={16}
                  y={3}
                  textAnchor="middle"
                  fill="#f87171"
                  fontSize="9"
                  fontWeight="bold"
                  className="cursor-pointer hover:fill-rose-400"
                  onClick={() => deleteOpening(op.id)}
                >
                  DEL
                </text>
              </g>
            </g>
          )}
        </g>
      );
    });
  };

  // Render Fixtures & Furniture (Draggable, Resizable, Rotatable)
  const renderFixtures = (room: Room) => {
    const roomFixtures = fixtures.filter((f) => f.roomId === room.id);

    return roomFixtures.map((fix) => {
      const isSelected = selectedId === fix.id;
      const x = fix.x * SCALE;
      const y = fix.y * SCALE;
      const w = fix.width * SCALE;
      const h = fix.height * SCALE;
      const geom = fix.geometry || 'rectangle';
      const verts = fix.vertices && fix.vertices.length >= 3
        ? fix.vertices
        : getDefaultVerticesForGeometry(geom, fix.width, fix.height);

      return (
        <g
          key={fix.id}
          transform={`translate(${x}, ${y}) rotate(${fix.rotation})`}
          onMouseDown={(e) => handleMouseDownFixture(e, fix)}
          className="cursor-grab active:cursor-grabbing group select-none"
        >
          {/* Main Shape Polygon (Rendered dynamically through all vertices) */}
          {geom === 'circle' && !fix.vertices ? (
            <circle
              cx={w / 2}
              cy={h / 2}
              r={Math.min(w, h) / 2 - 2}
              fill={isSelected ? '#f3f4f6' : '#ffffff'}
              fillOpacity={1.0}
              stroke={isSelected ? '#c99a6e' : '#111827'}
              strokeWidth={isSelected ? 2.5 : 1.8}
            />
          ) : (
            <polygon
              points={verts.map((v: { x: number; y: number }) => `${v.x * SCALE},${v.y * SCALE}`).join(' ')}
              fill={isSelected ? '#f3f4f6' : '#ffffff'}
              fillOpacity={1.0}
              stroke={isSelected ? '#c99a6e' : '#111827'}
              strokeWidth={isSelected ? 2.5 : 1.8}
            />
          )}

          {/* Specific Interior Fixture Detail Overlays */}
          {fix.type === 'stairs' && (
            <g stroke="#111827" strokeWidth={1.2}>
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={i} x1={0} y1={(h / 8) * i} x2={w} y2={(h / 8) * i} />
              ))}
              <line x1={w / 2} y1={h - 10} x2={w / 2} y2={10} stroke="#111827" strokeWidth={2} />
              <polygon points={`${w / 2},5 ${w / 2 - 4},12 ${w / 2 + 4},12`} fill="#111827" />
            </g>
          )}

          {fix.type === 'sofa' && (
            <g stroke="#111827" strokeWidth={1.2}>
              <rect x={2} y={2} width={w - 4} height={8} rx={2} fill="#f3f4f6" />
              <rect x={2} y={2} width={6} height={h - 4} rx={2} fill="#f3f4f6" />
              <rect x={w - 8} y={2} width={6} height={h - 4} rx={2} fill="#f3f4f6" />
            </g>
          )}

          {fix.type.includes('bed') && (
            <g stroke="#111827" strokeWidth={1.2}>
              <rect x={2} y={2} width={w - 4} height={8} rx={2} fill="#111827" />
              <rect x={4} y={12} width={w / 2 - 8} height={12} rx={2} fill="#ffffff" stroke="#111827" />
              <rect x={w / 2 + 4} y={12} width={w / 2 - 8} height={12} rx={2} fill="#ffffff" stroke="#111827" />
            </g>
          )}

          {fix.type === 'workstation_cluster' && (
            <g stroke="#111827" strokeWidth={1.2}>
              <line x1={w / 2} y1={2} x2={w / 2} y2={h - 2} stroke="#111827" strokeWidth={2} />
              <line x1={2} y1={h / 2} x2={w - 2} y2={h / 2} stroke="#111827" strokeWidth={2} />
              <rect x={4} y={4} width={w / 2 - 8} height={h / 2 - 8} rx={2} fill="#ffffff" stroke="#111827" />
              <rect x={w / 2 + 4} y={4} width={w / 2 - 8} height={h / 2 - 8} rx={2} fill="#ffffff" stroke="#111827" />
              <rect x={4} y={h / 2 + 4} width={w / 2 - 8} height={h / 2 - 8} rx={2} fill="#ffffff" stroke="#111827" />
              <rect x={w / 2 + 4} y={h / 2 + 4} width={w / 2 - 8} height={h / 2 - 8} rx={2} fill="#ffffff" stroke="#111827" />
            </g>
          )}

          {(fix.type === 'booth_standard' || fix.type === 'booth_sponsor') && (
            <g stroke="#111827" strokeWidth={1.5}>
              <line x1={2} y1={2} x2={w - 2} y2={2} stroke="#111827" strokeWidth={3} />
              <line x1={2} y1={2} x2={2} y2={h - 2} stroke="#111827" strokeWidth={3} />
              <line x1={w - 2} y1={2} x2={w - 2} y2={h - 2} stroke="#111827" strokeWidth={3} />
            </g>
          )}

          {/* Label */}
          <text
            x={w / 2}
            y={h / 2 + 3}
            textAnchor="middle"
            fill="#111827"
            fontSize="10"
            fontWeight="bold"
            fontFamily="sans-serif"
            className="pointer-events-none"
          >
            {fix.name}
          </text>

          {/* Interactive Resize Handles, Vertex Corner Points & Controls */}
          {isSelected && (
            <g className="select-none">
              {/* Bounding Box Outline */}
              <rect
                x={-3}
                y={-3}
                width={w + 6}
                height={h + 6}
                fill="none"
                stroke="#c99a6e"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                className="pointer-events-none"
              />

              {/* 1. SE Corner (Bottom-Right) Handle - Resizes Width & Height together */}
              <g
                className="cursor-nwse-resize pointer-events-auto"
                onMouseDown={(e) => handleMouseDownFixtureResize(e, fix.id, 'se', fix)}
              >
                <circle cx={w} cy={h} r={16} fill="transparent" />
                <rect
                  x={w - 6}
                  y={h - 6}
                  width={12}
                  height={12}
                  rx={2.5}
                  fill="#c99a6e"
                  stroke="#ffffff"
                  strokeWidth={2}
                  className="shadow-md"
                />
                <circle cx={w} cy={h} r={2} fill="#18110e" />
              </g>

              {/* 2. East Edge Handle - Resizes Width */}
              <g
                className="cursor-ew-resize pointer-events-auto"
                onMouseDown={(e) => handleMouseDownFixtureResize(e, fix.id, 'e', fix)}
              >
                <circle cx={w} cy={h / 2} r={14} fill="transparent" />
                <rect
                  x={w - 4}
                  y={h / 2 - 6}
                  width={8}
                  height={12}
                  rx={2}
                  fill="#c99a6e"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              </g>

              {/* 3. South Edge Handle - Resizes Height / Length */}
              <g
                className="cursor-ns-resize pointer-events-auto"
                onMouseDown={(e) => handleMouseDownFixtureResize(e, fix.id, 's', fix)}
              >
                <circle cx={w / 2} cy={h} r={14} fill="transparent" />
                <rect
                  x={w / 2 - 6}
                  y={h - 4}
                  width={12}
                  height={8}
                  rx={2}
                  fill="#c99a6e"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              </g>

              {/* Corner Vertex Grab Points (Remodeling individual polygon vertices) */}
              {verts.map((v: { x: number; y: number }, idx: number) => (
                <g
                  key={idx}
                  className="cursor-crosshair pointer-events-auto"
                  onMouseDown={(e) => handleMouseDownVertex(e, fix.id, idx, v)}
                >
                  <title>{`Corner Point ${idx + 1} (Drag to remodel)`}</title>
                  {/* Invisible generous hit target (prevents accidental body drag) */}
                  <circle
                    cx={v.x * SCALE}
                    cy={v.y * SCALE}
                    r={14}
                    fill="transparent"
                  />
                  {/* Outer border ring */}
                  <circle
                    cx={v.x * SCALE}
                    cy={v.y * SCALE}
                    r={6}
                    fill="#18110e"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                  {/* Inner center dot */}
                  <circle
                    cx={v.x * SCALE}
                    cy={v.y * SCALE}
                    r={2}
                    fill="#c99a6e"
                  />
                </g>
              ))}

              {/* Floating Quick Action Pill */}
              <g
                transform={`translate(${w / 2}, ${-24})`}
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto"
              >
                <rect x={-80} y={-10} width={160} height={20} rx={5} fill="#261e1b" stroke="#3d302a" />
                <text
                  x={-55}
                  y={3}
                  textAnchor="middle"
                  fill="#c99a6e"
                  fontSize="9"
                  fontWeight="bold"
                  className="cursor-pointer hover:fill-amber-300"
                  onClick={() => addFixtureVertex(fix.id)}
                >
                  +PT
                </text>
                <text
                  x={-20}
                  y={3}
                  textAnchor="middle"
                  fill="#e6ccb2"
                  fontSize="9"
                  fontWeight="bold"
                  className="cursor-pointer hover:fill-amber-300"
                  onClick={() => rotateFixture(fix.id)}
                >
                  ROT 90°
                </text>
                <text
                  x={22}
                  y={3}
                  textAnchor="middle"
                  fill="#e6ccb2"
                  fontSize="9"
                  fontWeight="bold"
                  className="cursor-pointer hover:fill-amber-300"
                  onClick={() => cloneFixture(fix.id)}
                >
                  COPY
                </text>
                <text
                  x={58}
                  y={3}
                  textAnchor="middle"
                  fill="#f87171"
                  fontSize="9"
                  fontWeight="bold"
                  className="cursor-pointer hover:fill-rose-400"
                  onClick={() => deleteFixture(fix.id)}
                >
                  DEL
                </text>
              </g>
            </g>
          )}
        </g>
      );
    });
  };

  const touchStartDist = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
    } else if (e.touches.length === 1) {
      setIsPanning(true);
      setStartPanMouse({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setStartPanOffset({ ...pan });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist.current;
      if (Math.abs(factor - 1) > 0.04) {
        setZoom((prev) => Math.max(0.4, Math.min(3.0, prev * (factor > 1 ? 1.02 : 0.98))));
        touchStartDist.current = dist;
      }
    } else if (e.touches.length === 1 && isPanning) {
      setPan({
        x: startPanOffset.x + (e.touches[0].clientX - startPanMouse.x),
        y: startPanOffset.y + (e.touches[0].clientY - startPanMouse.y),
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartDist.current = null;
    setIsPanning(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDownBackground}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="flex-1 h-full w-full relative overflow-hidden cursor-crosshair bg-[#ffffff] select-none touch-none"
    >
      <svg
        className="w-full h-full absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          {/* Subtle 0.25m minor grid lines */}
          <pattern
            id="gridMinorLight"
            width={SCALE * 0.25}
            height={SCALE * 0.25}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${SCALE * 0.25} 0 L 0 0 0 ${SCALE * 0.25}`}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="0.75"
            />
          </pattern>

          {/* Crisp 1.0m major drafting grid lines on pure white */}
          <pattern
            id="gridMajorLight"
            width={SCALE}
            height={SCALE}
            patternUnits="userSpaceOnUse"
          >
            <rect width={SCALE} height={SCALE} fill="#ffffff" />
            <rect width={SCALE} height={SCALE} fill="url(#gridMinorLight)" />
            <path d={`M ${SCALE} 0 L 0 0 0 ${SCALE}`} fill="none" stroke="#cbd5e1" strokeWidth="1" />
          </pattern>

          {/* Architectural Floor Grid (50cm tiles in crisp black lines on white inside spaces) */}
          <pattern
            id="archFloorGrid"
            width={SCALE * 0.5}
            height={SCALE * 0.5}
            patternUnits="userSpaceOnUse"
          >
            <rect width={SCALE * 0.5} height={SCALE * 0.5} fill="#ffffff" />
            <path
              d={`M ${SCALE * 0.5} 0 L 0 0 0 ${SCALE * 0.5}`}
              fill="none"
              stroke="#000000"
              strokeWidth="0.75"
              strokeOpacity="0.22"
            />
          </pattern>

          {/* Architectural Wood Planks (Crisp black plank lines on white inside spaces) */}
          <pattern id="archWoodPlanks" width={SCALE} height={20} patternUnits="userSpaceOnUse">
            <rect width={SCALE} height={20} fill="#ffffff" />
            <line x1="0" y1="20" x2={SCALE} y2="20" stroke="#000000" strokeWidth="0.8" strokeOpacity="0.25" />
            <line x1={SCALE * 0.5} y1="0" x2={SCALE * 0.5} y2="20" stroke="#000000" strokeWidth="0.6" strokeOpacity="0.2" />
          </pattern>

          {/* Architectural Hatching (45-degree diagonal lines in black on white inside spaces) */}
          <pattern id="archHatching" width={16} height={16} patternUnits="userSpaceOnUse">
            <rect width={16} height={16} fill="#ffffff" />
            <line x1="0" y1="0" x2="16" y2="16" stroke="#000000" strokeWidth="0.75" strokeOpacity="0.22" />
          </pattern>
        </defs>

        {/* 1. Background Grid (Infinite Continuous Drafting Canvas - No Cutoff) */}
        {showGrid && (
          <rect
            x={-50000}
            y={-50000}
            width={100000}
            height={100000}
            fill="url(#gridMajorLight)"
            className="pointer-events-none"
          />
        )}

        {/* 2. Land Boundary (Main Property Plot Centered In The Middle) */}
        <g className="pointer-events-none">
          <rect
            x={0}
            y={0}
            width={plot.width * SCALE}
            height={plot.height * SCALE}
            fill="none"
            stroke="#111827"
            strokeWidth={2.5}
            strokeDasharray="8 5"
          />
          {showDimensions && (
            <g fill="#111827" fontSize="11" fontFamily="monospace" fontWeight="700">
              <text x={(plot.width * SCALE) / 2} y={-12} textAnchor="middle">
                LAND WIDTH: {formatDimension(plot.width, plot.unit)}
              </text>
              <text
                x={-18}
                y={(plot.height * SCALE) / 2}
                textAnchor="middle"
                transform={`rotate(-90, -18, ${(plot.height * SCALE) / 2})`}
              >
                LAND DEPTH: {formatDimension(plot.height, plot.unit)}
              </text>
            </g>
          )}
        </g>

        {/* 3. Rooms Rendering */}
        {rooms.map((room) => {
          const isSelected = selectedId === room.id;
          const x = room.x * SCALE;
          const y = room.y * SCALE;
          const w = room.width * SCALE;
          const h = room.height * SCALE;
          const wallThick = 14;
          const wallRadiusPx = (room.wallRadius ?? 0) * SCALE;
          const isPoly = room.vertices && room.vertices.length >= 3;
          const roomVerts = isPoly
            ? room.vertices!
            : [
                { x: 0, y: 0 },
                { x: room.width, y: 0 },
                { x: room.width, y: room.height },
                { x: 0, y: room.height },
              ];

          const floorFill = room.floorTexture === 'wood'
            ? 'url(#archWoodPlanks)'
            : 'url(#archFloorGrid)';

          return (
            <g
              key={room.id}
              transform={`translate(${x}, ${y})`}
              onMouseDown={(e) => {
                if (activeTool === 'door' || activeTool === 'window') {
                  e.stopPropagation();
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    const mouseCanvasX = (e.clientX - rect.left - pan.x) / zoom;
                    const mouseCanvasY = (e.clientY - rect.top - pan.y) / zoom;
                    const rx = (mouseCanvasX / SCALE) - room.x;
                    const ry = (mouseCanvasY / SCALE) - room.y;
                    const distNorth = Math.abs(ry);
                    const distSouth = Math.abs(ry - room.height);
                    const distWest = Math.abs(rx);
                    const distEast = Math.abs(rx - room.width);
                    const minDist = Math.min(distNorth, distSouth, distWest, distEast);

                    let wall: WallOrientation = 'south';
                    let offset = 1.0;
                    if (minDist === distNorth) { wall = 'north'; offset = rx; }
                    else if (minDist === distSouth) { wall = 'south'; offset = rx; }
                    else if (minDist === distWest) { wall = 'west'; offset = ry; }
                    else { wall = 'east'; offset = ry; }

                    addOpening({
                      roomId: room.id,
                      type: activeOpeningPreset || (activeTool === 'door' ? 'single_door' : 'window'),
                      wall,
                      offset: Math.max(0.2, Math.min((wall === 'north' || wall === 'south' ? room.width : room.height) - 1.0, offset)),
                    });
                    setActiveTool('select');
                    return;
                  }
                }
                handleMouseDownRoom(e, room);
              }}
              className={activeTool === 'door' || activeTool === 'window' ? 'cursor-pointer' : 'cursor-move'}
            >
              {/* Room Floor & Walls (Supports Curved Radius & Polygon Outlines) */}
              {isPoly ? (
                <polygon
                  points={roomVerts.map((v: { x: number; y: number }) => `${v.x * SCALE},${v.y * SCALE}`).join(' ')}
                  fill={floorFill}
                  stroke="#111827"
                  strokeWidth={wallThick}
                  strokeLinejoin="round"
                  className="transition-colors duration-150"
                />
              ) : (
                <rect
                  x={0}
                  y={0}
                  width={w}
                  height={h}
                  rx={wallRadiusPx}
                  ry={wallRadiusPx}
                  fill={floorFill}
                  stroke="#111827"
                  strokeWidth={wallThick}
                  strokeLinejoin="round"
                  className="transition-colors duration-150"
                />
              )}

              {/* Selection Halo */}
              {isSelected && (
                <rect
                  x={-8}
                  y={-8}
                  width={w + 16}
                  height={h + 16}
                  rx={wallRadiusPx > 0 ? wallRadiusPx + 8 : 0}
                  ry={wallRadiusPx > 0 ? wallRadiusPx + 8 : 0}
                  fill="none"
                  stroke="#c99a6e"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  className="pointer-events-none animate-pulse"
                />
              )}

              {/* Room Label */}
              <g className="pointer-events-none" transform={`translate(${w / 2}, ${h / 2})`}>
                <rect
                  x={-60}
                  y={-14}
                  width={120}
                  height={26}
                  rx={8}
                  fill="#ffffff"
                  opacity={0.98}
                  stroke="#111827"
                  strokeWidth={1.5}
                />
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  fill="#111827"
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="sans-serif"
                >
                  {room.name}
                </text>
              </g>

              {/* Fixtures */}
              {renderFixtures(room)}

              {/* Openings */}
              {renderOpenings(room)}

              {/* Wall Dimensions */}
              {showDimensions && (
                <g fill="#111827" fontSize="10" fontFamily="monospace" fontWeight="700">
                  <text x={w / 2} y={-12} textAnchor="middle">
                    {formatDimension(room.width, plot.unit)}
                  </text>
                  <text x={w / 2} y={h + 20} textAnchor="middle">
                    {formatDimension(room.width, plot.unit)}
                  </text>
                  <text
                    x={-14}
                    y={h / 2}
                    textAnchor="middle"
                    transform={`rotate(-90, -14, ${h / 2})`}
                  >
                    {formatDimension(room.height, plot.unit)}
                  </text>
                  <text
                    x={w + 18}
                    y={h / 2}
                    textAnchor="middle"
                    transform={`rotate(90, ${w + 18}, ${h / 2})`}
                  >
                    {formatDimension(room.height, plot.unit)}
                  </text>
                </g>
              )}

              {/* Floating Quick Actions for Room */}
              {isSelected && (
                <g
                  transform={`translate(${w / 2}, ${-36})`}
                  onClick={(e) => e.stopPropagation()}
                  className="pointer-events-auto cursor-pointer select-none"
                >
                  <rect x={-95} y={-12} width={190} height={24} rx={12} fill="#1c1512" stroke="#3d302a" opacity={0.96} />
                  <text
                    x={-68}
                    y={4}
                    textAnchor="middle"
                    fill="#38bdf8"
                    fontSize="9"
                    fontWeight="bold"
                    className="hover:fill-sky-300"
                    onClick={() => addRoomVertex(room.id)}
                  >
                    +CORNER
                  </text>
                  <text
                    x={-22}
                    y={4}
                    textAnchor="middle"
                    fill="#e2b170"
                    fontSize="9"
                    fontWeight="bold"
                    className="hover:fill-amber-300"
                    onClick={() => setRoomWallRadius(room.id, (room.wallRadius || 0) > 0 ? 0 : 1.2)}
                  >
                    {(room.wallRadius || 0) > 0 ? 'FLAT' : 'CURVE'}
                  </text>
                  <text
                    x={18}
                    y={4}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontWeight="bold"
                    className="hover:fill-white"
                    onClick={() => rotateRoom(room.id)}
                  >
                    ROT
                  </text>
                  <text
                    x={50}
                    y={4}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontWeight="bold"
                    className="hover:fill-white"
                    onClick={() => cloneRoom(room.id)}
                  >
                    COPY
                  </text>
                  <text
                    x={78}
                    y={4}
                    textAnchor="middle"
                    fill="#f87171"
                    fontSize="9"
                    fontWeight="bold"
                    className="hover:fill-rose-400"
                    onClick={() => deleteRoom(room.id)}
                  >
                    DEL
                  </text>
                </g>
              )}

              {/* Corner Vertex Grab Handles for Direct Wall Reshaping */}
              {isSelected && (
                <g className="select-none">
                  {roomVerts.map((v: { x: number; y: number }, idx: number) => (
                    <g
                      key={idx}
                      className="cursor-crosshair pointer-events-auto"
                      onMouseDown={(e) => handleMouseDownRoomVertex(e, room.id, idx, v)}
                      onTouchStart={(e) => handleMouseDownRoomVertex(e, room.id, idx, v)}
                    >
                      <circle cx={v.x * SCALE} cy={v.y * SCALE} r={16} fill="transparent" />
                      <circle cx={v.x * SCALE} cy={v.y * SCALE} r={7.5} fill="#38bdf8" stroke="#ffffff" strokeWidth={2.5} />
                      <circle cx={v.x * SCALE} cy={v.y * SCALE} r={2.5} fill="#0f172a" />
                    </g>
                  ))}
                </g>
              )}

              {/* 8-Point Room Resize Handles */}
              {isSelected && (
                <g className="cursor-pointer">
                  <rect
                    x={-6}
                    y={-6}
                    width={12}
                    height={12}
                    fill="#a67c52"
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="cursor-nwse-resize"
                    onMouseDown={(e) => handleMouseDownRoomHandle(e, room.id, 'nw')}
                  />
                  <rect
                    x={w - 6}
                    y={-6}
                    width={12}
                    height={12}
                    fill="#a67c52"
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="cursor-nesw-resize"
                    onMouseDown={(e) => handleMouseDownRoomHandle(e, room.id, 'ne')}
                  />
                  <rect
                    x={-6}
                    y={h - 6}
                    width={12}
                    height={12}
                    fill="#a67c52"
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="cursor-nesw-resize"
                    onMouseDown={(e) => handleMouseDownRoomHandle(e, room.id, 'sw')}
                  />
                  <rect
                    x={w - 6}
                    y={h - 6}
                    width={12}
                    height={12}
                    fill="#a67c52"
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="cursor-nwse-resize"
                    onMouseDown={(e) => handleMouseDownRoomHandle(e, room.id, 'se')}
                  />

                  <circle
                    cx={w / 2}
                    cy={0}
                    r={6}
                    fill="#a67c52"
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="cursor-ns-resize"
                    onMouseDown={(e) => handleMouseDownRoomHandle(e, room.id, 'n')}
                  />
                  <circle
                    cx={w / 2}
                    cy={h}
                    r={6}
                    fill="#a67c52"
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="cursor-ns-resize"
                    onMouseDown={(e) => handleMouseDownRoomHandle(e, room.id, 's')}
                  />
                  <circle
                    cx={0}
                    cy={h / 2}
                    r={6}
                    fill="#a67c52"
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="cursor-ew-resize"
                    onMouseDown={(e) => handleMouseDownRoomHandle(e, room.id, 'w')}
                  />
                  <circle
                    cx={w}
                    cy={h / 2}
                    r={6}
                    fill="#a67c52"
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="cursor-ew-resize"
                    onMouseDown={(e) => handleMouseDownRoomHandle(e, room.id, 'e')}
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Zoom Bar (Bottom Left) */}
      <div className="absolute bottom-4 left-4 flex items-center bg-[#261e1b] text-[#e6ccb2] rounded-lg shadow-lg border border-[#3d302a] p-1 text-xs font-mono select-none">
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
          className="px-2 py-1 hover:bg-[#3d302a] rounded font-bold"
        >
          −
        </button>
        <span className="px-3 py-1 font-semibold">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(3.0, z + 0.15))}
          className="px-2 py-1 hover:bg-[#3d302a] rounded font-bold"
          title="Zoom In"
        >
          +
        </button>
        <span className="text-[#3d302a] px-0.5">|</span>
        <button
          onClick={centerPlot}
          className="px-2 py-1 hover:bg-[#3d302a] rounded font-sans font-bold text-[10px] text-[#c99a6e] hover:text-[#f5ebe0] transition flex items-center gap-1"
          title="Center Main Plot in the Middle of Screen"
        >
          <span>🎯 Center Plot</span>
        </button>
      </div>

      {/* Minimap (Bottom Right) */}
      <div className="absolute bottom-4 right-4 w-36 h-28 bg-[#ffffff]/95 backdrop-blur rounded-xl border border-slate-300 shadow-xl overflow-hidden pointer-events-none p-1.5 flex items-center justify-center">
        <svg viewBox="0 0 16 14" className="w-full h-full">
          <rect x="0" y="0" width="16" height="14" fill="#fafafa" stroke="#e4e4e7" strokeWidth="0.5" />
          {rooms.map((r) => (
            <rect
              key={r.id}
              x={r.x}
              y={r.y}
              width={r.width}
              height={r.height}
              fill="#ffffff"
              stroke="#111827"
              strokeWidth="0.8"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

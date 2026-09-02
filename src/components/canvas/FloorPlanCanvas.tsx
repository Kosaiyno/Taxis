import React, { useRef, useState, useEffect } from 'react';
import { useFloorPlanStore } from '../../store/floorplanStore';
import { Room, Opening, Fixture } from '../../types/floorplan';
import { snapToGrid, snapToAdjacentRooms, formatDimension } from '../../utils/geometry';

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
    moveOpening,
    resizeOpening,
    flipOpeningSwing,
    moveFixture,
    resizeFixture,
    rotateFixture,
    cloneFixture,
    deleteFixture,
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
  const [resizeFixtureStart, setResizeFixtureStart] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Opening (Door/Window) Drag & Resize
  const [draggingOpeningId, setDraggingOpeningId] = useState<string | null>(null);
  const [dragStartOpeningOffset, setDragStartOpeningOffset] = useState<number>(0);

  const [resizingOpeningId, setResizingOpeningId] = useState<string | null>(null);
  const [resizeOpeningStartWidth, setResizeOpeningStartWidth] = useState<number>(0);

  // Center plot on mount
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const plotWidthPx = plot.width * SCALE;
      const plotHeightPx = plot.height * SCALE;
      setPan({
        x: (rect.width - plotWidthPx) / 2,
        y: (rect.height - plotHeightPx) / 2,
      });
    }
  }, []);

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

  // Fixture Drag Start
  const handleMouseDownFixture = (e: React.MouseEvent, fix: Fixture) => {
    e.stopPropagation();
    selectItem(fix.id, 'fixture');
    setDraggingFixtureId(fix.id);
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    setDragStartFixturePos({ x: fix.x, y: fix.y });
  };

  // Fixture Resize Handle Start
  const handleMouseDownFixtureResize = (e: React.MouseEvent, fix: Fixture) => {
    e.stopPropagation();
    setResizingFixtureId(fix.id);
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    setResizeFixtureStart({ width: fix.width, height: fix.height });
  };

  // Opening Drag Start (Sliding along wall)
  const handleMouseDownOpening = (e: React.MouseEvent, op: Opening) => {
    e.stopPropagation();
    selectItem(op.id, 'opening');
    setDraggingOpeningId(op.id);
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    setDragStartOpeningOffset(op.offset);
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

    // 3. Resize Fixture Width & Height (Correctly projected with rotation)
    if (resizingFixtureId) {
      const fix = fixtures.find((f) => f.id === resizingFixtureId);
      if (fix) {
        const dx = (e.clientX - dragStartMouse.x) / (SCALE * zoom);
        const dy = (e.clientY - dragStartMouse.y) / (SCALE * zoom);

        const rad = (-fix.rotation * Math.PI) / 180;
        const localDx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const localDy = dx * Math.sin(rad) + dy * Math.cos(rad);

        let newW = Math.max(0.4, resizeFixtureStart.width + localDx);
        let newH = Math.max(0.4, resizeFixtureStart.height + localDy);

        if (gridSnap) {
          newW = snapToGrid(newW, gridSnapSize);
          newH = snapToGrid(newH, gridSnapSize);
        }

        resizeFixture(resizingFixtureId, newW, newH);
      }
      return;
    }

    // 4. Slide Opening Along Wall
    if (draggingOpeningId) {
      const opening = openings.find((o) => o.id === draggingOpeningId);
      const room = rooms.find((r) => r.id === opening?.roomId);
      if (opening && room) {
        const isHorizontal = opening.wall === 'north' || opening.wall === 'south';
        const delta = isHorizontal
          ? (e.clientX - dragStartMouse.x) / (SCALE * zoom)
          : (e.clientY - dragStartMouse.y) / (SCALE * zoom);

        let newOffset = dragStartOpeningOffset + delta;
        const maxOffset = (isHorizontal ? room.width : room.height) - opening.width;
        newOffset = Math.max(0.1, Math.min(maxOffset, snapToGrid(newOffset, 0.05)));

        moveOpening(draggingOpeningId, newOffset);
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
            fill={room.color || '#eddcc9'}
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
                stroke={isSelected ? '#c99a6e' : '#2b2d42'}
                strokeWidth={3}
              />
              <path
                d={
                  op.swingDirection === 'outside'
                    ? `M 0 ${-openingWidthPx} A ${openingWidthPx} ${openingWidthPx} 0 0 1 ${openingWidthPx} 0`
                    : `M 0 ${openingWidthPx} A ${openingWidthPx} ${openingWidthPx} 0 0 0 ${openingWidthPx} 0`
                }
                fill="none"
                stroke={isSelected ? '#c99a6e' : '#64748b'}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            </g>
          ) : (
            <g>
              <line x1={0} y1={-3} x2={openingWidthPx} y2={-3} stroke={isSelected ? '#c99a6e' : '#0284c7'} strokeWidth={2} />
              <line x1={0} y1={3} x2={openingWidthPx} y2={3} stroke={isSelected ? '#c99a6e' : '#0284c7'} strokeWidth={2} />
              <line x1={0} y1={-8} x2={0} y2={8} stroke="#1e293b" strokeWidth={2} />
              <line x1={openingWidthPx} y1={-8} x2={openingWidthPx} y2={8} stroke="#1e293b" strokeWidth={2} />
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

      return (
        <g
          key={fix.id}
          transform={`translate(${x}, ${y}) rotate(${fix.rotation}, ${w / 2}, ${h / 2})`}
          onMouseDown={(e) => handleMouseDownFixture(e, fix)}
          className="cursor-grab active:cursor-grabbing group select-none"
        >
          {/* Main Body */}
          <rect
            width={w}
            height={h}
            rx={4}
            fill={isSelected ? '#c99a6e' : '#d5bdaf'}
            fillOpacity={0.85}
            stroke={isSelected ? '#a67c52' : '#8d7b68'}
            strokeWidth={isSelected ? 2.5 : 1.5}
            className="transition-colors"
          />

          {/* Stairs */}
          {fix.type === 'stairs' && (
            <g stroke="#7f5539" strokeWidth={1.2}>
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={i} x1={0} y1={(h / 8) * i} x2={w} y2={(h / 8) * i} />
              ))}
              <line x1={w / 2} y1={h - 10} x2={w / 2} y2={10} stroke="#7f5539" strokeWidth={2} />
              <polygon points={`${w / 2},5 ${w / 2 - 4},12 ${w / 2 + 4},12`} fill="#7f5539" />
            </g>
          )}

          {/* Sofa */}
          {fix.type === 'sofa' && (
            <g stroke="#7f5539" strokeWidth={1}>
              <rect x={2} y={2} width={w - 4} height={8} rx={2} fill="#b08968" />
              <rect x={2} y={2} width={6} height={h - 4} rx={2} fill="#b08968" />
              <rect x={w - 8} y={2} width={6} height={h - 4} rx={2} fill="#b08968" />
            </g>
          )}

          {/* Bed */}
          {fix.type.includes('bed') && (
            <g stroke="#7f5539" strokeWidth={1}>
              <rect x={2} y={2} width={w - 4} height={8} rx={2} fill="#8d7b68" />
              <rect x={4} y={12} width={w / 2 - 8} height={12} rx={2} fill="#ffffff" stroke="#c0a080" />
              <rect x={w / 2 + 4} y={12} width={w / 2 - 8} height={12} rx={2} fill="#ffffff" stroke="#c0a080" />
            </g>
          )}

          {/* Table / Conference Table */}
          {(fix.type === 'dining_table' || fix.type === 'conference_table' || fix.type === 'restaurant_table') && (
            <g stroke="#7f5539" strokeWidth={1}>
              <rect x={3} y={3} width={w - 6} height={h - 6} rx={4} fill="#b08968" />
              {/* Chair dots around table */}
              <circle cx={w / 2} cy={-2} r={3} fill="#7f5539" />
              <circle cx={w / 2} cy={h + 2} r={3} fill="#7f5539" />
            </g>
          )}

          {/* Desks & Workstations */}
          {(fix.type === 'desk' || fix.type === 'executive_desk' || fix.type === 'doctor_desk' || fix.type === 'workbench') && (
            <g stroke="#7f5539" strokeWidth={1}>
              <rect x={2} y={2} width={w - 4} height={h - 4} rx={2} fill="#b08968" />
              <rect x={w / 3} y={4} width={w / 3} height={6} rx={1} fill="#ffffff" stroke="#c0a080" />
            </g>
          )}

          {/* Workstation Pods */}
          {fix.type === 'workstation_cluster' && (
            <g stroke="#7f5539" strokeWidth={1}>
              <line x1={w / 2} y1={2} x2={w / 2} y2={h - 2} stroke="#7f5539" strokeWidth={2} />
              <line x1={2} y1={h / 2} x2={w - 2} y2={h / 2} stroke="#7f5539" strokeWidth={2} />
              <rect x={4} y={4} width={w / 2 - 8} height={h / 2 - 8} rx={2} fill="#b08968" />
              <rect x={w / 2 + 4} y={4} width={w / 2 - 8} height={h / 2 - 8} rx={2} fill="#b08968" />
              <rect x={4} y={h / 2 + 4} width={w / 2 - 8} height={h / 2 - 8} rx={2} fill="#b08968" />
              <rect x={w / 2 + 4} y={h / 2 + 4} width={w / 2 - 8} height={h / 2 - 8} rx={2} fill="#b08968" />
            </g>
          )}

          {/* Circular Shapes & Round Banquet Tables */}
          {(fix.geometry === 'circle' || fix.type === 'round_banquet_table' || fix.type === 'camera_rig') && (
            <g stroke="#7f5539" strokeWidth={1.5}>
              <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) / 2 - 2} fill={isSelected ? '#c99a6e' : '#ebd9c3'} />
              {/* Banquet Chairs */}
              {Array.from({ length: 8 }).map((_, idx) => {
                const angle = (idx * 2 * Math.PI) / 8;
                const r = Math.min(w, h) / 2 + 3;
                return (
                  <circle
                    key={idx}
                    cx={w / 2 + r * Math.cos(angle)}
                    cy={h / 2 + r * Math.sin(angle)}
                    r={3}
                    fill="#7f5539"
                  />
                );
              })}
            </g>
          )}

          {/* L-Shaped Geometries */}
          {fix.geometry === 'l_shape' && (
            <polygon
              points={`0,0 ${w},0 ${w},${h * 0.4} ${w * 0.4},${h * 0.4} ${w * 0.4},${h} 0,${h}`}
              fill={isSelected ? '#c99a6e' : '#d5bdaf'}
              stroke="#7f5539"
              strokeWidth={1.5}
            />
          )}

          {/* U-Shaped Geometries */}
          {fix.geometry === 'u_shape' && (
            <polygon
              points={`0,0 ${w * 0.3},0 ${w * 0.3},${h * 0.6} ${w * 0.7},${h * 0.6} ${w * 0.7},0 ${w},0 ${w},${h} 0,${h}`}
              fill={isSelected ? '#c99a6e' : '#d5bdaf'}
              stroke="#7f5539"
              strokeWidth={1.5}
            />
          )}

          {/* V-Shaped Geometries (Keynote Stages) */}
          {fix.geometry === 'v_shape' && (
            <polygon
              points={`0,0 ${w / 2},${h * 0.3} ${w},0 ${w},${h * 0.4} ${w / 2},${h} 0,${h * 0.4}`}
              fill={isSelected ? '#c99a6e' : '#d5bdaf'}
              stroke="#7f5539"
              strokeWidth={1.5}
            />
          )}

          {/* T-Shaped Geometries */}
          {fix.geometry === 't_shape' && (
            <polygon
              points={`0,0 ${w},0 ${w},${h * 0.35} ${w * 0.65},${h * 0.35} ${w * 0.65},${h} ${w * 0.35},${h} ${w * 0.35},${h * 0.35} 0,${h * 0.35}`}
              fill={isSelected ? '#c99a6e' : '#d5bdaf'}
              stroke="#7f5539"
              strokeWidth={1.5}
            />
          )}

          {/* Exhibition Booths (Standard & Gold Sponsor) */}
          {(fix.type === 'booth_standard' || fix.type === 'booth_sponsor') && (
            <g stroke="#7f5539" strokeWidth={1.5}>
              <rect x={2} y={2} width={w - 4} height={h - 4} fill={fix.type === 'booth_sponsor' ? '#fef3c7' : '#f5ebe0'} strokeDasharray="4 2" />
              <line x1={2} y1={2} x2={w - 2} y2={2} stroke="#c99a6e" strokeWidth={3} />
              <line x1={2} y1={2} x2={2} y2={h - 2} stroke="#c99a6e" strokeWidth={3} />
              <line x1={w - 2} y1={2} x2={w - 2} y2={h - 2} stroke="#c99a6e" strokeWidth={3} />
            </g>
          )}

          {/* Main Keynote Stage */}
          {fix.type === 'keynote_stage' && (
            <g stroke="#7f5539" strokeWidth={2}>
              <rect x={2} y={2} width={w - 4} height={h - 4} rx={4} fill="#292524" />
              <polygon points={`${w / 2 - 12},${h - 4} ${w / 2 + 12},${h - 4} ${w / 2},${h - 12}`} fill="#c99a6e" />
              <line x1={6} y1={h - 4} x2={w - 6} y2={h - 4} stroke="#c99a6e" strokeWidth={2} />
            </g>
          )}

          {/* Label */}
          <text
            x={w / 2}
            y={h / 2 + 3}
            textAnchor="middle"
            fill="#3d2c1d"
            fontSize="10"
            fontWeight="600"
            fontFamily="sans-serif"
            className="pointer-events-none"
          >
            {fix.name}
          </text>

          {/* Active Floating Controls & Resize Handles for Fixtures */}
          {isSelected && (
            <g>
              {/* Outer Bounding Box */}
              <rect
                x={-3}
                y={-3}
                width={w + 6}
                height={h + 6}
                fill="none"
                stroke="#a67c52"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />

              {/* Bottom-Right Corner Resize Handle */}
              <circle
                cx={w}
                cy={h}
                r={6}
                fill="#c99a6e"
                stroke="#ffffff"
                strokeWidth={2}
                className="cursor-nwse-resize hover:scale-125 transition-transform pointer-events-auto"
                onMouseDown={(e) => handleMouseDownFixtureResize(e, fix)}
              />

              {/* Floating Quick Action Pill (Rotate / Clone / Delete) */}
              <g
                transform={`translate(${w / 2}, ${-24})`}
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto"
              >
                <rect x={-55} y={-10} width={110} height={20} rx={5} fill="#261e1b" stroke="#3d302a" />
                <text
                  x={-36}
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
                  x={2}
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
                  x={38}
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

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDownBackground}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="flex-1 h-full w-full relative overflow-hidden cursor-crosshair bg-[#fcfbf9] select-none"
    >
      <svg
        className="w-full h-full absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <pattern
            id="gridMinorLight"
            width={SCALE * 0.25}
            height={SCALE * 0.25}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${SCALE * 0.25} 0 L 0 0 0 ${SCALE * 0.25}`}
              fill="none"
              stroke="#f5f0eb"
              strokeWidth="0.75"
            />
          </pattern>

          <pattern
            id="gridMajorLight"
            width={SCALE}
            height={SCALE}
            patternUnits="userSpaceOnUse"
          >
            <rect width={SCALE} height={SCALE} fill="url(#gridMinorLight)" />
            <path d={`M ${SCALE} 0 L 0 0 0 ${SCALE}`} fill="none" stroke="#e8dfd8" strokeWidth="1" />
          </pattern>

          <pattern id="woodPlankPattern" width="40" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="20" x2="40" y2="20" stroke="#d5bdaf" strokeWidth="0.5" opacity="0.35" />
            <line x1="20" y1="0" x2="20" y2="20" stroke="#d5bdaf" strokeWidth="0.5" opacity="0.35" />
          </pattern>
        </defs>

        {/* 1. Background Grid */}
        {showGrid && (
          <rect
            x={-5000}
            y={-5000}
            width={10000}
            height={10000}
            fill="url(#gridMajorLight)"
            className="pointer-events-none"
          />
        )}

        {/* 2. Land Boundary */}
        <g className="pointer-events-none">
          <rect
            x={0}
            y={0}
            width={plot.width * SCALE}
            height={plot.height * SCALE}
            fill="#a67c5205"
            stroke="#a67c52"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          {showDimensions && (
            <g fill="#a67c52" fontSize="11" fontFamily="monospace" fontWeight="600">
              <text x={(plot.width * SCALE) / 2} y={-10} textAnchor="middle">
                LAND WIDTH: {formatDimension(plot.width, plot.unit)}
              </text>
              <text
                x={-15}
                y={(plot.height * SCALE) / 2}
                textAnchor="middle"
                transform={`rotate(-90, -15, ${(plot.height * SCALE) / 2})`}
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

          return (
            <g
              key={room.id}
              transform={`translate(${x}, ${y})`}
              onMouseDown={(e) => handleMouseDownRoom(e, room)}
              className="cursor-move"
            >
              {/* Room Sandy Brown Floor */}
              <rect
                x={0}
                y={0}
                width={w}
                height={h}
                fill={room.color || '#eddcc9'}
                stroke="#1e293b"
                strokeWidth={wallThick}
                strokeLinejoin="round"
                className="transition-colors duration-150"
              />

              <rect
                x={wallThick / 2}
                y={wallThick / 2}
                width={w - wallThick}
                height={h - wallThick}
                fill="url(#woodPlankPattern)"
                className="pointer-events-none opacity-40"
              />

              {/* Selection Halo */}
              {isSelected && (
                <rect
                  x={-8}
                  y={-8}
                  width={w + 16}
                  height={h + 16}
                  fill="none"
                  stroke="#a67c52"
                  strokeWidth={2}
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
                  rx={6}
                  fill="#261e1b"
                  opacity={0.88}
                />
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="600"
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
                <g fill="#261e1b" fontSize="11" fontFamily="sans-serif" fontWeight="600">
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
                  className="pointer-events-auto cursor-pointer"
                >
                  <rect x={-60} y={-11} width={120} height={22} rx={6} fill="#261e1b" stroke="#3d302a" />
                  <text
                    x={-38}
                    y={4}
                    textAnchor="middle"
                    fill="#e6ccb2"
                    fontSize="9"
                    fontWeight="bold"
                    className="hover:fill-amber-300"
                    onClick={() => rotateRoom(room.id)}
                  >
                    ROTATE
                  </text>
                  <text
                    x={2}
                    y={4}
                    textAnchor="middle"
                    fill="#e6ccb2"
                    fontSize="9"
                    fontWeight="bold"
                    className="hover:fill-amber-300"
                    onClick={() => cloneRoom(room.id)}
                  >
                    CLONE
                  </text>
                  <text
                    x={40}
                    y={4}
                    textAnchor="middle"
                    fill="#f87171"
                    fontSize="9"
                    fontWeight="bold"
                    className="hover:fill-rose-400"
                    onClick={() => deleteRoom(room.id)}
                  >
                    DELETE
                  </text>
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
        >
          +
        </button>
      </div>

      {/* Minimap (Bottom Right) */}
      <div className="absolute bottom-4 right-4 w-36 h-28 bg-[#fcfbf9]/95 backdrop-blur rounded-xl border-2 border-[#d5bdaf] shadow-xl overflow-hidden pointer-events-none p-1.5 flex items-center justify-center">
        <svg viewBox="0 0 16 14" className="w-full h-full">
          <rect x="0" y="0" width="16" height="14" fill="#f5ebe0" stroke="#d5bdaf" strokeWidth="0.5" />
          {rooms.map((r) => (
            <rect
              key={r.id}
              x={r.x}
              y={r.y}
              width={r.width}
              height={r.height}
              fill="#c99a6e"
              stroke="#261e1b"
              strokeWidth="0.4"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

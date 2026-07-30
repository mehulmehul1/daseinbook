import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGridStore } from './useGridStore';
import { Page, PageItem, GridArea } from './types';
import { Trash2, GripHorizontal, Move, Maximize2, Type, Image as ImageIcon, Box } from 'lucide-react';

// Spin a 3D shape inside the grid cell using an isolated canvas
function SpinnerModel({ src }: { src: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.6;
      meshRef.current.rotation.x += delta * 0.3;
    }
  });

  const geometry = useRef<THREE.BufferGeometry | null>(null);
  if (!geometry.current) {
    switch (src) {
      case 'torus':
        geometry.current = new THREE.TorusGeometry(1.2, 0.4, 16, 64);
        break;
      case 'knot':
        geometry.current = new THREE.TorusKnotGeometry(0.9, 0.3, 64, 8);
        break;
      case 'sphere':
        geometry.current = new THREE.SphereGeometry(1.2, 32, 32);
        break;
      case 'box':
      default:
        geometry.current = new THREE.BoxGeometry(1.6, 1.6, 1.6);
        break;
    }
  }

  // Pure Swiss aesthetic materials (matte ceramic or high metallics)
  const material = useRef<THREE.MeshStandardMaterial | null>(null);
  if (!material.current) {
    if (src === 'torus') {
      material.current = new THREE.MeshStandardMaterial({
        color: 0xdfb46c, // Gold
        roughness: 0.15,
        metalness: 0.9,
      });
    } else if (src === 'sphere') {
      material.current = new THREE.MeshStandardMaterial({
        color: 0xe63946, // Swiss Red Lucite
        roughness: 0.1,
        metalness: 0.15,
      });
    } else {
      material.current = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a, // Matte Black Ceramic
        roughness: 0.4,
        metalness: 0.1,
      });
    }
  }

  return (
    <mesh ref={meshRef} geometry={geometry.current} material={material.current} />
  );
}

export function MiniModelCanvas({ src }: { src: string }) {
  return (
    <div className="w-full h-full relative cursor-pointer flex items-center justify-center bg-transparent">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[2, 3, 2]} intensity={2.0} />
        <pointLight position={[-2, -1, -2]} intensity={0.5} />
        <SpinnerModel src={src} />
      </Canvas>
    </div>
  );
}

// Dynamic style and class resolution for typography
export const getTypographyClasses = (item: PageItem) => {
  const fontFamilyClass = item.fontFamily === 'sans' ? 'font-sans' 
                        : item.fontFamily === 'serif' ? 'font-serif'
                        : item.fontFamily === 'mono' ? 'font-mono'
                        : ((item.fontSize || 0) > 0.04 ? 'font-sans' : 'font-serif');

  const fontWeightClass = item.fontWeight === 'light' ? 'font-light'
                        : item.fontWeight === 'normal' ? 'font-normal'
                        : item.fontWeight === 'semibold' ? 'font-semibold'
                        : item.fontWeight === 'bold' ? 'font-bold'
                        : item.fontWeight === 'extrabold' ? 'font-extrabold'
                        : ((item.fontSize || 0) > 0.04 ? 'font-extrabold' : 'font-medium');

  const alignmentClass = item.alignment === 'left' ? 'text-left'
                       : item.alignment === 'center' ? 'text-center'
                       : item.alignment === 'right' ? 'text-right'
                       : item.alignment === 'justify' ? 'text-justify'
                       : 'text-left';

  const trackingClass = item.letterSpacing === 'tighter' ? 'tracking-tighter'
                      : item.letterSpacing === 'tight' ? 'tracking-tight'
                      : item.letterSpacing === 'normal' ? 'tracking-normal'
                      : item.letterSpacing === 'wide' ? 'tracking-wide'
                      : item.letterSpacing === 'widest' ? 'tracking-widest'
                      : ((item.fontSize || 0) > 0.04 ? 'tracking-tighter' : 'tracking-normal');

  const transformClass = item.uppercase ? 'uppercase' : 'normal-case';

  // Flexbox alignments inside the item container box
  const flexAlignClass = item.alignment === 'center' ? 'items-center justify-center text-center'
                       : item.alignment === 'right' ? 'items-end justify-end text-right'
                       : item.alignment === 'justify' ? 'items-stretch justify-start text-justify'
                       : 'items-start justify-start text-left';

  return {
    fontFamilyClass,
    fontWeightClass,
    alignmentClass,
    trackingClass,
    transformClass,
    flexAlignClass,
  };
};

interface PageCanvas2DProps {
  pageIndex: number;
  page: Page;
  showGridLines: boolean;
}

export default function PageCanvas2D({ pageIndex, page, showGridLines }: PageCanvas2DProps) {
  const isEditMode = useGridStore((state) => state.isEditMode);
  const selectedItemId = useGridStore((state) => state.selectedItemId);
  const setSelectedItemId = useGridStore((state) => state.setSelectedItemId);
  const deleteItem = useGridStore((state) => state.deleteItem);
  const updateItemGridArea = useGridStore((state) => state.updateItemGridArea);
  const setActivePageIndex = useGridStore((state) => state.setActivePageIndex);

  // Local state for inline text editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Local state for marquee cell selection (for drag-to-create layouts)
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState<{ row: number; col: number } | null>(null);
  const [selectCurrent, setSelectCurrent] = useState<{ row: number; col: number } | null>(null);
  const [showCreateMenu, setShowCreateMenu] = useState<{ x: number; y: number; area: GridArea } | null>(null);

  // Local state for dragging existing item
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrentCoords, setDragCurrentCoords] = useState<{ left: number; top: number } | null>(null);

  // Local state for resizing existing item
  const [resizingItem, setResizingItem] = useState<{
    id: string;
    handle: 'tl' | 'tr' | 'bl' | 'br';
    initialGrid: GridArea;
    initialMouse: { x: number; y: number };
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Parse page grid parameters
  const { columns, rows, margins, columnGutter, rowGutter } = page.gridSettings;

  // Calculate active layout bounds (as percentage of page width/height)
  const activeWidthPercent = 100 - (margins.left + margins.right) * 100;
  const activeHeightPercent = 100 - (margins.top + margins.bottom) * 100;

  // Single Cell percentages
  const cellWidthPercent = (activeWidthPercent - (columns - 1) * columnGutter * 100) / columns;
  const cellHeightPercent = (activeHeightPercent - (rows - 1) * rowGutter * 100) / rows;

  // Get item's 2D percentage bounds
  const getItemRect = (gridArea: GridArea) => {
    const colS = Math.min(Math.max(1, gridArea.colStart), columns);
    const colE = Math.min(Math.max(colS, gridArea.colEnd), columns);
    const rowS = Math.min(Math.max(1, gridArea.rowStart), rows);
    const rowE = Math.min(Math.max(rowS, gridArea.rowEnd), rows);

    const spanCols = colE - colS + 1;
    const spanRows = rowE - rowS + 1;

    const left = margins.left * 100 + (colS - 1) * (cellWidthPercent + columnGutter * 100);
    const top = margins.top * 100 + (rowS - 1) * (cellHeightPercent + rowGutter * 100);
    const width = spanCols * cellWidthPercent + (spanCols - 1) * columnGutter * 100;
    const height = spanRows * cellHeightPercent + (spanRows - 1) * rowGutter * 100;

    return { left, top, width, height };
  };

  // Convert client coordinates to page cell coordinates
  const getCellFromEvent = (clientX: number, clientY: number) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Convert pixels to percentages of the sheet
    const xp = (x / rect.width) * 100;
    const yp = (y / rect.height) * 100;

    // Adjust for margins
    const marginL = margins.left * 100;
    const marginT = margins.top * 100;

    // Row / Col width in percentage with gutters
    const cellWAndGutter = cellWidthPercent + columnGutter * 100;
    const cellHAndGutter = cellHeightPercent + rowGutter * 100;

    const col = Math.floor((xp - marginL) / cellWAndGutter) + 1;
    const row = Math.floor((yp - marginT) / cellHAndGutter) + 1;

    return {
      col: Math.min(Math.max(1, col), columns),
      row: Math.min(Math.max(1, row), rows),
    };
  };

  // 1. Grid-Cell Selection (Drag-to-create marquee)
  const handleGridMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    // Don't trigger if clicked directly on an existing selected item or a textarea
    if ((e.target as HTMLElement).closest('.grid-item-container') || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

    e.preventDefault(); // Prevent standard browser text selection highlight
    setActivePageIndex(pageIndex); // Sync active page index to the current page clicked!
    setSelectedItemId(null);
    setShowCreateMenu(null);

    const cell = getCellFromEvent(e.clientX, e.clientY);
    if (cell) {
      setIsSelecting(true);
      setSelectStart(cell);
      setSelectCurrent(cell);
    }
  };

  const handleGridMouseMove = (e: React.MouseEvent) => {
    if (isSelecting && selectStart) {
      const cell = getCellFromEvent(e.clientX, e.clientY);
      if (cell) {
        setSelectCurrent(cell);
      }
    }
  };

  const handleGridMouseUp = (e: React.MouseEvent) => {
    if (isSelecting && selectStart && selectCurrent) {
      setIsSelecting(false);

      // Compute final bounding area
      const colStart = Math.min(selectStart.col, selectCurrent.col);
      const colEnd = Math.max(selectStart.col, selectCurrent.col);
      const rowStart = Math.min(selectStart.row, selectCurrent.row);
      const rowEnd = Math.max(selectStart.row, selectCurrent.row);

      // Calculate pixel coordinates for the floating menu
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const menuX = e.clientX - rect.left;
        const menuY = e.clientY - rect.top;

        setShowCreateMenu({
          x: menuX,
          y: menuY,
          area: { colStart, colEnd, rowStart, rowEnd },
        });
      }
    }
  };

  // Instantiates a new item in the designated dragged-out cell range
  const handleCreateItemInArea = (type: 'text' | 'image' | 'model', srcType?: string) => {
    if (!showCreateMenu) return;
    const { area } = showCreateMenu;

    const addItem = useGridStore.getState().addItemToPage;
    const baseItem = {
      type,
      src: srcType || '',
      gridArea: area,
    };

    if (type === 'text') {
      addItem(pageIndex, {
        ...baseItem,
        content: srcType === 'headline' ? 'NEW SWISS TYPE' : 'A beautifully aligned paragraph conforming strictly to modular grids.',
        fontSize: srcType === 'headline' ? 0.055 : 0.026,
        color: '#1a1a1a',
      });
    } else if (type === 'image') {
      addItem(pageIndex, {
        ...baseItem,
        src: 'https://images.unsplash.com/photo-1541824894926-3c58ec3ce706?auto=format&fit=crop&w=800&q=80',
      });
    } else {
      addItem(pageIndex, {
        ...baseItem,
        src: srcType || 'torus',
      });
    }

    setShowCreateMenu(null);
    setSelectStart(null);
    setSelectCurrent(null);
  };

  // 2. Drag & Drop from Asset Drawer
  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault();

    const cell = getCellFromEvent(e.clientX, e.clientY);
    if (!cell) return;

    try {
      const dragDataStr = e.dataTransfer.getData('application/json');
      if (!dragDataStr) return;
      const asset = JSON.parse(dragDataStr);

      const colStart = cell.col;
      const colEnd = Math.min(cell.col + 1, columns);
      const rowStart = cell.row;
      const rowEnd = Math.min(cell.row + 1, rows);

      const addItem = useGridStore.getState().addItemToPage;
      const baseItem = {
        type: asset.type,
        src: asset.src,
        gridArea: { colStart, colEnd, rowStart, rowEnd },
      };

      if (asset.type === 'text') {
        addItem(pageIndex, {
          ...baseItem,
          content: asset.src === 'headline'
            ? 'SWISS DESIGN SYSTEM'
            : 'Müller-Brockmann developed grids to organize structural balance mathematically.',
          fontSize: asset.src === 'headline' ? 0.055 : 0.026,
          color: '#1a1a1a',
        });
      } else {
        addItem(pageIndex, baseItem);
      }
    } catch (err) {
      console.warn('Drop parsing failed', err);
    }
  };

  // 3. Resizing Items
  const handleResizeMouseDown = (e: React.MouseEvent, itemId: string, handle: 'tl' | 'tr' | 'bl' | 'br') => {
    e.stopPropagation();
    e.preventDefault();

    const item = page.items.find(it => it.id === itemId);
    if (!item) return;

    setResizingItem({
      id: itemId,
      handle,
      initialGrid: { ...item.gridArea },
      initialMouse: { x: e.clientX, y: e.clientY },
    });
  };

  // 4. Drag-Moving Items
  const handleItemMouseDown = (e: React.MouseEvent, itemId: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setActivePageIndex(pageIndex); // Sync active page index to the current page clicked!
    setSelectedItemId(itemId);

    if (editingTextId === itemId) return; // Allow typing

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Get item coordinates
      const item = page.items.find(it => it.id === itemId);
      if (!item) return;
      const rectPerc = getItemRect(item.gridArea);

      // Save initial cursor offsets inside item bounds (as percentages)
      const cursorPercentX = (x / rect.width) * 100;
      const cursorPercentY = (y / rect.height) * 100;

      setDraggingItemId(itemId);
      setDragOffset({
        x: cursorPercentX - rectPerc.left,
        y: cursorPercentY - rectPerc.top,
      });
      setDragCurrentCoords({
        left: rectPerc.left,
        top: rectPerc.top,
      });
    }
  };

  // Combined listener for active Drag-moving & Resizing operations on window
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // HANDLE RESIZING
      if (resizingItem && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const deltaX = e.clientX - resizingItem.initialMouse.x;
        const deltaY = e.clientY - resizingItem.initialMouse.y;

        // Convert deltas to column and row counts
        const cellWidthPx = (rect.width * cellWidthPercent) / 100;
        const cellHeightPx = (rect.height * cellHeightPercent) / 100;
        const colGutterPx = (rect.width * columnGutter);
        const rowGutterPx = (rect.height * rowGutter);

        const colDelta = Math.round(deltaX / (cellWidthPx + colGutterPx));
        const rowDelta = Math.round(deltaY / (cellHeightPx + rowGutterPx));

        const init = resizingItem.initialGrid;
        let newGrid = { ...init };

        if (resizingItem.handle === 'br') {
          newGrid.colEnd = Math.min(Math.max(init.colStart, init.colEnd + colDelta), columns);
          newGrid.rowEnd = Math.min(Math.max(init.rowStart, init.rowEnd + rowDelta), rows);
        } else if (resizingItem.handle === 'tl') {
          newGrid.colStart = Math.max(1, Math.min(init.colEnd, init.colStart + colDelta));
          newGrid.rowStart = Math.max(1, Math.min(init.rowEnd, init.rowStart + rowDelta));
        } else if (resizingItem.handle === 'tr') {
          newGrid.colEnd = Math.min(Math.max(init.colStart, init.colEnd + colDelta), columns);
          newGrid.rowStart = Math.max(1, Math.min(init.rowEnd, init.rowStart + rowDelta));
        } else if (resizingItem.handle === 'bl') {
          newGrid.colStart = Math.max(1, Math.min(init.colEnd, init.colStart + colDelta));
          newGrid.rowEnd = Math.min(Math.max(init.rowStart, init.rowEnd + rowDelta), rows);
        }

        updateItemGridArea(pageIndex, resizingItem.id, newGrid);
      }

      // HANDLE MOVING
      if (draggingItemId && dragOffset && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Mouse positions in percentage
        const mouseXPercent = (mouseX / rect.width) * 100;
        const mouseYPercent = (mouseY / rect.height) * 100;

        const nextLeft = mouseXPercent - dragOffset.x;
        const nextTop = mouseYPercent - dragOffset.y;

        setDragCurrentCoords({ left: nextLeft, top: nextTop });

        // Calculate dynamic snapped cell start
        const marginL = margins.left * 100;
        const marginT = margins.top * 100;
        const cellWAndGutter = cellWidthPercent + columnGutter * 100;
        const cellHAndGutter = cellHeightPercent + rowGutter * 100;

        const snappedColStart = Math.round((nextLeft - marginL) / cellWAndGutter) + 1;
        const snappedRowStart = Math.round((nextTop - marginT) / cellHAndGutter) + 1;

        const item = page.items.find(it => it.id === draggingItemId);
        if (item) {
          const colSpan = item.gridArea.colEnd - item.gridArea.colStart;
          const rowSpan = item.gridArea.rowEnd - item.gridArea.rowStart;

          const colS = Math.min(Math.max(1, snappedColStart), columns - colSpan);
          const rowS = Math.min(Math.max(1, snappedRowStart), rows - rowSpan);

          const newArea: GridArea = {
            colStart: colS,
            colEnd: colS + colSpan,
            rowStart: rowS,
            rowEnd: rowS + rowSpan,
          };

          // Update real-time snapped coordinates inside the state
          if (
            newArea.colStart !== item.gridArea.colStart ||
            newArea.rowStart !== item.gridArea.rowStart
          ) {
            updateItemGridArea(pageIndex, draggingItemId, newArea);
          }
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (resizingItem) setResizingItem(null);
      if (draggingItemId) {
        setDraggingItemId(null);
        setDragOffset(null);
        setDragCurrentCoords(null);
      }
    };

    if (resizingItem || draggingItemId) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [resizingItem, draggingItemId, dragOffset]);

  // Handle outside clicks to cancel popup and selection marquee
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.create-menu-popup') && !(e.target as HTMLElement).closest('.grid-sheet-canvas')) {
        setShowCreateMenu(null);
        setSelectStart(null);
        setSelectCurrent(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDown={handleGridMouseDown}
      onMouseMove={handleGridMouseMove}
      onMouseUp={handleGridMouseUp}
      className="grid-sheet-canvas relative w-full h-full bg-[#fbfaf8] text-black shadow-xl overflow-hidden select-none"
      style={{
        border: '1px solid #dfdedb',
        aspectRatio: '1.4 / 2.0',
      }}
    >
      {/* 1. Page Margin Boundary Frame Outline */}
      {isEditMode && (
        <div
          className="absolute border border-dashed border-red-200/50 pointer-events-none"
          style={{
            left: `${margins.left * 100}%`,
            right: `${margins.right * 100}%`,
            top: `${margins.top * 100}%`,
            bottom: `${margins.bottom * 100}%`,
          }}
        />
      )}

      {/* 2. Modular Grid Lines Overlay */}
      {isEditMode && showGridLines && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            paddingLeft: `${margins.left * 100}%`,
            paddingRight: `${margins.right * 100}%`,
            paddingTop: `${margins.top * 100}%`,
            paddingBottom: `${margins.bottom * 100}%`,
          }}
        >
          <div
            className="w-full h-full grid"
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              columnGap: `${columnGutter * 100}%`,
              rowGap: `${rowGutter * 100}%`,
            }}
          >
            {Array.from({ length: columns * rows }).map((_, idx) => (
              <div
                key={idx}
                className="w-full h-full border border-[#e8e6e0]/60 bg-[#eae7df]/10 flex items-center justify-center"
              >
                {/* Micro numerical coordinates indicating the cell */}
                <span className="text-[7px] font-mono font-bold text-[#aaaaaa]/40 select-none">
                  {Math.floor(idx / columns) + 1}:{idx % columns + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Real-time selection marquee visualization */}
      {isSelecting && selectStart && selectCurrent && (
        (() => {
          const colS = Math.min(selectStart.col, selectCurrent.col);
          const colE = Math.max(selectStart.col, selectCurrent.col);
          const rowS = Math.min(selectStart.row, selectCurrent.row);
          const rowE = Math.max(selectStart.row, selectCurrent.row);

          const rect = getItemRect({ colStart: colS, colEnd: colE, rowStart: rowS, rowEnd: rowE });
          return (
            <div
              className="absolute bg-[#ff4d4d]/10 border-2 border-dashed border-[#ff4d4d]/70 z-40 pointer-events-none flex items-center justify-center"
              style={{
                left: `${rect.left}%`,
                top: `${rect.top}%`,
                width: `${rect.width}%`,
                height: `${rect.height}%`,
              }}
            >
              <span className="text-[10px] font-bold font-mono text-[#ff4d4d] px-2 py-0.5 bg-white/90 border border-[#ff4d4d]/30 shadow-sm rounded">
                COL {colS}-{colE} × ROW {rowS}-{rowE}
              </span>
            </div>
          );
        })()
      )}

      {/* 4. Active Page Content Items */}
      {page.items.filter(item => !item.spanSpread).map((item) => {
        const isSelected = selectedItemId === item.id;
        const isDragging = draggingItemId === item.id;
        const rect = getItemRect(item.gridArea);

        // Customize layout bounds in percentage
        let itemLeft = rect.left;
        let itemTop = rect.top;

        // If dragging, we can show a live slide position or stick to grid area
        if (isDragging && dragCurrentCoords) {
          // Slide smoothly visually, but grid position is updated in background
          itemLeft = dragCurrentCoords.left;
          itemTop = dragCurrentCoords.top;
        }

        return (
          <div
            key={item.id}
            onMouseDown={(e) => handleItemMouseDown(e, item.id)}
            className={`grid-item-container absolute flex flex-col group z-10 ${
              isEditMode ? 'cursor-grab active:cursor-grabbing' : ''
            } ${isSelected ? 'z-30' : ''}`}
            style={{
              left: `${itemLeft}%`,
              top: `${itemTop}%`,
              width: `${rect.width}%`,
              height: `${rect.height}%`,
              transition: isDragging ? 'none' : 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Inner Content Render Box */}
            <div
              className={`w-full h-full relative overflow-hidden flex flex-col justify-center select-none ${
                isEditMode ? 'hover:bg-black/[0.02]' : ''
              }`}
            >
              {/* IMAGE TYPE */}
              {item.type === 'image' && (
                <div className="w-full h-full flex items-center justify-center overflow-hidden bg-[#faf8f5]">
                  <img
                    src={item.src}
                    alt="Swiss photography asset"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover select-none pointer-events-none filter grayscale contrast-[1.1] transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}

              {/* MODEL TYPE (Embedded mini canvas) */}
              {item.type === 'model' && (
                <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-transparent">
                  <MiniModelCanvas src={item.src} />
                </div>
              )}

              {/* TEXT TYPE */}
              {item.type === 'text' && (() => {
                const {
                  fontFamilyClass,
                  fontWeightClass,
                  alignmentClass,
                  trackingClass,
                  transformClass,
                  flexAlignClass
                } = getTypographyClasses(item);

                return (
                  <div
                    className={`w-full p-2.5 overflow-hidden flex flex-col h-full ${flexAlignClass} ${alignmentClass}`}
                    onDoubleClick={() => {
                      if (isEditMode) setEditingTextId(item.id);
                    }}
                  >
                    {editingTextId === item.id ? (
                      <textarea
                        value={item.content || ''}
                        autoFocus
                        onBlur={() => setEditingTextId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
                            setEditingTextId(null);
                          }
                        }}
                        onChange={(e) => {
                          useGridStore.setState((state) => {
                            const updatedPages = state.pages.map((p, idx) => {
                              if (idx !== pageIndex) return p;
                              const updatedItems = p.items.map((it) => {
                                if (it.id !== item.id) return it;
                                return { ...it, content: e.target.value };
                              });
                              return { ...p, items: updatedItems };
                            });
                            return { pages: updatedPages };
                          });
                        }}
                        style={{
                          fontSize: `${(item.fontSize || 0.028) * 450}px`,
                          color: item.color || '#1a1a1a',
                          lineHeight: item.lineHeight || 1.45,
                          textAlign: item.alignment || 'left',
                        }}
                        className={`w-full h-full resize-none bg-transparent border-none outline-none p-0 m-0 focus:ring-0 focus:outline-none ${fontFamilyClass} ${fontWeightClass} ${trackingClass} ${transformClass}`}
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: `${(item.fontSize || 0.028) * 450}px`,
                          color: item.color || '#1a1a1a',
                          lineHeight: item.lineHeight || 1.45,
                          whiteSpace: 'pre-line',
                        }}
                        className={`${fontFamilyClass} ${fontWeightClass} ${trackingClass} ${transformClass} leading-relaxed cursor-pointer`}
                        title={isEditMode ? "Double click to edit text inline" : undefined}
                      >
                        {item.content}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* SELECTION BOUNDS & RESIZE WIDGETS (Only in Edit Mode) */}
            {isEditMode && isSelected && (
              <>
                {/* 1px Solid Red Boundary line */}
                <div className="absolute inset-0 border-2 border-[#ff4d4d] pointer-events-none z-20" />

                {/* Selection Label Badge */}
                <div className="absolute -top-6 left-0 bg-[#ff4d4d] text-white text-[9px] font-bold tracking-widest px-2 py-0.5 rounded uppercase z-40 select-none shadow-sm flex items-center gap-1.5 pointer-events-none">
                  {item.type === 'text' && <Type size={9} />}
                  {item.type === 'image' && <ImageIcon size={9} />}
                  {item.type === 'model' && <Box size={9} />}
                  {item.type} (C:{item.gridArea.colStart}-{item.gridArea.colEnd} R:{item.gridArea.rowStart}-{item.gridArea.rowEnd})
                </div>

                {/* Trash Icon Button overlay on selected item */}
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    deleteItem(pageIndex, item.id);
                  }}
                  className="absolute -top-6 right-0 bg-[#1a1a1a] hover:bg-black text-white p-1 rounded shadow-sm z-40 transition"
                  title="Delete Item"
                >
                  <Trash2 size={10} />
                </button>

                {/* Resizing Corner Knobs */}
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, item.id, 'tl')}
                  className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-white border-2 border-[#ff4d4d] cursor-nwse-resize z-40 hover:bg-[#ff4d4d] transition rounded-full"
                />
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, item.id, 'tr')}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white border-2 border-[#ff4d4d] cursor-nesw-resize z-40 hover:bg-[#ff4d4d] transition rounded-full"
                />
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, item.id, 'bl')}
                  className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-white border-2 border-[#ff4d4d] cursor-nesw-resize z-40 hover:bg-[#ff4d4d] transition rounded-full"
                />
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, item.id, 'br')}
                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white border-2 border-[#ff4d4d] cursor-nwse-resize z-40 hover:bg-[#ff4d4d] transition rounded-full shadow"
                />
              </>
            )}
          </div>
        );
      })}

      {/* 5. Floating Insertion Context Menu Popup (Only visible after a cell click-and-drag range) */}
      {showCreateMenu && (
        <div
          className="create-menu-popup absolute bg-white/95 backdrop-blur-md shadow-2xl border border-[#dfdedb] p-3 rounded-lg flex flex-col gap-1.5 z-50 text-xs w-48 font-sans animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${Math.max(8, Math.min(showCreateMenu.x, (containerRef.current?.clientWidth || 400) - 200))}px`,
            top: `${Math.max(8, Math.min(showCreateMenu.y, (containerRef.current?.clientHeight || 600) - 260))}px`,
          }}
        >
          <div className="text-[10px] text-[#777777] font-bold uppercase tracking-wider border-b border-[#dfdedb] pb-1.5 mb-1 select-none">
            Insert Alignment Asset
          </div>
          <button
            onClick={() => handleCreateItemInArea('text', 'headline')}
            className="flex items-center gap-2 hover:bg-[#f3f2ef] px-2 py-1.5 text-left rounded text-[#1a1a1a] transition font-bold"
          >
            <Type size={13} className="text-[#ff4d4d]" />
            Editorial Headline
          </button>
          <button
            onClick={() => handleCreateItemInArea('text', 'paragraph')}
            className="flex items-center gap-2 hover:bg-[#f3f2ef] px-2 py-1.5 text-left rounded text-[#1a1a1a] transition"
          >
            <Type size={13} className="text-[#777777]" />
            Editorial Body text
          </button>
          <button
            onClick={() => handleCreateItemInArea('image')}
            className="flex items-center gap-2 hover:bg-[#f3f2ef] px-2 py-1.5 text-left rounded text-[#1a1a1a] transition"
          >
            <ImageIcon size={13} className="text-blue-500" />
            Image Component
          </button>
          <button
            onClick={() => handleCreateItemInArea('model', 'torus')}
            className="flex items-center gap-2 hover:bg-[#f3f2ef] px-2 py-1.5 text-left rounded text-[#1a1a1a] transition"
          >
            <Box size={13} className="text-amber-500" />
            Metallic 3D Sculpture
          </button>
          <button
            onClick={() => handleCreateItemInArea('model', 'sphere')}
            className="flex items-center gap-2 hover:bg-[#f3f2ef] px-2 py-1.5 text-left rounded text-[#1a1a1a] transition"
          >
            <Box size={13} className="text-[#ff4d4d]" />
            Lucite 3D Sphere
          </button>
          <div className="h-[1px] bg-[#dfdedb] my-0.5" />
          <button
            onClick={() => setShowCreateMenu(null)}
            className="text-center text-[10px] text-[#999999] hover:text-black py-0.5 transition"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

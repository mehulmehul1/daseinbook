import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useState, useEffect } from 'react';
import { useGridStore } from './useGridStore';
import { savePageLayout, fetchLocalAssets, LocalAsset } from './MockGitAPI';
import PaperFlipbook from './PaperFlipbook';
import PageCanvas2D, { MiniModelCanvas, getTypographyClasses } from './PageCanvas2D';
import { Plus, Trash2, Check, ArrowRight, Layout, Moon, Sun, Save, Eye, FolderOpen, Grid, RefreshCw, Compass, AlignLeft, AlignCenter, AlignRight, AlignJustify, X, Edit2, Palette, Image as ImageIcon, Type, Box } from 'lucide-react';
import { Annotation, AnnotationType, Page, PageItem, GridArea } from './types';

interface AnnotationItemProps {
  annotation: Annotation;
  pageIndex: number;
  isEditMode: boolean;
  onDelete: () => void;
}

function AnnotationItem({ annotation, pageIndex, isEditMode, onDelete }: AnnotationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(annotation.text || '');
  const updateAnnotation = useGridStore((state) => state.updateAnnotation);

  const fontClass =
    annotation.fontFamily === 'marker'
      ? 'font-marker'
      : annotation.fontFamily === 'caveat'
      ? 'font-caveat'
      : 'font-handwritten';

  if (annotation.type === 'text') {
    if (isEditing) {
      return (
        <div
          className="absolute pointer-events-auto"
          style={{
            left: `${annotation.x}%`,
            top: `${annotation.y}%`,
            transform: `translate(-50%, -50%) rotate(${annotation.angle || 0}deg)`,
            zIndex: 50,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white border border-red-200 p-1 rounded shadow-lg flex gap-1 items-center select-text">
            <input
              type="text"
              autoFocus
              className="border border-[#dfdedb] text-xs font-handwritten text-[#e63946] px-1.5 py-0.5 focus:outline-none focus:border-red-500 rounded bg-red-50/5 w-32 font-bold"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editText.trim()) {
                    updateAnnotation(pageIndex, annotation.id, { text: editText.trim() });
                  }
                  setIsEditing(false);
                } else if (e.key === 'Escape') {
                  setEditText(annotation.text || '');
                  setIsEditing(false);
                }
              }}
            />
            <button
              onClick={() => {
                if (editText.trim()) {
                  updateAnnotation(pageIndex, annotation.id, { text: editText.trim() });
                }
                setIsEditing(false);
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 text-[9px] font-bold uppercase rounded cursor-pointer"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditText(annotation.text || '');
                setIsEditing(false);
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="absolute pointer-events-auto"
        style={{
          left: `${annotation.x}%`,
          top: `${annotation.y}%`,
          transform: `translate(-50%, -50%) rotate(${annotation.angle || 0}deg)`,
          color: annotation.color || '#e63946',
          zIndex: 40,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative group flex items-center gap-1.5 whitespace-nowrap">
          <span
            onDoubleClick={() => {
              if (isEditMode) {
                setIsEditing(true);
              }
            }}
            className={`select-none transition-colors text-red-500 hover:text-red-600 ${fontClass} cursor-pointer`}
            style={{ fontSize: `${annotation.fontSize || 16}px` }}
            title={isEditMode ? "Double click to edit text" : undefined}
          >
            {annotation.text}
          </span>
          {isEditMode && isHovered && (
            <div className="flex items-center gap-1 bg-white/90 px-1 py-0.5 rounded shadow border border-red-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="text-red-500 hover:text-red-600 p-0.5 rounded transition cursor-pointer"
                title="Edit annotation text"
              >
                <Edit2 size={9} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-500 hover:text-red-600 p-0.5 rounded transition cursor-pointer"
                title="Delete annotation"
              >
                <Trash2 size={9} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (annotation.type === 'circle') {
    return (
      <div
        className="absolute pointer-events-auto"
        style={{
          left: `${annotation.x}%`,
          top: `${annotation.y}%`,
          width: `${annotation.width || 40}%`,
          height: `${annotation.height || 30}%`,
          transform: 'rotate(-1deg)',
          zIndex: 35,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="w-full h-full relative"
          style={{
            border: `2.2px solid ${annotation.color || '#e63946'}`,
            borderRadius: '48% 52% 55% 45% / 45% 53% 48% 52%',
          }}
        >
          {isEditMode && isHovered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="absolute -top-2.5 -right-2.5 bg-red-500 hover:bg-red-600 text-white p-0.5 rounded-full shadow pointer-events-auto transition cursor-pointer"
              title="Delete annotation"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (annotation.type === 'arrow' || annotation.type === 'line') {
    const pts = annotation.points;
    if (!pts || pts.length < 2) return null;
    const p1 = pts[0];
    const p2 = pts[1];

    const minX = Math.min(p1[0], p2[0]) - 2.5;
    const maxX = Math.max(p1[0], p2[0]) + 2.5;
    const minY = Math.min(p1[1], p2[1]) - 2.5;
    const maxY = Math.max(p1[1], p2[1]) + 2.5;

    const width = Math.max(2, maxX - minX);
    const height = Math.max(2, maxY - minY);

    const localX1 = ((p1[0] - minX) / width) * 100;
    const localY1 = ((p1[1] - minY) / height) * 100;
    const localX2 = ((p2[0] - minX) / width) * 100;
    const localY2 = ((p2[1] - minY) / height) * 100;

    return (
      <div
        className="absolute pointer-events-auto"
        style={{
          left: `${minX}%`,
          top: `${minY}%`,
          width: `${width}%`,
          height: `${height}%`,
          zIndex: 35,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <svg
          className="w-full h-full overflow-visible pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <marker
              id={`arrowhead-${annotation.id}`}
              markerWidth="8"
              markerHeight="6"
              refX="6"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill={annotation.color || '#e63946'} />
            </marker>
          </defs>
          <path
            d={`M ${localX1} ${localY1} L ${localX2} ${localY2}`}
            stroke={annotation.color || '#e63946'}
            strokeWidth="2.2"
            fill="none"
            strokeDasharray={annotation.type === 'line' ? '3 3' : undefined}
            markerEnd={annotation.type === 'arrow' ? `url(#arrowhead-${annotation.id})` : undefined}
          />
        </svg>

        {isEditMode && isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute bg-red-500 hover:bg-red-600 text-white p-0.5 rounded-full shadow pointer-events-auto transition cursor-pointer"
            style={{
              left: `${localX1}%`,
              top: `${localY1}%`,
              transform: 'translate(-50%, -50%)',
            }}
            title="Delete annotation"
          >
            <Trash2 size={10} />
          </button>
        )}
      </div>
    );
  }

  return null;
}

export default function App() {
  // Zustand State hooks
  const pages = useGridStore((state) => state.pages);
  const activePageIndex = useGridStore((state) => state.activePageIndex);
  const setActivePageIndex = useGridStore((state) => state.setActivePageIndex);
  const isEditMode = useGridStore((state) => state.isEditMode);
  const setIsEditMode = useGridStore((state) => state.setIsEditMode);
  const selectedItemId = useGridStore((state) => state.selectedItemId);
  const setSelectedItemId = useGridStore((state) => state.setSelectedItemId);
  const updateGridSettings = useGridStore((state) => state.updateGridSettings);
  const addItemToPage = useGridStore((state) => state.addItemToPage);
  const deleteItem = useGridStore((state) => state.deleteItem);
  const addNewPage = useGridStore((state) => state.addNewPage);
  const updateItemGridArea = useGridStore((state) => state.updateItemGridArea);
  
  // Zustand Annotations & Spans
  const addAnnotation = useGridStore((state) => state.addAnnotation);
  const updateAnnotation = useGridStore((state) => state.updateAnnotation);
  const deleteAnnotation = useGridStore((state) => state.deleteAnnotation);
  const toggleSpanSpread = useGridStore((state) => state.toggleSpanSpread);

  // Spanning Dragging State
  const [spanningDraggingId, setSpanningDraggingId] = useState<string | null>(null);
  const [spanningDragOffset, setSpanningDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [spanningDragCoords, setSpanningDragCoords] = useState<{ left: number; top: number } | null>(null);

  // Spanning Resizing State
  const [spanningResizingItem, setSpanningResizingItem] = useState<{
    id: string;
    handle: 'tl' | 'tr' | 'bl' | 'br';
    initialGrid: GridArea;
    initialMouse: { x: number; y: number };
  } | null>(null);

  // Local state for annotations
  const [annotationTool, setAnnotationTool] = useState<'none' | 'text' | 'arrow' | 'circle' | 'line'>('none');
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [drawingAnnotation, setDrawingAnnotation] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  
  // Annotation typing state
  const [activeTypingAnnotation, setActiveTypingAnnotation] = useState<{
    x: number;
    y: number;
    pageIndex: number;
  } | null>(null);
  const [typingText, setTypingText] = useState('');

  // Local state for assets, notifications, and git actions
  const [drawerAssets, setDrawerAssets] = useState<LocalAsset[]>([]);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [ghToken, setGhToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  // NEW: Grid guidelines visibility and 3D preview toggle
  const [showGridLines, setShowGridLines] = useState(true);
  const [show3DPreview, setShow3DPreview] = useState(false);
  const [editingSpanningTextId, setEditingSpanningTextId] = useState<string | null>(null);

  // Active spread mapping
  const currentSpread = Math.floor((activePageIndex + 1) / 2);
  const activePage = pages[activePageIndex];

  // Fetch local assets when active page changes
  useEffect(() => {
    if (activePage) {
      fetchLocalAssets(activePage.folderPath).then((assets) => {
        setDrawerAssets(assets);
      });
    }
  }, [activePageIndex, activePage?.folderPath]);

  // Spread-spanning coordinate mapper
  const getSpreadItemRect = (item: PageItem, leftPage: Page, rightPage: Page) => {
    const leftSettings = leftPage.gridSettings;
    const rightSettings = rightPage.gridSettings;
    
    // Single cell sizing on left page
    const leftActiveW = 100 - (leftSettings.margins.left + leftSettings.margins.right) * 100;
    const leftActiveH = 100 - (leftSettings.margins.top + leftSettings.margins.bottom) * 100;
    const leftCellW = (leftActiveW - (leftSettings.columns - 1) * leftSettings.columnGutter * 100) / leftSettings.columns;
    const leftCellH = (leftActiveH - (leftSettings.rows - 1) * leftSettings.rowGutter * 100) / leftSettings.rows;
    
    // Single cell sizing on right page
    const rightActiveW = 100 - (rightSettings.margins.left + rightSettings.margins.right) * 100;
    const rightCellW = (rightActiveW - (rightSettings.columns - 1) * rightSettings.columnGutter * 100) / rightSettings.columns;
    
    const colS = item.gridArea.colStart;
    const colE = item.gridArea.colEnd;
    const rowS = item.gridArea.rowStart;
    const rowE = item.gridArea.rowEnd;
    
    // Left page portion rect (relative to left page, 0 to 100)
    const leftPageItemL = leftSettings.margins.left * 100 + (colS - 1) * (leftCellW + leftSettings.columnGutter * 100);
    
    // Sizing of item relative to right page (right page has its own grid)
    const rightColE = Math.min(colE, rightSettings.columns);
    const rightPageItemR = rightSettings.margins.left * 100 + (rightColE - 1) * (rightCellW + rightSettings.columnGutter * 100) + rightCellW;
    
    // Map left edge to spread percentage (Left page takes left 50%)
    const spreadL = leftPageItemL * 0.5;
    
    // Map right edge to spread percentage (Right page takes right 50%)
    const spreadR = 50 + rightPageItemR * 0.5;
    const spreadW = Math.max(5, spreadR - spreadL);
    
    // Vertical stays the same (measured as percentage of page height)
    const spanRows = rowE - rowS + 1;
    const top = leftSettings.margins.top * 100 + (rowS - 1) * (leftCellH + leftSettings.rowGutter * 100);
    const height = spanRows * leftCellH + (spanRows - 1) * leftSettings.rowGutter * 100;
    
    return { left: spreadL, top, width: spreadW, height };
  };

  // Spanning Drag & Resize Event Handlers
  const handleSpanningItemMouseDown = (e: React.MouseEvent, item: PageItem) => {
    if (!isEditMode) return;
    if (annotationTool !== 'none') return;
    e.stopPropagation();
    
    // Select the item
    setSelectedItemId(item.id);
    
    // Find left page settings (spanning items always belong to the left page)
    const leftPageIndex = currentSpread * 2 - 1;
    const rightPageIndex = currentSpread * 2;
    const leftPage = pages[leftPageIndex];
    const rightPage = pages[rightPageIndex];
    if (!leftPage || !rightPage) return;

    const rect = getSpreadItemRect(item, leftPage, rightPage);
    
    // Get container bounding rect
    const container = document.querySelector('.grid-sheet-double-spread');
    if (container) {
      const cRect = container.getBoundingClientRect();
      const mouseX = e.clientX - cRect.left;
      const mouseY = e.clientY - cRect.top;
      const mouseXPercent = (mouseX / cRect.width) * 100;
      const mouseYPercent = (mouseY / cRect.height) * 100;

      setSpanningDraggingId(item.id);
      setSpanningDragOffset({
        x: mouseXPercent - rect.left,
        y: mouseYPercent - rect.top,
      });
      setSpanningDragCoords({
        left: rect.left,
        top: rect.top,
      });
    }
  };

  const handleSpanningResizeMouseDown = (e: React.MouseEvent, item: PageItem, handle: 'tl' | 'tr' | 'bl' | 'br') => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();
    
    setSpanningResizingItem({
      id: item.id,
      handle,
      initialGrid: { ...item.gridArea },
      initialMouse: { x: e.clientX, y: e.clientY },
    });
  };

  // Drag and Resize Update Effect
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const leftPageIndex = currentSpread * 2 - 1;
      const rightPageIndex = currentSpread * 2;
      const leftPage = pages[leftPageIndex];
      const rightPage = pages[rightPageIndex];
      if (!leftPage || !rightPage) return;

      const leftSettings = leftPage.gridSettings;
      const rightSettings = rightPage.gridSettings;

      // Sizing variables for Left Page
      const leftActiveW = 100 - (leftSettings.margins.left + leftSettings.margins.right) * 100;
      const leftActiveH = 100 - (leftSettings.margins.top + leftSettings.margins.bottom) * 100;
      const leftCellW = (leftActiveW - (leftSettings.columns - 1) * leftSettings.columnGutter * 100) / leftSettings.columns;
      const leftCellH = (leftActiveH - (leftSettings.rows - 1) * leftSettings.rowGutter * 100) / leftSettings.rows;
      
      // Sizing variables for Right Page
      const rightActiveW = 100 - (rightSettings.margins.left + rightSettings.margins.right) * 100;
      const rightCellW = (rightActiveW - (rightSettings.columns - 1) * rightSettings.columnGutter * 100) / rightSettings.columns;

      const doubleSpreadContainer = document.querySelector('.grid-sheet-double-spread');
      if (!doubleSpreadContainer) return;
      const cRect = doubleSpreadContainer.getBoundingClientRect();

      // 1. Handling Spanning Item Dragging
      if (spanningDraggingId && spanningDragOffset) {
        const mouseX = e.clientX - cRect.left;
        const mouseY = e.clientY - cRect.top;
        const mouseXPercent = (mouseX / cRect.width) * 100;
        const mouseYPercent = (mouseY / cRect.height) * 100;

        const nextLeft = mouseXPercent - spanningDragOffset.x;
        const nextTop = mouseYPercent - spanningDragOffset.y;

        setSpanningDragCoords({ left: nextLeft, top: nextTop });

        const item = leftPage.items.find(it => it.id === spanningDraggingId);
        if (item) {
          const colSpan = item.gridArea.colEnd - item.gridArea.colStart;
          const rowSpan = item.gridArea.rowEnd - item.gridArea.rowStart;

          // Back-map double spread coordinates to left page
          const leftPageItemL = nextLeft * 2;
          const marginL = leftSettings.margins.left * 100;
          const cellWAndGutter = leftCellW + leftSettings.columnGutter * 100;
          const snappedColStart = Math.round((leftPageItemL - marginL) / cellWAndGutter) + 1;

          // Vertical mapping
          const marginT = leftSettings.margins.top * 100;
          const cellHAndGutter = leftCellH + leftSettings.rowGutter * 100;
          const snappedRowStart = Math.round((nextTop - marginT) / cellHAndGutter) + 1;

          const colS = Math.min(Math.max(1, snappedColStart), leftSettings.columns);
          const colE = colS + colSpan;

          const rowS = Math.min(Math.max(1, snappedRowStart), leftSettings.rows - rowSpan);
          const rowE = rowS + rowSpan;

          const newArea: GridArea = {
            colStart: colS,
            colEnd: colE,
            rowStart: rowS,
            rowEnd: rowE,
          };

          if (
            newArea.colStart !== item.gridArea.colStart ||
            newArea.colEnd !== item.gridArea.colEnd ||
            newArea.rowStart !== item.gridArea.rowStart ||
            newArea.rowEnd !== item.gridArea.rowEnd
          ) {
            updateItemGridArea(leftPageIndex, spanningDraggingId, newArea);
          }
        }
      }

      // 2. Handling Spanning Item Resizing
      if (spanningResizingItem) {
        const item = leftPage.items.find(it => it.id === spanningResizingItem.id);
        if (item) {
          const deltaX = ((e.clientX - spanningResizingItem.initialMouse.x) / cRect.width) * 100;
          const deltaY = ((e.clientY - spanningResizingItem.initialMouse.y) / cRect.height) * 100;

          // Sizing variables in Left Page and Double Spread
          const initialRect = getSpreadItemRect(item, leftPage, rightPage);

          // Sizing of column / row offsets
          const marginL = leftSettings.margins.left * 100;
          const cellWAndGutter = leftCellW + leftSettings.columnGutter * 100;

          const marginT = leftSettings.margins.top * 100;
          const cellHAndGutter = leftCellH + leftSettings.rowGutter * 100;

          const rightMarginL = rightSettings.margins.left * 100;
          const rightCellWAndGutter = rightCellW + rightSettings.columnGutter * 100;

          let newColStart = item.gridArea.colStart;
          let newColEnd = item.gridArea.colEnd;
          let newRowStart = item.gridArea.rowStart;
          let newRowEnd = item.gridArea.rowEnd;

          // Resize calculations based on handle
          if (spanningResizingItem.handle === 'br') {
            const nextSpreadR = initialRect.left + initialRect.width + deltaX;
            const nextTop = initialRect.top;
            const nextHeight = initialRect.height + deltaY;

            const rightPageItemR = (nextSpreadR - 50) * 2;
            const snappedColEnd = Math.round((rightPageItemR - rightMarginL - rightCellW) / rightCellWAndGutter) + 1;
            newColEnd = Math.min(Math.max(1, snappedColEnd), rightSettings.columns);

            const snappedRowEnd = Math.round((nextTop + nextHeight - marginT - leftCellH) / cellHAndGutter) + 1;
            newRowEnd = Math.min(Math.max(newRowStart, snappedRowEnd), leftSettings.rows);
          }
          else if (spanningResizingItem.handle === 'bl') {
            const nextSpreadL = initialRect.left + deltaX;
            const nextHeight = initialRect.height + deltaY;

            const leftPageItemL = nextSpreadL * 2;
            const snappedColStart = Math.round((leftPageItemL - marginL) / cellWAndGutter) + 1;
            newColStart = Math.min(Math.max(1, snappedColStart), leftSettings.columns);

            const snappedRowEnd = Math.round((initialRect.top + nextHeight - marginT - leftCellH) / cellHAndGutter) + 1;
            newRowEnd = Math.min(Math.max(newRowStart, snappedRowEnd), leftSettings.rows);
          }
          else if (spanningResizingItem.handle === 'tr') {
            const nextSpreadR = initialRect.left + initialRect.width + deltaX;
            const nextTop = initialRect.top + deltaY;

            const rightPageItemR = (nextSpreadR - 50) * 2;
            const snappedColEnd = Math.round((rightPageItemR - rightMarginL - rightCellW) / rightCellWAndGutter) + 1;
            newColEnd = Math.min(Math.max(1, snappedColEnd), rightSettings.columns);

            const snappedRowStart = Math.round((nextTop - marginT) / cellHAndGutter) + 1;
            newRowStart = Math.min(Math.max(1, snappedRowStart), newRowEnd);
          }
          else if (spanningResizingItem.handle === 'tl') {
            const nextSpreadL = initialRect.left + deltaX;
            const nextTop = initialRect.top + deltaY;

            const leftPageItemL = nextSpreadL * 2;
            const snappedColStart = Math.round((leftPageItemL - marginL) / cellWAndGutter) + 1;
            newColStart = Math.min(Math.max(1, snappedColStart), leftSettings.columns);

            const snappedRowStart = Math.round((nextTop - marginT) / cellHAndGutter) + 1;
            newRowStart = Math.min(Math.max(1, snappedRowStart), newRowEnd);
          }

          const newArea: GridArea = {
            colStart: newColStart,
            colEnd: newColEnd,
            rowStart: newRowStart,
            rowEnd: newRowEnd,
          };

          if (
            newArea.colStart !== item.gridArea.colStart ||
            newArea.colEnd !== item.gridArea.colEnd ||
            newArea.rowStart !== item.gridArea.rowStart ||
            newArea.rowEnd !== item.gridArea.rowEnd
          ) {
            updateItemGridArea(leftPageIndex, item.id, newArea);
          }
        }
      }
    };

    const handleGlobalMouseUp = () => {
      setSpanningDraggingId(null);
      setSpanningDragOffset(null);
      setSpanningDragCoords(null);
      setSpanningResizingItem(null);
    };

    if (spanningDraggingId || spanningResizingItem) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [spanningDraggingId, spanningDragOffset, spanningResizingItem, pages, currentSpread]);

  // Annotation Drawing Event Handlers
  const handleSpreadMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (annotationTool === 'none') return;
    
    // Get mouse coordinates relative to the spread container
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (annotationTool === 'text') {
      // If there was an existing typing annotation with text, commit it first
      if (activeTypingAnnotation && typingText.trim()) {
        addAnnotation(activeTypingAnnotation.pageIndex, {
          type: 'text',
          x: activeTypingAnnotation.x,
          y: activeTypingAnnotation.y,
          text: typingText.trim(),
          color: '#e63946',
          fontFamily: 'handwritten',
          fontSize: 17,
          angle: Math.floor(Math.random() * 6) - 3
        });
      }

      // Determine which page was clicked (left vs right)
      const clickedLeftPage = x < 50;
      const targetPageIndex = clickedLeftPage ? currentSpread * 2 - 1 : currentSpread * 2;
      
      // Convert x relative to that page (0 to 100)
      const pageX = clickedLeftPage ? x * 2 : (x - 50) * 2;
      
      setActiveTypingAnnotation({
        x: pageX,
        y: y,
        pageIndex: targetPageIndex
      });
      setTypingText('');
      return;
    }
    
    setDrawingAnnotation({
      startX: x,
      startY: y,
      currentX: x,
      currentY: y
    });
  };

  const handleSpreadMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawingAnnotation) return;
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setDrawingAnnotation(prev => prev ? {
      ...prev,
      currentX: x,
      currentY: y
    } : null);
  };

  const handleSpreadMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawingAnnotation) return;
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Determine target page based on start coordinate
    const startedLeftPage = drawingAnnotation.startX < 50;
    const targetPageIndex = startedLeftPage ? currentSpread * 2 - 1 : currentSpread * 2;
    
    // Map start and end coordinates relative to that page
    const mapToPageX = (val: number) => startedLeftPage ? val * 2 : (val - 50) * 2;
    
    const pageStartX = mapToPageX(drawingAnnotation.startX);
    const pageStartY = drawingAnnotation.startY;
    const pageEndX = mapToPageX(x);
    const pageEndY = y;
    
    const deltaX = Math.abs(pageEndX - pageStartX);
    const deltaY = Math.abs(pageEndY - pageStartY);
    
    if (annotationTool === 'arrow' || annotationTool === 'line') {
      if (deltaX > 0.5 || deltaY > 0.5) {
        addAnnotation(targetPageIndex, {
          type: annotationTool,
          x: pageStartX,
          y: pageStartY,
          color: '#e63946',
          points: [[pageStartX, pageStartY], [pageEndX, pageEndY]]
        });
      }
    } else if (annotationTool === 'circle') {
      if (deltaX > 0.5 && deltaY > 0.5) {
        const circleX = Math.min(pageStartX, pageEndX);
        const circleY = Math.min(pageStartY, pageEndY);
        const circleW = Math.abs(pageStartX - pageEndX);
        const circleH = Math.abs(pageStartY - pageEndY);
        
        addAnnotation(targetPageIndex, {
          type: 'circle',
          x: circleX,
          y: circleY,
          width: circleW,
          height: circleH,
          color: '#e63946'
        });
      }
    }
    
    setDrawingAnnotation(null);
  };

  // Utility to show beautiful, auto-dismissing toast notifications
  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Triggers layout saving (mock API & GitHub REST integration)
  const handleSaveLayout = async () => {
    if (!activePage) return;
    setIsSaving(true);
    try {
      const response = await savePageLayout(
        activePage.folderPath,
        {
          items: activePage.items,
          gridSettings: activePage.gridSettings,
        },
        ghToken || undefined
      );

      if (response.success) {
        triggerToast(response.message, 'success');
      } else {
        triggerToast(response.message, 'error');
      }
    } catch (err: any) {
      triggerToast(`Failed to save: ${err?.message || 'Network error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Click handler to instantiate elements from the drawer to the grid
  const handleAddAsset = (asset: LocalAsset) => {
    if (!activePage) return;

    // Find a reasonable starting cell
    const colStart = 1;
    const colEnd = Math.min(2, activePage.gridSettings.columns);
    const rowStart = 2;
    const rowEnd = Math.min(3, activePage.gridSettings.rows);

    const baseItem = {
      type: asset.type,
      src: asset.src,
      gridArea: { colStart, colEnd, rowStart, rowEnd },
    };

    if (asset.type === 'text') {
      addItemToPage(activePageIndex, {
        ...baseItem,
        content: asset.src === 'headline'
          ? 'SWISS DESIGN RHYTHM'
          : 'Josef Müller-Brockmann constructed strict layouts to establish mathematical structural balance.',
        fontSize: asset.src === 'headline' ? 0.055 : 0.026,
        color: '#111111',
      });
    } else {
      addItemToPage(activePageIndex, baseItem);
    }

    triggerToast(`Added ${asset.name} to the layout. Drag to position.`, 'success');
  };

  // Swiss Composition Auto-Generator
  const handleAutoGenerateLayout = () => {
    if (!activePage) return;

    useGridStore.setState((state) => {
      const updatedPages = state.pages.map((p, pIdx) => {
        if (pIdx !== activePageIndex) return p;

        const colMax = p.gridSettings.columns;
        const rowMax = p.gridSettings.rows;

        const newItems = [
          {
            id: `title-${Date.now()}`,
            type: 'text' as const,
            src: 'headline',
            content: 'GRID & FORM',
            gridArea: { colStart: 1, colEnd: Math.min(colMax, 3), rowStart: 1, rowEnd: 1 },
            fontSize: 0.055,
            color: '#111111',
          },
          {
            id: `img-${Date.now() + 1}`,
            type: 'image' as const,
            src: p.assets[0] || 'https://images.unsplash.com/photo-1541824894926-3c58ec3ce706?auto=format&fit=crop&w=800&q=80',
            gridArea: {
              colStart: Math.min(colMax, 2),
              colEnd: colMax,
              rowStart: 2,
              rowEnd: Math.min(rowMax, 3)
            },
          },
          {
            id: `para-${Date.now() + 2}`,
            type: 'text' as const,
            src: 'body',
            content: 'The typography system conforms tightly to the underlying division of column compartments, aligning design to absolute structural order.',
            gridArea: {
              colStart: 1,
              colEnd: Math.min(colMax, colMax > 3 ? 2 : 1),
              rowStart: Math.min(rowMax, 4),
              rowEnd: Math.min(rowMax, 4)
            },
            fontSize: 0.026,
            color: '#444444',
          }
        ];
        return { ...p, items: newItems };
      });
      return { pages: updatedPages };
    });

    triggerToast('Suggested a classic Swiss composition.', 'success');
  };

  // Find selected item from either page in the active spread
  const leftPageIndex = currentSpread * 2 - 1;
  const rightPageIndex = currentSpread * 2;
  const leftPage = pages[leftPageIndex];
  const rightPage = pages[rightPageIndex];

  let selectedItem = activePage?.items?.find((item) => item.id === selectedItemId);
  let selectedItemPageIndex = activePageIndex;

  if (!selectedItem && currentSpread > 0) {
    if (leftPage) {
      selectedItem = leftPage.items.find((item) => item.id === selectedItemId);
      if (selectedItem) selectedItemPageIndex = leftPageIndex;
    }
    if (!selectedItem && rightPage) {
      selectedItem = rightPage.items.find((item) => item.id === selectedItemId);
      if (selectedItem) selectedItemPageIndex = rightPageIndex;
    }
  }

  const updateSelectedItemProperty = (key: string, value: any) => {
    if (!selectedItem) return;
    useGridStore.setState((state) => {
      const updatedPages = state.pages.map((p, pIdx) => {
        if (pIdx !== selectedItemPageIndex) return p;
        const updatedItems = p.items.map((it) => {
          if (it.id !== selectedItem!.id) return it;
          return { ...it, [key]: value };
        });
        return { ...p, items: updatedItems };
      });
      return { pages: updatedPages };
    });
  };

  // Global Keyboard Shortcuts (Esc to cancel tool/selection, Delete to remove selected element)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        setAnnotationTool('none');
        setSelectedItemId(null);
        setActiveTypingAnnotation(null);
        setDrawingAnnotation(null);
        setEditingSpanningTextId(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItemId && selectedItem) {
          e.preventDefault();
          deleteItem(selectedItemPageIndex, selectedItemId);
          setSelectedItemId(null);
          triggerToast('Deleted element', 'info');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, selectedItem, selectedItemPageIndex, deleteItem, setSelectedItemId]);

  return (
    <div className="h-screen overflow-hidden bg-[#f3f2ef] text-[#1a1a1a] flex flex-col font-sans selection:bg-[#ff4d4d] selection:text-white">
      {/* 1. Monochromatic Premium Swiss Header */}
      <header className="border-b border-[#dfdedb] bg-white/95 backdrop-blur px-6 py-4 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-extrabold tracking-tight uppercase flex items-center gap-2">
            <Compass size={16} className="text-[#ff4d4d]" />
            Müller-Brockmann Editorial Layout Studio
          </h1>
          <div className="h-4 w-[1px] bg-[#dfdedb]"></div>
          <span className="text-[10px] bg-red-50 text-[#ff4d4d] border border-red-200 font-bold px-2 py-0.5 tracking-wider uppercase rounded-sm">
            2D Grid System
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Active Studio Controls */}
          {isEditMode && (
            <div className="flex items-center gap-2">
              {/* Guidelines visibility */}
              <button
                onClick={() => {
                  setShowGridLines(!showGridLines);
                  triggerToast(showGridLines ? 'Grid guidelines hidden' : 'Grid guidelines visible', 'info');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold uppercase border transition ${
                  showGridLines
                    ? 'bg-red-50 border-red-200 text-[#ff4d4d]'
                    : 'bg-white border-[#dfdedb] text-[#555555] hover:text-black'
                }`}
                title="Toggle Grid Guidelines Overlay"
              >
                <Grid size={13} />
                <span className="hidden sm:inline">Grid Guidelines</span>
              </button>

              {/* Auto composition generator */}
              <button
                onClick={handleAutoGenerateLayout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold uppercase bg-white border border-[#dfdedb] text-[#555555] hover:border-[#1a1a1a] hover:text-black transition"
                title="Auto-generate a perfect balanced Swiss editorial composition"
              >
                <RefreshCw size={13} />
                <span className="hidden sm:inline">Auto-Layout</span>
              </button>
            </div>
          )}

          {/* 3D Book View Toggle */}
          <button
            onClick={() => {
              setShow3DPreview(!show3DPreview);
              triggerToast(show3DPreview ? 'Returned to 2D Studio Canvas' : 'Rendering interactive 3D virtual book', 'info');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase border transition ${
              show3DPreview
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'bg-white border-[#dfdedb] text-[#555555] hover:text-black'
            }`}
          >
            <Compass size={13} className={show3DPreview ? 'animate-spin' : ''} />
            {show3DPreview ? 'Studio Editor (2D)' : 'View in 3D'}
          </button>

          <div className="h-4 w-[1px] bg-[#dfdedb]"></div>

          {/* Mode Toggle */}
          <div className="flex bg-[#f3f2ef] p-1 border border-[#dfdedb]">
            <button
              onClick={() => {
                setIsEditMode(false);
                setSelectedItemId(null);
                triggerToast('Preview Mode Activated', 'info');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase transition ${
                !isEditMode
                  ? 'bg-white shadow-sm text-black border border-[#dfdedb]'
                  : 'text-[#555555] hover:text-black'
              }`}
            >
              <Eye size={13} />
              Preview
            </button>
            <button
              onClick={() => {
                setIsEditMode(true);
                triggerToast('Designer Edit Mode Activated. Feel free to drag assets.', 'info');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase transition ${
                isEditMode
                  ? 'bg-black text-white'
                  : 'text-[#555555] hover:text-black'
              }`}
            >
              <Layout size={13} />
              Edit Mode
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* 2. Left Sidebar: Table of Contents & Josef Müller-Brockmann Grids */}
        {isEditMode && (
          <aside className="w-80 border-r border-[#dfdedb] bg-white flex flex-col z-10 shrink-0">
            {/* Scrollable controls */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* SECTION A: TABLE OF CONTENTS */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[11px] font-bold tracking-widest text-[#777777] uppercase">
                    Table of Contents
                  </h3>
                  <button
                    onClick={() => {
                      addNewPage();
                      triggerToast('Created a clean grid spread.', 'success');
                    }}
                    className="p-1 hover:bg-[#f3f2ef] text-[#555555] hover:text-black transition"
                    title="Create New Page"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {[
                    { label: '00 / FRONT COVER', spreadIndex: 0, pages: [0] },
                    { label: '01 / THEORY & INDEX', spreadIndex: 1, pages: [1, 2] },
                    { label: '02 / PHYSICAL GEOMETRIES', spreadIndex: 2, pages: [3, 4] },
                    { label: '03 / INTERACTIVE SANDBOX', spreadIndex: 3, pages: [5, 6] },
                  ].map((item, idx) => {
                    const isActive = currentSpread === item.spreadIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setActivePageIndex(item.pages[0]);
                          setSelectedItemId(null);
                        }}
                        className={`w-full flex items-center justify-between text-left px-3 py-2.5 transition text-xs font-semibold ${
                          isActive
                            ? 'bg-[#1a1a1a] text-white'
                            : 'hover:bg-[#f3f2ef] text-[#444444] hover:text-black'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        {isActive && <ArrowRight size={12} className="text-[#ff4d4d]" />}
                      </button>
                    );
                  })}

                  {/* Dynamically append custom sheets if any */}
                  {pages.length > 7 &&
                    Array.from({ length: Math.ceil((pages.length - 7) / 2) }).map((_, cIdx) => {
                      const sheetIndex = 4 + cIdx;
                      const p1 = 7 + cIdx * 2;
                      const isActive = currentSpread === sheetIndex;
                      return (
                        <button
                          key={sheetIndex}
                          onClick={() => {
                            setActivePageIndex(p1);
                            setSelectedItemId(null);
                          }}
                          className={`w-full flex items-center justify-between text-left px-3 py-2.5 transition text-xs font-semibold ${
                            isActive
                              ? 'bg-[#1a1a1a] text-white'
                              : 'hover:bg-[#f3f2ef] text-[#444444] hover:text-black'
                          }`}
                        >
                          <span>{`0${sheetIndex} / CUSTOM CANVAS SPREAD`}</span>
                          {isActive && <ArrowRight size={12} className="text-[#ff4d4d]" />}
                        </button>
                      );
                    })}
                </nav>
              </div>

              <div className="h-[1px] bg-[#dfdedb]"></div>

              {/* SECTION B: SYSTEM LAYOUT ADJUSTMENTS */}
              {activePage && (() => {
                const leftPageIndex = currentSpread * 2 - 1;
                const rightPageIndex = currentSpread * 2;
                
                return (
                  <div className="space-y-5">
                    <h3 className="text-[11px] font-bold tracking-widest text-[#777777] uppercase">
                      Modular Grid Parameters
                    </h3>

                    {/* Dual-Page Selection Tabs & Actions */}
                    {currentSpread > 0 ? (
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-bold text-[#777777] uppercase tracking-wider block">
                          Spread Page Selector
                        </span>
                        <div className="grid grid-cols-2 gap-1 p-0.5 bg-[#f3f2ef] rounded border border-[#dfdedb]">
                          <button
                            onClick={() => setActivePageIndex(leftPageIndex)}
                            className={`px-2 py-1.5 text-[10px] font-bold uppercase transition rounded text-center ${
                              activePageIndex === leftPageIndex
                                ? 'bg-black text-white shadow-sm'
                                : 'text-[#555555] hover:text-black hover:bg-white/55'
                            }`}
                          >
                            Left (P. {leftPageIndex})
                          </button>
                          <button
                            onClick={() => setActivePageIndex(rightPageIndex)}
                            className={`px-2 py-1.5 text-[10px] font-bold uppercase transition rounded text-center ${
                              activePageIndex === rightPageIndex
                                ? 'bg-black text-white shadow-sm'
                                : 'text-[#555555] hover:text-black hover:bg-white/55'
                            }`}
                          >
                            Right (P. {rightPageIndex})
                          </button>
                        </div>

                        {/* Copy utilities */}
                        <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold uppercase tracking-wide">
                          <button
                            onClick={() => {
                              if (pages[leftPageIndex] && pages[rightPageIndex]) {
                                updateGridSettings(rightPageIndex, { ...pages[leftPageIndex].gridSettings });
                                triggerToast(`Copied Page ${leftPageIndex} grid to Page ${rightPageIndex}`, 'success');
                              }
                            }}
                            className="border border-[#dfdedb] hover:bg-[#f3f2ef] px-2 py-1.5 rounded transition text-center bg-white text-black"
                          >
                            Copy Left → Right
                          </button>
                          <button
                            onClick={() => {
                              if (pages[leftPageIndex] && pages[rightPageIndex]) {
                                updateGridSettings(leftPageIndex, { ...pages[rightPageIndex].gridSettings });
                                triggerToast(`Copied Page ${rightPageIndex} grid to Page ${leftPageIndex}`, 'success');
                              }
                            }}
                            className="border border-[#dfdedb] hover:bg-[#f3f2ef] px-2 py-1.5 rounded transition text-center bg-white text-black"
                          >
                            Copy Right → Left
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#1a1a1a] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded text-center">
                        Front Cover (Page 0)
                      </div>
                    )}

                    {/* Miniature visual grid layout mockup */}
                    <div className="border border-[#dfdedb] p-3 bg-[#fdfcfb] rounded space-y-2">
                      <div className="flex justify-between text-[9px] font-mono text-[#777777] uppercase">
                        <span>Page {activePageIndex} Grid Geometry</span>
                        <span className="font-bold text-black">{activePage.gridSettings.columns} × {activePage.gridSettings.rows}</span>
                      </div>
                      <div 
                        className="grid gap-1 bg-[#f3f2ef]/55 p-2 border border-dashed border-[#dfdedb]" 
                        style={{
                          gridTemplateColumns: `repeat(${activePage.gridSettings.columns}, minmax(0, 1fr))`,
                          gridTemplateRows: `repeat(${activePage.gridSettings.rows}, minmax(0, 1fr))`,
                          aspectRatio: '1.4 / 2.0',
                          height: '90px',
                          margin: '0 auto',
                        }}
                      >
                        {Array.from({ length: activePage.gridSettings.columns * activePage.gridSettings.rows }).map((_, idx) => (
                          <div key={idx} className="bg-black/10 border border-black/5 rounded-[1px]" />
                        ))}
                      </div>
                    </div>

                    {/* Grid Columns */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="uppercase text-[#555555]">Grid Columns</span>
                        <span>{activePage.gridSettings.columns}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        step="1"
                        value={activePage.gridSettings.columns}
                        onChange={(e) =>
                          updateGridSettings(activePageIndex, { columns: parseInt(e.target.value) })
                        }
                        className="w-full accent-black h-1 bg-[#dfdedb] rounded cursor-pointer"
                      />
                    </div>

                    {/* Grid Rows */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="uppercase text-[#555555]">Grid Rows</span>
                        <span>{activePage.gridSettings.rows}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        step="1"
                        value={activePage.gridSettings.rows}
                        onChange={(e) =>
                          updateGridSettings(activePageIndex, { rows: parseInt(e.target.value) })
                        }
                        className="w-full accent-black h-1 bg-[#dfdedb] rounded cursor-pointer"
                      />
                    </div>

                    {/* Column Gutter */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="uppercase text-[#555555]">Column Gutter</span>
                        <span>{activePage.gridSettings.columnGutter.toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.005"
                        max="0.08"
                        step="0.005"
                        value={activePage.gridSettings.columnGutter}
                        onChange={(e) =>
                          updateGridSettings(activePageIndex, { columnGutter: parseFloat(e.target.value) })
                        }
                        className="w-full accent-black h-1 bg-[#dfdedb] rounded cursor-pointer"
                      />
                    </div>

                    {/* Row Gutter */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="uppercase text-[#555555]">Row Gutter</span>
                        <span>{activePage.gridSettings.rowGutter.toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.005"
                        max="0.08"
                        step="0.005"
                        value={activePage.gridSettings.rowGutter}
                        onChange={(e) =>
                          updateGridSettings(activePageIndex, { rowGutter: parseFloat(e.target.value) })
                        }
                        className="w-full accent-black h-1 bg-[#dfdedb] rounded cursor-pointer"
                      />
                    </div>

                    {/* Margins */}
                    <div className="space-y-3 pt-2">
                      <span className="text-[10px] font-bold text-[#777777] uppercase tracking-wider block">
                        Page Margin Offsets
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-[#777777]">Left / Right</label>
                          <input
                            type="number"
                            min="0.02"
                            max="0.3"
                            step="0.01"
                            value={activePage.gridSettings.margins.left}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0.1;
                              updateGridSettings(activePageIndex, {
                                margins: { ...activePage.gridSettings.margins, left: val, right: val },
                              });
                            }}
                            className="w-full border border-[#dfdedb] px-2 py-1 text-xs font-mono rounded bg-white text-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-[#777777]">Top / Bottom</label>
                          <input
                            type="number"
                            min="0.02"
                            max="0.3"
                            step="0.01"
                            value={activePage.gridSettings.margins.top}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0.12;
                              updateGridSettings(activePageIndex, {
                                margins: { ...activePage.gridSettings.margins, top: val, bottom: val },
                              });
                            }}
                            className="w-full border border-[#dfdedb] px-2 py-1 text-xs font-mono rounded bg-white text-black"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Quick Info Box */}
            <div className="p-6 border-t border-[#dfdedb] bg-[#fafafa]">
              <p className="text-[11px] text-[#777777] leading-relaxed">
                <strong>Swiss Principles</strong>: Consistent column grids align geometry, typography, and image, creating order, readability, and timeless visual discipline.
              </p>
            </div>
          </aside>
        )}

        {/* 3. CENTER: High-Performance 2D Studio Canvas OR 3D Presentation Preview */}
        <main className="flex-1 h-full bg-[#eae9e5] relative flex flex-col items-center justify-center p-8 overflow-y-auto select-none">
          {show3DPreview ? (
            <div className="w-full h-full relative">
              <Canvas
                shadows
                camera={{ position: [0, 0, 3], fov: 45 }}
                gl={{
                  antialias: true,
                  alpha: true,
                  powerPreference: 'high-performance',
                }}
                style={{ width: '100%', height: '100%' }}
              >
                {/* High-end Studio Lighting Configuration */}
                <color attach="background" args={['#eae9e5']} />
                <ambientLight intensity={1.5} />
                <directionalLight
                  position={[2, 4, 3]}
                  intensity={2.2}
                  castShadow
                  shadow-mapSize={[2048, 2048]}
                  shadow-bias={-0.0001}
                />
                <pointLight position={[-3, 2, -2]} intensity={0.5} />

                {/* Book Flipbook mesh */}
                <PaperFlipbook />

                <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  minDistance={1.2}
                  maxDistance={5.0}
                  makeDefault
                />
              </Canvas>
              <div className="absolute top-4 left-4 bg-amber-500 text-white text-[9px] font-bold tracking-widest px-2.5 py-1 rounded uppercase shadow-sm pointer-events-none">
                3D WebGL Presentation Preview
              </div>
            </div>
          ) : (
            /* DUAL 2D STUDIO EDITOR ARTBOARD */
            <div className="w-full max-w-5xl flex flex-col items-center justify-center gap-6 py-4">
              {currentSpread === 0 ? (
                /* SINGLE SHEET VIEW (COVER PAGE) */
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-[#777777] uppercase tracking-wider">
                    Front Cover (Page 0)
                  </span>
                  <div className="w-[380px] sm:w-[420px] shadow-2xl hover:shadow-red-100/50 transition-shadow duration-300">
                    <PageCanvas2D
                      pageIndex={0}
                      page={pages[0]}
                      showGridLines={showGridLines}
                    />
                  </div>
                </div>
              ) : (
                /* DUAL PAGES SIDE-BY-SIDE (OPENED BOOK SPREAD) */
                <div className="flex flex-col items-center gap-3.5 w-full">
                  <div className="flex justify-between items-center w-full max-w-4xl px-2">
                    <div className="text-[10px] font-bold text-[#777777] uppercase tracking-wider">
                      Left Page (Page {currentSpread * 2 - 1})
                    </div>
                    
                    {/* RED EDITORIAL MARKUP & QUICK ASSETS TOOLBAR */}
                    {isEditMode && (
                      <div className="flex items-center gap-2">
                        {/* Quick-Add Asset Toolbar */}
                        <div className="hidden md:flex items-center gap-1 bg-white border border-[#dfdedb] p-1 rounded-md shadow-sm">
                          <button
                            onClick={() => handleAddAsset({ id: 'quick-head', type: 'text', name: 'Headline', src: 'headline' })}
                            className="px-2 py-1 text-[9px] font-bold uppercase hover:bg-[#f3f2ef] rounded flex items-center gap-1 text-black cursor-pointer"
                            title="Add Headline"
                          >
                            <Type size={11} className="text-[#ff4d4d]" />
                            + Title
                          </button>
                          <button
                            onClick={() => handleAddAsset({ id: 'quick-body', type: 'text', name: 'Text Note', src: 'body' })}
                            className="px-2 py-1 text-[9px] font-bold uppercase hover:bg-[#f3f2ef] rounded flex items-center gap-1 text-black cursor-pointer"
                            title="Add Paragraph Note"
                          >
                            <Type size={11} className="text-[#777777]" />
                            + Note
                          </button>
                          <button
                            onClick={() => handleAddAsset({ id: 'quick-img', type: 'image', name: 'Photo', src: 'https://images.unsplash.com/photo-1541824894926-3c58ec3ce706?auto=format&fit=crop&w=800&q=80' })}
                            className="px-2 py-1 text-[9px] font-bold uppercase hover:bg-[#f3f2ef] rounded flex items-center gap-1 text-black cursor-pointer"
                            title="Add Photo Asset"
                          >
                            <ImageIcon size={11} className="text-blue-500" />
                            + Photo
                          </button>
                          <button
                            onClick={() => handleAddAsset({ id: 'quick-3d', type: 'model', name: '3D Geometry', src: 'torus' })}
                            className="px-2 py-1 text-[9px] font-bold uppercase hover:bg-[#f3f2ef] rounded flex items-center gap-1 text-black cursor-pointer"
                            title="Add 3D Shape"
                          >
                            <Box size={11} className="text-amber-500" />
                            + 3D
                          </button>
                        </div>

                        {/* Red Editorial Pen Bar */}
                        <div className="flex items-center gap-1 bg-red-50/50 border border-red-100 p-1 rounded-md shadow-sm">
                          <span className="text-[9px] font-extrabold tracking-wider text-[#e63946] uppercase px-2 font-mono">
                            Red Editorial Pen
                          </span>
                          {[
                            { id: 'none', label: 'Pointer' },
                            { id: 'text', label: 'Text Note' },
                            { id: 'arrow', label: 'Arrow' },
                            { id: 'circle', label: 'Circle' },
                            { id: 'line', label: 'Dashed' },
                          ].map((tool) => (
                            <button
                              key={tool.id}
                              onClick={() => {
                                setAnnotationTool(tool.id as any);
                                if (tool.id !== 'none') {
                                  setSelectedItemId(null);
                                }
                              }}
                              className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition rounded-sm flex items-center gap-1 cursor-pointer ${
                                annotationTool === tool.id
                                  ? 'bg-red-500 text-white'
                                  : 'text-[#e63946] hover:bg-red-100/50'
                              }`}
                            >
                              {tool.label}
                            </button>
                          ))}
                          
                          <div className="w-[1px] h-3 bg-red-200 mx-1"></div>
                          
                          <button
                            onClick={() => {
                              setShowAnnotations(!showAnnotations);
                            }}
                            className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wide transition rounded-sm flex items-center gap-1 cursor-pointer ${
                              showAnnotations
                                ? 'bg-red-50 border border-red-200 text-[#e63946]'
                                : 'bg-white border border-[#dfdedb] text-[#777777]'
                            }`}
                          >
                            {showAnnotations ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-[10px] font-bold text-[#777777] uppercase tracking-wider text-right">
                      Right Page (Page {currentSpread * 2})
                    </div>
                  </div>

                  {/* Joined double spread container with middle crease */}
                  <div
                    onMouseDown={handleSpreadMouseDown}
                    onMouseMove={handleSpreadMouseMove}
                    onMouseUp={handleSpreadMouseUp}
                    className={`grid-sheet-double-spread flex w-full max-w-4xl shadow-2xl relative bg-white border border-[#dfdedb] select-none ${
                      annotationTool !== 'none' ? 'cursor-crosshair' : ''
                    }`}
                  >
                    {/* Page 1 (Left Page) */}
                    <div className={`w-1/2 border-r border-[#e3e2de] relative ${annotationTool !== 'none' ? 'pointer-events-none' : ''}`}>
                      {pages[currentSpread * 2 - 1] ? (
                        <PageCanvas2D
                          pageIndex={currentSpread * 2 - 1}
                          page={pages[currentSpread * 2 - 1]}
                          showGridLines={showGridLines}
                        />
                      ) : (
                        <div className="aspect-[1.4/2] bg-[#fdfcfb] flex items-center justify-center p-8 text-center text-xs text-[#999999]">
                          Page empty or uninstantiated. Click "Next" to continue.
                        </div>
                      )}
                      
                      {/* Subtle shading simulating the inner gutter of the left page */}
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-black/[0.04] pointer-events-none" />
                    </div>

                    {/* Page 2 (Right Page) */}
                    <div className={`w-1/2 relative ${annotationTool !== 'none' ? 'pointer-events-none' : ''}`}>
                      {pages[currentSpread * 2] ? (
                        <PageCanvas2D
                          pageIndex={currentSpread * 2}
                          page={pages[currentSpread * 2]}
                          showGridLines={showGridLines}
                        />
                      ) : (
                        <div className="aspect-[1.4/2] bg-[#fdfcfb] flex items-center justify-center p-8 text-center text-xs text-[#999999] border-l border-[#dfdedb]">
                          Page empty or uninstantiated. Click "Next" to continue.
                        </div>
                      )}

                      {/* Subtle shading simulating the inner gutter of the right page */}
                      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-l from-transparent to-black/[0.04] pointer-events-none" />
                    </div>

                    {/* SPREAD-SPANNING LAYOUT ITEMS LAYER */}
                    {pages[currentSpread * 2 - 1]?.items?.filter(item => item.spanSpread).map((item) => {
                      const rect = getSpreadItemRect(item, pages[currentSpread * 2 - 1], pages[currentSpread * 2]);
                      const isSelected = selectedItemId === item.id;
                      
                      let itemLeft = rect.left;
                      let itemTop = rect.top;

                      if (spanningDraggingId === item.id && spanningDragCoords) {
                        itemLeft = spanningDragCoords.left;
                        itemTop = spanningDragCoords.top;
                      }

                      return (
                        <div
                          key={item.id}
                          onMouseDown={(e) => {
                            if (annotationTool === 'none') {
                              handleSpanningItemMouseDown(e, item);
                            }
                          }}
                          className={`absolute flex flex-col group z-20 ${
                            isEditMode && annotationTool === 'none' ? 'cursor-grab active:cursor-grabbing' : ''
                          }`}
                          style={{
                            left: `${itemLeft}%`,
                            top: `${itemTop}%`,
                            width: `${rect.width}%`,
                            height: `${rect.height}%`,
                            pointerEvents: annotationTool !== 'none' ? 'none' : 'auto',
                            transition: spanningDraggingId === item.id ? 'none' : 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                          }}
                        >
                          <div className="w-full h-full relative overflow-hidden flex flex-col justify-center">
                            {item.type === 'image' && (
                              <div className="w-full h-full flex items-center justify-center overflow-hidden bg-[#faf8f5]">
                                <img
                                  src={item.src}
                                  alt="Spread spanning photo"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover select-none pointer-events-none filter grayscale contrast-[1.1] transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                            )}

                            {item.type === 'model' && (
                              <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-transparent">
                                <MiniModelCanvas src={item.src} />
                              </div>
                            )}

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
                                  className={`w-full p-2.5 overflow-hidden flex flex-col h-full justify-center ${flexAlignClass} ${alignmentClass}`}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    if (isEditMode) setEditingSpanningTextId(item.id);
                                  }}
                                >
                                  {editingSpanningTextId === item.id ? (
                                    <textarea
                                      value={item.content || ''}
                                      autoFocus
                                      onBlur={() => setEditingSpanningTextId(null)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
                                          setEditingSpanningTextId(null);
                                        }
                                      }}
                                      onChange={(e) => updateSelectedItemProperty('content', e.target.value)}
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
                            
                            {/* Spanning badge identifier in Edit Mode */}
                            {isEditMode && (
                              <div className="absolute top-2 left-2 bg-[#ff4d4d] text-white text-[8px] font-bold tracking-widest px-1.5 py-0.5 uppercase rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                SPREAD SPANNING {item.type.toUpperCase()}
                              </div>
                            )}

                            {isEditMode && isSelected && (
                              <>
                                {/* 1px Solid Red Boundary line */}
                                <div className="absolute inset-0 border-2 border-[#ff4d4d] pointer-events-none z-30" />

                                {/* Selection Label Badge */}
                                <div className="absolute -top-6 left-0 bg-[#ff4d4d] text-white text-[9px] font-bold tracking-widest px-2 py-0.5 rounded uppercase z-40 select-none shadow-sm flex items-center gap-1.5 pointer-events-none">
                                  {item.type === 'text' && <Type size={9} />}
                                  {item.type === 'image' && <ImageIcon size={9} />}
                                  {item.type === 'model' && <Box size={9} />}
                                  Spanning {item.type} (C:{item.gridArea.colStart}-{item.gridArea.colEnd} R:{item.gridArea.rowStart}-{item.gridArea.rowEnd})
                                </div>

                                {/* Trash Icon Button overlay on selected item */}
                                <button
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    deleteItem(currentSpread * 2 - 1, item.id);
                                    setSelectedItemId(null);
                                  }}
                                  className="absolute -top-6 right-0 bg-[#1a1a1a] hover:bg-black text-white p-1 rounded shadow-sm z-40 transition cursor-pointer flex items-center justify-center"
                                  title="Delete Item"
                                >
                                  <Trash2 size={10} />
                                </button>

                                {/* Resizing Corner Knobs */}
                                <div
                                  onMouseDown={(e) => handleSpanningResizeMouseDown(e, item, 'tl')}
                                  className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-white border-2 border-[#ff4d4d] cursor-nwse-resize z-40 hover:bg-[#ff4d4d] transition rounded-full"
                                />
                                <div
                                  onMouseDown={(e) => handleSpanningResizeMouseDown(e, item, 'tr')}
                                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white border-2 border-[#ff4d4d] cursor-nesw-resize z-40 hover:bg-[#ff4d4d] transition rounded-full"
                                />
                                <div
                                  onMouseDown={(e) => handleSpanningResizeMouseDown(e, item, 'bl')}
                                  className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-white border-2 border-[#ff4d4d] cursor-nesw-resize z-40 hover:bg-[#ff4d4d] transition rounded-full"
                                />
                                <div
                                  onMouseDown={(e) => handleSpanningResizeMouseDown(e, item, 'br')}
                                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white border-2 border-[#ff4d4d] cursor-nwse-resize z-40 hover:bg-[#ff4d4d] transition rounded-full shadow"
                                />
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* LEFT PAGE RED ANNOTATIONS OVERLAY */}
                    <div className="absolute inset-y-0 left-0 w-1/2 pointer-events-none z-30">
                      {showAnnotations && pages[currentSpread * 2 - 1]?.annotations?.map((ann) => (
                        <AnnotationItem
                          key={ann.id}
                          annotation={ann}
                          pageIndex={currentSpread * 2 - 1}
                          isEditMode={isEditMode}
                          onDelete={() => deleteAnnotation(currentSpread * 2 - 1, ann.id)}
                        />
                      ))}
                    </div>

                    {/* RIGHT PAGE RED ANNOTATIONS OVERLAY */}
                    <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none z-30">
                      {showAnnotations && pages[currentSpread * 2]?.annotations?.map((ann) => (
                        <AnnotationItem
                          key={ann.id}
                          annotation={ann}
                          pageIndex={currentSpread * 2}
                          isEditMode={isEditMode}
                          onDelete={() => deleteAnnotation(currentSpread * 2, ann.id)}
                        />
                      ))}
                    </div>

                    {/* LIVE DRAWING FEEDBACK OVERLAY */}
                    {drawingAnnotation && (
                      <div className="absolute inset-0 pointer-events-none z-40">
                        {/* Live Arrow or Dashed Line */}
                        {(annotationTool === 'arrow' || annotationTool === 'line') && (
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                              <marker id="live-arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
                                <polygon points="0 0, 8 3, 0 6" fill="#e63946" />
                              </marker>
                            </defs>
                            <path
                              d={`M ${drawingAnnotation.startX} ${drawingAnnotation.startY} L ${drawingAnnotation.currentX} ${drawingAnnotation.currentY}`}
                              stroke="#e63946"
                              strokeWidth="0.3"
                              strokeDasharray={annotationTool === 'line' ? '3 3' : undefined}
                              fill="none"
                              markerEnd={annotationTool === 'arrow' ? 'url(#live-arrowhead)' : undefined}
                            />
                          </svg>
                        )}
                        
                        {/* Live Highlight Circle */}
                        {annotationTool === 'circle' && (
                          <div
                            className="absolute border-2 border-[#e63946] border-dashed"
                            style={{
                              left: `${Math.min(drawingAnnotation.startX, drawingAnnotation.currentX)}%`,
                              top: `${Math.min(drawingAnnotation.startY, drawingAnnotation.currentY)}%`,
                              width: `${Math.abs(drawingAnnotation.startX - drawingAnnotation.currentX)}%`,
                              height: `${Math.abs(drawingAnnotation.startY - drawingAnnotation.currentY)}%`,
                              borderRadius: '48% 52% 55% 45% / 45% 53% 48% 52%',
                            }}
                          />
                        )}
                      </div>
                    )}

                    {/* ACTIVE TYPING TEXT INLINE MODAL */}
                    {activeTypingAnnotation && (
                      <div
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="absolute z-50 bg-white shadow-xl border border-red-200 p-2.5 rounded flex flex-col gap-2 pointer-events-auto"
                        style={{
                          left: `${activeTypingAnnotation.pageIndex === currentSpread * 2 - 1 ? activeTypingAnnotation.x / 2 : 50 + activeTypingAnnotation.x / 2}%`,
                          top: `${activeTypingAnnotation.y}%`,
                          transform: 'translate(-50%, -105%)',
                        }}
                      >
                        <span className="text-[9px] font-bold tracking-widest text-[#e63946] uppercase font-mono">
                          Type Red Ink Note
                        </span>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Type annotation..."
                            value={typingText}
                            onChange={(e) => setTypingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (typingText.trim()) {
                                  addAnnotation(activeTypingAnnotation.pageIndex, {
                                    type: 'text',
                                    x: activeTypingAnnotation.x,
                                    y: activeTypingAnnotation.y,
                                    text: typingText.trim(),
                                    color: '#e63946',
                                    fontFamily: 'handwritten',
                                    fontSize: 17,
                                    angle: Math.floor(Math.random() * 6) - 3
                                  });
                                  triggerToast('Added red ink note', 'success');
                                }
                                setActiveTypingAnnotation(null);
                                setTypingText('');
                                setAnnotationTool('none');
                              } else if (e.key === 'Escape') {
                                setActiveTypingAnnotation(null);
                                setTypingText('');
                                setAnnotationTool('none');
                              }
                            }}
                            className="border border-[#dfdedb] text-xs font-handwritten text-[#e63946] px-2.5 py-1 focus:outline-none focus:border-red-500 rounded bg-red-50/5 w-48 font-bold"
                          />
                          <button
                            onClick={() => {
                              if (typingText.trim()) {
                                addAnnotation(activeTypingAnnotation.pageIndex, {
                                  type: 'text',
                                  x: activeTypingAnnotation.x,
                                  y: activeTypingAnnotation.y,
                                  text: typingText.trim(),
                                  color: '#e63946',
                                  fontFamily: 'handwritten',
                                  fontSize: 17,
                                  angle: Math.floor(Math.random() * 6) - 3
                                });
                                triggerToast('Added red ink note', 'success');
                              }
                              setActiveTypingAnnotation(null);
                              setTypingText('');
                              setAnnotationTool('none');
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 text-[10px] font-bold uppercase rounded flex items-center justify-center cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                        <span className="text-[8px] text-[#777777] font-mono">
                          PRESS ENTER TO COMMIT · ESC TO CANCEL
                        </span>
                      </div>
                    )}

                    {/* Highly tactile absolute center line representing the spine book spine */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-[#dfdedb] shadow-inner pointer-events-none z-10" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Page Index Indicators (Monochromatic bottom tabs) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 px-5 py-2.5 border border-[#dfdedb] shadow-sm flex items-center gap-4 text-xs font-bold uppercase tracking-wider rounded z-10">
            <button
              disabled={activePageIndex === 0}
              onClick={() => {
                setActivePageIndex(Math.max(0, activePageIndex - 2));
                setSelectedItemId(null);
              }}
              className="text-[#777777] hover:text-black disabled:opacity-35 transition"
            >
              PREV SPREAD
            </button>
            <div className="h-3 w-[1px] bg-[#dfdedb]"></div>
            <span className="text-black font-mono">
              {currentSpread === 0
                ? 'COVER (P. 0)'
                : `SPREAD ${currentSpread} (P. ${currentSpread * 2 - 1} - ${currentSpread * 2})`}
            </span>
            <div className="h-3 w-[1px] bg-[#dfdedb]"></div>
            <button
              disabled={currentSpread * 2 >= pages.length - 1}
              onClick={() => {
                setActivePageIndex(Math.min(pages.length - 1, currentSpread * 2 + 1));
                setSelectedItemId(null);
              }}
              className="text-[#777777] hover:text-black disabled:opacity-35 transition"
            >
              NEXT SPREAD
            </button>
          </div>
        </main>

        {/* 4. Right Sidebar: Asset Drawer & Layout Committing */}
        {isEditMode && (
          <aside className="w-80 border-l border-[#dfdedb] bg-white flex flex-col z-10 shrink-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* PERSISTENCE SECTIONS */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold tracking-widest text-[#777777] uppercase">
                  Layout Persistence
                </h3>

                <div className="space-y-2">
                  <button
                    onClick={handleSaveLayout}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-black text-white px-4 py-3 text-xs font-bold uppercase transition disabled:opacity-50"
                  >
                    <Save size={14} />
                    {isSaving ? 'PERSISTING LAYOUT...' : 'SAVE SPREAD LAYOUT'}
                  </button>

                  <button
                    onClick={() => setShowTokenInput(!showTokenInput)}
                    className="w-full flex items-center justify-center gap-2 border border-[#dfdedb] hover:bg-[#f3f2ef] text-black px-4 py-2.5 text-[10px] font-bold uppercase transition"
                  >
                    <FolderOpen size={13} />
                    {ghToken ? 'GITHUB LINKED' : 'LINK GITHUB COMMIT'}
                  </button>
                </div>

                {/* Collapsible GitHub Access Input */}
                {showTokenInput && (
                  <div className="border border-[#dfdedb] p-3 space-y-2 bg-[#fdfdfd] rounded">
                    <span className="text-[10px] font-bold text-[#555555] uppercase block">
                      GitHub OAuth Token
                    </span>
                    <input
                      type="password"
                      placeholder="ghp_********************"
                      value={ghToken}
                      onChange={(e) => setGhToken(e.target.value)}
                      className="w-full border border-[#dfdedb] px-2 py-1.5 text-xs font-mono rounded bg-white focus:outline-none focus:border-black"
                    />
                    <p className="text-[9px] text-[#777777] leading-normal">
                      Enter a token to simulate a direct commit to your GitHub repository using the octokit git database REST API.
                    </p>
                  </div>
                )}
              </div>

              <div className="h-[1px] bg-[#dfdedb]"></div>

              {/* SELECTION MODIFIER */}
              {selectedItem ? (
                <div className="border border-[#ff4d4d] p-4 space-y-4 bg-red-50/10 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold tracking-wider text-[#ff4d4d] uppercase">
                      Element Selected
                    </span>
                    <button
                      onClick={() => {
                        deleteItem(activePageIndex, selectedItem.id);
                        triggerToast('Element deleted.', 'info');
                      }}
                      className="p-1 text-[#ff4d4d] hover:bg-red-50 hover:text-red-700 transition rounded"
                      title="Delete Element"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-[10px] border-b border-[#dfdedb]/50 pb-2">
                      <div>
                        <span className="text-[#777777] block uppercase font-mono">Type</span>
                        <span className="font-bold uppercase font-mono text-black">{selectedItem.type}</span>
                      </div>
                      <div>
                        <span className="text-[#777777] block uppercase font-mono">Grid Area</span>
                        <span className="font-bold font-mono text-black">
                          C:{selectedItem.gridArea.colStart}-{selectedItem.gridArea.colEnd} R:
                          {selectedItem.gridArea.rowStart}-{selectedItem.gridArea.rowEnd}
                        </span>
                      </div>
                    </div>

                    {/* SPREAD SPANNING TRIGGER */}
                    {currentSpread > 0 && (
                      <div className="border border-red-200/50 bg-red-500/[0.02] p-2.5 rounded space-y-1.5">
                        <div className="flex justify-between items-center gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-[#e63946] uppercase block font-mono">
                              Spread-Spanning Layout
                            </span>
                            <p className="text-[8px] text-[#777777] leading-normal">
                              Span element across center crease to cover both pages.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              toggleSpanSpread(selectedItemPageIndex, selectedItem!.id);
                              triggerToast(selectedItem!.spanSpread ? 'Spread spanning disabled.' : 'Spread spanning activated!', 'success');
                            }}
                            className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition rounded-sm border cursor-pointer ${
                              selectedItem.spanSpread
                                ? 'bg-red-500 border-red-300 text-white shadow-sm'
                                : 'bg-white border-[#dfdedb] text-black hover:bg-[#fafafa]'
                            }`}
                          >
                            {selectedItem.spanSpread ? 'ACTIVE' : 'OFF'}
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedItem.type === 'text' ? (
                      <div className="space-y-3.5">
                        {/* Text input content */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-[#555555] uppercase block">Content</span>
                          <textarea
                            value={selectedItem.content || ''}
                            rows={3}
                            onChange={(e) => updateSelectedItemProperty('content', e.target.value)}
                            className="w-full border border-[#dfdedb] p-2 text-xs font-sans rounded focus:outline-none focus:border-[#ff4d4d] bg-white text-black"
                          />
                        </div>

                        {/* Classic Typographic scale presets */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-[#555555] uppercase block">Typography Scale</span>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { label: 'Micro', value: 0.018 },
                              { label: 'Body', value: 0.026 },
                              { label: 'Lead', value: 0.035 },
                              { label: 'Header', value: 0.055 },
                              { label: 'Title', value: 0.075 },
                              { label: 'Display', value: 0.09 },
                            ].map((scale) => (
                              <button
                                key={scale.label}
                                onClick={() => updateSelectedItemProperty('fontSize', scale.value)}
                                className={`px-1 py-1 text-[9px] font-bold uppercase border rounded text-center transition ${
                                  Math.abs((selectedItem.fontSize || 0.026) - scale.value) < 0.005
                                    ? 'bg-[#1a1a1a] border-black text-white'
                                    : 'bg-white border-[#dfdedb] text-[#555555] hover:bg-[#fafafa]'
                                }`}
                              >
                                {scale.label}
                              </button>
                            ))}
                          </div>
                          
                          {/* Fine-grain custom size slider */}
                          <div className="pt-1 flex items-center justify-between text-[9px] font-mono">
                            <span className="text-[#777777]">FINE-GRAIN SIZE</span>
                            <span className="font-bold text-black">{((selectedItem.fontSize || 0.026) * 1000).toFixed(0)}pt</span>
                          </div>
                          <input
                            type="range"
                            min="0.01"
                            max="0.15"
                            step="0.005"
                            value={selectedItem.fontSize || 0.026}
                            onChange={(e) => updateSelectedItemProperty('fontSize', parseFloat(e.target.value))}
                            className="w-full accent-black h-1 bg-[#dfdedb] rounded cursor-pointer"
                          />
                        </div>

                        {/* Font Family selector */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-[#555555] uppercase block">Font Family</span>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { value: 'sans', label: 'Grotesque' },
                              { value: 'serif', label: 'Roman' },
                              { value: 'mono', label: 'System' },
                            ].map((family) => (
                              <button
                                key={family.value}
                                onClick={() => updateSelectedItemProperty('fontFamily', family.value)}
                                className={`py-1 text-[9px] font-mono font-bold uppercase border rounded transition ${
                                  selectedItem.fontFamily === family.value || (!selectedItem.fontFamily && family.value === 'serif')
                                    ? 'bg-[#1a1a1a] border-black text-white'
                                    : 'bg-white border-[#dfdedb] text-[#555555] hover:bg-[#fafafa]'
                                }`}
                              >
                                {family.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Font Weight */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-[#555555] uppercase block">Font Weight</span>
                          <div className="grid grid-cols-5 gap-0.5">
                            {[
                              { value: 'light', label: 'L' },
                              { value: 'normal', label: 'N' },
                              { value: 'semibold', label: 'SB' },
                              { value: 'bold', label: 'B' },
                              { value: 'extrabold', label: 'XB' },
                            ].map((weight) => (
                              <button
                                key={weight.value}
                                onClick={() => updateSelectedItemProperty('fontWeight', weight.value)}
                                className={`py-1 text-[9px] font-bold uppercase border rounded transition ${
                                  selectedItem.fontWeight === weight.value || (!selectedItem.fontWeight && weight.value === 'normal')
                                    ? 'bg-[#1a1a1a] border-black text-white'
                                    : 'bg-white border-[#dfdedb] text-[#555555] hover:bg-[#fafafa]'
                                }`}
                                title={weight.value}
                              >
                                {weight.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Alignment and Case casing */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-[#555555] uppercase block">Alignment</span>
                            <div className="flex gap-1">
                              {[
                                { value: 'left', icon: AlignLeft },
                                { value: 'center', icon: AlignCenter },
                                { value: 'right', icon: AlignRight },
                                { value: 'justify', icon: AlignJustify },
                              ].map((align) => {
                                const Icon = align.icon;
                                return (
                                  <button
                                    key={align.value}
                                    onClick={() => updateSelectedItemProperty('alignment', align.value)}
                                    className={`p-1.5 border rounded flex-1 flex justify-center transition ${
                                      selectedItem.alignment === align.value || (!selectedItem.alignment && align.value === 'left')
                                        ? 'bg-[#1a1a1a] border-black text-white'
                                        : 'bg-white border-[#dfdedb] text-[#555555] hover:bg-[#fafafa]'
                                    }`}
                                    title={align.value}
                                  >
                                    <Icon size={12} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-[#555555] uppercase block">Casing</span>
                            <button
                              onClick={() => updateSelectedItemProperty('uppercase', !selectedItem.uppercase)}
                              className={`w-full py-1.5 text-[9px] font-bold uppercase border rounded transition ${
                                selectedItem.uppercase
                                  ? 'bg-[#1a1a1a] border-black text-white'
                                  : 'bg-white border-[#dfdedb] text-[#555555]'
                              }`}
                            >
                              {selectedItem.uppercase ? 'UPPERCASE ONLY' : 'Standard Case'}
                            </button>
                          </div>
                        </div>

                        {/* Line Height & Letter Spacing */}
                        <div className="space-y-2 pt-1 border-t border-[#dfdedb]/50">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-mono text-[#777777]">
                              <span className="uppercase">Line Leading (Height)</span>
                              <span className="font-bold text-black">{selectedItem.lineHeight || 1.45}</span>
                            </div>
                            <input
                              type="range"
                              min="1.0"
                              max="2.2"
                              step="0.05"
                              value={selectedItem.lineHeight || 1.45}
                              onChange={(e) => updateSelectedItemProperty('lineHeight', parseFloat(e.target.value))}
                              className="w-full accent-black h-1 bg-[#dfdedb] rounded cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-[#555555] uppercase block">Letter Tracking</span>
                            <div className="grid grid-cols-5 gap-0.5">
                              {['tighter', 'tight', 'normal', 'wide', 'widest'].map((track) => (
                                <button
                                  key={track}
                                  onClick={() => updateSelectedItemProperty('letterSpacing', track)}
                                  className={`py-1 text-[8px] font-bold uppercase border rounded text-center transition truncate ${
                                    selectedItem.letterSpacing === track || (!selectedItem.letterSpacing && track === 'normal')
                                      ? 'bg-[#1a1a1a] border-black text-white'
                                      : 'bg-white border-[#dfdedb] text-[#555555] hover:bg-[#fafafa]'
                                  }`}
                                  title={track}
                                >
                                  {track}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Color swatches */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-[#555555] uppercase block">Color Swatches</span>
                          <div className="flex gap-2 bg-white border border-[#dfdedb] p-2 rounded justify-between">
                            {[
                              { label: 'Red', value: '#e63946' },
                              { label: 'Black', value: '#1a1a1a' },
                              { label: 'Graphite', value: '#444444' },
                              { label: 'Grey', value: '#777777' },
                              { label: 'White', value: '#ffffff' },
                            ].map((color) => (
                              <button
                                key={color.value}
                                onClick={() => updateSelectedItemProperty('color', color.value)}
                                className={`h-6 w-6 rounded-full border shadow-sm transition-transform hover:scale-110 flex items-center justify-center`}
                                style={{
                                  backgroundColor: color.value,
                                  borderColor: selectedItem.color === color.value ? '#ff4d4d' : '#dfdedb',
                                  borderWidth: selectedItem.color === color.value ? '2px' : '1px'
                                }}
                                title={color.label}
                              >
                                {selectedItem.color === color.value && (
                                  <Check size={10} className={color.value === '#ffffff' ? 'text-black' : 'text-white'} />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-[#777777] leading-relaxed italic p-2 border border-dashed border-[#dfdedb] rounded bg-white">
                        Standard visual geometry (images or models) can be resized on the canvas using corner grab handles or drag-moved directly.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-[#dfdedb] p-4 text-center">
                  <p className="text-xs text-[#777777]">
                    {isEditMode
                      ? 'Click any page component to modify its values, size or delete it.'
                      : 'Turn on EDIT MODE to select and re-align components.'}
                  </p>
                </div>
              )}

              <div className="h-[1px] bg-[#dfdedb]"></div>

              {/* ASSET DRAWER CONTENT */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold tracking-widest text-[#777777] uppercase">
                  Asset Drawer
                </h3>

                <div className="space-y-3">
                  {/* Category titles */}
                  <span className="text-[9px] font-bold text-[#999999] uppercase tracking-wider block">
                    Available Page Assets
                  </span>

                  {/* Layout asset buttons */}
                  <div className="grid grid-cols-1 gap-2">
                    {/* Plain Text Column Option */}
                    <button
                      onClick={() =>
                        handleAddAsset({
                          id: 'text-body',
                          type: 'text',
                          name: 'Typography Column',
                          src: 'body',
                        })
                      }
                      draggable={isEditMode}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          'application/json',
                          JSON.stringify({ type: 'text', src: 'body' })
                        );
                      }}
                      className="flex items-center gap-3 w-full border border-[#dfdedb] p-2.5 text-left hover:bg-[#fafafa] transition rounded group cursor-grab active:cursor-grabbing"
                    >
                      <div className="h-10 w-10 border border-[#dfdedb] flex items-center justify-center bg-[#fdfcfb] font-serif font-bold text-lg select-none">
                        T
                      </div>
                      <div className="text-xs truncate select-none">
                        <span className="font-bold block uppercase">Typography Column</span>
                        <span className="text-[#777777] text-[10px]">Add Swiss Grotesque Paragraph</span>
                      </div>
                    </button>

                    {/* Headline Option */}
                    <button
                      onClick={() =>
                        handleAddAsset({
                          id: 'text-head',
                          type: 'text',
                          name: 'Display Headline',
                          src: 'headline',
                        })
                      }
                      draggable={isEditMode}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          'application/json',
                          JSON.stringify({ type: 'text', src: 'headline' })
                        );
                      }}
                      className="flex items-center gap-3 w-full border border-[#dfdedb] p-2.5 text-left hover:bg-[#fafafa] transition rounded group cursor-grab active:cursor-grabbing"
                    >
                      <div className="h-10 w-10 border border-[#dfdedb] flex items-center justify-center bg-[#fdfcfb] font-bold text-xs uppercase tracking-tight select-none">
                        TITLE
                      </div>
                      <div className="text-xs truncate select-none">
                        <span className="font-bold block uppercase">Display Headline</span>
                        <span className="text-[#777777] text-[10px]">Large Müller-Brockmann Header</span>
                      </div>
                    </button>

                    {/* Image Thumbnail assets */}
                    {drawerAssets
                      .filter((asset) => asset.type === 'image')
                      .map((asset) => (
                        <button
                          key={asset.id}
                          onClick={() => handleAddAsset(asset)}
                          draggable={isEditMode}
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              'application/json',
                              JSON.stringify({ type: asset.type, src: asset.src })
                            );
                          }}
                          className="flex items-center gap-3 w-full border border-[#dfdedb] p-2 hover:bg-[#fafafa] transition rounded text-left group cursor-grab active:cursor-grabbing"
                        >
                          <img
                            src={asset.src}
                            alt={asset.name}
                            referrerPolicy="no-referrer"
                            className="h-10 w-10 object-cover border border-[#dfdedb] filter grayscale group-hover:grayscale-0 transition select-none"
                          />
                          <div className="text-xs truncate select-none">
                            <span className="font-bold block uppercase truncate">{asset.name}</span>
                            <span className="text-[#777777] text-[10px] uppercase font-mono">Image Asset</span>
                          </div>
                        </button>
                      ))}

                    {/* 3D Geometries */}
                    {drawerAssets
                      .filter((asset) => asset.type === 'model')
                      .map((asset) => (
                        <button
                          key={asset.id}
                          onClick={() => handleAddAsset(asset)}
                          draggable={isEditMode}
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              'application/json',
                              JSON.stringify({ type: asset.type, src: asset.src })
                            );
                          }}
                          className="flex items-center gap-3 w-full border border-[#dfdedb] p-2.5 text-left hover:bg-[#fafafa] transition rounded group cursor-grab active:cursor-grabbing"
                        >
                          <div className="h-10 w-10 border border-[#dfdedb] flex items-center justify-center bg-[#18181b] text-white text-[10px] font-bold uppercase rounded-sm select-none">
                            3D
                          </div>
                          <div className="text-xs truncate select-none">
                            <span className="font-bold block uppercase">{asset.name}</span>
                            <span className="text-[#777777] text-[10px] uppercase font-mono">
                              Procedural Model
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* 5. Minimal Monochromatic Toast Notifications */}
      {toast.show && (
        <div className="absolute bottom-24 right-6 bg-[#1a1a1a] text-white border border-[#333333] px-5 py-4 shadow-lg flex items-center gap-3 max-w-sm z-30 animate-fade-in rounded-sm">
          <Check size={16} className="text-[#ff4d4d] shrink-0" />
          <p className="text-xs font-bold uppercase tracking-wider leading-relaxed">
            {toast.message}
          </p>
        </div>
      )}
    </div>
  );
}

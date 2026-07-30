import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useState, useEffect, useCallback } from 'react';
import { useGridStore } from './useGridStore';
import { savePageLayout, fetchLocalAssets, saveProjectToLocal, loadProjectFromLocal, exportToBlob, parseImport, LocalAsset } from './MockGitAPI';
import PaperFlipbook from './PaperFlipbook';
import PageCanvas2D from './PageCanvas2D';
import SpreadRenderer from './SpreadRenderer';
import { Plus, Trash2, Check, ArrowRight, Layout, Save, Eye, FolderOpen, Grid, RefreshCw, Compass, Undo2, Redo2, Download, Upload, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

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
  const setPageItems = useGridStore((state) => state.setPageItems);
  const updateItemProperty = useGridStore((state) => state.updateItemProperty);
  const undo = useGridStore((state) => state.undo);
  const redo = useGridStore((state) => state.redo);
  const exportProject = useGridStore((state) => state.exportProject);
  const importProject = useGridStore((state) => state.importProject);
  const docStore = useGridStore((state) => state.document);

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

  // Active spread mapping
  const activePage = pages[activePageIndex];

  // Keyboard shortcuts: Ctrl+Z undo, Ctrl+Shift+Z redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) { redo(); } else { undo(); }
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // Auto-save project to localStorage on document change
  useEffect(() => {
    const timer = setTimeout(() => {
      try { saveProjectToLocal(exportProject()); } catch {}
    }, 2000);
    return () => clearTimeout(timer);
  }, [docStore, exportProject]);

  // Restore project from localStorage on mount
  useEffect(() => {
    const saved = loadProjectFromLocal();
    if (saved) {
      const result = importProject(saved);
      if (result.success) {
        console.log('Project restored from localStorage');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch local assets when active page changes
  useEffect(() => {
    if (activePage) {
      fetchLocalAssets(activePage.folderPath).then((assets) => {
        setDrawerAssets(assets);
      });
    }
  }, [activePageIndex, activePage?.folderPath]);

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

    const colMax = activePage.gridSettings.columns;
    const rowMax = activePage.gridSettings.rows;

    const newItems = [
      {
        type: 'text' as const,
        src: 'headline',
        content: 'GRID & FORM',
        gridArea: { colStart: 1, colEnd: Math.min(colMax, 3), rowStart: 1, rowEnd: 1 },
        fontSize: 0.055,
        color: '#111111',
      },
      {
        type: 'image' as const,
        src: activePage.assets[0] || 'https://images.unsplash.com/photo-1541824894926-3c58ec3ce706?auto=format&fit=crop&w=800&q=80',
        gridArea: {
          colStart: Math.min(colMax, 2),
          colEnd: colMax,
          rowStart: 2,
          rowEnd: Math.min(rowMax, 3)
        },
      },
      {
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
    ] as const;

    setPageItems(activePageIndex, newItems as any);
    triggerToast('Suggested a classic Swiss composition.', 'success');
  };

  const selectedItem = activePage?.items.find((item) => item.id === selectedItemId);

  const updateSelectedItemProperty = useCallback((key: string, value: any) => {
    if (!selectedItem || !activePage) return;
    updateItemProperty(activePageIndex, selectedItem.id, key, value);
  }, [selectedItem, activePage, activePageIndex, updateItemProperty]);

  // Export/Import handlers
  const handleExport = () => {
    const file = exportProject();
    const blob = exportToBlob(file);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dasein-project-${Date.now()}.dasein`;
    a.click();
    URL.revokeObjectURL(url);
    saveProjectToLocal(file);
    triggerToast('Project exported as .dasein file', 'success');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.dasein,application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = parseImport(text);
        if (!parsed) { triggerToast('Invalid .dasein file', 'error'); return; }
        const result = importProject(parsed);
        if (result.success) {
          triggerToast('Project imported successfully', 'success');
        } else {
          triggerToast(result.error || 'Import failed', 'error');
        }
      } catch {
        triggerToast('Failed to read file', 'error');
      }
    };
    input.click();
  };

  // Compute spread data for current view
  const currentSpread = Math.floor((activePageIndex + 1) / 2);
  const spreads = useGridStore((state) => state.document.spreads);
  const spreadData = spreads[currentSpread];

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

          {/* Undo/Redo */}
          {isEditMode && (
            <div className="flex items-center gap-1">
              <button
                onClick={undo}
                className="p-1.5 hover:bg-[#f3f2ef] text-[#555555] hover:text-black border border-transparent hover:border-[#dfdedb] transition rounded"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={14} />
              </button>
              <button
                onClick={redo}
                className="p-1.5 hover:bg-[#f3f2ef] text-[#555555] hover:text-black border border-transparent hover:border-[#dfdedb] transition rounded"
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 size={14} />
              </button>
            </div>
          )}

          {/* Export/Import */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold uppercase bg-white border border-[#dfdedb] text-[#555555] hover:border-[#1a1a1a] hover:text-black transition"
              title="Export .dasein project file"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold uppercase bg-white border border-[#dfdedb] text-[#555555] hover:border-[#1a1a1a] hover:text-black transition"
              title="Import .dasein project file"
            >
              <Upload size={13} />
              <span className="hidden sm:inline">Import</span>
            </button>
          </div>

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
                /* DUAL PAGES SIDE-BY-SIDE (OPENED BOOK SPREAD) via SpreadRenderer */
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="flex justify-between w-full max-w-4xl px-2 text-[10px] font-bold text-[#777777] uppercase tracking-wider">
                    <span>Left Page (Page {currentSpread * 2 - 1})</span>
                    <span>Spread {currentSpread}</span>
                    <span>Right Page (Page {currentSpread * 2})</span>
                  </div>

                  {spreadData ? (
                    <SpreadRenderer
                      spread={spreadData}
                      leftPage={pages[currentSpread * 2 - 1]}
                      rightPage={pages[currentSpread * 2]}
                      activePageIndex={activePageIndex}
                      onPageClick={(idx) => { setActivePageIndex(idx); setSelectedItemId(null); }}
                      showGridLines={showGridLines}
                    />
                  ) : (
                    <div className="flex w-full max-w-4xl shadow-2xl relative bg-white border border-[#dfdedb]">
                      <div className="w-1/2 border-r border-[#e3e2de] relative">
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
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-black/[0.04] pointer-events-none" />
                      </div>
                      <div className="w-1/2 relative">
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
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-l from-transparent to-black/[0.04] pointer-events-none" />
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-[#dfdedb] shadow-inner pointer-events-none z-10" />
                    </div>
                  )}
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

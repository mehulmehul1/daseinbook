import { create } from 'zustand';
import {
  Page, PageItem, GridSettings, GridArea, ItemType,
  Spread, BleedItem, DaseinFile,
} from './types';

// ── Internal Types ────────────────────────────────────

interface DaseinDocument {
  spreads: Spread[];
  pagesById: Record<string, Page>;
  gridDefaults: GridSettings;
}

// ── Helpers ────────────────────────────────────────────

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Rebuild pages[] array from spreads order + pagesById, appending any orphans. */
function derivePages(document: DaseinDocument): Page[] {
  const ordered: Page[] = [];
  const added = new Set<string>();
  for (const spread of document.spreads) {
    if (spread.leftPageId && document.pagesById[spread.leftPageId]) {
      const p = document.pagesById[spread.leftPageId];
      if (!added.has(p.id)) { ordered.push(p); added.add(p.id); }
    }
    if (spread.rightPageId && document.pagesById[spread.rightPageId]) {
      const p = document.pagesById[spread.rightPageId];
      if (!added.has(p.id)) { ordered.push(p); added.add(p.id); }
    }
  }
  for (const [id, page] of Object.entries(document.pagesById)) {
    if (!added.has(id)) ordered.push(page);
  }
  return ordered;
}

// ── Defaults ───────────────────────────────────────────

const defaultGridSettings: GridSettings = {
  columns: 4,
  rows: 4,
  margins: { top: 0.12, bottom: 0.12, left: 0.1, right: 0.1 },
  columnGutter: 0.03,
  rowGutter: 0.03,
};

// ── Initial Pages ──────────────────────────────────────

const INITIAL_PAGES: Page[] = [
  {
    id: 'cover', title: 'COVER', folderPath: '/pages/cover',
    assets: ['https://images.unsplash.com/photo-1541824894926-3c58ec3ce706?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'],
    gridSettings: { columns: 3, rows: 4, margins: { top: 0.15, bottom: 0.15, left: 0.12, right: 0.12 }, columnGutter: 0.04, rowGutter: 0.04 },
    items: [
      { id: 'cover-eyebrow', type: 'text', src: '', content: 'MÜLLER-BROCKMANN SYSTEM', gridArea: { colStart: 1, colEnd: 4, rowStart: 1, rowEnd: 1 }, fontSize: 0.035, color: '#777777' },
      { id: 'cover-title', type: 'text', src: '', content: 'GRID SYSTEMS\nIN GRAPHIC DESIGN', gridArea: { colStart: 1, colEnd: 4, rowStart: 2, rowEnd: 3 }, fontSize: 0.09, color: '#000000' },
      { id: 'cover-geometry', type: 'model', src: 'torus', gridArea: { colStart: 1, colEnd: 4, rowStart: 3, rowEnd: 4 }, modelScale: 0.45, modelRotation: [0.5, 0.5, 0] },
      { id: 'cover-footer', type: 'text', src: '', content: 'SWISS DESIGN-STUDIO MANUAL\nN° 01 / EDITORIAL LAYOUT ENGINE', gridArea: { colStart: 1, colEnd: 4, rowStart: 4, rowEnd: 4 }, fontSize: 0.026, color: '#333333' },
    ],
  },
  {
    id: 'intro-left', title: 'T.O.C. & THEORY', folderPath: '/pages/spread1-left',
    assets: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'],
    gridSettings: { ...defaultGridSettings },
    items: [
      { id: 'toc-label', type: 'text', src: '', content: 'INDEX / CONTENTS', gridArea: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 1 }, fontSize: 0.038, color: '#999999' },
      { id: 'toc-items', type: 'text', src: '', content: '01  /  INTRODUCTION TO GRID THEORY\n02  /  THE MODULAR SYSTEM\n03  /  INTERACTIVE WEBGL GRID SANDBOX\n04  /  PRODUCTION EXPORT PIPELINE', gridArea: { colStart: 1, colEnd: 5, rowStart: 2, rowEnd: 3 }, fontSize: 0.035, color: '#000000' },
      { id: 'toc-footnote', type: 'text', src: '', content: '"The grid system is an aid, not a guarantee."', gridArea: { colStart: 1, colEnd: 5, rowStart: 4, rowEnd: 4 }, fontSize: 0.028, color: '#555555' },
    ],
  },
  {
    id: 'intro-right', title: 'VISUAL COMPOSITION', folderPath: '/pages/spread1-right',
    assets: ['https://images.unsplash.com/photo-1541824894926-3c58ec3ce706?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=800&q=80'],
    gridSettings: { ...defaultGridSettings },
    items: [
      { id: 'intro-image', type: 'image', src: 'https://images.unsplash.com/photo-1541824894926-3c58ec3ce706?auto=format&fit=crop&w=800&q=80', gridArea: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 3 } },
      { id: 'intro-caption', type: 'text', src: '', content: 'STRUCTURAL FORM\nBrutalist concrete architecture.', gridArea: { colStart: 1, colEnd: 3, rowStart: 4, rowEnd: 4 }, fontSize: 0.025, color: '#222222' },
      { id: 'intro-subimage', type: 'image', src: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=800&q=80', gridArea: { colStart: 3, colEnd: 5, rowStart: 4, rowEnd: 4 } },
    ],
  },
  {
    id: 'gltf-left', title: '3D GRID OBJECTS', folderPath: '/pages/spread2-left',
    assets: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'],
    gridSettings: { ...defaultGridSettings },
    items: [
      { id: 'gltf-header', type: 'text', src: '', content: 'DIMENSIONAL OBJECTS\nMODULAR ALIGNMENTS', gridArea: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 1 }, fontSize: 0.04, color: '#000000' },
      { id: 'gltf-desc', type: 'text', src: '', content: 'Grids are not confined to two dimensions.', gridArea: { colStart: 1, colEnd: 5, rowStart: 2, rowEnd: 2 }, fontSize: 0.028, color: '#555555' },
      { id: 'gltf-model-1', type: 'model', src: 'knot', gridArea: { colStart: 1, colEnd: 3, rowStart: 3, rowEnd: 4 }, modelScale: 0.45 },
      { id: 'gltf-model-2', type: 'model', src: 'sphere', gridArea: { colStart: 3, colEnd: 5, rowStart: 3, rowEnd: 4 }, modelScale: 0.45 },
    ],
  },
  {
    id: 'gltf-right', title: 'THE MODULAR GRID', folderPath: '/pages/spread2-right',
    assets: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'],
    gridSettings: { ...defaultGridSettings },
    items: [
      { id: 'grid-right-img', type: 'image', src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', gridArea: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 3 } },
      { id: 'grid-right-text', type: 'text', src: '', content: 'RHYTHMIC REPETITION\nThe skyscraper facade reflects a clean mathematical grid.', gridArea: { colStart: 1, colEnd: 5, rowStart: 4, rowEnd: 4 }, fontSize: 0.026, color: '#444444' },
    ],
  },
  {
    id: 'sandbox-left', title: 'INTERACTIVE CANVAS', folderPath: '/pages/spread3-left',
    assets: ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'],
    gridSettings: { ...defaultGridSettings },
    items: [
      { id: 'sandbox-title', type: 'text', src: '', content: 'DESIGN SANDBOX\nDRAG & ALIGN ITEMS', gridArea: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 1 }, fontSize: 0.036, color: '#000000' },
      { id: 'sandbox-instr', type: 'text', src: '', content: 'Turn on EDIT MODE in the header.', gridArea: { colStart: 1, colEnd: 5, rowStart: 2, rowEnd: 2 }, fontSize: 0.026, color: '#555555' },
      { id: 'sandbox-pic', type: 'image', src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', gridArea: { colStart: 1, colEnd: 5, rowStart: 3, rowEnd: 4 } },
    ],
  },
  {
    id: 'sandbox-right', title: 'LAYOUT COMPOSTER', folderPath: '/pages/spread3-right',
    assets: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'],
    gridSettings: { columns: 3, rows: 4, margins: { top: 0.12, bottom: 0.12, left: 0.1, right: 0.1 }, columnGutter: 0.03, rowGutter: 0.03 },
    items: [
      { id: 'sandbox-r-header', type: 'text', src: '', content: 'GRID CELL ALIGN', gridArea: { colStart: 1, colEnd: 4, rowStart: 1, rowEnd: 1 }, fontSize: 0.036, color: '#111111' },
      { id: 'sandbox-r-text', type: 'text', src: '', content: 'Create your perfect spread.\nAlign, compose, save.', gridArea: { colStart: 1, colEnd: 3, rowStart: 2, rowEnd: 2 }, fontSize: 0.028, color: '#666666' },
      { id: 'sandbox-r-model', type: 'model', src: 'box', gridArea: { colStart: 1, colEnd: 4, rowStart: 3, rowEnd: 4 }, modelScale: 0.5, modelRotation: [0.4, 0.4, 0] },
    ],
  },
];

function buildInitialDocument(): DaseinDocument {
  const pagesById: Record<string, Page> = {};
  for (const page of INITIAL_PAGES) pagesById[page.id] = deepClone(page);
  return {
    spreads: [
      { id: 'spread-cover', leftPageId: 'cover', rightPageId: null, bleedItems: [] },
      { id: 'spread-1', leftPageId: 'intro-left', rightPageId: 'intro-right', bleedItems: [] },
      { id: 'spread-2', leftPageId: 'gltf-left', rightPageId: 'gltf-right', bleedItems: [] },
      { id: 'spread-3', leftPageId: 'sandbox-left', rightPageId: 'sandbox-right', bleedItems: [] },
    ],
    pagesById,
    gridDefaults: { ...defaultGridSettings },
  };
}

const INITIAL_DOC = buildInitialDocument();

// ── Store Type ────────────────────────────────────────

interface GridState {
  // Backward-compat root-level props
  pages: Page[];
  activePageIndex: number;
  isEditMode: boolean;
  selectedItemId: string | null;

  // Internal organized state
  document: DaseinDocument;

  // Undo history
  history: DaseinDocument[];
  historyIndex: number;

  // ── Actions ──
  undo: () => void;
  redo: () => void;
  pushSnapshot: () => void;

  // Spread actions (new)
  addSpread: (leftPageId: string, rightPageId: string | null) => void;
  removeSpread: (id: string) => void;
  addBleedItem: (spreadId: string, item: Omit<BleedItem, 'id'>) => void;
  updateBleedItem: (spreadId: string, itemId: string, updates: Partial<BleedItem>) => void;
  removeBleedItem: (spreadId: string, itemId: string) => void;

  // Page actions
  addNewPage: () => void;               // backward-compat name
  removePage: (pageId: string) => void; // new (by ID)

  // Item actions (backward-compat: by pageIndex)
  updateItemGridArea: (pageIndex: number, itemId: string, newGridArea: GridArea) => void;
  deleteItem: (pageIndex: number, itemId: string) => void;
  addItemToPage: (pageIndex: number, item: Omit<PageItem, 'id'>) => void;
  updateGridSettings: (pageIndex: number, newSettings: Partial<GridSettings>) => void;
  setPageItems: (pageIndex: number, items: PageItem[]) => void;
  updateItemProperty: (pageIndex: number, itemId: string, key: string, value: any) => void;
  updateItemNoSnapshot: (pageIndex: number, itemId: string, updates: Partial<PageItem>) => void;

  // UI actions
  setActivePageIndex: (index: number) => void;
  setIsEditMode: (v: boolean) => void;
  setSelectedItemId: (id: string | null) => void;

  // Persistence (new)
  exportProject: () => DaseinFile;
  importProject: (file: DaseinFile) => { success: boolean; error?: string };
}

// ── Store Implementation ──────────────────────────────

export const useGridStore = create<GridState>((set, get) => ({
  // Root-level (backward compat)
  pages: derivePages(INITIAL_DOC),
  activePageIndex: 0,
  isEditMode: false,
  selectedItemId: null,

  // Internal
  document: deepClone(INITIAL_DOC),
  history: [],
  historyIndex: -1,

  // ─── History ──────────────────────────────────────

  pushSnapshot: () => {
    const { document, history, historyIndex } = get();
    const snapshot = deepClone(document);
    const trimmed = history.slice(0, historyIndex + 1);
    trimmed.push(snapshot);
    if (trimmed.length > 50) trimmed.shift();
    set({ history: trimmed, historyIndex: trimmed.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < 0) return;
    const prev = history[historyIndex];
    const doc = deepClone(prev);
    const pages = derivePages(doc);
    set({ document: doc, pages, historyIndex: historyIndex - 1 });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 2) return;
    const next = history[historyIndex + 2];
    if (!next) return;
    const doc = deepClone(next);
    const pages = derivePages(doc);
    set({ document: doc, pages, historyIndex: historyIndex + 1 });
  },

  // ─── Spreads ──────────────────────────────────────

  addSpread: (leftPageId, rightPageId) => {
    get().pushSnapshot();
    set((state) => {
      const spreads = [...state.document.spreads, { id: generateId(), leftPageId, rightPageId, bleedItems: [] }];
      const document = { ...state.document, spreads };
      return { document, pages: derivePages(document) };
    });
  },

  removeSpread: (id) => {
    get().pushSnapshot();
    set((state) => {
      const document = { ...state.document, spreads: state.document.spreads.filter((s) => s.id !== id) };
      return { document, pages: derivePages(document) };
    });
  },

  addBleedItem: (spreadId, item) => {
    get().pushSnapshot();
    set((state) => {
      const spreads = state.document.spreads.map((s) =>
        s.id === spreadId ? { ...s, bleedItems: [...s.bleedItems, { ...item, id: generateId() }] } : s
      );
      const newDoc = { ...state.document, spreads };
      return { document: newDoc, pages: derivePages(newDoc) };
    });
  },

  updateBleedItem: (spreadId, itemId, updates) => {
    get().pushSnapshot();
    set((state) => {
      const spreads = state.document.spreads.map((s) =>
        s.id === spreadId
          ? { ...s, bleedItems: s.bleedItems.map((b) => (b.id === itemId ? { ...b, ...updates } : b)) }
          : s
      );
      const newDoc = { ...state.document, spreads };
      return { document: newDoc, pages: derivePages(newDoc) };
    });
  },

  removeBleedItem: (spreadId, itemId) => {
    get().pushSnapshot();
    set((state) => {
      const spreads = state.document.spreads.map((s) =>
        s.id === spreadId ? { ...s, bleedItems: s.bleedItems.filter((b) => b.id !== itemId) } : s
      );
      const newDoc = { ...state.document, spreads };
      return { document: newDoc, pages: derivePages(newDoc) };
    });
  },

  // ─── Pages ────────────────────────────────────────

  /** @deprecated Use addPage() for pageId return, kept for backward compat */
  addNewPage: () => {
    get().pushSnapshot();
    set((state) => {
      const newId = generateId();
      const newPage: Page = {
        id: newId,
        title: `PAGE ${Object.keys(state.document.pagesById).length + 1}`,
        folderPath: `/pages/custom-${newId}`,
        assets: [],
        gridSettings: { ...state.document.gridDefaults },
        items: [],
      };
      const pagesById = { ...state.document.pagesById, [newId]: newPage };
      const document = { ...state.document, pagesById };
      return { document, pages: derivePages(document) };
    });
  },

  removePage: (pageId) => {
    get().pushSnapshot();
    set((state) => {
      const { [pageId]: _removed, ...pagesById } = state.document.pagesById;
      const spreads = state.document.spreads
        .filter((s) => s.leftPageId !== pageId && s.rightPageId !== pageId)
        .map((s) => ({
          ...s,
          rightPageId: s.rightPageId === pageId ? null : s.rightPageId,
        }));
      const document = { ...state.document, spreads, pagesById };
      return { document, pages: derivePages(document) };
    });
  },

  // ─── Items (by pageIndex) ─────────────────────────

  updateItemGridArea: (pageIndex, itemId, newGridArea) => {
    get().pushSnapshot();
    set((state) => {
      const page = state.pages[pageIndex];
      if (!page) return state;
      const updatedItems = page.items.map((item) =>
        item.id === itemId ? { ...item, gridArea: newGridArea } : item
      );
      const pagesById = { ...state.document.pagesById, [page.id]: { ...page, items: updatedItems } };
      const newDoc = { ...state.document, pagesById };
      return { document: newDoc, pages: derivePages(newDoc) };
    });
  },

  deleteItem: (pageIndex, itemId) => {
    get().pushSnapshot();
    set((state) => {
      const page = state.pages[pageIndex];
      if (!page) return state;
      const pagesById = {
        ...state.document.pagesById,
        [page.id]: { ...page, items: page.items.filter((item) => item.id !== itemId) },
      };
      const newDoc = { ...state.document, pagesById };
      return {
        document: newDoc,
        pages: derivePages(newDoc),
        selectedItemId: state.selectedItemId === itemId ? null : state.selectedItemId,
      };
    });
  },

  addItemToPage: (pageIndex, item) => {
    get().pushSnapshot();
    const newItem: PageItem = { ...item, id: generateId() };
    set((state) => {
      const page = state.pages[pageIndex];
      if (!page) return state;
      const pagesById = {
        ...state.document.pagesById,
        [page.id]: { ...page, items: [...page.items, newItem] },
      };
      const newDoc = { ...state.document, pagesById };
      return {
        document: newDoc,
        pages: derivePages(newDoc),
        selectedItemId: newItem.id,
      };
    });
  },

  updateGridSettings: (pageIndex, newSettings) => {
    get().pushSnapshot();
    set((state) => {
      const page = state.pages[pageIndex];
      if (!page) return state;
      const pagesById = {
        ...state.document.pagesById,
        [page.id]: { ...page, gridSettings: { ...page.gridSettings, ...newSettings } },
      };
      const newDoc = { ...state.document, pagesById };
      return { document: newDoc, pages: derivePages(newDoc) };
    });
  },

  setPageItems: (pageIndex, items) => {
    get().pushSnapshot();
    set((state) => {
      const page = state.pages[pageIndex];
      if (!page) return state;
      const pagesById = {
        ...state.document.pagesById,
        [page.id]: { ...page, items },
      };
      const newDoc = { ...state.document, pagesById };
      return { document: newDoc, pages: derivePages(newDoc) };
    });
  },

  updateItemProperty: (pageIndex, itemId, key, value) => {
    get().pushSnapshot();
    set((state) => {
      const page = state.pages[pageIndex];
      if (!page) return state;
      const updatedItems = page.items.map((item) =>
        item.id === itemId ? { ...item, [key]: value } : item
      );
      const pagesById = {
        ...state.document.pagesById,
        [page.id]: { ...page, items: updatedItems },
      };
      const newDoc = { ...state.document, pagesById };
      return { document: newDoc, pages: derivePages(newDoc) };
    });
  },

  /** No-snapshot variant for real-time editing (text content, etc.) */
  updateItemNoSnapshot: (pageIndex, itemId, updates) => {
    set((state) => {
      const page = state.pages[pageIndex];
      if (!page) return state;
      const updatedItems = page.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      );
      const pagesById = {
        ...state.document.pagesById,
        [page.id]: { ...page, items: updatedItems },
      };
      const newDoc = { ...state.document, pagesById };
      return { document: newDoc, pages: derivePages(newDoc) };
    });
  },

  // ─── UI ───────────────────────────────────────────

  setActivePageIndex: (index) => set({ activePageIndex: index }),

  setIsEditMode: (isEditMode) => set({ isEditMode }),

  setSelectedItemId: (id) => set({ selectedItemId: id }),

  // ─── Persistence ──────────────────────────────────

  exportProject: () => ({
    version: 1,
    document: deepClone(get().document),
  }),

  importProject: (file) => {
    if (!file || file.version !== 1 || !file.document) {
      return { success: false, error: 'Invalid .dasein file format' };
    }
    const { spreads, pagesById, gridDefaults } = file.document;
    if (!Array.isArray(spreads) || typeof pagesById !== 'object' || !gridDefaults) {
      return { success: false, error: 'Missing required document fields' };
    }
    for (const spread of spreads) {
      if (!pagesById[spread.leftPageId]) {
        return { success: false, error: `Spread references non-existent page: ${spread.leftPageId}` };
      }
      if (spread.rightPageId && !pagesById[spread.rightPageId]) {
        return { success: false, error: `Spread references non-existent page: ${spread.rightPageId}` };
      }
    }
    const doc = deepClone(file.document);
    set({
      document: doc,
      pages: derivePages(doc),
      history: [],
      historyIndex: -1,
      activePageIndex: 0,
      selectedItemId: null,
      isEditMode: false,
    });
    return { success: true };
  },
}));

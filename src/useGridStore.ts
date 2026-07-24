import { create } from 'zustand';
import { Page, PageItem, GridSettings, GridArea, ItemType } from './types';

interface GridState {
  pages: Page[];
  activePageIndex: number; // Represents the active spread index (0 = cover, 1 = spread 1, 2 = spread 2, etc.)
  isEditMode: boolean;
  selectedItemId: string | null;
  updateItemGridArea: (pageIndex: number, itemId: string, newGridArea: GridArea) => void;
  updateGridSettings: (pageIndex: number, newSettings: Partial<GridSettings>) => void;
  addNewPage: () => void;
  addAssetToPage: (pageIndex: number, asset: string) => void;
  addItemToPage: (pageIndex: number, item: Omit<PageItem, 'id'>) => void;
  deleteItem: (pageIndex: number, itemId: string) => void;
  setActivePageIndex: (index: number) => void;
  setIsEditMode: (isEditMode: boolean) => void;
  setSelectedItemId: (id: string | null) => void;
}

const defaultGridSettings: GridSettings = {
  columns: 4,
  rows: 4,
  margins: { top: 0.12, bottom: 0.12, left: 0.1, right: 0.1 },
  columnGutter: 0.03,
  rowGutter: 0.03,
};

const INITIAL_PAGES: Page[] = [
  {
    id: 'cover',
    title: 'COVER',
    folderPath: '/pages/cover',
    assets: [
      'https://images.unsplash.com/photo-1541824894926-3c58ec3ce706?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
    ],
    gridSettings: {
      columns: 3,
      rows: 4,
      margins: { top: 0.15, bottom: 0.15, left: 0.12, right: 0.12 },
      columnGutter: 0.04,
      rowGutter: 0.04,
    },
    items: [
      {
        id: 'cover-eyebrow',
        type: 'text',
        src: '',
        content: 'MÜLLER-BROCKMANN SYSTEM',
        gridArea: { colStart: 1, colEnd: 4, rowStart: 1, rowEnd: 1 },
        fontSize: 0.035,
        color: '#777777',
      },
      {
        id: 'cover-title',
        type: 'text',
        src: '',
        content: 'GRID SYSTEMS\nIN GRAPHIC DESIGN',
        gridArea: { colStart: 1, colEnd: 4, rowStart: 2, rowEnd: 3 },
        fontSize: 0.09,
        color: '#000000',
      },
      {
        id: 'cover-geometry',
        type: 'model',
        src: 'torus',
        gridArea: { colStart: 1, colEnd: 4, rowStart: 3, rowEnd: 4 },
        modelScale: 0.45,
        modelRotation: [0.5, 0.5, 0],
      },
      {
        id: 'cover-footer',
        type: 'text',
        src: '',
        content: 'SWISS DESIGN-STUDIO MANUAL\nN° 01 / EDITORIAL LAYOUT ENGINE',
        gridArea: { colStart: 1, colEnd: 4, rowStart: 4, rowEnd: 4 },
        fontSize: 0.026,
        color: '#333333',
      }
    ]
  },
  {
    id: 'intro-left',
    title: 'T.O.C. & THEORY',
    folderPath: '/pages/spread1-left',
    assets: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    ],
    gridSettings: {
      columns: 4,
      rows: 4,
      margins: { top: 0.12, bottom: 0.12, left: 0.1, right: 0.1 },
      columnGutter: 0.03,
      rowGutter: 0.03,
    },
    items: [
      {
        id: 'toc-label',
        type: 'text',
        src: '',
        content: 'INDEX / CONTENTS',
        gridArea: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 1 },
        fontSize: 0.038,
        color: '#999999',
      },
      {
        id: 'toc-items',
        type: 'text',
        src: '',
        content: '01  /  INTRODUCTION TO GRID THEORY\n02  /  THE MODULAR SYSTEM OF MÜLLER-BROCKMANN\n03  /  INTERACTIVE WEBGL GRID SANDBOX\n04  /  PRODUCTION EXPORT PIPELINE',
        gridArea: { colStart: 1, colEnd: 5, rowStart: 2, rowEnd: 3 },
        fontSize: 0.035,
        color: '#000000',
      },
      {
        id: 'toc-footnote',
        type: 'text',
        src: '',
        content: '“The grid system is an aid, not a guarantee. It permits a number of possible uses and each designer can look for a solution appropriate to his personal style.”',
        gridArea: { colStart: 1, colEnd: 5, rowStart: 4, rowEnd: 4 },
        fontSize: 0.028,
        color: '#555555',
      }
    ]
  },
  {
    id: 'intro-right',
    title: 'VISUAL COMPOSITION',
    folderPath: '/pages/spread1-right',
    assets: [
      'https://images.unsplash.com/photo-1541824894926-3c58ec3ce706?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=800&q=80',
    ],
    gridSettings: {
      columns: 4,
      rows: 4,
      margins: { top: 0.12, bottom: 0.12, left: 0.1, right: 0.1 },
      columnGutter: 0.03,
      rowGutter: 0.03,
    },
    items: [
      {
        id: 'intro-image',
        type: 'image',
        src: 'https://images.unsplash.com/photo-1541824894926-3c58ec3ce706?auto=format&fit=crop&w=800&q=80',
        gridArea: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 3 },
      },
      {
        id: 'intro-caption',
        type: 'text',
        src: '',
        content: 'STRUCTURAL FORM\nBrutalist concrete architecture represents the solid, uncompromising structure of the physical grid. Order is beauty, mathematics is art.',
        gridArea: { colStart: 1, colEnd: 3, rowStart: 4, rowEnd: 4 },
        fontSize: 0.025,
        color: '#222222',
      },
      {
        id: 'intro-subimage',
        type: 'image',
        src: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=800&q=80',
        gridArea: { colStart: 3, colEnd: 5, rowStart: 4, rowEnd: 4 },
      }
    ]
  },
  {
    id: 'gltf-left',
    title: '3D GRID OBJECTS',
    folderPath: '/pages/spread2-left',
    assets: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    ],
    gridSettings: {
      columns: 4,
      rows: 4,
      margins: { top: 0.12, bottom: 0.12, left: 0.1, right: 0.1 },
      columnGutter: 0.03,
      rowGutter: 0.03,
    },
    items: [
      {
        id: 'gltf-header',
        type: 'text',
        src: '',
        content: 'DIMENSIONAL OBJECTS\nMODULAR ALIGNMENTS',
        gridArea: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 1 },
        fontSize: 0.04,
        color: '#000000',
      },
      {
        id: 'gltf-desc',
        type: 'text',
        src: '',
        content: 'Grids are not confined to two dimensions. When modeling 3D space, we construct a virtual volume of alignment. Designers position 3D geometries inside bounding cell spaces, treating coordinates with identical rhythmic precision.',
        gridArea: { colStart: 1, colEnd: 5, rowStart: 2, rowEnd: 2 },
        fontSize: 0.028,
        color: '#555555',
      },
      {
        id: 'gltf-model-1',
        type: 'model',
        src: 'knot',
        gridArea: { colStart: 1, colEnd: 3, rowStart: 3, rowEnd: 4 },
        modelScale: 0.45,
        modelRotation: [0, 0, 0],
      },
      {
        id: 'gltf-model-2',
        type: 'model',
        src: 'sphere',
        gridArea: { colStart: 3, colEnd: 5, rowStart: 3, rowEnd: 4 },
        modelScale: 0.45,
        modelRotation: [0, 0, 0],
      }
    ]
  },
  {
    id: 'gltf-right',
    title: 'THE MODULAR GRID',
    folderPath: '/pages/spread2-right',
    assets: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
    ],
    gridSettings: {
      columns: 4,
      rows: 4,
      margins: { top: 0.12, bottom: 0.12, left: 0.1, right: 0.1 },
      columnGutter: 0.03,
      rowGutter: 0.03,
    },
    items: [
      {
        id: 'grid-right-img',
        type: 'image',
        src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
        gridArea: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 3 },
      },
      {
        id: 'grid-right-text',
        type: 'text',
        src: '',
        content: 'RHYTHMIC REPETITION\nThe skyscraper facade reflects a clean mathematical grid. Infinite glass cubes aligned horizontally and vertically creating structural rhythm.',
        gridArea: { colStart: 1, colEnd: 5, rowStart: 4, rowEnd: 4 },
        fontSize: 0.026,
        color: '#444444',
      }
    ]
  },
  {
    id: 'sandbox-left',
    title: 'INTERACTIVE CANVAS',
    folderPath: '/pages/spread3-left',
    assets: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    ],
    gridSettings: {
      columns: 4,
      rows: 4,
      margins: { top: 0.12, bottom: 0.12, left: 0.1, right: 0.1 },
      columnGutter: 0.03,
      rowGutter: 0.03,
    },
    items: [
      {
        id: 'sandbox-title',
        type: 'text',
        src: '',
        content: 'DESIGN SANDBOX\nDRAG & ALIGN ITEMS',
        gridArea: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 1 },
        fontSize: 0.036,
        color: '#000000',
      },
      {
        id: 'sandbox-instr',
        type: 'text',
        src: '',
        content: 'Turn on [ EDIT MODE ] in the header. Drag elements from the Asset Drawer (right side) on to the grid, or drag existing components around to snap them to cells dynamically.',
        gridArea: { colStart: 1, colEnd: 5, rowStart: 2, rowEnd: 2 },
        fontSize: 0.026,
        color: '#555555',
      },
      {
        id: 'sandbox-pic',
        type: 'image',
        src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        gridArea: { colStart: 1, colEnd: 5, rowStart: 3, rowEnd: 4 },
      }
    ]
  },
  {
    id: 'sandbox-right',
    title: 'LAYOUT COMPOSTER',
    folderPath: '/pages/spread3-right',
    assets: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541824894926-3c58ec3ce706?auto=format&fit=crop&w=800&q=80'
    ],
    gridSettings: {
      columns: 3,
      rows: 4,
      margins: { top: 0.12, bottom: 0.12, left: 0.1, right: 0.1 },
      columnGutter: 0.03,
      rowGutter: 0.03,
    },
    items: [
      {
        id: 'sandbox-r-header',
        type: 'text',
        src: '',
        content: 'GRID CELL ALIGN',
        gridArea: { colStart: 1, colEnd: 4, rowStart: 1, rowEnd: 1 },
        fontSize: 0.036,
        color: '#111111',
      },
      {
        id: 'sandbox-r-text',
        type: 'text',
        src: '',
        content: 'Create your perfect spread.\nAlign, compose, save.',
        gridArea: { colStart: 1, colEnd: 3, rowStart: 2, rowEnd: 2 },
        fontSize: 0.028,
        color: '#666666',
      },
      {
        id: 'sandbox-r-model',
        type: 'model',
        src: 'box',
        gridArea: { colStart: 1, colEnd: 4, rowStart: 3, rowEnd: 4 },
        modelScale: 0.5,
        modelRotation: [0.4, 0.4, 0],
      }
    ]
  }
];

export const useGridStore = create<GridState>((set) => ({
  pages: INITIAL_PAGES,
  activePageIndex: 0,
  isEditMode: false,
  selectedItemId: null,

  updateItemGridArea: (pageIndex, itemId, newGridArea) =>
    set((state) => {
      const updatedPages = state.pages.map((page, idx) => {
        if (idx !== pageIndex) return page;
        const updatedItems = page.items.map((item) => {
          if (item.id !== itemId) return item;
          return { ...item, gridArea: newGridArea };
        });
        return { ...page, items: updatedItems };
      });
      return { pages: updatedPages };
    }),

  updateGridSettings: (pageIndex, newSettings) =>
    set((state) => {
      const updatedPages = state.pages.map((page, idx) => {
        if (idx !== pageIndex) return page;
        return {
          ...page,
          gridSettings: { ...page.gridSettings, ...newSettings },
        };
      });
      return { pages: updatedPages };
    }),

  addNewPage: () =>
    set((state) => {
      const newIndex = state.pages.length + 1;
      const newPage: Page = {
        id: `page-${Date.now()}`,
        title: `PAGE ${newIndex} / CREATED`,
        folderPath: `/pages/custom-${newIndex}`,
        assets: [
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1541824894926-3c58ec3ce706?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=800&q=80'
        ],
        gridSettings: { ...defaultGridSettings },
        items: [
          {
            id: `title-${Date.now()}`,
            type: 'text',
            src: '',
            content: 'NEW CANVAS SPREAD',
            gridArea: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 1 },
            fontSize: 0.04,
            color: '#000000',
          },
          {
            id: `descr-${Date.now()}`,
            type: 'text',
            src: '',
            content: 'Double click in edit mode to add items or drag them from the drawer.',
            gridArea: { colStart: 1, colEnd: 5, rowStart: 2, rowEnd: 2 },
            fontSize: 0.026,
            color: '#666666',
          }
        ],
      };
      return { pages: [...state.pages, newPage] };
    }),

  addAssetToPage: (pageIndex, asset) =>
    set((state) => {
      const updatedPages = state.pages.map((page, idx) => {
        if (idx !== pageIndex) return page;
        if (page.assets.includes(asset)) return page;
        return { ...page, assets: [...page.assets, asset] };
      });
      return { pages: updatedPages };
    }),

  addItemToPage: (pageIndex, item) =>
    set((state) => {
      const newItem: PageItem = {
        ...item,
        id: `${item.type}-${Date.now()}`,
      };
      const updatedPages = state.pages.map((page, idx) => {
        if (idx !== pageIndex) return page;
        return { ...page, items: [...page.items, newItem] };
      });
      return { pages: updatedPages, selectedItemId: newItem.id };
    }),

  deleteItem: (pageIndex, itemId) =>
    set((state) => {
      const updatedPages = state.pages.map((page, idx) => {
        if (idx !== pageIndex) return page;
        return {
          ...page,
          items: page.items.filter((item) => item.id !== itemId),
        };
      });
      return {
        pages: updatedPages,
        selectedItemId: state.selectedItemId === itemId ? null : state.selectedItemId,
      };
    }),

  setActivePageIndex: (index) => set({ activePageIndex: index }),
  setIsEditMode: (isEditMode) => set({ isEditMode }),
  setSelectedItemId: (id) => set({ selectedItemId: id }),
}));

import { create } from 'zustand';
import { Page, PageItem, GridSettings, GridArea, ItemType, Annotation } from './types';

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
  
  // Annotations system
  addAnnotation: (pageIndex: number, annotation: Omit<Annotation, 'id'>) => void;
  updateAnnotation: (pageIndex: number, annotationId: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (pageIndex: number, annotationId: string) => void;
  toggleSpanSpread: (pageIndex: number, itemId: string) => void;
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
        gridArea: { colStart: 1, colEnd: 3, rowStart: 1, rowEnd: 1 },
        fontSize: 0.035,
        color: '#777777',
      },
      {
        id: 'cover-title',
        type: 'text',
        src: '',
        content: 'GRID SYSTEMS\nIN GRAPHIC DESIGN',
        gridArea: { colStart: 1, colEnd: 3, rowStart: 2, rowEnd: 3 },
        fontSize: 0.09,
        color: '#000000',
      },
      {
        id: 'cover-geometry',
        type: 'model',
        src: 'torus',
        gridArea: { colStart: 1, colEnd: 3, rowStart: 3, rowEnd: 4 },
        modelScale: 0.45,
        modelRotation: [0.5, 0.5, 0],
      },
      {
        id: 'cover-footer',
        type: 'text',
        src: '',
        content: 'SWISS DESIGN-STUDIO MANUAL\nN° 01 / EDITORIAL LAYOUT ENGINE',
        gridArea: { colStart: 1, colEnd: 3, rowStart: 4, rowEnd: 4 },
        fontSize: 0.026,
        color: '#333333',
      }
    ],
    annotations: [
      {
        id: 'ann-cover-1',
        type: 'text',
        x: 10,
        y: 45,
        text: '표지 타이틀 (서체: Helvetica Black 32pt)',
        color: '#e63946',
        fontFamily: 'handwritten',
        fontSize: 16,
        angle: -3,
      },
      {
        id: 'ann-cover-2',
        type: 'arrow',
        x: 0,
        y: 0,
        color: '#e63946',
        points: [[15, 42], [20, 28]],
      },
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
      },
      {
        id: 'spread-image-vegetables',
        type: 'image',
        src: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1200&q=80', // Beautiful gardening image
        gridArea: { colStart: 1, colEnd: 4, rowStart: 3, rowEnd: 3 },
        spanSpread: true, // Spanning across left and right page!
      }
    ],
    annotations: [
      {
        id: 'ann-left-1',
        type: 'text',
        x: 6,
        y: 4,
        text: '판형: 200 x 266mm',
        color: '#e63946',
        fontFamily: 'marker',
        fontSize: 16,
      },
      {
        id: 'ann-left-2',
        type: 'text',
        x: 6,
        y: 8,
        text: '판면: 165 x 232mm',
        color: '#e63946',
        fontFamily: 'marker',
        fontSize: 16,
      },
      {
        id: 'ann-left-3',
        type: 'text',
        x: 45,
        y: 11,
        text: '윤명조 340 - 9pt로 설정하기',
        color: '#e63946',
        fontFamily: 'handwritten',
        fontSize: 18,
        angle: 4,
      },
      {
        id: 'ann-left-4',
        type: 'arrow',
        x: 0,
        y: 0,
        color: '#e63946',
        points: [[50, 15], [35, 23]],
      },
      {
        id: 'ann-left-5',
        type: 'text',
        x: 5,
        y: 85,
        text: '← 텃밭에서 나온 모종과 배양토 (이 여백 넓혀서 5단 정렬 맞추기)',
        color: '#e63946',
        fontFamily: 'handwritten',
        fontSize: 17,
        angle: -1,
      },
      {
        id: 'ann-left-6',
        type: 'line',
        x: 0,
        y: 0,
        color: '#e63946',
        points: [[10, 3], [40, 3]], // Dimension header guide
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
        gridArea: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 2 },
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
    ],
    annotations: [
      {
        id: 'ann-right-1',
        type: 'text',
        x: 15,
        y: 48,
        text: '중간 이미지는 그리드 끝까지 넓혀서 꽉 차게',
        color: '#e63946',
        fontFamily: 'handwritten',
        fontSize: 18,
        angle: -2,
      },
      {
        id: 'ann-right-2',
        type: 'arrow',
        x: 0,
        y: 0,
        color: '#e63946',
        points: [[35, 52], [42, 60]],
      },
      {
        id: 'ann-right-3',
        type: 'circle',
        x: 48,
        y: 5,
        width: 48,
        height: 38,
        color: '#e63946',
      },
      {
        id: 'ann-right-4',
        type: 'text',
        x: 52,
        y: 34,
        text: '선명하고 강하게 (중간 먹조 강화)',
        color: '#e63946',
        fontFamily: 'handwritten',
        fontSize: 17,
        angle: 1,
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

  addAnnotation: (pageIndex, annotation) =>
    set((state) => {
      const newAnnotation: Annotation = {
        ...annotation,
        id: `ann-${Date.now()}`,
      };
      const updatedPages = state.pages.map((page, idx) => {
        if (idx !== pageIndex) return page;
        const annotations = page.annotations || [];
        return { ...page, annotations: [...annotations, newAnnotation] };
      });
      return { pages: updatedPages };
    }),

  updateAnnotation: (pageIndex, annotationId, updates) =>
    set((state) => {
      const updatedPages = state.pages.map((page, idx) => {
        if (idx !== pageIndex) return page;
        const annotations = (page.annotations || []).map((ann) => {
          if (ann.id !== annotationId) return ann;
          return { ...ann, ...updates };
        });
        return { ...page, annotations };
      });
      return { pages: updatedPages };
    }),

  deleteAnnotation: (pageIndex, annotationId) =>
    set((state) => {
      const updatedPages = state.pages.map((page, idx) => {
        if (idx !== pageIndex) return page;
        const annotations = (page.annotations || []).filter((ann) => ann.id !== annotationId);
        return { ...page, annotations };
      });
      return { pages: updatedPages };
    }),

  toggleSpanSpread: (pageIndex, itemId) =>
    set((state) => {
      // Find the item first
      let targetItem: PageItem | undefined;
      state.pages.forEach((p, idx) => {
        if (idx === pageIndex) {
          targetItem = p.items.find((it) => it.id === itemId);
        }
      });

      if (!targetItem) return state;

      // If item is on an even page (Right page, e.g. P2, P4, P6)
      if (pageIndex % 2 === 0 && pageIndex > 0) {
        const leftPageIndex = pageIndex - 1;
        const updatedPages = state.pages.map((page, idx) => {
          if (idx === pageIndex) {
            // Remove from right page
            return { ...page, items: page.items.filter((it) => it.id !== itemId) };
          }
          if (idx === leftPageIndex) {
            // Add to left page with spanSpread enabled
            const newGridArea = {
              colStart: 1,
              colEnd: 8,
              rowStart: targetItem!.gridArea.rowStart,
              rowEnd: targetItem!.gridArea.rowEnd,
            };
            return {
              ...page,
              items: [...page.items, { ...targetItem!, spanSpread: true, gridArea: newGridArea }],
            };
          }
          return page;
        });
        return { pages: updatedPages };
      }

      // If item is on an odd page (Left page, e.g. P1, P3, P5)
      const nextSpanState = !targetItem.spanSpread;
      const updatedPages = state.pages.map((page, idx) => {
        if (idx !== pageIndex) return page;
        const items = page.items.map((item) => {
          if (item.id !== itemId) return item;
          const newGridArea = nextSpanState
            ? { colStart: 1, colEnd: 8, rowStart: item.gridArea.rowStart, rowEnd: item.gridArea.rowEnd }
            : { colStart: 1, colEnd: Math.min(4, item.gridArea.colEnd), rowStart: item.gridArea.rowStart, rowEnd: item.gridArea.rowEnd };
          return { ...item, spanSpread: nextSpanState, gridArea: newGridArea };
        });
        return { ...page, items };
      });
      return { pages: updatedPages };
    }),
}));

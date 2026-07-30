export interface GridSettings {
  columns: number;
  rows: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  columnGutter: number;
  rowGutter: number;
}

export interface GridArea {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
}

export type ItemType = 'image' | 'video' | 'text' | 'model';

export interface PageItem {
  id: string;
  type: ItemType;
  src: string;
  gridArea: GridArea;
  content?: string; // Text content
  modelScale?: number;
  modelRotation?: [number, number, number];
  color?: string; // Hex color or styling
  fontSize?: number;
  fontFamily?: 'sans' | 'serif' | 'mono';
  fontWeight?: 'light' | 'normal' | 'semibold' | 'bold' | 'extrabold';
  alignment?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  uppercase?: boolean;
  letterSpacing?: 'tighter' | 'tight' | 'normal' | 'wide' | 'widest';
  spanSpread?: boolean; // Spans across the entire spread (left to right page)
}

export type AnnotationType = 'text' | 'arrow' | 'circle' | 'line';

export interface Annotation {
  id: string;
  type: AnnotationType;
  x: number; // percentage from left (0 to 100)
  y: number; // percentage from top (0 to 100)
  width?: number; // for circle/box annotations
  height?: number; // for circle/box annotations
  text?: string; // for handwritten label annotations
  color?: string; // e.g. '#e63946' (Swiss red marker)
  points?: [number, number][]; // SVG relative coordinates or [start, end] for arrows/lines
  fontSize?: number; // visual scale of font
  fontFamily?: 'handwritten' | 'marker' | 'caveat';
  angle?: number; // rotation in degrees
}

export interface Page {
  id: string;
  title: string;
  folderPath: string;
  assets: string[];
  gridSettings: GridSettings;
  items: PageItem[];
  annotations?: Annotation[]; // Red pen annotations
}

export interface GridDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

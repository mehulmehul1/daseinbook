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
}

export interface Page {
  id: string;
  title: string;
  folderPath: string;
  assets: string[];
  gridSettings: GridSettings;
  items: PageItem[];
}

export interface GridDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

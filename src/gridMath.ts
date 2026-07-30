import { GridSettings, GridArea, GridDimensions } from './types';

export const PAGE_WIDTH = 1.4;
export const PAGE_HEIGHT = 2.0;

/**
 * Calculates active layout dimensions after subtracting margins
 */
export function getActiveDimensions(settings: GridSettings, width = PAGE_WIDTH, height = PAGE_HEIGHT) {
  const { margins } = settings;
  const activeWidth = width - margins.left - margins.right;
  const activeHeight = height - margins.top - margins.bottom;
  return { activeWidth, activeHeight };
}

/**
 * Calculates the width and height of a single modular cell
 */
export function getCellDimensions(settings: GridSettings, width = PAGE_WIDTH, height = PAGE_HEIGHT) {
  const { columns, rows, columnGutter, rowGutter } = settings;
  const { activeWidth, activeHeight } = getActiveDimensions(settings, width, height);

  const cellWidth = (activeWidth - (columns - 1) * columnGutter) / columns;
  const cellHeight = (activeHeight - (rows - 1) * rowGutter) / rows;

  return {
    cellWidth: Math.max(0.01, cellWidth),
    cellHeight: Math.max(0.01, cellHeight),
  };
}

/**
 * Translates a GridArea (colStart, colEnd, rowStart, rowEnd) into local 3D coordinates.
 * Returns { x, y, width, height } where (x,y) is the center in local R3F coordinates
 * (Origin at page center, X rightwards, Y upwards).
 */
export function getRectFromGridArea(
  gridArea: GridArea,
  settings: GridSettings,
  width = PAGE_WIDTH,
  height = PAGE_HEIGHT
): GridDimensions {
  const { margins, columnGutter, rowGutter, columns, rows } = settings;
  const { cellWidth, cellHeight } = getCellDimensions(settings, width, height);

  // Clamp values to valid grid ranges
  const colS = Math.min(Math.max(1, gridArea.colStart), columns);
  const colE = Math.min(Math.max(colS, gridArea.colEnd), columns);
  const rowS = Math.min(Math.max(1, gridArea.rowStart), rows);
  const rowE = Math.min(Math.max(rowS, gridArea.rowEnd), rows);

  // Compute 2D top-left coordinates where (0,0) is top-left of physical page sheet
  const spanCols = colE - colS + 1;
  const itemWidth = spanCols * cellWidth + (spanCols - 1) * columnGutter;
  const itemLeft = margins.left + (colS - 1) * (cellWidth + columnGutter);

  const spanRows = rowE - rowS + 1;
  const itemHeight = spanRows * cellHeight + (spanRows - 1) * rowGutter;
  const itemTop = margins.top + (rowS - 1) * (cellHeight + rowGutter);

  // Convert to 3D center relative to page center
  // 3D coordinates: X is center-aligned [-width/2, +width/2], Y is center-aligned [-height/2, +height/2]
  const x = -width / 2 + itemLeft + itemWidth / 2;
  const y = height / 2 - itemTop - itemHeight / 2;

  return {
    x,
    y,
    width: itemWidth,
    height: itemHeight,
  };
}

/**
 * Translates a 3D local coordinate (x,y) back into snapped grid boundaries
 * for a specific item span (colSpan, rowSpan).
 */
export function getGridAreaFromCoords(
  localX: number,
  localY: number,
  colSpan: number,
  rowSpan: number,
  settings: GridSettings,
  width = PAGE_WIDTH,
  height = PAGE_HEIGHT
): GridArea {
  const { margins, columnGutter, rowGutter, columns, rows } = settings;
  const { cellWidth, cellHeight } = getCellDimensions(settings, width, height);

  // Convert local 3D center (origin centered) to 2D layout coordinates (origin top-left)
  const px = localX + width / 2;
  const py = height / 2 - localY;

  // We want to find the best colStart and rowStart that centers around (px, py)
  // For an item of certain span, we calculate the top-left of its bounding box.
  // px_item_center = px
  // py_item_center = py
  const itemWidth = colSpan * cellWidth + (colSpan - 1) * columnGutter;
  const itemHeight = rowSpan * cellHeight + (rowSpan - 1) * rowGutter;

  const itemLeft = px - itemWidth / 2;
  const itemTop = py - itemHeight / 2;

  // Find colStart and rowStart based on this itemLeft and itemTop
  let colStart = Math.round((itemLeft - margins.left) / (cellWidth + columnGutter)) + 1;
  let rowStart = Math.round((itemTop - margins.top) / (cellHeight + rowGutter)) + 1;

  // Clamp starting points to guarantee elements stay inside the grid
  colStart = Math.min(Math.max(1, colStart), columns - colSpan + 1);
  rowStart = Math.min(Math.max(1, rowStart), rows - rowSpan + 1);

  const colEnd = colStart + colSpan - 1;
  const rowEnd = rowStart + rowSpan - 1;

  return {
    colStart,
    colEnd,
    rowStart,
    rowEnd,
  };
}

/**
 * Validates that a GridArea falls within the bounds of a page grid.
 * Returns true when all coordinates are within [1, columns] and [1, rows]
 * and colStart <= colEnd, rowStart <= rowEnd.
 */
export function isWithinPageBounds(
  gridArea: GridArea,
  columns: number,
  rows: number
): boolean {
  const { colStart, colEnd, rowStart, rowEnd } = gridArea;
  if (colStart < 1 || colStart > columns) return false;
  if (colEnd < 1 || colEnd > columns) return false;
  if (rowStart < 1 || rowStart > rows) return false;
  if (rowEnd < 1 || rowEnd > rows) return false;
  if (colStart > colEnd) return false;
  if (rowStart > rowEnd) return false;
  return true;
}

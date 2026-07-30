import React from 'react';
import PageCanvas2D from './PageCanvas2D';
import { getRectFromGridArea } from './gridMath';
import { Spread, Page, BleedItem, GridSettings, GridDimensions } from './types';

// ── Props ──────────────────────────────────────────────────────────────────────

interface SpreadRendererProps {
  spread: Spread;
  leftPage: Page;
  rightPage: Page;
  activePageIndex: number;
  onPageClick: (pageIndex: number) => void;
  showGridLines: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_W = 1.4;
const PAGE_H = 2.0;

// ── Helper: convert gridMath rect to spread-relative percentage position ────────

interface SpreadPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

function gridRectToSpreadPosition(
  rect: GridDimensions,
  side: 'left' | 'right',
): SpreadPosition {
  // rect.x / rect.y are the item center in page-local 3D coords
  // (origin at page centre, X right, Y up)
  const itemLeftPageLocal = rect.x - rect.width / 2;
  const itemTopPageLocal = rect.y + rect.height / 2; // Y-up → top edge is higher Y

  // Convert to percentage within a single page
  const pctLeftInPage = ((itemLeftPageLocal + PAGE_W / 2) / PAGE_W) * 100;
  const pctTopInPage = ((PAGE_H / 2 - itemTopPageLocal) / PAGE_H) * 100;
  const pctWidthInPage = (rect.width / PAGE_W) * 100;
  const pctHeightInPage = (rect.height / PAGE_H) * 100;

  // Offset into the spread container (each page occupies 50 % width)
  const spreadLeft = side === 'left' ? pctLeftInPage / 2 : 50 + pctLeftInPage / 2;
  const spreadWidth = pctWidthInPage / 2;

  return {
    left: spreadLeft,
    top: pctTopInPage,
    width: spreadWidth,
    height: pctHeightInPage,
  };
}

// ── Helper: build the positioning for one side of a bleed item ──────────────────

function getBleedSidePosition(
  bleedItem: BleedItem,
  gridSettings: GridSettings | null,
  side: 'left' | 'right',
): SpreadPosition | null {
  const gridArea = side === 'left' ? bleedItem.gridAreaLeft : bleedItem.gridAreaRight;
  if (!gridArea || !gridSettings) return null;

  const rect = getRectFromGridArea(gridArea, gridSettings, PAGE_W, PAGE_H);
  return gridRectToSpreadPosition(rect, side);
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SpreadRenderer({
  spread,
  leftPage,
  rightPage,
  activePageIndex,
  onPageClick,
  showGridLines,
}: SpreadRendererProps) {
  // Determine the correct numeric page indices by finding positions in the
  // (project-level) pages array. The parent passes activePageIndex which reflects
  // the current spread's left page; derive the right index from it.
  const leftPageIndex = activePageIndex;
  const rightPageIndex = activePageIndex + 1;

  // ===== Empty state handlers =====

  const renderLeftPage = () => {
    if (!leftPage) {
      return (
        <div className="aspect-[1.4/2] bg-[#fdfcfb] flex items-center justify-center p-8 text-center text-xs text-[#999999]">
          Page empty
        </div>
      );
    }
    return (
      <PageCanvas2D
        pageIndex={leftPageIndex}
        page={leftPage}
        showGridLines={showGridLines}
      />
    );
  };

  const renderRightPage = () => {
    if (!rightPage) {
      return (
        <div className="aspect-[1.4/2] bg-[#fdfcfb] flex items-center justify-center p-8 text-center text-xs text-[#999999]">
          Page empty
        </div>
      );
    }
    return (
      <PageCanvas2D
        pageIndex={rightPageIndex}
        page={rightPage}
        showGridLines={showGridLines}
      />
    );
  };

  // ===== Bleed items overlay =====

  const renderBleedItems = () => {
    if (!spread.bleedItems || spread.bleedItems.length === 0) return null;

    return (
      <div className="absolute inset-0 z-20 pointer-events-none">
        {spread.bleedItems.map((bleedItem) => {
          // Left-side portion
          const leftPos = getBleedSidePosition(
            bleedItem,
            leftPage?.gridSettings ?? null,
            'left',
          );

          // Right-side portion
          const rightPos =
            bleedItem.gridAreaRight && rightPage?.gridSettings
              ? getBleedSidePosition(
                  bleedItem,
                  rightPage.gridSettings,
                  'right',
                )
              : null;

          return (
            <React.Fragment key={bleedItem.id}>
              {/* Left-page bleed portion */}
              {leftPos && (
                <div
                  className="absolute border border-dashed border-red-400 bg-red-50/20 pointer-events-auto cursor-pointer overflow-hidden"
                  style={{
                    left: `${leftPos.left}%`,
                    top: `${leftPos.top}%`,
                    width: `${leftPos.width}%`,
                    height: `${leftPos.height}%`,
                    zIndex: bleedItem.zIndex ?? 1,
                  }}
                >
                  <span className="absolute top-1 left-1 text-[10px] font-mono font-bold text-red-500 uppercase">
                    {bleedItem.type}
                  </span>
                </div>
              )}

              {/* Right-page bleed portion (only when spread has a right page) */}
              {rightPos && (
                <div
                  className="absolute border border-dashed border-red-400 bg-red-50/20 pointer-events-auto cursor-pointer overflow-hidden"
                  style={{
                    left: `${rightPos.left}%`,
                    top: `${rightPos.top}%`,
                    width: `${rightPos.width}%`,
                    height: `${rightPos.height}%`,
                    zIndex: bleedItem.zIndex ?? 1,
                  }}
                >
                  <span className="absolute top-1 left-1 text-[10px] font-mono font-bold text-red-500 uppercase">
                    {bleedItem.type}
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ===== Main render =====

  return (
    <div
      className="flex w-full max-w-4xl shadow-2xl relative bg-white border border-[#dfdedb]"
      style={{ aspectRatio: '1.4/1' }}
    >
      {/* Click-away / page-click overlay */}
      <div
        className="absolute inset-0 z-0"
        onClick={() => {
          // On a click to the spread background itself, send the left page index
          onPageClick(leftPageIndex);
        }}
      />

      {/* ─── Left page ─────────────────────────────────── */}
      <div className="w-1/2 border-r border-[#e3e2de] relative">
        {renderLeftPage()}

        {/* Subtle shading simulating the inner gutter of the left page */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-black/[0.04] pointer-events-none z-10" />
      </div>

      {/* ─── Right page ────────────────────────────────── */}
      <div className="w-1/2 relative">
        {renderRightPage()}

        {/* Subtle shading simulating the inner gutter of the right page */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-l from-transparent to-black/[0.04] pointer-events-none z-10" />
      </div>

      {/* ─── Center spine line ─────────────────────────── */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-[#dfdedb] shadow-inner pointer-events-none z-10" />

      {/* ─── Bleed items overlay ───────────────────────── */}
      {renderBleedItems()}
    </div>
  );
}

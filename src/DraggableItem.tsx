import { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGridStore } from './useGridStore';
import { getGridAreaFromCoords, getRectFromGridArea } from './gridMath';
import { GridArea, GridSettings, GridDimensions } from './types';

interface DraggableItemProps {
  id: string;
  pageIndex: number;
  gridArea: GridArea;
  gridSettings: GridSettings;
  rect: GridDimensions;
  children: React.ReactNode;
}

export default function DraggableItem({
  id,
  pageIndex,
  gridArea,
  gridSettings,
  rect,
  children,
}: DraggableItemProps) {
  const groupRef = useRef<THREE.Group>(null);
  const updateItemGridArea = useGridStore((state) => state.updateItemGridArea);
  const deleteItem = useGridStore((state) => state.deleteItem);
  const selectedItemId = useGridStore((state) => state.selectedItemId);
  const setSelectedItemId = useGridStore((state) => state.setSelectedItemId);

  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: rect.x, y: rect.y });
  const [snappedArea, setSnappedArea] = useState<GridArea | null>(null);

  const dragOffset = useRef({ x: 0, y: 0 });
  const { size } = useThree();

  const colSpan = gridArea.colEnd - gridArea.colStart + 1;
  const rowSpan = gridArea.rowEnd - gridArea.rowStart + 1;

  // Compute the 3D bounds of the preview snapped area
  const previewRect = useMemo(() => {
    if (!snappedArea) return null;
    return getRectFromGridArea(snappedArea, gridSettings);
  }, [snappedArea, gridSettings]);

  // Pointer Down handler: begins the dragging operation
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    
    // Select this item in global state
    setSelectedItemId(id);
    setIsDragging(true);

    // Calculate local intersection coordinates
    const localPoint = e.point.clone();
    e.eventObject.parent.worldToLocal(localPoint);

    // Store offset between item's actual center and the clicked point on the mesh
    dragOffset.current = {
      x: localPoint.x - rect.x,
      y: localPoint.y - rect.y,
    };

    // Initialize drag position
    setDragPos({ x: rect.x, y: rect.y });
    setSnappedArea(gridArea);

    // Capture pointer events for precision dragging outside item bounds
    e.target.setPointerCapture(e.pointerId);
  };

  // Pointer Move handler: tracks and projects ray onto page layout plane
  const handlePointerMove = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();

    // Mathematically project the mouse ray onto the page plane (z = 0 in local page coordinates)
    const localRay = e.ray.clone();
    const invMatrix = new THREE.Matrix4().copy(e.eventObject.parent.matrixWorld).invert();
    localRay.applyMatrix4(invMatrix);

    // Compute intersection time t: origin.z + t * direction.z = 0 => t = -origin.z / direction.z
    if (Math.abs(localRay.direction.z) > 0.0001) {
      const t = -localRay.origin.z / localRay.direction.z;
      const localIntersect = localRay.origin.clone().add(localRay.direction.clone().multiplyScalar(t));

      // Subtract the original drag click offset to keep the dragging movement aligned to the finger/mouse
      const targetX = localIntersect.x - dragOffset.current.x;
      const targetY = localIntersect.y - dragOffset.current.y;

      setDragPos({ x: targetX, y: targetY });

      // Determine snapped cell area based on current dragging coordinates
      const currentSnapped = getGridAreaFromCoords(
        targetX,
        targetY,
        colSpan,
        rowSpan,
        gridSettings
      );
      setSnappedArea(currentSnapped);
    }
  };

  // Pointer Up handler: finishes the drag, applying new coordinates and resetting local states
  const handlePointerUp = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();

    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);

    if (snappedArea) {
      updateItemGridArea(pageIndex, id, snappedArea);
    }
    setSnappedArea(null);
  };

  const isSelected = selectedItemId === id;

  return (
    <group>
      {/* 1. Dragging Snap Cell Highlight Box (Sits on page z=0.0015 behind the item) */}
      {isDragging && previewRect && (
        <group position={[previewRect.x, previewRect.y, 0.0015]}>
          {/* Snapped zone background tint */}
          <mesh>
            <planeGeometry args={[previewRect.width, previewRect.height]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.15} />
          </mesh>
          {/* Snapped zone delicate grid borders */}
          <mesh>
            <edgesGeometry args={[new THREE.PlaneGeometry(previewRect.width, previewRect.height)]} />
            <lineBasicMaterial color="#3b82f6" linewidth={2} />
          </mesh>
        </group>
      )}

      {/* 2. Actual Dragged/Static Item Group */}
      <group
        ref={groupRef}
        position={[
          isDragging ? dragPos.x : rect.x,
          isDragging ? dragPos.y : rect.y,
          isDragging ? 0.05 : 0.003 // Lift up slightly when dragging to cast shadows
        ]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Child Content */}
        {children}

        {/* Delicate designer selection / dragging bounds outline */}
        {(isSelected || isDragging) && (
          <lineSegments position={[0, 0, 0.006]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(rect.width + 0.01, rect.height + 0.01)]} />
            <lineBasicMaterial color={isDragging ? '#3b82f6' : '#ff4d4d'} linewidth={1.5} />
          </lineSegments>
        )}

        {/* Small corner edit widgets (only visible on selected item in edit mode) */}
        {isSelected && !isDragging && (
          <group position={[rect.width / 2, -rect.height / 2, 0.008]}>
            {/* Dot marker */}
            <mesh>
              <sphereGeometry args={[0.012, 16, 16]} />
              <meshBasicMaterial color="#ff4d4d" />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}

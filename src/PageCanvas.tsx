import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGridStore } from './useGridStore';
import { getRectFromGridArea, getCellDimensions, PAGE_WIDTH, PAGE_HEIGHT } from './gridMath';
import { Page, PageItem } from './types';
import DraggableItem from './DraggableItem';

interface SafeImageProps {
  url: string;
  width: number;
  height: number;
  isSelected: boolean;
}

function SafeImage({ url, width, height, isSelected }: SafeImageProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setTexture(null);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.warn('Failed to load image texture:', url, err);
        setError(true);
        setLoading(false);
      }
    );
  }, [url]);

  if (error) {
    return (
      <group>
        <mesh>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial color="#e5e5e5" />
        </mesh>
        <Text
          fontSize={Math.min(width * 0.08, 0.024)}
          color="#888888"
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.002]}
          maxWidth={width - 0.02}
        >
          ASSET LOAD ERROR
        </Text>
      </group>
    );
  }

  if (loading || !texture) {
    return (
      <group>
        <mesh>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial color="#f5f5f5" />
        </mesh>
        <Text
          fontSize={Math.min(width * 0.08, 0.022)}
          color="#999999"
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.002]}
        >
          LOADING...
        </Text>
      </group>
    );
  }

  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} transparent opacity={1.0} />
    </mesh>
  );
}

interface PageCanvasProps {
  pageIndex: number;
  page: Page;
}

// A beautiful rotating 3D sculpture inside a grid cell
function GridModel({ item, width, height }: { item: PageItem; width: number; height: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.25;
    }
  });

  const geometry = useMemo(() => {
    switch (item.src) {
      case 'torus':
        return new THREE.TorusGeometry(0.24, 0.08, 16, 64);
      case 'knot':
        return new THREE.TorusKnotGeometry(0.18, 0.06, 64, 8);
      case 'sphere':
        return new THREE.SphereGeometry(0.24, 32, 32);
      case 'box':
      default:
        return new THREE.BoxGeometry(0.35, 0.35, 0.35);
    }
  }, [item.src]);

  // Premium Swiss materials: Matte black ceramic, silver/chrome, gold, transparent red acrylic
  const material = useMemo(() => {
    const isGold = item.id.includes('geometry') || item.id.includes('cover');
    const isRed = item.id.includes('model-2');
    const isChrome = item.id.includes('model-1');

    if (isGold) {
      return new THREE.MeshStandardMaterial({
        color: 0xdfb46c, // Premium Swiss Gold
        roughness: 0.18,
        metalness: 0.95,
      });
    } else if (isRed) {
      return new THREE.MeshStandardMaterial({
        color: 0xe63946, // Vibrant Swiss Red Lucite
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: 0.85,
      });
    } else if (isChrome) {
      return new THREE.MeshStandardMaterial({
        color: 0xf1f5f9, // Silver-chrome mirror
        roughness: 0.05,
        metalness: 0.95,
      });
    } else {
      return new THREE.MeshStandardMaterial({
        color: 0x18181b, // Sleek matte black ceramic
        roughness: 0.6,
        metalness: 0.1,
      });
    }
  }, [item.id]);

  const scale = item.modelScale || 0.45;
  const baseRotation = item.modelRotation || [0, 0, 0];

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[0, 0, 0.08]} // Lift up from page surface
      scale={[scale, scale, scale]}
      rotation={new THREE.Euler(...baseRotation)}
      castShadow
    />
  );
}

// Renders the delicate designer guidelines overlay when editing
function GridLinesOverlay({ settings }: { settings: any }) {
  const { columns, rows, margins, columnGutter, rowGutter } = settings;
  const { cellWidth, cellHeight } = getCellDimensions(settings);

  const xMin = -PAGE_WIDTH / 2 + margins.left;
  const xMax = PAGE_WIDTH / 2 - margins.right;
  const yMin = -PAGE_HEIGHT / 2 + margins.bottom;
  const yMax = PAGE_HEIGHT / 2 - margins.top;

  const marginColor = '#ef4444'; // Swiss precision red
  const cellColor = '#60a5fa'; // Blueprint blue
  const lineWidth = 0.003; // Thicker for clear visibility
  const thinLineWidth = 0.0018;

  const segments = useMemo(() => {
    const list: { position: [number, number, number]; size: [number, number, number]; color: string; opacity: number }[] = [];

    // 1. Margin boundaries (Swiss Blueprint Red)
    // Horizontal Top
    list.push({
      position: [(xMin + xMax) / 2, yMax, 0.001],
      size: [xMax - xMin, lineWidth, lineWidth],
      color: marginColor,
      opacity: 0.9,
    });
    // Horizontal Bottom
    list.push({
      position: [(xMin + xMax) / 2, yMin, 0.001],
      size: [xMax - xMin, lineWidth, lineWidth],
      color: marginColor,
      opacity: 0.9,
    });
    // Vertical Left
    list.push({
      position: [xMin, (yMin + yMax) / 2, 0.001],
      size: [lineWidth, yMax - yMin, lineWidth],
      color: marginColor,
      opacity: 0.9,
    });
    // Vertical Right
    list.push({
      position: [xMax, (yMin + yMax) / 2, 0.001],
      size: [lineWidth, yMax - yMin, lineWidth],
      color: marginColor,
      opacity: 0.9,
    });

    // 2. Columns (Vertical lines inside active area)
    for (let i = 0; i < columns; i++) {
      const colLeft = xMin + i * (cellWidth + columnGutter);
      const colRight = colLeft + cellWidth;
      const yCenter = (yMin + yMax) / 2;
      const h = yMax - yMin;

      // Vertical left edge of column
      list.push({
        position: [colLeft, yCenter, 0.0006],
        size: [thinLineWidth, h, thinLineWidth],
        color: cellColor,
        opacity: 0.65,
      });
      // Vertical right edge of column
      list.push({
        position: [colRight, yCenter, 0.0006],
        size: [thinLineWidth, h, thinLineWidth],
        color: cellColor,
        opacity: 0.65,
      });
    }

    // 3. Rows (Horizontal lines inside active area)
    for (let j = 0; j < rows; j++) {
      const rowTop = yMax - j * (cellHeight + rowGutter);
      const rowBottom = rowTop - cellHeight;
      const xCenter = (xMin + xMax) / 2;
      const w = xMax - xMin;

      // Horizontal top edge of row
      list.push({
        position: [xCenter, rowTop, 0.0006],
        size: [w, thinLineWidth, thinLineWidth],
        color: cellColor,
        opacity: 0.65,
      });
      // Horizontal bottom edge of row
      list.push({
        position: [xCenter, rowBottom, 0.0006],
        size: [w, thinLineWidth, thinLineWidth],
        color: cellColor,
        opacity: 0.65,
      });
    }

    // 4. Subtle cell background fills
    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        const cellLeft = xMin + i * (cellWidth + columnGutter);
        const cellTop = yMax - j * (cellHeight + rowGutter);
        const cellX = cellLeft + cellWidth / 2;
        const cellY = cellTop - cellHeight / 2;

        list.push({
          position: [cellX, cellY, 0.0002],
          size: [cellWidth, cellHeight, 0.0001],
          color: '#3b82f6',
          opacity: 0.045, // Elegant faint blueprint tint
        });
      }
    }

    return list;
  }, [columns, rows, margins, cellWidth, cellHeight, columnGutter, rowGutter, xMin, xMax, yMin, yMax]);

  return (
    <group>
      {segments.map((seg, idx) => (
        <mesh key={idx} position={seg.position}>
          <boxGeometry args={seg.size} />
          <meshBasicMaterial color={seg.color} transparent opacity={seg.opacity} />
        </mesh>
      ))}
    </group>
  );
}

export default function PageCanvas({ pageIndex, page }: PageCanvasProps) {
  const isEditMode = useGridStore((state) => state.isEditMode);
  const selectedItemId = useGridStore((state) => state.selectedItemId);
  const setSelectedItemId = useGridStore((state) => state.setSelectedItemId);

  // Background page sheet bounding mesh (invisible plane to receive raycasts for dragging)
  const collisionPlaneRef = useRef<THREE.Mesh>(null);

  return (
    <group position={[0, 0, 0.001]}>
      {/* Editorial page text header / metadata (thin top stamp) */}
      <group position={[0, PAGE_HEIGHT / 2 - 0.06, 0.002]}>
        <Text
          fontSize={0.018}
          color="#a1a1aa"
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          {page.title} — {page.folderPath}
        </Text>
      </group>

      {/* Rulers / grid system visual blueprint */}
      {isEditMode && <GridLinesOverlay settings={page.gridSettings} />}

      {/* Page Items */}
      {page.items.map((item) => {
        const { x, y, width, height } = getRectFromGridArea(item.gridArea, page.gridSettings);
        const isSelected = selectedItemId === item.id;

        const contentComponent = (() => {
          switch (item.type) {
            case 'image':
              return (
                <group>
                  <SafeImage
                    url={item.src}
                    width={width}
                    height={height}
                    isSelected={isSelected}
                  />
                  {/* Outer delicate frame for image */}
                  <lineSegments position={[0, 0, 0.0005]}>
                    <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
                    <lineBasicMaterial color={isSelected ? '#3b82f6' : '#cccccc'} linewidth={1} />
                  </lineSegments>
                </group>
              );

            case 'text':
              return (
                <Text
                  fontSize={item.fontSize || 0.028}
                  color={item.color || '#18181b'}
                  lineHeight={1.4}
                  maxWidth={width}
                  anchorX="left"
                  anchorY="top"
                  // Align text box starting at the top-left of calculated cell boundary
                  position={[-width / 2, height / 2, 0.001]}
                >
                  {item.content || ''}
                </Text>
              );

            case 'model':
              return (
                <group>
                  <GridModel item={item} width={width} height={height} />
                  {/* Light grid compartment outline around 3D item */}
                  {isEditMode && (
                    <lineSegments position={[0, 0, 0.001]}>
                      <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
                      <lineBasicMaterial color="#dfdedb" />
                    </lineSegments>
                  )}
                </group>
              );

            default:
              return null;
          }
        })();

        // If edit mode is on, wrap items in Draggable component
        if (isEditMode) {
          return (
            <DraggableItem
              key={item.id}
              id={item.id}
              pageIndex={pageIndex}
              gridArea={item.gridArea}
              gridSettings={page.gridSettings}
              rect={{ x, y, width, height }}
            >
              {contentComponent}
            </DraggableItem>
          );
        }

        // Standard interactive click selection in preview mode
        return (
          <group
            key={item.id}
            position={[x, y, 0.002]}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedItemId(item.id === selectedItemId ? null : item.id);
            }}
          >
            {contentComponent}
            {isSelected && (
              <lineSegments position={[0, 0, 0.01]}>
                <edgesGeometry args={[new THREE.PlaneGeometry(width + 0.015, height + 0.015)]} />
                <lineBasicMaterial color="#000000" linewidth={1.5} />
              </lineSegments>
            )}
          </group>
        );
      })}

      {/* Invisible plane covering the whole page to capture raycast drag-and-drops */}
      <mesh
        ref={collisionPlaneRef}
        name="page_raycast_plane"
        position={[0, 0, 0.0001]}
        visible={false}
      >
        <planeGeometry args={[PAGE_WIDTH, PAGE_HEIGHT]} />
        <meshBasicMaterial color="red" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

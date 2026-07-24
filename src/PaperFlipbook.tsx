import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RenderTexture, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useGridStore } from './useGridStore';
import { PAGE_WIDTH, PAGE_HEIGHT } from './gridMath';
import PageCanvas from './PageCanvas';

interface BookSheetProps {
  index: number;
  frontPageIdx: number;
  backPageIdx: number;
  targetAngle: number;
}

function BookSheet({ index, frontPageIdx, backPageIdx, targetAngle }: BookSheetProps) {
  const pivotRef = useRef<THREE.Group>(null);
  const frontMeshRef = useRef<THREE.SkinnedMesh>(null);
  const backMeshRef = useRef<THREE.SkinnedMesh>(null);
  const frontOverlayRef = useRef<THREE.Group>(null);
  const backOverlayRef = useRef<THREE.Group>(null);
  
  const currentAngleRef = useRef(targetAngle);
  const pages = useGridStore((state) => state.pages);
  const isEditMode = useGridStore((state) => state.isEditMode);
  const activePageIndex = useGridStore((state) => state.activePageIndex);
  const [isFlipping, setIsFlipping] = useState(false);

  // 1. Create front and back page geometries with bone rigging attributes
  const { frontGeometry, backGeometry } = useMemo(() => {
    // Front Geometry (Extends along +X from 0 to PAGE_WIDTH, facing Z+)
    const fGeo = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT, 32, 2);
    fGeo.translate(PAGE_WIDTH / 2, 0, 0);

    // Back Geometry (Flipped to face Z-, still extends along +X relative to parent bone)
    const bGeo = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT, 32, 2);
    bGeo.rotateY(Math.PI);
    bGeo.translate(PAGE_WIDTH / 2, 0, 0);

    // Bind vertices to the 5 bone chain (Indices 0 to 4)
    [fGeo, bGeo].forEach((geo) => {
      const position = geo.attributes.position;
      const vertexCount = position.count;

      const skinIndices = [];
      const skinWeights = [];
      const segmentWidth = PAGE_WIDTH / 4;

      for (let i = 0; i < vertexCount; i++) {
        const xCoord = position.getX(i); // Positive distance from the spine at x=0

        // Determine which segment this vertex falls into
        const rawBoneIndex = xCoord / segmentWidth;
        const boneIndex = Math.min(3, Math.floor(rawBoneIndex));
        const weight = rawBoneIndex - boneIndex;

        // Assign the two closest bones for smooth skeletal bending
        skinIndices.push(boneIndex, boneIndex + 1, 0, 0);
        skinWeights.push(1 - weight, weight, 0, 0);
      }

      geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
      geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
    });

    return { frontGeometry: fGeo, backGeometry: bGeo };
  }, []);

  // 2. Create the bone hierarchy for realistic paper curling
  const skeleton = useMemo(() => {
    const bones: THREE.Bone[] = [];
    const segmentWidth = PAGE_WIDTH / 4;

    for (let i = 0; i <= 4; i++) {
      const bone = new THREE.Bone();
      if (i === 0) {
        bone.position.set(0, 0, 0);
      } else {
        // Subsequent bones extend along X relative to parent bone
        bone.position.set(segmentWidth, 0, 0);
        bones[i - 1].add(bone);
      }
      bones.push(bone);
    }

    return new THREE.Skeleton(bones);
  }, []);

  // Bind the skeleton to our skinned meshes as soon as they mount
  useEffect(() => {
    if (frontMeshRef.current) {
      frontMeshRef.current.bind(skeleton);
    }
  }, [skeleton, frontMeshRef.current]);

  useEffect(() => {
    if (backMeshRef.current) {
      backMeshRef.current.bind(skeleton);
    }
  }, [skeleton, backMeshRef.current]);

  const frontPage = pages[frontPageIdx];
  const backPage = pages[backPageIdx];

  // Compute active spread index
  const currentSpread = Math.floor((activePageIndex + 1) / 2);

  // Render front page if it's the active right page OR if the sheet is flipping
  const shouldRenderFront = (index === currentSpread) || (isFlipping && index === currentSpread - 1);

  // Render back page if it's the active left page OR if the sheet is flipping
  const shouldRenderBack = (index === currentSpread - 1) || (isFlipping && index === currentSpread);

  // 3. Animate the page curling bones in the frame loop
  useFrame((_, delta) => {
    // Smooth damp/lerp to target angle
    const speed = isEditMode ? 12 : 5; // Flip faster in edit mode for snappiness
    currentAngleRef.current += (targetAngle - currentAngleRef.current) * Math.min(delta * speed, 1);

    const phi = currentAngleRef.current;
    
    // Set root bone rotation to the macro folding angle (page flip)
    skeleton.bones[0].rotation.y = phi;

    // Set overlay group rotations and positions to match!
    if (frontOverlayRef.current) {
      frontOverlayRef.current.rotation.y = phi;
    }
    if (backOverlayRef.current) {
      backOverlayRef.current.rotation.y = phi;
    }

    // Detect if page is flipping
    const currentIsFlipping = Math.abs(currentAngleRef.current - targetAngle) > 0.02;
    if (currentIsFlipping !== isFlipping) {
      setIsFlipping(currentIsFlipping);
    }

    // Apply the micro curling page-peel bend when turning the page
    // No curling in edit mode to preserve clean designer layout planes
    if (isEditMode) {
      for (let i = 1; i <= 4; i++) {
        skeleton.bones[i].rotation.y = 0;
        skeleton.bones[i].rotation.z = 0;
      }
    } else {
      const progress = Math.abs(phi / Math.PI); // 0 (flat right) to 1 (flat left)
      const curlIntensity = Math.sin(progress * Math.PI); // Reaches peak at 50% flip
      
      // Determine folding direction for physical curl bending
      const foldDirection = targetAngle === -Math.PI ? 1 : -1;
      const baseCurl = curlIntensity * 0.22 * foldDirection;

      for (let i = 1; i <= 4; i++) {
        const bone = skeleton.bones[i];
        // Y-rotation curls the page horizontally
        bone.rotation.y = baseCurl * (1 - (i - 1) * 0.15);
        // Z-rotation lifts page corners dynamically for premium realism
        bone.rotation.z = -curlIntensity * 0.08 * foldDirection * (i / 4);
      }
    }

    // Stack sheets slightly along Z based on page index to prevent Z-fighting
    if (pivotRef.current) {
      pivotRef.current.position.z = -index * 0.0015;
    }
  });

  return (
    <group ref={pivotRef}>
      {/* Mount the skeleton's root bone in the scene graph */}
      <primitive object={skeleton.bones[0]} />

      {/* Front Page of Sheet (Visible when sheet is on the right, targetAngle = 0) */}
      {frontPage && (
        <group>
          <skinnedMesh
            ref={frontMeshRef}
            geometry={frontGeometry}
            skeleton={skeleton}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color="#fbfaf8"
              roughness={0.9}
              metalness={0.05}
              side={THREE.DoubleSide}
              shadowSide={THREE.DoubleSide}
            >
              {!isEditMode && shouldRenderFront && (
                <RenderTexture attach="map" width={1024} height={1024}>
                  <OrthographicCamera
                    makeDefault
                    position={[0, 0, 2]}
                    left={-PAGE_WIDTH / 2}
                    right={PAGE_WIDTH / 2}
                    top={PAGE_HEIGHT / 2}
                    bottom={-PAGE_HEIGHT / 2}
                    near={0.1}
                    far={10}
                  />
                  <color attach="background" args={['#fbfaf8']} />
                  <ambientLight intensity={1.5} />
                  <directionalLight position={[1, 1, 3]} intensity={0.4} />
                  <PageCanvas pageIndex={frontPageIdx} page={frontPage} />
                </RenderTexture>
              )}
            </meshStandardMaterial>
          </skinnedMesh>

          {/* Overlay interactive flat canvas only when in Edit Mode */}
          {isEditMode && shouldRenderFront && (
            <group ref={frontOverlayRef}>
              <group position={[PAGE_WIDTH / 2, 0, 0.0025]}>
                <PageCanvas pageIndex={frontPageIdx} page={frontPage} />
              </group>
            </group>
          )}
        </group>
      )}

      {/* Back Page of Sheet (Visible when sheet is folded to the left, targetAngle = -Math.PI) */}
      {backPage && (
        <group>
          <skinnedMesh
            ref={backMeshRef}
            geometry={backGeometry}
            skeleton={skeleton}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color="#fbfaf8"
              roughness={0.9}
              metalness={0.05}
              side={THREE.DoubleSide}
              shadowSide={THREE.DoubleSide}
            >
              {!isEditMode && shouldRenderBack && (
                <RenderTexture attach="map" width={1024} height={1024}>
                  <OrthographicCamera
                    makeDefault
                    position={[0, 0, 2]}
                    left={-PAGE_WIDTH / 2}
                    right={PAGE_WIDTH / 2}
                    top={PAGE_HEIGHT / 2}
                    bottom={-PAGE_HEIGHT / 2}
                    near={0.1}
                    far={10}
                  />
                  <color attach="background" args={['#fbfaf8']} />
                  <ambientLight intensity={1.5} />
                  <directionalLight position={[1, 1, 3]} intensity={0.4} />
                  <PageCanvas pageIndex={backPageIdx} page={backPage} />
                </RenderTexture>
              )}
            </meshStandardMaterial>
          </skinnedMesh>

          {/* Overlay interactive flat canvas only when in Edit Mode */}
          {isEditMode && shouldRenderBack && (
            <group ref={backOverlayRef}>
              <group rotation={[0, Math.PI, 0]} position={[PAGE_WIDTH / 2, 0, 0.0025]}>
                <PageCanvas pageIndex={backPageIdx} page={backPage} />
              </group>
            </group>
          )}
        </group>
      )}
    </group>
  );
}

export default function PaperFlipbook() {
  const pages = useGridStore((state) => state.pages);
  const activePageIndex = useGridStore((state) => state.activePageIndex);
  const { viewport } = useThree();

  // Map pages into double-sided sheet objects
  const numSheets = Math.ceil(pages.length / 2);
  const sheets = useMemo(() => {
    const list = [];
    for (let i = 0; i < numSheets; i++) {
      list.push({
        index: i,
        frontPageIdx: i * 2,
        backPageIdx: i * 2 + 1,
      });
    }
    return list;
  }, [pages, numSheets]);

  const currentSpread = Math.floor((activePageIndex + 1) / 2);

  // Dynamically calculate scale factor to fit the viewport nicely
  const bookScale = useMemo(() => {
    const widthRatio = viewport.width / (PAGE_WIDTH * 2.8);
    const heightRatio = viewport.height / (PAGE_HEIGHT * 1.3);
    const scale = Math.min(widthRatio, heightRatio, 1.1);
    return Math.max(scale, 0.45);
  }, [viewport]);

  return (
    <group 
      scale={bookScale} 
      position={[currentSpread === 0 ? -PAGE_WIDTH / 3 : 0, 0, 0]} 
      rotation={[0.15, 0, 0]} // Aesthetic tilt for editorial presentation perspective
    >
      {/* Central spine shadows and binding line */}
      <mesh position={[0, 0, 0.001]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.015, PAGE_HEIGHT]} />
        <meshBasicMaterial color="#dfdedb" transparent opacity={0.65} />
      </mesh>

      {/* Map sheets and determine their target folding angle */}
      {sheets.map((sheet) => {
        const isFlipped = sheet.index < currentSpread;
        const targetAngle = isFlipped ? -Math.PI : 0;

        return (
          <BookSheet
            key={sheet.index}
            index={sheet.index}
            frontPageIdx={sheet.frontPageIdx}
            backPageIdx={sheet.backPageIdx}
            targetAngle={targetAngle}
          />
        );
      })}

      {/* Studio shadow floor plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -PAGE_HEIGHT / 2 - 0.2, -0.2]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={0.15} />
      </mesh>
    </group>
  );
}

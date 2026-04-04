import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { BodyMeasurements, FitResult } from "../../shared/measurements";

interface Props {
  measurements: BodyMeasurements;
  fitResults?: FitResult[];
}

const FIT_COLORS: Record<string, THREE.Color> = {
  loose: new THREE.Color(0x22c55e),
  perfect: new THREE.Color(0x22c55e),
  snug: new THREE.Color(0xeab308),
  tight: new THREE.Color(0xef4444),
};

const SKIN_COLOR = new THREE.Color(0xd4a574);

export default function BodyViewer({ measurements, fitResults }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    model: THREE.Group | null;
    mixer: THREE.AnimationMixer | null;
    animId: number;
    isDragging: boolean;
    prevX: number;
    modelRotY: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    camera.position.set(0, 0.9, 3.2);
    camera.lookAt(0, 0.85, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(2, 3, 3);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xffffff, 0.3);
    fill.position.set(-2, 1, -1);
    scene.add(fill);

    const state = {
      renderer,
      scene,
      camera,
      model: null as THREE.Group | null,
      mixer: null as THREE.AnimationMixer | null,
      animId: 0,
      isDragging: false,
      prevX: 0,
      modelRotY: 0,
    };
    stateRef.current = state;

    // Load model
    const loader = new GLTFLoader();
    loader.load("models/cesiumman.glb", (gltf) => {
      const model = gltf.scene;

      // Apply skin-tone material
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: SKIN_COLOR,
            roughness: 0.7,
            metalness: 0.0,
          });
        }
      });

      // Scale body based on measurements
      applyMeasurements(model, measurements);

      scene.add(model);
      state.model = model;

      // Freeze at first frame (standing pose)
      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const clip = gltf.animations[0];
        const action = mixer.clipAction(clip);
        action.play();
        mixer.setTime(0); // freeze at frame 0
        action.paused = true;
        state.mixer = mixer;
      }
    });

    // Drag to rotate
    const onPointerDown = (e: PointerEvent) => {
      state.isDragging = true;
      state.prevX = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!state.isDragging || !state.model) return;
      const dx = e.clientX - state.prevX;
      state.modelRotY += dx * 0.01;
      state.model.rotation.y = state.modelRotY;
      state.prevX = e.clientX;
    };
    const onPointerUp = () => {
      state.isDragging = false;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", onPointerUp);
    renderer.domElement.style.cursor = "grab";

    // Animate
    const animate = () => {
      renderer.render(scene, camera);
      state.animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(state.animId);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointerleave", onPointerUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [measurements]);

  // Update fit colors
  useEffect(() => {
    const state = stateRef.current;
    if (!state?.model) return;

    state.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshStandardMaterial).color.copy(SKIN_COLOR);
        (child.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
        (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
      }
    });

    if (!fitResults || fitResults.length === 0) return;

    // Since it's a single mesh, we tint the whole body based on worst fit
    const worst = fitResults.reduce((prev, curr) => {
      const order = { tight: 3, snug: 2, perfect: 1, loose: 0 };
      return order[curr.fit] > order[prev.fit] ? curr : prev;
    });

    state.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.emissive.copy(FIT_COLORS[worst.fit]);
        mat.emissiveIntensity = 0.25;
      }
    });
  }, [fitResults]);

  return <div ref={containerRef} className="w-full" style={{ touchAction: "none" }} />;
}

function applyMeasurements(model: THREE.Group, m: BodyMeasurements) {
  // The CesiumMan default is roughly 1.8m tall
  const defaultHeight = 1.8;
  const heightScale = (m.height / 100) / defaultHeight;

  model.scale.setScalar(heightScale);

  // Scale torso width based on chest/shoulder
  const torsoNode = model.getObjectByName("Skeleton_torso_joint_1");
  if (torsoNode) {
    const chestScale = m.chest / 96; // 96cm = default chest
    const shoulderScale = m.shoulderWidth / 46; // 46cm default
    torsoNode.scale.x = Math.max(shoulderScale, chestScale);
    torsoNode.scale.z = chestScale * 0.9;
  }

  // Scale hip area
  const legR = model.getObjectByName("leg_joint_R_1");
  const legL = model.getObjectByName("leg_joint_L_1");
  const hipScale = m.hips / 98; // 98cm default
  if (legR) {
    legR.scale.x = hipScale;
    legR.scale.z = hipScale * 0.9;
  }
  if (legL) {
    legL.scale.x = hipScale;
    legL.scale.z = hipScale * 0.9;
  }
}

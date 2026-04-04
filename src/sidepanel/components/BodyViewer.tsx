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

const SKIN_COLOR = new THREE.Color(0xc68642);

export default function BodyViewer({ measurements, fitResults }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    model: THREE.Group | null;
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

    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lighting — soft studio setup
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(3, 5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-3, 3, -2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.3);
    rim.position.set(0, 2, -5);
    scene.add(rim);

    const state = {
      renderer,
      scene,
      camera,
      model: null as THREE.Group | null,
      animId: 0,
      isDragging: false,
      prevX: 0,
      modelRotY: 0,
    };
    stateRef.current = state;

    // Load MakeHuman model
    const loader = new GLTFLoader();
    loader.load("models/me.glb", (gltf) => {
      const model = gltf.scene;

      // Apply skin material
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: SKIN_COLOR,
            roughness: 0.6,
            metalness: 0.0,
          });
        }
      });

      // Center and fit model in view
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Center the model at origin
      model.position.x = -center.x;
      model.position.y = -box.min.y; // feet on ground
      model.position.z = -center.z;

      // Position camera to frame the full body
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const dist = (maxDim / 2) / Math.tan(fov / 2) * 1.3;
      camera.position.set(0, size.y * 0.45, dist);
      camera.lookAt(0, size.y * 0.45, 0);

      scene.add(model);
      state.model = model;
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

    // Render loop
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

    // Reset to skin color
    state.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshStandardMaterial).color.copy(SKIN_COLOR);
        (child.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
        (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
      }
    });

    if (!fitResults || fitResults.length === 0) return;

    // Tint body based on worst fit
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

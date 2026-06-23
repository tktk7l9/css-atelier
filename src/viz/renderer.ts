// Blueprint render context — the deliberate inverse of snippet-sprint's dark
// neon stage: paper-white clear colour, NO bloom / EffectComposer (direct
// render), flat white lighting, a graph-paper grid floor, drafting-blue lines.

import * as THREE from "three";

export const PALETTE = {
  paper: 0xeef1f8,
  ink: 0x18203a,
  blueprint: 0x2f5fd0,
  soft: 0x9fb2e6,
  grid: 0xc9d6f2,
  green: 0x2f9d5b,
  gold: 0xb9791b,
  fill: 0xdbe4fb,
} as const;

export interface RenderContext {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  resize(): void;
  render(): void;
}

export function createRenderContext(
  canvas: HTMLCanvasElement,
  reducedMotion: boolean,
): RenderContext {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(PALETTE.paper, 1);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 4.6, 9.2);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 0.7);
  key.position.set(4, 10, 7);
  scene.add(key);

  // Graph-paper floor: a large grid laid flat (rotated to the XZ plane).
  const grid = new THREE.GridHelper(40, 80, PALETTE.soft, PALETTE.grid);
  (grid.material as THREE.Material).opacity = 0.55;
  (grid.material as THREE.Material).transparent = true;
  grid.position.y = -2.2;
  scene.add(grid);

  function resize(): void {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function render(): void {
    renderer.render(scene, camera);
  }

  // A touch of idle drift unless the user prefers reduced motion.
  void reducedMotion;

  resize();
  return { renderer, scene, camera, resize, render };
}

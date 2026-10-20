import * as T from 'three';
import {$} from './dom.js';

// Renderer, scene, lights and the orthographic camera. Knows nothing about game rules.
export class Stage {
  constructor(canvas) {
    try {
      this.renderer = new T.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      $('loading').textContent =
        'O navegador não conseguiu iniciar o 3D. Ative a aceleração de hardware ou tente Chrome/Edge atualizado.';
      throw e;
    }
    const {renderer} = this;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.type = T.PCFShadowMap;
    this.scene = new T.Scene();
    this.camera = new T.OrthographicCamera(-16, 16, 10, -10, 0.1, 160);
    this.scene.add(new T.HemisphereLight(0xfff8de, 0x426b88, 1.5));
    const sun = new T.DirectionalLight(0xffefce, 2.6);
    sun.position.set(-12, 25, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -32,
      right: 32,
      top: 25,
      bottom: -25,
      near: 1,
      far: 100,
    });
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);
    this.halfWidth = 16;
    this.playerX = -7;
    // Camera framing. zoom 1 is the gameplay view (20 world units tall); the menu zooms in.
    this.view = {zoom: 1, x: 0, y: 1};
  }

  resize() {
    const {camera} = this;
    this.halfWidth = (10 * innerWidth) / innerHeight;
    Object.assign(camera, {left: -this.halfWidth, right: this.halfWidth, top: 10, bottom: -10});
    this.renderer.setSize(innerWidth, innerHeight);
    this.playerX = -this.halfWidth * (innerWidth <= 680 ? 0.48 : 0.42);
    this.applyView();
  }

  setView(view) {
    Object.assign(this.view, view);
    this.applyView();
  }

  applyView() {
    const {camera, view} = this;
    camera.zoom = view.zoom;
    camera.position.set(view.x, view.y + 4.5, 32);
    camera.lookAt(view.x, view.y, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  // Screen row (pixels from the top) of a world point, for the current view.
  screenY(x, y, z) {
    return ((1 - new T.Vector3(x, y, z).project(this.camera).y) / 2) * innerHeight;
  }

  setQuality(low) {
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1 : 1.7));
    this.renderer.shadowMap.enabled = !low;
    this.resize();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

import {
  AlwaysDepth, DepthTexture, Mesh, OrthographicCamera, PlaneGeometry,
  ShaderMaterial, SRGBColorSpace, Vector2, Vector3, WebGLRenderTarget,
} from 'three';

// With an orthographic lens, a tracking shot translates the whole static
// landscape uniformly on screen. A colour AND depth plate retains occlusion
// under bridges and behind roofs when the live meshes are drawn over it.
const plateWidth = 84, plateHeight = 60;
const staticLayer = 1;
const vertexShader = `
  varying vec2 screenUV;
  void main() {
    screenUV = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;
const fragmentShader = `
  uniform sampler2D colourPlate, depthPlate;
  uniform vec2 centre, scale, fogRange;
  uniform vec3 sky;
  uniform float depthOffset, depthRange, nearPlane;
  varying vec2 screenUV;
  void main() {
    vec2 at = centre + (screenUV - 0.5) * scale;
    if (any(lessThan(at, vec2(0.0))) || any(greaterThan(at, vec2(1.0)))) {
      gl_FragColor = vec4(sky, 1.0);
      gl_FragDepth = 1.0;
    } else {
      float d = texture2D(depthPlate, at).r;
      float z = d >= 1.0 ? 1.0 : clamp(d + depthOffset, 0.0, 1.0);
      float haze = smoothstep(fogRange.x, fogRange.y, z * depthRange + nearPlane);
      gl_FragColor = vec4(mix(texture2D(colourPlate, at).rgb, sky, haze), 1.0);
      // Sub-texel variation on the road should not cut holes in tyre-contact decals.
      gl_FragDepth = min(1.0, z + 0.00024);
    }
    #include <colorspace_fragment>
  }
`;
export function createSceneryCache(renderer, scene, world, vehicle, streetProps, camera) {
  const width = Math.min(renderer.capabilities.maxTextureSize, 2016);
  const height = Math.round(width * plateHeight / plateWidth);
  const target = new WebGLRenderTarget(width, height, { depthBuffer: true });
  target.texture.colorSpace = SRGBColorSpace;
  target.depthTexture = new DepthTexture(width, height);
  const lens = new OrthographicCamera(-plateWidth/2, plateWidth/2, plateHeight/2, -plateHeight/2, camera.near, camera.far);
  lens.layers.set(staticLayer);
  const facing = new Vector3();
  const atlasCentre = new Vector3(0, 1.5, -4);
  const right = new Vector3(), up = new Vector3(), delta = new Vector3();
  const uniforms = {
    colourPlate: { value: target.texture }, depthPlate: { value: target.depthTexture },
    centre: { value: new Vector2() }, scale: { value: new Vector2() },
    sky: { value: scene.background }, fogRange: { value: new Vector2(scene.fog.near, scene.fog.far) },
    depthOffset: { value: 0 }, depthRange: { value: camera.far - camera.near },
    nearPlane: { value: camera.near },
  };
  const quad = new Mesh(new PlaneGeometry(2,2), new ShaderMaterial({
    uniforms, vertexShader, fragmentShader, depthWrite: true, depthTest: true, depthFunc: AlwaysDepth,
  }));
  quad.name = 'Static neighbourhood colour and depth';
  quad.frustumCulled = false;
  quad.renderOrder = -10000;
  quad.visible = false;
  scene.add(quad);
  let cached = false, failed = false, requested = -1, baked = -1, changedAt = 0;

  function classify() {
    const dynamic = new Set([quad]);
    for (const root of [vehicle, streetProps, ...world.movingObjects()]) root.traverse(object => dynamic.add(object));
    scene.traverse(object => {
      if (object.isLight) object.layers.enable(staticLayer);
      else if (object.isMesh || object.isSprite || object.isLine || object.isPoints) {
        object.layers.set(dynamic.has(object) ? 0 : staticLayer);
      }
    });
  }

  function bake() {
    classify();
    camera.updateMatrixWorld();
    facing.setFromMatrixColumn(camera.matrixWorld, 2);
    lens.position.copy(atlasCentre).addScaledVector(facing, 72);
    lens.lookAt(atlasCentre);
    lens.updateMatrixWorld();
    right.setFromMatrixColumn(lens.matrixWorld, 0);
    up.setFromMatrixColumn(lens.matrixWorld, 1);
    const previousTarget = renderer.getRenderTarget();
    const near = scene.fog.near, far = scene.fog.far;
    try {
      // Fog depends on the driver's camera, not on the distant atlas camera.
      scene.fog.near = 9000;
      scene.fog.far = 10000;
      renderer.setRenderTarget(target);
      const gl = renderer.getContext();
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw Error('Unusable scenery framebuffer');
      renderer.render(scene, lens);
      cached = true;
      baked = world.paintVersion;
    } catch {
      failed = true;
      cached = false;
    } finally {
      renderer.setRenderTarget(previousTarget);
      scene.fog.near = near;
      scene.fog.far = far;
    }
  }

  return {
    prepare(now, allowed) {
      quad.visible = false;
      camera.layers.enable(staticLayer);
      if (failed || !allowed) return false;
      camera.updateMatrixWorld();
      delta.setFromMatrixColumn(camera.matrixWorld, 2);
      if (cached && delta.dot(facing) < .999999) cached = false;
      if (requested !== world.paintVersion) {
        requested = world.paintVersion;
        changedAt = now;
      }
      // Batch image completion into a single pass. Direct 3D stays available
      // as the shops load and when a device switches to another lens bearing.
      if ((!cached || requested !== baked) && now - changedAt >= 180) bake();
      if (!cached) return false;

      delta.subVectors(camera.position, lens.position);
      uniforms.centre.value.set(.5 + delta.dot(right)/plateWidth, .5 + delta.dot(up)/plateHeight);
      uniforms.scale.value.set((camera.right-camera.left)/(camera.zoom*plateWidth),
        (camera.top-camera.bottom)/(camera.zoom*plateHeight));
      uniforms.depthOffset.value = delta.dot(facing) / (camera.far-camera.near);
      quad.visible = true;
      camera.layers.disable(staticLayer);
      return true;
    },
    dispose() {
      scene.remove(quad);
      quad.geometry.dispose();
      quad.material.dispose();
      target.dispose();
    },
  };
}

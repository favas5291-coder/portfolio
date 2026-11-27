import * as THREE from 'three';

// One shared low-resolution view for the authored patches on the wet stone.
// Their UVs, silhouette and roughness remain the ones exported by Blender.
export function kerbReflection(renderer, scene, meshes, compact) {
  if (!meshes.length) return null;
  const size = compact ? 256 : 384;
  const target = new THREE.WebGLRenderTarget(size, size, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearMipmapLinearFilter,
    generateMipmaps: true,
  });
  const mirror = new THREE.PerspectiveCamera();
  const viewProjection = new THREE.Matrix4();
  const waterY = new THREE.Box3().setFromObject(meshes[0]).max.y;
  const up = new THREE.Vector3(0, 1, 0);
  const direction = new THREE.Vector3();
  const clip = new THREE.Plane();
  const plane = new THREE.Vector4();
  const corner = new THREE.Vector4();
  const wetMaterials = new Set(meshes.flatMap((mesh) => [mesh.material].flat()));

  for (const material of wetMaterials) {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.waterReflection = { value: target.texture };
      shader.uniforms.reflectedView = { value: viewProjection };
      shader.vertexShader =
        'uniform mat4 reflectedView; varying vec4 wetPosition;\n' +
        shader.vertexShader.replace(
          '#include <project_vertex>',
          '#include <project_vertex>\nwetPosition = reflectedView * modelMatrix * vec4(transformed,1.);',
        );
      shader.fragmentShader =
        'uniform sampler2D waterReflection; varying vec4 wetPosition;\n' +
        shader.fragmentShader.replace(
          '#include <opaque_fragment>',
          `vec2 refUV = wetPosition.xy / wetPosition.w * .5 + .5;
         vec3 reflected = textureLod(waterReflection, clamp(refUV + normal.xy * .0025,.002,.998), 1.2).rgb;
         float grazing = 1. - max(0., dot(normalize(vViewPosition), normal));
         outgoingLight = mix(outgoingLight, reflected, .36 + .4 * grazing);
         #include <opaque_fragment>`,
        );
    };
    material.needsUpdate = true;
  }

  function render(camera) {
    mirror.position.copy(camera.position);
    mirror.position.y = 2 * waterY - camera.position.y;
    camera.getWorldDirection(direction).reflect(up);
    mirror.up.copy(camera.up).applyQuaternion(camera.quaternion).reflect(up);
    mirror.lookAt(direction.add(mirror.position));
    mirror.updateMatrixWorld();
    mirror.projectionMatrix.copy(camera.projectionMatrix);
    viewProjection.multiplyMatrices(mirror.projectionMatrix, mirror.matrixWorldInverse);

    // Oblique near plane excludes the ground in the reflected pass.
    clip.set(up, -waterY - 0.002).applyMatrix4(mirror.matrixWorldInverse);
    plane.set(clip.normal.x, clip.normal.y, clip.normal.z, clip.constant);
    const m = mirror.projectionMatrix.elements;
    corner.set(
      (Math.sign(plane.x) + m[8]) / m[0],
      (Math.sign(plane.y) + m[9]) / m[5],
      -1,
      (1 + m[10]) / m[14],
    );
    plane.multiplyScalar(2 / plane.dot(corner));
    m[2] = plane.x;
    m[6] = plane.y;
    m[10] = plane.z + 1;
    m[14] = plane.w;
    mirror.projectionMatrixInverse.copy(mirror.projectionMatrix).invert();
    for (const mesh of meshes) mesh.visible = false;
    const previous = renderer.getRenderTarget();
    try {
      renderer.setRenderTarget(target);
      renderer.render(scene, mirror);
    } finally {
      renderer.setRenderTarget(previous);
      for (const mesh of meshes) mesh.visible = true;
    }
  }

  return { render, dispose: () => target.dispose() };
}

#!/usr/bin/env bash
# glTF Transform 4.5.1 with Khronos KTX-Software 4.4.2 on PATH.
# Keep named hinge, screen and puddle nodes intact during optimisation.
set -euo pipefail
src=$1
dest=$2
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT
gltf-transform dedup "$src" "$tmpdir/unique.glb"
if [[ "$(basename "$src")" == shell* ]]; then
    # Preserve grain direction in tangent-space normals. The roughness,
    # indirect-light and albedo maps tolerate a smaller ETC1S transfer.
    gltf-transform uastc "$tmpdir/unique.glb" "$tmpdir/normals.glb" --slots normalTexture --resize 512 --level 1 --rdo --rdo-lambda 1.0 --zstd 16 --jobs 2
    gltf-transform etc1s "$tmpdir/normals.glb" "$tmpdir/texture.glb" --quality 185 --compression 1 --jobs 2
else
    gltf-transform uastc "$tmpdir/unique.glb" "$tmpdir/texture.glb" --level 1 --rdo --rdo-lambda 1.8 --zstd 16 --jobs 2
fi
gltf-transform meshopt "$tmpdir/texture.glb" "$dest" --level medium

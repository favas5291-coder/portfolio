// Rollup can merge a dynamic entry with shared modules and omit its source-path key.
export function pageEntry(manifest, file) {
  if (manifest[file]) return file;
  const name = file.split('/').pop().replace(/\.jsx$/, '');
  const keys = manifest['index.html'].dynamicImports.filter(key => manifest[key]?.name === name);
  if (keys.length !== 1) throw new Error('Cannot identify page bundle for ' + file);
  return keys[0];
}

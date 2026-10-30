import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { updateProjectPreview } from '../scripts/update-project-preview.mjs';

test('refresh validates captures before changing the last good preview and skips duplicate output', async () => {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-preview-'));
  try {
    await mkdir(join(root, 'src/data'), { recursive: true });
    const manifest = join(root, 'src/data/project-previews.js');
    const capture = join(root, 'capture.png');
    const previews = { demo: { website: 'https://example.com/', screenshot: '/images/old.webp', capturedAt: '2026-01-01T00:00:00.000Z', width: 200, height: 100 } };
    await writeFile(manifest, 'last good manifest');
    await writeFile(capture, 'invalid image');
    await assert.rejects(updateProjectPreview({ root, id: 'demo', capture, capturedAt: '2026-01-02T00:00:00Z', previews }));
    assert.equal(await readFile(manifest, 'utf8'), 'last good manifest');
    await sharp({ create: { width: 200, height: 100, channels: 3, background: '#fff' } }).png().toFile(capture);
    await assert.rejects(updateProjectPreview({ root, id: 'demo', capture, capturedAt: '2026-01-02T00:00:00Z', previews }), /Blank/);
    assert.equal(await readFile(manifest, 'utf8'), 'last good manifest');
    await sharp({ create: { width: 200, height: 100, channels: 3, background: '#fff' } }).composite([{ input: Buffer.from('<svg width="200" height="100"><rect x="100" width="100" height="100" fill="black"/></svg>') }]).png().toFile(capture);
    const result = await updateProjectPreview({ root, id: 'demo', capture, capturedAt: '2026-01-02T00:00:00Z', previews });
    assert.ok(result.changed);
    assert.match(result.screenshot, /^\/images\/projects\/demo-[a-f0-9]{16}\.webp$/);
    assert.equal((await sharp(join(root, `public${result.screenshot}`)).metadata()).width, 200);
    const saved = await readFile(manifest, 'utf8');
    const next = JSON.parse(saved.match(/export const projectPreviews = ([\s\S]*);\n/)[1]);
    const duplicate = await updateProjectPreview({ root, id: 'demo', capture, capturedAt: '2026-01-03T00:00:00Z', previews: next });
    assert.equal(duplicate.changed, false);
    assert.equal(await readFile(manifest, 'utf8'), saved);
    await assert.rejects(updateProjectPreview({ root, id: '../escape', capture, capturedAt: '2026-01-03T00:00:00Z', previews }), /Unknown/);
    await assert.rejects(updateProjectPreview({ root, id: 'demo', capture, capturedAt: '2025-01-01T00:00:00Z', previews }), /predates/);
    await assert.rejects(updateProjectPreview({ root, id: 'demo', capture, capturedAt: 'not a date', previews }), /Invalid/);
    await assert.rejects(updateProjectPreview({ root, id: 'demo', capture, capturedAt: '2999-01-01', previews }), /Invalid/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

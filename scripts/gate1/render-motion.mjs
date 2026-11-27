import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

// Write only scene pixels to the video. Blank project plates remain available
// for manifest-sourced HTML images, independent of video compression.
export async function renderExit(page, output, layout) {
  await mkdir(output, {recursive: true});
  const working = await mkdtemp(resolve(tmpdir(), 'appointment-motion-'));
  try {
    const frames = 61;
    for (let i = 0; i < frames; i++) {
      const data = await page.evaluate(async (progress) => {
        await window.showRoom(progress);
        return document.querySelector('canvas').toDataURL('image/png').split(',')[1];
      }, 0.21 * i / (frames - 1));
      const filename = resolve(working, String(i).padStart(3, '0') + '.png');
      await writeFile(filename, Buffer.from(data, 'base64'));
      if (i % 10 === 0) console.log(layout, 'frame', i, 'of', frames);
    }
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', '24', '-i',
      resolve(working, '%03d.png'), '-c:v', 'libx264', '-threads', '2', '-crf', '18', '-preset', 'medium',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-pix_fmt', 'yuv420p', '-g', '6', '-keyint_min','6',
      '-sc_threshold', '0', '-bf', '0', '-movflags', '+faststart', resolve(output, layout + '.mp4')]);
  } finally {
    await rm(working, {recursive: true, force: true});
  }
}

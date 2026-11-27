// Every one of the 61 baked poses comes from the same normalized native scroll path.
const clip = document.querySelector('video');
const compact = matchMedia('(max-width: 760px)');
const fps = 24;
const lastFrame = 60;
let requested = 0;

document.querySelector('#project').href = window.motionSource.store;
document.querySelector('#chat').href = window.motionSource.whatsapp;

function seek() {
  const travel = document.documentElement.scrollHeight - innerHeight;
  requested = Math.round(lastFrame * Math.min(1, Math.max(0, scrollY / Math.max(1, travel))));
  if (clip.readyState < HTMLMediaElement.HAVE_METADATA || clip.seeking) return;
  const time = (requested + 0.05) / fps;
  if (Math.abs(clip.currentTime - time) < 0.48 / fps) return;
  clip.currentTime = time;
}

function loadClip() {
  clip.src = compact.matches ? 'compact.mp4' : 'wide.mp4';
  clip.load();
}
compact.addEventListener('change', loadClip);
clip.addEventListener('loadedmetadata', seek);
clip.addEventListener('seeked', seek);
window.addEventListener('scroll', seek, {passive:true});
window.addEventListener('resize', seek);
loadClip();

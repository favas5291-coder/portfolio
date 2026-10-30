# Guided portfolio implementation

The homepage is a self-contained React experience using the project's existing Three.js/React Three Fiber dependencies and the browser's speech API. It does not require an avatar subscription, external speech account or API key.

## Current asset status

**Temporary character — final likeness not complete.** The procedural hierarchical rig in `src/guide/GuideCharacter.jsx` includes breathing, blinking, a short wave, presentation/pointing poses, head turns and speech-activity mouth movement. Its dark pinstripe suit, open white collar, hair and facial hair follow the reference direction. The mesh is not an accurate custom facial reconstruction. Speech mouth activity is amplitude-style animation, not phoneme/viseme lip synchronization.

`public/characters/favas-character.webp` is a static reference-inspired concept, created with the built-in image tool and optimized for the project. It is the fallback when WebGL fails or the visitor selects a static character. The original photograph is not a rigged asset. A final custom rigged model was not available in the repository.

Remaining final-model work:

1. Model/sculpt the user's recognizable face and hair from the supplied identity reference; obtain likeness approval before calling it final.
2. Retopologize, UV unwrap and bake efficient textures. Aim for roughly 25–50k triangles, a small number of materials and 1K/2K texture maps, then measure on real phones.
3. Add a skeleton, skin weights and restrained Idle, Wave, Present, Point, Turn and Welcome clips. Add facial blink, smile, jaw and viseme targets.
4. Export a self-contained GLB to `public/characters/`, set `characterAsset.model` in `tourConfig.js`, and map clip names using `characterAsset.animations`. Verify framing, directions, scale and all clips on actual hardware.
5. Only after the actual likeness model is integrated and approved should its temporary status and visitor label be changed. True lip synchronization additionally needs time-aligned phoneme data and a facial mapping layer; it is not implemented by the current speech-activity approximation.

No external decoder or texture CDN is needed by the current prototype. A final GLB should be self-contained and uncompressed unless local decoder assets are explicitly added.

## Narration and controls

`src/guide/tourConfig.js` contains the five-step tour, about 61 seconds in captions mode. Each step has a target section, narration segments, reading durations, character action and highlight element. Narration only describes the existing service data and real GymDrobe project. Tours do not invent clients, results, services or metrics.

Browser English speech is used when available. No audio plays before opt-in. Speech quality depends on installed/browser voices, and operating-system/browser restrictions may prevent playback. A visible Play control and sound toggle keep the tour available through captions. A blocked voice pauses the tour; the visitor can retry Play or turn sound off and Play captions.

The narration driver preserves media position/remaining reading time on pause. Previous/next select sections, and Replay starts a fresh welcome. Scrolling manually, choosing page links, opening project inspection, leaving the page or hiding the tab pauses narration. A hidden tab also stops character rendering. Dismissing the introduction is remembered for the current session only; the Meet Favas button remains available.

Optional recorded audio: place one MP3/OGG per caption segment in `public/audio/tour/` and set that segment's `audio` URL. Keep the caption text identical to the clip, and set `durationMs` to its reading/playback length for muted mode. Recorded clips advance on their real end event. Splitting narration into sentence-length clips gives tighter captions. No prerecorded clips are shipped, and no cloned voice is used.

## Content updates

- Project descriptions, destinations, stack and project-specific `tourNarration`: `src/data/portfolio.js`.
- Real project preview: `src/data/project-previews.js`, refreshed with the existing `preview:update` helper.
- Service list and process: `src/data/site.js`; narration service names derive from the same data.
- Spoken copy, target IDs, optional audio and actions: `src/guide/tourConfig.js`.
- Add verified projects to the page and one optional configured presentation step per project. Do not publish project claims based on the screenshot alone.

Always run `npm run verify`, inspect the mobile layout and then deploy the existing Vercel project. This redesign preserves canonical URLs, contact details, sitemap/robots, service pages and the existing GymDrobe case study. Existing old Forge components and historical tests remain in the repository but are not the new homepage's renderer.

## Verification record

- Tour reducer: opt-in, completion, restart, pause, sound, blocked audio, skip and section bounds.
- Narration driver: no autoplay; captions pause/resume keeps remaining time; speech activation/cancel; retained audio playhead; blocked playback recovery and stale-event cleanup.
- Existing production checks: all nine prerendered public pages, canonical metadata, contact links, structured data, assets, internal links and JavaScript budget.
- Browser inspection: desktop and phone/tablet iframe widths 320, 390 and 768 CSS pixels; no phone horizontal overflow; caption-only transitions, service/project highlights, controls and actual project preview; WebGL failure retains the static character.
- Verification limit: the cloud browser disables WebGL and cannot play a usable English speech voice. The actual 3D appearance/poses and audible English delivery therefore require a real-device check. This is not a completed final-likeness or phoneme-lip-sync verification.

## Static fallback art direction

Output: `public/characters/favas-character.webp`. Created with the built-in image-generation tool, not an external avatar app. Generation prompt:

> Use case: stylized-concept. Create a polished, premium, slightly stylized 3D character portrait as a static fallback asset for this man's personal developer portfolio. The provided photograph is the identity reference, not the background. Preserve recognizable facial identity, medium warm brown skin, thick swept wavy black hair, dark eyebrows, moustache, short trimmed beard, dark navy/charcoal fine pinstripe suit with subtle lapels and white open-collar shirt. Friendly confident gentle closed-mouth smile, direct eye contact. Show from upper thighs to a little above hair, hands visible naturally, one hand lightly raised in an understated welcome wave. Natural adult proportions, restrained stylization, sophisticated physically based materials and soft cinematic studio lighting, beautiful high-end character sculpt. Upright front three-quarter stance, entire silhouette centered and uncropped. Actual transparent background. No text, no UI, no floor, no rectangle, no environment, no extra people. Character asset only. This is a provisional character concept for later proper modeling and rigging, not a replacement for an actual rigged character.

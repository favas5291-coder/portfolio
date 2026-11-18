import {
  Color, DirectionalLight, Fog, HemisphereLight, OrthographicCamera,
  PCFShadowMap, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three';
import { DRIVE_BOUNDS } from './layout.js';
import { createDriveState, FIXED_STEP, respawn as resetDrive, stepDrive } from './simulation.js';
import { createPickup, createStreetProps } from './pickup.js';
import { createWorld } from './world.js';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const throttleKeys = new Set(['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS']);
const steerKeys = new Set(['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD']);
const gameKeys = new Set([...throttleKeys, ...steerKeys, 'KeyB', 'Space', 'KeyR', 'KeyE', 'Enter', 'KeyM', 'KeyL']);

// An original, quiet oscillator motor. No network or decoder runs before
// the driver opts in. Suspending the context stops audio work on hidden tabs.
function createMotor() {
  let context;
  let motor;
  let filter;
  let gain;
  let muted = true;
  let running = false;

  function wake() {
    if (!context) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      try { context = new Audio(); } catch { return; }
      motor = context.createOscillator();
      motor.type = 'triangle';
      filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 155;
      gain = context.createGain();
      gain.gain.value = 0;
      motor.connect(filter).connect(gain).connect(context.destination);
      motor.start();
    }
    return context;
  }

  function sync() {
    if (!context || context.state === 'closed') return;
    if (!muted && running) context.resume().catch(() => {});
    else context.suspend().catch(() => {});
  }

  return {
    toggle() {
      if (!wake()) return true;
      muted = !muted;
      sync();
      return muted;
    },
    run(value) {
      if (running === value) return;
      running = value;
      sync();
    },
    update(speed, pedal) {
      if (muted || !running || !context) return;
      const load = Math.min(1, Math.abs(speed) / 11);
      const t = context.currentTime;
      motor.frequency.setTargetAtTime(34 + 54 * load + Math.abs(pedal) * 13, t, 0.10);
      filter.frequency.setTargetAtTime(130 + 180 * load, t, 0.14);
      gain.gain.setTargetAtTime(0.018 + 0.022 * load, t, 0.12);
    },
    dispose() {
      if (context) {
        motor.stop();
        context.close().catch(() => {});
      }
    },
  };
}

export function createDrive(host, callbacks = {}) {
  const scene = new Scene();
  scene.background = new Color(0xf1dfbb);
  scene.fog = new Fog(0xf1dfbb, 58, 110);
  const renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const canvas = renderer.domElement;
  canvas.style.cssText = 'display:block;width:100%;height:100%;';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const sky = new HemisphereLight(0xfff9ee, 0x9ca99f, 1.70);
  const sun = new DirectionalLight(0xfff1de, 2.34);
  sun.position.set(-20, 34, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 32, bottom: -30, near: 1, far: 95 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.0003;
  scene.add(sky, sun, sun.target);

  const state = createDriveState();
  const truck = createPickup();
  const movable = createStreetProps();
  const world = createWorld(scene);
  scene.add(truck.root, movable.root);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.2, 145);
  const eye = new Vector3();
  const focus = new Vector3();
  const aim = new Vector3();
  const motor = createMotor();
  const pressed = new Set();
  const input = { throttle: 0, steer: 0, brake: false, jump: false };
  const stick = { x: 0, y: 0 };
  let touchBrake = false;
  let jumpQueued = false;
  let frameId = 0;
  let previous = 0;
  let accumulator = 0;
  let elapsed = 0;
  let stepCount = 0;
  let disposed = false;
  let inView = true;
  let paused = false;
  let opened = null;
  let nearby = null;
  let ready = false;
  let firstDrive = false;
  let discovered = false;
  let compact = false;
  let ratio = 1;
  let lastReadout = 0;
  let framesInSample = 0;
  let frameSum = 0;
  let lastShadowPaint = -Infinity;
  let pausedPaintsUntil = 0;
  let firstInputTime;
  let expanded = false;

  function sampleInput() {
    input.throttle = clamp(stick.y + Number(pressed.has('ArrowUp') || pressed.has('KeyW')) -
      Number(pressed.has('ArrowDown') || pressed.has('KeyS')), -1, 1);
    input.steer = clamp(stick.x + Number(pressed.has('ArrowRight') || pressed.has('KeyD')) -
      Number(pressed.has('ArrowLeft') || pressed.has('KeyA')), -1, 1);
    input.brake = touchBrake || pressed.has('KeyB');
  }
  function firstMovement() {
    if (firstInputTime === undefined) firstInputTime = performance.now();
  }
  function release() {
    pressed.clear();
    stick.x = 0;
    stick.y = 0;
    touchBrake = false;
    jumpQueued = false;
    sampleInput();
  }
  function setStick(steer = 0, throttle = 0) {
    if (paused || disposed) return;
    stick.x = clamp(steer, -1, 1);
    stick.y = clamp(throttle, -1, 1);
    if (throttle) firstMovement();
  }

  function setCamera(dt, snap = false) {
    const speed = state.speed;
    const look = Math.min(Math.abs(speed) * 0.25, 3) * Math.sign(speed);
    const streetBias = (compact ? 6.65 : 6.55) - Math.min(Math.abs(speed) * 0.30, 2.9);
    // This paper-model viewpoint retains its bearing as the driver turns.
    // A stable north makes returning to a shop or reading a sign much easier.
    aim.set(
      clamp(state.x - Math.sin(state.heading) * look, DRIVE_BOUNDS.minX + 3, DRIVE_BOUNDS.maxX - 3),
      (compact ? 0.72 : 1.10) + Math.max(0, state.y) * 0.22,
      clamp(state.z - streetBias - Math.cos(state.heading) * look, DRIVE_BOUNDS.minZ + 4, DRIVE_BOUNDS.maxZ - 4),
    );
    if (snap) focus.copy(aim);
    else focus.lerp(aim, 1 - Math.exp(-5.1 * dt));
    camera.position.copy(focus).add(eye);
    camera.lookAt(focus);
  }

  function size() {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    compact = width < 680;
    const aspect = width / height;
    const span = compact ? Math.max(18.5, 16.4 / aspect) : Math.max(17.8, Math.min(23, 24 / aspect));
    camera.left = -span * aspect / 2;
    camera.right = -camera.left;
    camera.top = span / 2;
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    eye.set(compact ? 4.8 : 15.4, compact ? 19.6 : 19.7, 27.0);
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    setCamera(0, !ready);
  }

  function readout(now, force) {
    if (!force && now - lastReadout < 110) return;
    lastReadout = now;
    const data = host.dataset;
    data.x = state.x.toFixed(3);
    data.z = state.z.toFixed(3);
    data.heading = state.heading.toFixed(4);
    data.speed = state.speed.toFixed(3);
    data.parked = nearby || '';
    data.collisions = String(state.impacts);
    data.step = String(stepCount);
    data.discovered = String(Boolean(state.unlocked));
    data.paused = String(paused);
  }

  function eligibleStop() {
    return state.grounded && Math.abs(state.speed) < 3 ? state.nearby : null;
  }

  function schedule() {
    if (!frameId && !disposed && inView && !document.hidden) frameId = requestAnimationFrame(render);
  }
  function stop() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    previous = 0;
    accumulator = 0;
  }

  function render(now) {
    frameId = 0;
    if (disposed || !inView || document.hidden) return;
    const delta = previous ? Math.max(0, (now - previous) / 1000) : 0;
    const dt = Math.min(delta, 0.15);
    previous = now;
    elapsed += dt;
    sampleInput();
    if (!paused) {
      accumulator = Math.min(0.15, accumulator + dt);
      while (accumulator >= FIXED_STEP) {
        input.jump = jumpQueued;
        stepDrive(state, input, FIXED_STEP);
        jumpQueued = false;
        accumulator -= FIXED_STEP;
        stepCount++;
      }
      setCamera(dt);
      const invitation = eligibleStop();
      if (invitation !== nearby) {
        nearby = invitation;
        callbacks.onNearby?.(nearby);
      }
      if (!firstDrive && Math.abs(state.speed) > 0.08) {
        firstDrive = true;
        callbacks.onFirstDrive?.();
      }
      if (state.unlocked && !discovered) {
        discovered = true;
        callbacks.onDiscovery?.();
      }
    }

    truck.update(state);
    movable.update(state);
    world.update(dt, { time: elapsed, opened, nearby, discovered, paused });
    motor.update(state.speed, input.throttle);
    // Static architecture shares one sunlight map. The truck's small contact
    // shadow follows it each frame, even between directional-shadow passes.
    const activeShadow = Math.abs(state.speed) > 0.05 || !state.grounded || now < pausedPaintsUntil;
    if (now - lastShadowPaint >= (activeShadow ? (compact ? 36 : 28) : 230)) {
      renderer.shadowMap.needsUpdate = true;
      lastShadowPaint = now;
    }
    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      host.dataset.renderer = 'webgl';
      host.dataset.driverReady = 'true';
      callbacks.onReady?.();
    }
    if (firstDrive && firstInputTime !== undefined && !host.dataset.inputMs) {
      host.dataset.inputMs = String(Math.round(performance.now() - firstInputTime));
    }
    readout(now, paused);

    if (!paused && delta > 0 && delta < 0.4) {
      framesInSample++;
      frameSum += delta;
      if (framesInSample >= 45) {
        if (frameSum / framesInSample > 0.040 && ratio > 0.72) {
          ratio = Math.max(0.72, ratio * 0.82);
          renderer.setPixelRatio(ratio);
        }
        framesInSample = 0;
        frameSum = 0;
      }
    }
    if (!paused || now < pausedPaintsUntil) schedule();
    else previous = 0;
  }

  function setOpened(id) {
    if (opened === id) return;
    opened = id || null;
    pausedPaintsUntil = performance.now() + 1350;
    schedule();
  }
  function setPaused(value, id) {
    if (id !== undefined) setOpened(id);
    if (paused === Boolean(value)) return;
    paused = Boolean(value);
    release();
    accumulator = 0;
    previous = 0;
    if (!paused) setOpened(null);
    else state.speed = 0;
    host.dataset.paused = String(paused);
    motor.run(!paused && !document.hidden && inView);
    schedule();
  }
  function jump() {
    if (!paused && !disposed) jumpQueued = true;
  }
  function interact() {
    const id = eligibleStop();
    if (id && !paused) callbacks.onInteract?.(id);
  }
  function respawn() {
    if (disposed || paused) return;
    release();
    resetDrive(state);
    setCamera(0, true);
    lastShadowPaint = -Infinity;
    schedule();
  }
  function getPose() {
    return { x: state.x, z: state.z, heading: state.heading, unlocked: state.unlocked };
  }
  function restorePose(pose) {
    if (disposed || !pose || ![pose.x, pose.z, pose.heading].every(Number.isFinite)) return;
    if (pose.x < DRIVE_BOUNDS.minX || pose.x > DRIVE_BOUNDS.maxX ||
        pose.z < DRIVE_BOUNDS.minZ || pose.z > DRIVE_BOUNDS.maxZ) return;
    release();
    resetDrive(state);
    state.x = pose.x;
    state.z = pose.z;
    state.heading = pose.heading;
    state.unlocked = pose.unlocked === true;
    state.rampLanded = state.unlocked;
    discovered = state.unlocked;
    // Resolve the pavement height and the parking invitation at the saved position.
    stepDrive(state, { throttle: 0, steer: 0 }, FIXED_STEP);
    nearby = eligibleStop();
    callbacks.onNearby?.(nearby);
    setCamera(0, true);
    lastShadowPaint = -Infinity;
    readout(performance.now(), true);
    schedule();
  }
  function toggleMute() {
    const muted = motor.toggle();
    callbacks.onMuteChange?.(muted);
    return muted;
  }

  function keydown(event) {
    if (paused || disposed || !inView || document.hidden || event.defaultPrevented ||
      event.altKey || event.metaKey || event.ctrlKey || !gameKeys.has(event.code)) return;
    const target = event.target;
    if (target instanceof Element && target !== document.body &&
        target !== document.documentElement && target !== host && target !== canvas) return;
    event.preventDefault();
    pressed.add(event.code);
    if (throttleKeys.has(event.code)) firstMovement();
    if (event.repeat) return;
    if (event.code === 'Space') jump();
    if (event.code === 'KeyR') respawn();
    if (event.code === 'KeyE' || event.code === 'Enter') interact();
    if (event.code === 'KeyM') callbacks.onMap?.();
    if (event.code === 'KeyL') toggleMute();
  }
  function keyup(event) {
    pressed.delete(event.code);
  }
  function focusGame() {
    host.focus({ preventScroll: true });
  }
  function activity() {
    if (!inView || document.hidden) {
      release();
      stop();
    } else schedule();
    motor.run(!paused && !document.hidden && inView);
  }
  function contextLost(event) {
    event.preventDefault();
    dispose();
    callbacks.onFallback?.();
  }
  function resize() {
    size();
    schedule();
  }
  const resizeObserver = new ResizeObserver(resize);
  const visibilityObserver = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    activity();
  });
  document.addEventListener('keydown', keydown);
  document.addEventListener('keyup', keyup);
  window.addEventListener('blur', release);
  document.addEventListener('visibilitychange', activity);
  canvas.addEventListener('pointerdown', focusGame);
  canvas.addEventListener('webglcontextlost', contextLost);
  resizeObserver.observe(host);
  visibilityObserver.observe(host);
  ratio = Math.min(window.devicePixelRatio || 1, host.clientWidth < 680 ? 1.4 : 1.65);
  size();
  activity();

  function dispose() {
    if (disposed) return;
    disposed = true;
    stop();
    release();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    document.removeEventListener('keydown', keydown);
    document.removeEventListener('keyup', keyup);
    window.removeEventListener('blur', release);
    document.removeEventListener('visibilitychange', activity);
    canvas.removeEventListener('pointerdown', focusGame);
    canvas.removeEventListener('webglcontextlost', contextLost);
    motor.dispose();
    movable.dispose();
    truck.dispose();
    world.dispose();
    sun.shadow.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    delete host.dataset.driverReady;
    delete host.dataset.renderer;
  }

  async function setExpanded() {
    if (expanded || disposed) return;
    expanded = true;
    await world.loadDistricts();
    lastShadowPaint = -Infinity;
    if (!disposed) schedule();
  }

  return {
    setStick, setBrake: value => { touchBrake = Boolean(value) && !paused; },
    jump, interact, respawn, getPose, restorePose, toggleMute, setPaused, setOpened, setExpanded, dispose,
  };
}

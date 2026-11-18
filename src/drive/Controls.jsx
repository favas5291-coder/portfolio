import { useRef } from 'react';

const paths = {
  map: 'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16m6-14v16',
  sound: 'M3 9h4l5-4v14l-5-4H3z M16 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14',
  mute: 'M3 9h4l5-4v14l-5-4H3z M16 9l5 6m0-6-5 6',
  reset: 'M3 10a9 9 0 1 1 1 7 M3 4v6h6',
  controls: 'M5 7h14l3 10a2 2 0 0 1-3 2l-4-4H9l-4 4a2 2 0 0 1-3-2z M6 11h4m-2-2v4m8-2h1m1 2h1',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  out: 'M6 18 18 6M8 6h10v10',
  back: 'M19 12H5m6 6-6-6 6-6',
  pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0z M14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  wa: 'M20 11a8 8 0 0 1-12 7l-5 2 1.5-5A8.5 8.5 0 1 1 20 11z M8 8c1 4 3 6 7 7',
};
export function Icon({ name }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function Joystick({ onStick }) {
  const active = useRef(null);
  function move(event) {
    if (event.pointerId !== active.current) return;
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const radius = rect.width * 0.37;
    const dx = (event.clientX - rect.left - rect.width / 2) / radius;
    const dy = (event.clientY - rect.top - rect.height / 2) / radius;
    const scale = Math.max(1, Math.hypot(dx, dy));
    const x = dx / scale,
      y = dy / scale;
    target.style.setProperty('--stick-x', x * radius * 0.76 + 'px');
    target.style.setProperty('--stick-y', y * radius * 0.76 + 'px');
    onStick(x, -y);
  }
  function release(event) {
    if (event.pointerId !== active.current) return;
    active.current = null;
    event.currentTarget.style.removeProperty('--stick-x');
    event.currentTarget.style.removeProperty('--stick-y');
    onStick(0, 0);
  }
  return (
    <div
      role="group"
      aria-label="Touch driving control"
      data-stick=""
      className="drive-stick"
      onPointerDown={(e) => {
        if (active.current !== null) return;
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <i />
      <span />
    </div>
  );
}

export function ControlsHelp() {
  return (
    <div className="drive-help">
      <h2>Driving controls</h2>
      <p>
        On a phone, slide your thumb up to drive, sideways to steer, and down to reverse. Hold Brake to park. A
        shop can be opened when you slow down beside it.
      </p>
      <dl>
        {[
          ['Drive and steer', 'W A S D / Arrow keys'],
          ['Brake', 'B'],
          ['Jump', 'Space'],
          ['Explore a stop', 'Enter / E'],
          ['Open the map', 'M'],
          ['Sound on or off', 'L'],
          ['Recover the pickup', 'R'],
        ].map(([action, keys]) => (
          <div key={action}>
            <dt>{action}</dt>
            <dd>{keys}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

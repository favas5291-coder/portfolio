import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { project } from '../data/portfolio.js';

export const productURL = 'https://www.gymdrobe.com/product/6ad2351ed8f991271e3d1a8b';
export const evidenceRoot = project.repository + '/blob/935e09add8383cfa104379f83e002ed3b0834b8f/';
const options = [
  { name: 'Black', colour: '#232323', photo: '/images/projects/gymdrobe-shirt-black.webp' },
  { name: 'Red', colour: '#a52c31', photo: '/images/projects/gymdrobe-shirt-red.webp' },
];
const sizes = ['S', 'M', 'L', 'XL'];
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

function Product({ colour, onColour, size, onSize }) {
  return (
    <div className="sample">
      <div className="shopbar">
        <b>GYMDROBE</b>
        <span>Workout essentials</span>
      </div>
      <div className="sample-product">
        <div className="sample-photo">
          <img
            src={colour.photo}
            width="240"
            height={colour.name === 'Black' ? 360 : 320}
            fetchPriority="high"
            alt={colour.name + ' COITONIC compression shirt'}
          />
        </div>
        <div className="sample-info">
          <span className="maker">COITONIC</span>
          <h3>Compression Half Sleeves T-shirt</h3>
          <fieldset>
            <legend>
              Colour <strong>{colour.name}</strong>
            </legend>
            <div className="swatches">
              {options.map((c) => (
                <button
                  type="button"
                  key={c.name}
                  aria-label={'Choose ' + c.name}
                  aria-pressed={colour === c}
                  onClick={() => onColour(c)}
                >
                  <i style={{ background: c.colour }} />
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>
              Size <strong>{size || 'Choose'}</strong>
            </legend>
            <div className="size-buttons">
              {sizes.map((s) => (
                <button
                  type="button"
                  key={s}
                  aria-label={'Size ' + s}
                  aria-pressed={size === s}
                  onClick={() => onSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="observed">Sample sizes. Check the store for current availability.</p>
          <a href={productURL + '?colour=' + colour.name.toUpperCase()}>View product at GymDrobe ↗</a>
        </div>
      </div>
    </div>
  );
}

function RailScene({ frame }) {
  useEffect(() => {
    const host = frame.current,
      pref = matchMedia('(prefers-reduced-motion: reduce)');
    let dispose,
      generation = 0;
    async function start() {
      const seq = ++generation;
      dispose?.();
      dispose = undefined;
      if (pref.matches) return;
      try {
        const { mountRails } = await import('./rails.js');
        if (seq === generation) dispose = mountRails(host);
      } catch {
        /* The illustrated rails remain available. */
      }
    }
    const timer = setTimeout(start, 180);
    pref.addEventListener('change', start);
    return () => {
      generation++;
      clearTimeout(timer);
      dispose?.();
      pref.removeEventListener('change', start);
    };
  }, [frame]);
  return null;
}

export default function ProductBench() {
  const [colour, setColour] = useState(options[0]),
    [size, setSize] = useState('');
  const [width, setWidth] = useState(null),
    [area, setArea] = useState(0),
    [touched, setTouched] = useState(false);
  const space = useRef(null),
    frame = useRef(null),
    drag = useRef(null),
    modal = useRef(null),
    enlarge = useRef(null);
  useLayoutEffect(() => {
    const measure = () => setArea(Math.round(space.current.getBoundingClientRect().width));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(space.current);
    return () => ro.disconnect();
  }, []);
  const available = Math.max(1, area - 36),
    min = Math.min(300, available),
    max = Math.max(600, available);
  const logical = clamp(width ?? (area < 500 ? available : max), min, max);
  const physical = Math.min(logical, available),
    scale = physical / logical;
  const set = (n) => {
    setTouched(true);
    setWidth(clamp(n, min, max));
  };
  const productProps = {
    colour,
    onColour: (c) => {
      setTouched(true);
      setColour(c);
    },
    size,
    onSize: (s) => {
      setTouched(true);
      setSize(s);
    },
  };
  const keyDown = (e) => {
    const inc = e.shiftKey ? 32 : 8;
    const keys = { ArrowLeft: logical - inc, ArrowRight: logical + inc, Home: min, End: max };
    if (Object.hasOwn(keys, e.key)) {
      e.preventDefault();
      set(keys[e.key]);
    }
  };
  const down = (e) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, start: logical };
    e.currentTarget.focus({ preventScroll: true });
    e.currentTarget.setPointerCapture(e.pointerId);
    setTouched(true);
  };
  return (
    <section className="bench" id="demonstration" aria-label="GymDrobe product demonstration">
      <header className="bench-head">
        <div>
          <span className="eyeline">A store I founded and built</span>
          <h2>
            GymDrobe<span>.</span>
          </h2>
        </div>
        <span className="bench-tag">Local interactive demo</span>
      </header>
      <div className="platen" ref={space}>
        <div
          ref={frame}
          className={'mount' + (touched ? ' used' : '')}
          data-renderer="illustration"
          style={area ? { width: physical + 24 } : undefined}
        >
          <div className="metal-layer" aria-hidden="true" />
          <div className="rail left" aria-hidden="true" />
          <div className="rail right" aria-hidden="true" />
          <div className="sample-window">
            <div style={area ? { width: logical, zoom: scale } : undefined}>
              <Product {...productProps} />
            </div>
          </div>
          <div
            className="handle"
            role="slider"
            tabIndex={0}
            aria-label="Resize product layout"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={logical}
            aria-valuetext={logical + ' CSS pixels'}
            onKeyDown={keyDown}
            onPointerDown={down}
            onPointerMove={(e) => {
              if (drag.current)
                set(
                  drag.current.start +
                    ((e.clientX - drag.current.x) * (max - min)) / Math.max(96, available - min),
                );
            }}
            onLostPointerCapture={() => {
              drag.current = null;
            }}
          >
            <i>↔</i>
          </div>
        </div>
        <RailScene frame={frame} />
      </div>
      <div className="bench-foot">
        <span>
          <b>↔</b> Drag to resize {area > 0 && <output>{logical} px</output>}
        </span>
        <div className="tools" role="group" aria-label="Demo layout">
          <button onClick={() => set(max)} aria-pressed={logical === max}>
            Desktop
          </button>
          <button onClick={() => set(min)} aria-pressed={logical < 450}>
            Mobile
          </button>
          <button
            ref={enlarge}
            aria-label="Enlarge product demo"
            onClick={() => modal.current.showModal()}
          >
            ⤢
          </button>
        </div>
      </div>
      <dialog
        className="fit-dialog"
        aria-label="Enlarged product demo"
        ref={modal}
        onClose={() => enlarge.current.focus()}
      >
        <div>
          <header>
            <b>GymDrobe · Local interactive demo</b>
            <button onClick={() => modal.current.close()}>Close ×</button>
          </header>
          <Product {...productProps} />
        </div>
      </dialog>
    </section>
  );
}

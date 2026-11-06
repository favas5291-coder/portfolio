import { useEffect, useRef, useState } from 'react';
import { projectPreviews } from '../data/project-previews.js';
import Arrow from './Arrow.jsx';
import './capture.css';

const date = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});
export default function Capture({ projectId = 'gymdrobe', name = 'GymDrobe', preferMobile = false }) {
  const proof = projectPreviews[projectId];
  const [selection, setSelection] = useState(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (!preferMobile) return;
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [preferMobile]);
  const dialog = useRef(null),
    button = useRef(null);
  const paired = proof.mobile?.matchesDesktop === proof.screenshot;
  const device = paired && (selection ?? (narrow ? 'Mobile' : 'Desktop')) === 'Mobile' ? 'Mobile' : 'Desktop';
  const mobile = device === 'Mobile';
  const capture = mobile ? proof.mobile : proof;
  return (
    <figure className="capture">
      <div className="capture-bar">
        <span className="eyeline">Captured preview</span>
        {paired && (
          <div className="tools" role="group" aria-label="Compare desktop and mobile">
            {['Desktop', 'Mobile'].map((d) => (
              <button key={d} aria-pressed={device === d} onClick={() => setSelection(d)}>
                {d}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={'capture-image' + (mobile ? ' portrait' : '')}>
        <img
          loading="lazy"
          src={capture.screenshot}
          width={capture.width}
          height={capture.height}
          alt={name + ' ' + device.toLowerCase() + ' homepage'}
        />
      </div>
      <figcaption>
        <span>Captured {date.format(new Date(capture.capturedAt))}</span>
        <button ref={button} onClick={() => dialog.current.showModal()}>
          Enlarge screenshot {preferMobile ? <Arrow /> : <span aria-hidden="true">↗</span>}
        </button>
      </figcaption>
      <dialog
        className="fit-dialog capture-dialog"
        ref={dialog}
        aria-label={`${name} storefront capture`}
        onClose={() => button.current.focus()}
      >
        <div>
          <header>
            <strong>{name} · {device}</strong>
            <button onClick={() => dialog.current.close()}>Close ×</button>
          </header>
          <img
            src={capture.screenshot}
            width={capture.width}
            height={capture.height}
            alt={'Enlarged ' + device.toLowerCase() + ' storefront'}
          />
        </div>
      </dialog>
    </figure>
  );
}

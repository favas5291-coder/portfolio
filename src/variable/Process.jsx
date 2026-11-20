import { useRef, useState } from 'react';
import { productURL } from '../data/product-evidence.js';

const layouts = [
  {
    id: 'inline',
    title: 'After the details',
    effect: 'Read the fit and fabric before reaching the shop link.',
  },
  { id: 'pinned', title: 'At the screen edge', effect: 'Keep the shop link in reach while reading.' },
];

function PhoneProposal({ proposal, scrolled }) {
  return (
    <article className="vw-proposal" data-layout={proposal.id} aria-label={proposal.title}>
      <div className="vw-phone" data-inspect={scrolled ? 'details' : 'image'}>
        <div className="vw-phone-head">GymDrobe</div>
        <div className="vw-phone-window">
          <div className="vw-phone-page">
            <img
              src="/images/projects/gymdrobe-shirt-black.webp"
              alt="Black compression T-shirt"
              width="640"
              height="960"
              loading="lazy"
            />
            <div className="vw-phone-copy">
              <strong>Compression Half Sleeves T-shirt</strong>
              <span>Coitonic · Black</span>
              <p>Close-fitting nylon–spandex. 180 GSM.</p>
              {proposal.id === 'inline' && (
                <a href={productURL} tabIndex={scrolled ? 0 : -1}>
                  Shop this tee
                </a>
              )}
            </div>
          </div>
        </div>
        {proposal.id === 'pinned' && (
          <div className="vw-phone-fixed">
            <a href={productURL}>Shop this tee</a>
          </div>
        )}
      </div>
      <h3>{proposal.title}</h3>
      <p>{proposal.effect}</p>
    </article>
  );
}

export default function LayoutReview() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState(0);
  const gallery = useRef(null);
  function showLayout(i) {
    setActive(i);
    const strip = gallery.current;
    const target = strip.children[i];
    strip.scrollTo({
      left: target.getBoundingClientRect().left - strip.getBoundingClientRect().left + strip.scrollLeft,
      behavior: 'instant',
    });
  }
  return (
    <div className="vw-review">
      <div className="vw-review-controls" role="group" aria-label="Preview both proposals">
        <button type="button" aria-pressed={!scrolled} onClick={() => setScrolled(false)}>
          Product image
        </button>
        <button type="button" aria-pressed={scrolled} onClick={() => setScrolled(true)}>
          Product details
        </button>
      </div>
      <div className="vw-review-switch" role="group" aria-label="Choose a proposal">
        {layouts.map((layout, i) => (
          <button key={layout.id} type="button" aria-pressed={active === i} onClick={() => showLayout(i)}>
            {layout.title}
          </button>
        ))}
      </div>
      <div
        className="vw-phones"
        ref={gallery}
        onScroll={({ currentTarget: strip }) => {
          if (strip.scrollWidth > strip.clientWidth)
            setActive(strip.scrollLeft > strip.clientWidth * 0.4 ? 1 : 0);
        }}
      >
        {layouts.map((proposal) => (
          <PhoneProposal key={proposal.id} proposal={proposal} scrolled={scrolled} />
        ))}
      </div>
    </div>
  );
}

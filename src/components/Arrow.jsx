import './arrow.css';

export default function Arrow({ down = false }) {
  return (
    <svg className="contact-arrow" viewBox="0 0 24 24" aria-hidden="true">
      <path d={down ? 'M12 4v16m-6-6 6 6 6-6' : 'M5 19 19 5M5 5h14v14'} />
    </svg>
  );
}


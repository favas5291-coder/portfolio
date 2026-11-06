import { services } from '../data/site.js';
import Arrow from './Arrow.jsx';

export default function ServiceLinks({ exclude, rows = false }) {
  return (
    <div className={rows ? 'service-rows' : 'service-grid'}>
      {services.filter(service => service.slug !== exclude).map((service, index) => (
        <a className="service-card" href={`/services/${service.slug}/`} key={service.slug}>
          <span className="mono">0{index + 1}{!rows && ' / DEVELOPMENT'}</span>
          <div className="service-card-copy">
            <h3>{service.name}{!rows && <span aria-hidden="true">↗</span>}</h3>
            <p>{service.short}</p>
          </div>
          {rows ? <Arrow/> : <span className="text-link">Explore {service.name.toLowerCase()}</span>}
        </a>
      ))}
    </div>
  );
}

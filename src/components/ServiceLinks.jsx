import { services } from '../data/site.js';
export default function ServiceLinks({ exclude }) {
  return <div className="service-grid">{services.filter(service => service.slug !== exclude).map((service, index) => <a className="service-card" href={`/services/${service.slug}/`} key={service.slug}><span className="mono">0{index + 1} / DEVELOPMENT</span><h3>{service.name}<span aria-hidden="true">↗</span></h3><p>{service.short}</p><span className="text-link">Explore {service.name.toLowerCase()}</span></a>)}</div>;
}

import { profile, project, luxvibe, fabea } from './data/portfolio.js';
import { projectPreviews } from './data/project-previews.js';
import { services, processSteps } from './data/site.js';
import { ContactActions, MobileContact } from './components/ContactActions.jsx';
import ServiceLinks from './components/ServiceLinks.jsx';
import AnalyticsPreference from './components/AnalyticsPreference.jsx';

const External = ({ href, children, ...props }) => <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}<span className="sr-only"> (opens in a new tab)</span></a>;
export function Process() {
  return <section className="marketing-section" aria-labelledby="process-title"><p className="mono overline">FROM BRIEF TO BUILD</p><h2 id="process-title">A clear process, together.</h2><ol className="process-list">{processSteps.map(([name, detail], i) => <li key={name}><span className="mono">0{i + 1}</span><div><h3>{name}</h3><p>{detail}</p></div></li>)}</ol><p className="scope-note">Scope, quote, schedule and any support arrangement are agreed for your project.</p></section>;
}
function ProjectEvidence({ text }) {
  return <aside className="project-proof"><div><p className="mono overline">REAL PROJECT / MY OWN BUILD</p><h2>GymDrobe, from product to purchase.</h2><p>{text || 'My own fitness e-commerce platform brings clothing, supplements and accessories into one store. See how the interface, shopping state and checkout connect.'}</p><a href="/projects/gymdrobe/" className="text-link">Read the GymDrobe case study <span aria-hidden="true">↗</span></a></div><a href="/projects/gymdrobe/" aria-label="View the GymDrobe case study"><img src={project.screenshot} alt={project.screenshotAlt} width="1348" height="926" loading="lazy" decoding="async"/></a></aside>;
}
function QuoteCTA() { return <section className="quote-cta"><p className="mono overline">YOUR NEXT WEBSITE</p><h2>Tell me what your business needs.</h2><p>Share your idea or existing website. We can define the right scope and a quote.</p><ContactActions/></section>; }
function ServicePage({ service }) {
  return <><section className="marketing-hero"><p className="mono overline">{service.name} / KOZHIKODE · KERALA · REMOTE</p><h1>{service.heading}</h1><p className="marketing-lead">{service.audience}</p><ContactActions compact/><a className="text-link" href="/projects/gymdrobe/">View my work <span aria-hidden="true">↗</span></a></section>
    <section className="marketing-section split-copy"><div><p className="mono overline">BUILT AROUND YOUR CUSTOMERS</p><h2>Make the next step easier.</h2><p>{service.problem}</p></div><div><h2 className="small-heading">What we can include</h2><p>The final deliverables depend on the scope we agree.</p><ul className="deliverables">{service.deliverables.map(item => <li key={item}>{item}</li>)}</ul></div></section>
    <ProjectEvidence text={service.evidence}/><Process/>
    <section className="marketing-section faq-section" aria-labelledby="faq-title"><p className="mono overline">BEFORE WE START</p><h2 id="faq-title">Useful questions.</h2>{service.faqs.map(([q, a]) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</section>
    <QuoteCTA/><section className="marketing-section"><h2>Need something different?</h2><ServiceLinks exclude={service.slug}/></section></>;
}
function ServicesPage() {
  return <><section className="marketing-hero"><p className="mono overline">FREELANCE WEBSITE DEVELOPMENT</p><h1>A website that works for your business.</h1><p className="marketing-lead">I’m Muhammed Favas K, a freelance web developer in Kozhikode (Calicut), Kerala. I build business websites, online stores and focused landing pages, with remote availability across India.</p><ContactActions compact/></section><section className="marketing-section" aria-labelledby="services-title"><p className="mono overline">FIND YOUR STARTING POINT</p><h2 id="services-title">What do you need to build?</h2><ServiceLinks/></section><ProjectEvidence/><Process/><QuoteCTA/></>;
}
function GymDrobePage() {
  return <><section className="marketing-hero"><p className="mono overline">CASE STUDY / OWN PROJECT</p><h1>GymDrobe.<br/><span className="muted">One connected store.</span></h1><p className="marketing-lead">{project.description} I built GymDrobe as my own project; this is not a paid client engagement.</p><div className="enquiry-actions"><External className="button-solid" href={project.website}>Visit GymDrobe <span aria-hidden="true">↗</span></External><External className="text-link" href={project.repository}>Explore the source <span aria-hidden="true">↗</span></External></div></section>
    <figure className="case-image"><img src={project.screenshot} alt={project.screenshotAlt} width="1348" height="926" decoding="async" fetchPriority="high"/><figcaption className="mono">ACTUAL PUBLIC STOREFRONT / CAPTURED {project.screenshotCaptured}</figcaption></figure>
    <section className="marketing-section split-copy"><div><p className="mono overline">THE BUSINESS PROBLEM</p><h2>Workout essentials, brought together.</h2><p>{project.problem}</p></div><div><p className="mono overline">MY ROLE / {project.role}</p><h2 className="small-heading">Connecting the customer journey.</h2><p>{project.contribution}</p><ul className="deliverables">{project.features.map(feature => <li key={feature}>{feature}</li>)}</ul></div></section>
    <section className="marketing-section"><p className="mono overline">TECHNOLOGY & DECISIONS</p><h2>The parts behind the purchase.</h2><p>{project.stack.join(' · ')}</p><div className="case-decisions">{project.decisions.map(d => <article key={d.title}><h3>{d.title}</h3><p>{d.challenge}</p><p>{d.decision}</p><External className="text-link" href={`${project.repository}/blob/${project.commit}/${d.file}`}>Read the implementation <span aria-hidden="true">↗</span></External></article>)}</div><p className="scope-note">{project.evidence}</p><p className="scope-note">No sales, traffic or conversion results are claimed in this case study.</p></section><QuoteCTA/></>;
}
function LuxvibePage() {
  const capture = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(projectPreviews.luxvibe.capturedAt));
  return <>
    <section className="marketing-hero">
      <p className="mono overline">INDEPENDENT CONCEPT / BOUTIQUE COMMERCE</p>
      <h1>Luxvibe.<br/><span className="muted">An everyday boutique.</span></h1>
      <p className="marketing-lead">{luxvibe.description} This is self-initiated portfolio work, not a commissioned or approved client website.</p>
      <div className="enquiry-actions"><External className="button-solid" href={luxvibe.demo}>Explore the working demo <span aria-hidden="true">↗</span></External><a className="text-link" href="/contact/?service=ecommerce-development">Discuss a similar store <span aria-hidden="true">↗</span></a></div>
    </section>
    <figure className="case-image"><img src={luxvibe.screenshot} alt={luxvibe.screenshotAlt} width={projectPreviews.luxvibe.width} height={projectPreviews.luxvibe.height} decoding="async" fetchPriority="high"/><figcaption className="mono">ACTUAL CONCEPT CAPTURE / {capture} / SAMPLE PRODUCTS</figcaption></figure>
    <section className="marketing-section split-copy"><div><p className="mono overline">THE DESIGN QUESTION</p><h2>A boutique before the conversation.</h2><p>{luxvibe.problem}</p></div><div><p className="mono overline">MY ROLE / {luxvibe.role}</p><h2 className="small-heading">From discovery to a clear enquiry.</h2><p>{luxvibe.contribution}</p><ul className="deliverables">{luxvibe.features.map(feature => <li key={feature}>{feature}</li>)}</ul></div></section>
    <section className="marketing-section"><p className="mono overline">DESIGN & IMPLEMENTATION</p><h2>The choices behind the edit.</h2><p>{luxvibe.stack.join(' · ')}</p><div className="case-decisions">{luxvibe.decisions.map(d => <article key={d.title}><h3>{d.title}</h3><p>{d.challenge}</p><p>{d.decision}</p></article>)}</div></section>
    <section className="marketing-section concept-mobile-proof"><figure><img src={projectPreviews.luxvibe.mobile.screenshot} alt="Actual phone-width capture of the Luxvibe concept with fixed Home, Categories, Search, Wishlist and Cart navigation" width={projectPreviews.luxvibe.mobile.width} height={projectPreviews.luxvibe.mobile.height} loading="lazy" decoding="async"/><figcaption className="mono">PHONE-WIDTH BROWSER CAPTURE / {capture}</figcaption></figure><div><p className="mono overline">TRY THE JOURNEY</p><h2>A few pieces.<br/>One prepared message.</h2><ol className="deliverables"><li>Find the Classic Dial and choose the M/L strap option.</li><li>Add two watches and one Everyday Zip Wallet to your bag.</li><li>Preview the itemized enquiry with its ₹3,770 sample subtotal.</li><li>Reload the page to check that the bag and selected options remain.</li></ol><p className="scope-note">The public demo prepares sample messages only. It does not send them, collect payments or mark an order as confirmed.</p><External className="button-solid" href={luxvibe.demo}>Try it for yourself <span aria-hidden="true">↗</span></External></div></section>
    <section className="marketing-section"><p className="mono overline">VALIDATION & CURRENT SCOPE</p><h2>Working, with clear boundaries.</h2><p>{luxvibe.evidence}</p><p className="scope-note">The actual Luxvibe catalog, photo permissions, receiving number, shipping and replacement policies still require owner confirmation. Production administration would need real authentication, server authorization and shared data storage. Physical-device and Lighthouse testing have not been claimed.</p></section>
    <QuoteCTA/>
  </>;
}

function FabeaPage() {
  const preview = projectPreviews.fabea;
  return <>
    <section className="marketing-hero">
      <p className="mono overline">CASE STUDY / INDEPENDENT STOREFRONT CONCEPT</p>
      <h1>FABEA.<br/><span className="muted">Carry your style.</span></h1>
      <p className="marketing-lead">{fabea.description} The collection uses sample products and generated photography.</p>
      <div className="enquiry-actions">
        <a className="button-solid" href={fabea.demo}>Open the working demo <span aria-hidden="true">↗</span></a>
        <a className="text-link" href="/contact/?service=ecommerce-development">Discuss this concept <span aria-hidden="true">↗</span></a>
      </div>
    </section>
    <figure className="case-image">
      <img src={preview.screenshot} alt="FABEA concept homepage with a chocolate handbag campaign and warm ivory typography" width={preview.width} height={preview.height} fetchPriority="high" decoding="async"/>
      <figcaption className="mono">STOREFRONT CAPTURE / SAMPLE COLLECTION</figcaption>
    </figure>
    <section className="marketing-section split-copy">
      <div><p className="mono overline">THE SHOPPING JOURNEY</p><h2>From a look to a piece.</h2><p>{fabea.problem}</p></div>
      <div><p className="mono overline">DESIGN & DEVELOPMENT</p><h2 className="small-heading">A boutique you can explore.</h2><p>{fabea.contribution}</p>
        <ul className="deliverables">{fabea.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
      </div>
    </section>
    <section className="marketing-section">
      <p className="mono overline">TRY THE DEMO</p><h2>Find a piece and prepare an enquiry.</h2>
      <ol className="deliverables"><li>Search for The Muse or browse the Bags collection.</li><li>Save a favourite, open a product and choose a quantity.</li><li>Add it to the enquiry bag and copy the sample message.</li></ol>
      <p className="scope-note">This independent preview uses illustrative inventory. A live store would use the boutique’s approved catalogue, business number and policies.</p>
      <a className="button-solid" href={fabea.demo}>Explore FABEA <span aria-hidden="true">↗</span></a>
    </section>
    <QuoteCTA/>
  </>;
}

function PrivacyPage() {
  return <><section className="marketing-hero"><p className="mono overline">YOUR INFORMATION</p><h1>Privacy & enquiries.</h1><p className="marketing-lead">This site is operated by Muhammed Favas K in Kozhikode, Kerala, India. Contact <a href={`mailto:${profile.email}`} data-contact="email">{profile.email}</a> with questions about your information.</p></section><section className="marketing-section privacy-copy"><h2>Project details you choose to share</h2><p>The enquiry form asks for your name, a way to reply and a short project description. Business name and budget are optional. These details are used to discuss your project, rather than added to a marketing list.</p><p>When the form offers a WhatsApp handoff, your brief is prepared in a link. You review it and send it in WhatsApp yourself; opening the link does not prove a message was sent. WhatsApp handles that conversation under its own privacy terms.</p><p>When direct form delivery is enabled, Formspree processes the submitted details and forwards them to the site owner. Its processing and retention policies also apply. Please avoid sharing passwords, payment details or sensitive personal information.</p><p>You can ask me to correct or delete enquiry information by email. Information needed for an agreed project or required records may need to be retained. No fixed deletion schedule is promised here.</p><h2>Optional analytics</h2><p>Analytics are off by default. If configured, you can choose to enable Google Analytics using the control below. The integration records page views, contact-button clicks and form-service confirmations, without form contents, query strings, WhatsApp message text or contact details as event parameters. Google may process device and network data and use analytics cookies when you opt in.</p><p>A contact click does not confirm an enquiry, and an enquiry does not confirm a sale. You can turn analytics off below. Previously recorded data and cookies may remain subject to the provider’s settings; clearing this site’s browser data removes local preferences.</p><AnalyticsPreference/><h2>Local preferences & hosting</h2><p>Your chosen 2D/3D view, motion preference and analytics choice may be stored in your browser. The hosting provider may process ordinary request and security logs.</p><p><External href="https://formspree.io/legal/privacy-policy/" className="text-link">Formspree privacy information ↗</External></p><p><External href="https://policies.google.com/privacy" className="text-link">Google privacy information ↗</External></p></section></>;
}
export default function MarketingPages({ page }) {
  return <div className="marketing-shell"><a className="skip-link" href="#main">Skip to content</a><header className="marketing-header"><a href="/" className="wordmark" aria-label="Favas home"><span className="forge-mark" aria-hidden="true"><i/><i/><i/></span>FAVAS<span className="wordmark-period">.</span></a><nav aria-label="Main navigation"><a href="/">Portfolio</a><a href="/services/" aria-current={page.path.startsWith('/services/') ? 'page' : undefined}>Services</a><a href="/#projects" aria-current={page.path.startsWith('/projects/') ? 'page' : undefined}>Work</a><a href="/contact/" aria-current={page.path === '/contact/' ? 'page' : undefined}>Contact</a></nav><a href="/contact/" className="header-contact">REQUEST A QUOTE <span aria-hidden="true">↗</span></a></header><main id="main" tabIndex={-1} className="marketing-main"><nav aria-label="Breadcrumb" className="breadcrumbs"><ol><li><a href="/">Home</a></li>{page.service && <li><a href="/services/">Services</a></li>}<li aria-current="page">{page.label}</li></ol></nav>{page.service ? <ServicePage service={page.service}/> : page.path === '/services/' ? <ServicesPage/> : page.path === '/projects/gymdrobe/' ? <GymDrobePage/> : page.path === '/projects/luxvibe/' ? <LuxvibePage/> : page.path === '/projects/fabea/' ? <FabeaPage/> : page.path === '/privacy/' ? <PrivacyPage/> : <section className="marketing-hero"><p className="mono overline">404 / PAGE NOT FOUND</p><h1>This page is missing.</h1><p className="marketing-lead">Explore my website development services or tell me what you need to build.</p><a className="button-solid" href="/services/">Explore services ↗</a></section>}</main><footer className="marketing-footer"><div><span className="mono">MUHAMMED FAVAS K / AFTERLIGHT</span><p>Web development from Kozhikode, Kerala.<br/>Remote projects across India.</p></div><nav aria-label="Footer navigation"><a href="/services/">Services</a><a href="/projects/gymdrobe/">GymDrobe</a><a href="/projects/luxvibe/">Luxvibe concept</a><a href="/projects/fabea/">FABEA concept</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a><External href={profile.github}>GitHub</External><External href={profile.linkedin}>LinkedIn</External></nav><AnalyticsPreference/></footer><MobileContact/></div>;
}

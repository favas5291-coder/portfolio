"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Camera, Check, ChevronDown, Copy, Heart, Menu, Minus, Plus, Search, ShoppingBag, SlidersHorizontal, X, ZoomIn } from "lucide-react";
import { enquiryText, isValidSelection, money, price, productPath, selectionKey, type Product, type Selection } from "./catalogue"
import { demoHref } from "./routes";

const colours: Record<string, string> = {
  Chocolate: "#4b2c20", Burgundy: "#68242d", Sand: "#c6ac8d", Black: "#222", Espresso: "#38251b"
};
const nav = [["The collection", "/shop"], ["Bags", "/shop?category=bags"], ["Heels", "/shop?category=heels"], ["The FABEA Edit", "/#the-edit"], ["Our story", "/about"]];
type ShopState = {
  products: Product[]; saved: string[]; bag: Selection[];
  toggleSaved: (id: string) => void; add: (item: Selection) => void;
  setBag: React.Dispatch<React.SetStateAction<Selection[]>>;
  notify: (message: string) => void; enquire: (items: Selection[]) => Promise<void>;
};
const Shop = createContext<ShopState | null>(null);
const useShop = () => useContext(Shop)!;

function Dialog({ title, children, close, className = "" }: { title: string; children: ReactNode; close: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    const panel = ref.current;
    panel?.showModal();
    document.body.style.overflow = "hidden";
    return () => { panel?.close(); document.body.style.overflow = previous; };
  }, []);
  return <dialog aria-label={title} ref={ref} className={"dialog " + className}
    onCancel={event => { event.preventDefault(); close(); }}
    onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="dialog-body">
      <header className="dialog-header"><p className="eyebrow">{title}</p><button className="icon" aria-label={"Close " + title} onClick={close}><X size={20}/></button></header>
      {children}
    </div>
  </dialog>;
}

export function Photo({ product, image = 0, eager = false }: { product?: Product; image?: number; eager?: boolean }) {
  const [broken, setBroken] = useState(false);
  const src = product?.images[image] || product?.images[0];
  useEffect(() => setBroken(false), [src]);
  return <div className="product-photo">
    {broken || !product || (!src && !product.sample)
      ? <div className="photo-fallback"><span className="wordmark">fabea</span><small>Image coming soon</small></div>
      : src
        ? <img src={src} alt={product.name} loading={eager ? "eager" : "lazy"} onError={() => setBroken(true)}/>
        : <div className="sample-photo" role="img" aria-label={product.name + " sample photograph"} style={{
            backgroundPosition: (product.imageIndex % 3) * 50 + "% " + (product.imageIndex < 3 ? "0%" : "100%")
          }}/>}
  </div>;
}
function SaveButton({ product, className = "icon" }: { product: Product; className?: string }) {
  const { saved, toggleSaved } = useShop();
  const active = saved.includes(product.id);
  return <button className={className + (active ? " selected" : "")} aria-pressed={active}
    aria-label={(active ? "Remove " : "Save ") + product.name + (active ? " from wishlist" : " to wishlist")}
    onClick={() => toggleSaved(product.id)}>
    <Heart size={20} strokeWidth={1.5} fill={active ? "currentColor" : "none"}/>
  </button>;
}
function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  return <article className="product-card">
    <div className="card-photo">
      <a href={demoHref(productPath(product))} aria-label={"Discover " + product.name}
        onPointerEnter={event => { if (event.pointerType === "mouse" && product.images.length > 1) setHovered(true); }}
        onPointerLeave={() => setHovered(false)}>
        <Photo product={product} image={hovered ? 1 : 0}/>
      </a>
      <SaveButton product={product} className="icon card-save"/>
      {product.stock === "unavailable" && <span className="stock-tag">Currently unavailable</span>}
    </div>
    <div className="card-title">
      <a href={demoHref(productPath(product))}>{product.name}</a>
      <span className="swatch" title={product.colours[0]} style={{ background: colours[product.colours[0]] || "#b7a393" }}/>
    </div>
    <div className="card-type">{product.type}</div>
    <div className="card-price">{price(product)}</div>
  </article>;
}
function ProductGrid({ products }: { products: Product[] }) {
  return <div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product}/>)}</div>;
}
function Empty({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="empty"><h2>{title}</h2><p>{description}</p>{children || <a href={demoHref("/shop")} className="button">Explore the collection <ArrowUpRight size={16}/></a>}</div>;
}
function Heading({ kicker, title, href, link }: { kicker: string; title: string; href?: string; link?: string }) {
  return <div className="section-heading"><div><p className="eyebrow">{kicker}</p><h2>{title}</h2></div>
    {href && <a className="text-link" href={href}>{link} <ArrowUpRight size={16}/></a>}
  </div>;
}

export default function Storefront({ products, path, query }: { products: Product[]; path: string; query: Record<string, string> }) {
  const [saved, setSaved] = useState<string[]>([]);
  const [bag, setBag] = useState<Selection[]>([]);
  const [ready, setReady] = useState(false);
  const [panel, setPanel] = useState<"search" | "menu" | null>(null);
  const [notice, setNotice] = useState("");
  const [manual, setManual] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = bag.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    try {
      const favourites = JSON.parse(localStorage.getItem("fazhere-fabea-demo-saved-v1") || "[]");
      const selections = JSON.parse(localStorage.getItem("fazhere-fabea-demo-enquiry-v1") || "[]");
      if (Array.isArray(favourites)) setSaved([...new Set<string>(favourites.filter(id => products.some(p => p.id === id)))]);
      if (Array.isArray(selections)) setBag(selections.filter(item => item && products.some(p => p.id === item.id && isValidSelection(item, p))).slice(0, 40));
    } catch { /* Browser storage can be unavailable. */ }
    setReady(true);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [products]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("fazhere-fabea-demo-saved-v1", JSON.stringify(saved));
      localStorage.setItem("fazhere-fabea-demo-enquiry-v1", JSON.stringify(bag));
    } catch { /* The current session still works. */ }
  }, [ready, saved, bag]);

  function notify(message: string) {
    setNotice(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(""), 4200);
  }
  function toggleSaved(id: string) {
    setSaved(old => old.includes(id) ? old.filter(item => item !== id) : [...old, id]);
  }
  function add(item: Selection) {
    if (!products.some(p => p.id === item.id && isValidSelection(item, p))) return;
    setBag(old => {
      const existing = old.find(i => selectionKey(i) === selectionKey(item));
      return existing ? old.map(i => i === existing ? { ...i, quantity: Math.min(10, i.quantity + item.quantity) } : i) : [...old, item];
    });
    notify("Added to your enquiry bag.");
  }
  async function enquire(items: Selection[]) {
    const valid = items.filter(item => products.some(p => p.id === item.id && isValidSelection(item, p)));
    if (!valid.length) return;
    const message = enquiryText(valid, products, location.origin);
    try {
      await navigator.clipboard.writeText(message);
      notify("Sample enquiry copied.");
    } catch {
      setManual(message);
    }
  }
  useEffect(() => { setPanel(null); setManual(""); }, [path]);
  const current = products.find(p => productPath(p) === path);
  const links = products.some(p => p.newArrival) ? [...nav.slice(0, 3), ["New arrivals", "/shop?new=1"], ...nav.slice(3)] : nav;

  return <Shop.Provider value={{ products, saved, bag, toggleSaved, add, setBag, notify, enquire }}>
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById("main")?.focus(); }}>Skip to content</a>
    <div className="announcement">Independent FABEA concept by Fazhere<span>—</span><a href="/projects/fabea/">Project overview <ArrowUpRight size={12}/></a></div>
    <header className="site-header">
      <div className="header-main">
        <div className="header-left">
          <button className="icon mobile-menu" aria-label="Open menu" onClick={() => setPanel("menu")}><Menu size={21}/></button>
          <button className="search-trigger" aria-label="Search the collection" onClick={() => setPanel("search")}><Search size={19}/><span>Find something lovely</span></button>
        </div>
        <a className="brand" href={demoHref("/")} aria-label="FABEA home"><span className="wordmark">fabea</span><span className="tagline">CARRY YOUR STYLE</span></a>
        <div className="header-actions">
          <a className="icon" href={demoHref("/wishlist")} aria-label={"Wishlist, " + saved.length + " saved pieces"}><Heart size={21}/>{saved.length > 0 && <b className="count">{saved.length}</b>}</a>
          <a className="icon bag-link" href={demoHref("/enquiry")} aria-label={"Enquiry bag, " + count + " items"}><ShoppingBag size={21}/>{count > 0 && <b className="count">{count}</b>}<span>Your bag</span></a>
        </div>
      </div>
      <nav className="desktop-nav" aria-label="Main navigation">{links.map(([name, href]) => <a key={href} href={demoHref(href)} className={href === path || href === "/shop?category=" + query.category ? "active" : ""}>{name}</a>)}</nav>
    </header>
    <main id="main" tabIndex={-1}>
      {path === "/" && <Home/>}
      {path === "/shop" && <Collection key={JSON.stringify(query)} query={query}/>}
      {path === "/wishlist" && <section className="section page-section">
        <p className="eyebrow">SAVED FOR ANOTHER LOOK</p><h1>Your favourites.</h1><p className="page-intro">A little collection of the pieces you love.</p>
        {saved.length ? <ProductGrid products={products.filter(p => saved.includes(p.id))}/> : <Empty title="Something will catch your eye." description="Save a piece with the heart icon and find it here whenever you like."/>}
      </section>}
      {path === "/enquiry" && <EnquiryBag count={count}/>}
      {current && <ProductDetail key={current.id} product={current}/>}
      {!current && !["/", "/shop", "/wishlist", "/enquiry"].includes(path) && <Information path={path}/>}
    </main>
    <Footer/>
    {notice && <div className="toast" role="status"><Check size={17}/>{notice}</div>}
    {panel === "menu" && <Dialog title="Menu" className="menu-dialog" close={() => setPanel(null)}>
      <a className="wordmark" href={demoHref("/")}>fabea</a>
      <nav aria-label="Mobile navigation">{links.map(([name, href]) => <a key={href} href={demoHref(href)} onClick={() => setPanel(null)}>{name}<ArrowUpRight size={18}/></a>)}</nav>
    </Dialog>}
    {panel === "search" && <SearchPanel close={() => setPanel(null)}/>}
    {manual && <Dialog title="Your enquiry" close={() => setManual("")}>
      <p>Copy this example to see what a customer enquiry would include.</p>
      <textarea className="copy-area" readOnly aria-label="Enquiry message" value={manual} onFocus={event => event.target.select()}/>

    </Dialog>}
  </Shop.Provider>;
}

function HeroImage({ className = "" }: { className?: string }) {
  return <img className={className} src="/demos/fabea/assets/editorial.webp" width="1536" height="1024"
    srcSet="/demos/fabea/assets/editorial-small.webp 768w, /demos/fabea/assets/editorial.webp 1536w"
    sizes="(max-width: 767px) 93vw, 62vw" fetchPriority="high"
    alt="Illustrative fashion editorial with cream tailoring and a chocolate handbag"/>;
}

function Home() {
  const { products } = useShop();
  const featured = products.filter(p => p.featured);
  const bag = products.find(p => p.category === "bags" && p.colours.includes("Burgundy")) || products.find(p => p.category === "bags");
  const heel = products.find(p => p.category === "heels" && p.colours.includes("Burgundy")) || products.find(p => p.category === "heels");
  return <>
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">THE EVERYDAY, ELEVATED</p><h1>Carry<br/>{" "}your <em>style.</em></h1>
        <p className="hero-description">Bags and heels for everyday plans<br className="desktop-break"/> and special occasions.</p>
        <div className="hero-actions"><a className="button" href={demoHref("/shop?category=bags")}>Explore bags <ArrowUpRight size={17}/></a>
        <a className="text-link" href={demoHref("/shop?category=heels")}>Discover heels <ArrowRight size={15}/></a></div>
        <span className="hero-note">CONSIDERED PIECES. ENDLESS POSSIBILITIES.</span>
      </div>
      <div className="hero-photo"><HeroImage/><span>THE ART OF EVERYDAY DRESSING</span><span>01 / THE FABEA EDIT</span></div>
    </section>
    <div className="value-line"><span>Curated with intention</span><i/><span>A little everyday elegance</span><i/><span>Styled your way</span></div>
    <section className="section featured">
      <Heading kicker="A FEW THINGS TO FALL FOR" title="Your next everyday favourite." href={demoHref("/shop")} link="Explore the collection"/>
      {products.some(p => p.sample) && <p className="sample-note">Collection preview · Illustrative sample styles</p>}
      {products.length ? <ProductGrid products={(featured.length ? featured : products).slice(0, 4)}/> : <Empty title="The collection is taking shape." description="Browse the concept collection."/>}
    </section>
    <section className="section category-grid">
      <a className="category-tile" href={demoHref("/shop?category=bags")}><Photo product={products.find(p => p.category === "bags")}/><div>
        <p className="eyebrow">YOUR EVERYDAY COMPANION</p><h2>Bags to go places.</h2><span className="text-link">Discover bags <ArrowUpRight size={16}/></span></div></a>
      <a className="category-tile heels-tile" href={demoHref("/shop?category=heels")}><Photo product={heel}/><div>
        <p className="eyebrow">FOR YOUR NEXT CHAPTER</p><h2>A step above.</h2><span className="text-link">Discover heels <ArrowUpRight size={16}/></span></div></a>
    </section>
    {bag && heel && <section className="edit" id="the-edit">
      <div className="edit-copy"><p className="eyebrow">THE FABEA EDIT · 01</p><h2>Two pieces.<br/>One lovely<br/><em>feeling.</em></h2>
        <p>A little structure. A little confidence.<br/>Find the finishing touches that feel like you.</p>
        <a className="button light" href={demoHref(productPath(bag))}>Explore the pairing <ArrowUpRight size={16}/></a>
      </div>
      <div className="pairing">
        {[bag, heel].map(p => <a key={p.id} href={demoHref(productPath(p))}><Photo product={p}/><span>{p.name}<ArrowUpRight size={17}/></span></a>)}
        <p>{bag.sample || heel.sample ? "A styling suggestion from our sample collection." : "Thoughtfully paired."}</p>
      </div>
    </section>}
    <section className="section story"><p className="eyebrow">A NOTE FROM FABEA</p><h2>Good style is personal.<br/>We’re here to help you <em>find yours.</em></h2>
      <p>A concept for a boutique collection of bags and heels.</p><a className="text-link" href={demoHref("/about")}>A little about us <ArrowUpRight size={16}/></a>
    </section>
    <HowTo compact/>
    <section className="section instagram"><Camera size={23}/><div><p className="eyebrow">DESIGN CONCEPT BY FAZHERE</p><h2>See the project behind the demo.</h2></div>
      <a className="text-link" href="/projects/fabea/">Read the case study <ArrowUpRight size={16}/></a>
    </section>
  </>;
}

function SearchPanel({ close }: { close: () => void }) {
  const { products } = useShop();
  const [term, setTerm] = useState("");
  const needle = term.trim().toLowerCase();
  const matches = products.filter(p => [p.name, p.code, p.category, p.type, ...p.colours].join(" ").toLowerCase().includes(needle));
  return <Dialog title="Search" className="search-dialog" close={close}>
    <label className="search-field"><Search size={21}/><input autoFocus aria-label="Search products" placeholder="Try ‘burgundy’, ‘tote’ or a product code" value={term} onChange={event => setTerm(event.target.value)}/></label>
    <p className="sample-note" aria-live="polite">{needle ? matches.length + " pieces found" : "A few pieces you might love"}</p>
    {matches.length ? <ProductGrid products={matches}/> : <Empty title="No pieces found." description="Try a colour, category or shorter search."><button className="text-link" onClick={() => setTerm("")}>Clear search <ArrowRight size={15}/></button></Empty>}
  </Dialog>;
}
function Collection({ query }: { query: Record<string, string> }) {
  const { products } = useShop();
  const [category, setCategory] = useState(["bags", "heels"].includes(query.category) ? query.category : "all");
  const [colour, setColour] = useState(query.colour || "");
  const [size, setSize] = useState(query.size || "");
  const [stock, setStock] = useState(query.stock || "");
  const [sort, setSort] = useState(query.sort || "featured");
  const [maxPrice, setMaxPrice] = useState(query.maxPrice || "");
  const [newOnly, setNewOnly] = useState(query.new === "1");
  const [filters, setFilters] = useState(false);
  const scoped = products.filter(p => (category === "all" || p.category === category) && (!newOnly || p.newArrival));
  const allColours = [...new Set(products.flatMap(p => p.colours))];
  const allSizes = [...new Set(products.flatMap(p => p.sizes))];
  const priced = products.some(p => p.price !== null);
  const active = colour || size || stock || maxPrice;
  const results = scoped.filter(p => (!colour || p.colours.includes(colour)) && (!size || p.sizes.includes(size)) &&
    (!stock || p.stock === stock) && (!maxPrice || (p.price !== null && p.price <= Number(maxPrice))));
  results.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "low") return (a.price ?? Infinity) - (b.price ?? Infinity);
    if (sort === "high") return (b.price ?? -Infinity) - (a.price ?? -Infinity);
    return a.sort - b.sort;
  });
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (newOnly) params.set("new", "1");
    if (colour) params.set("colour", colour);
    if (size) params.set("size", size);
    if (stock) params.set("stock", stock);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sort !== "featured") params.set("sort", sort);
    history.replaceState(null, "", demoHref("/shop" + (params.size ? "?" + params : "")));
  }, [category, newOnly, colour, size, stock, maxPrice, sort]);
  function clear() {
    setColour(""); setStock(""); setSize(""); setMaxPrice("");
  }
  return <section className="section page-section collection">
    <div className="collection-intro"><p className="eyebrow">A CONSIDERED EDIT</p><h1>{newOnly ? "New arrivals." : category === "bags" ? "Bags to go places." : category === "heels" ? "A step above." : "Find your kind of lovely."}</h1>
      <p>Pieces that feel like you.</p>{products.some(p => p.sample) && <p className="sample-note">Collection preview · Sample styles</p>}
    </div>
    <div className="collection-toolbar">
      <div className="tabs" aria-label="Product category">{[["all", "All pieces"], ["bags", "Bags"], ["heels", "Heels"]].map(([id, label]) =>
        <button key={id} aria-pressed={!newOnly && category === id} className={!newOnly && category === id ? "active" : ""} onClick={() => { setCategory(id); setNewOnly(false); }}>{label}</button>)}</div>
      <div className="collection-tools">
        <button className="filter-button" onClick={() => setFilters(!filters)} aria-expanded={filters}><SlidersHorizontal size={16}/> Filters {active && <span className="filter-dot"/>}</button>
        <label className="sort"><span className="sr-only">Sort products</span><select value={sort} onChange={event => setSort(event.target.value)}>
          <option value="featured">Featured</option><option value="name">Name: A–Z</option>
          {priced && <><option value="low">Price: low to high</option><option value="high">Price: high to low</option></>}
        </select><ChevronDown size={14}/></label>
      </div>
    </div>
    {filters && <div className="filters">
      <label>Colour<select aria-label="Colour" value={colour} onChange={event => setColour(event.target.value)}><option value="">All colours</option>{allColours.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Availability<select value={stock} onChange={event => setStock(event.target.value)}><option value="">All pieces</option><option value="available">Available</option><option value="confirm">To be confirmed</option><option value="unavailable">Unavailable</option></select></label>
      {allSizes.length > 0 && <label>Size<select value={size} onChange={event => setSize(event.target.value)}><option value="">All sizes</option>{allSizes.map(value => <option key={value}>{value}</option>)}</select></label>}
      {priced && <label>Maximum price (₹)<input type="number" min="0" value={maxPrice} onChange={event => setMaxPrice(event.target.value)}/></label>}
    </div>}
    <div className="results"><span aria-live="polite">{results.length} {results.length === 1 ? "piece" : "pieces"}</span>{active && <button className="text-link" onClick={clear}>Clear filters <X size={14}/></button>}</div>
    {results.length ? <ProductGrid products={results}/> : <Empty title="No pieces in this edit." description="Try a different colour or clear your filters.">
      <button className="button" onClick={() => { clear(); setCategory("all"); setNewOnly(false); }}>Show all pieces <ArrowRight size={16}/></button>
    </Empty>}
  </section>;
}

function Quantity({ value, change, label = "Quantity" }: { value: number; change: (quantity: number) => void; label?: string }) {
  return <div className="quantity" role="group" aria-label={label}>
    <button aria-label={"Decrease " + label.toLowerCase()} disabled={value <= 1} onClick={() => change(value - 1)}><Minus size={15}/></button>
    <output aria-label={label}>{value}</output>
    <button aria-label={"Increase " + label.toLowerCase()} disabled={value >= 10} onClick={() => change(value + 1)}><Plus size={15}/></button>
  </div>;
}
function ProductDetail({ product }: { product: Product }) {
  const { products, add, enquire, notify } = useShop();
  const [colour, setColour] = useState(product.colours.length === 1 ? product.colours[0] : "");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [error, setError] = useState("");
  const item = { id: product.id, colour, size, quantity };
  const available = product.stock !== "unavailable";
  function check(action: () => void) {
    if (!colour) return setError("Please choose a colour.");
    if (product.sizes.length && !size) return setError("Please choose a size.");
    if (!isValidSelection(item, product)) return setError("This selection is currently unavailable.");
    setError("");
    action();
  }
  return <>
    <div className="section breadcrumb"><a href={demoHref("/shop")}>The collection</a><span>/</span><a href={demoHref("/shop?category=" + product.category)}>{product.category === "bags" ? "Bags" : "Heels"}</a><span>/</span>{product.name}</div>
    <section className="section detail">
      <div className="gallery">
        <button className="gallery-main" aria-label={"Enlarge photograph of " + product.name} onClick={() => setZoom(true)}>
          <Photo product={product} image={image} eager/><span className="zoom-icon"><ZoomIn size={20}/></span>
        </button>
        {product.images.length > 1 && <div className="thumbnails">{product.images.map((_, index) =>
          <button key={index} aria-label={"View photograph " + (index + 1)} aria-pressed={image === index} onClick={() => setImage(index)}><Photo product={product} image={index}/></button>
        )}</div>}
        {product.sample && <p className="sample-note">Illustrative sample photograph · Collection preview</p>}
      </div>
      <div className="purchase">
        <p className="eyebrow">{product.type.toUpperCase()}</p><div className="detail-title"><h1>{product.name}</h1><SaveButton product={product}/></div>
        <p className="detail-price">{price(product)}</p><p className="description">{product.description}</p>
        <fieldset><legend>Colour</legend><div className="option-buttons">{product.colours.map(value =>
          <button key={value} aria-pressed={colour === value} onClick={() => { setColour(value); setError(""); }}>
            <span className="swatch" style={{ background: colours[value] || "#b7a393" }}/>{value}
          </button>)}</div></fieldset>
        {product.sizes.length > 0 ? <fieldset><legend>Size</legend><div className="option-buttons">{product.sizes.map(value =>
          <button key={value} aria-pressed={size === value} onClick={() => { setSize(value); setError(""); }}>{value}</button>
        )}</div></fieldset> : product.category === "heels" && <p className="fine">Ask us about available sizes.</p>}
        <div className="quantity-row"><span>Quantity</span><Quantity value={quantity} change={setQuantity}/></div>
        <p className="availability"><i/>{available ? product.stock === "available" ? "Available · final confirmation on enquiry" : "Availability confirmed on enquiry" : "Currently unavailable"}</p>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="detail-actions">
          <button className="button" disabled={!available} onClick={() => check(() => { void enquire([item]); })}><Copy size={17}/> Copy product enquiry<ArrowUpRight size={16}/></button>
          <button className="button outline" disabled={!available} onClick={() => check(() => add(item))}>Add to enquiry bag <Plus size={17}/></button>
        </div>
        <p className="fine">Try preparing a sample enquiry for the selected piece.</p>
        <button className="text-link share" onClick={async () => {
          try {
            if (navigator.share) await navigator.share({ title: product.name + " | FABEA", url: location.href });
            else { await navigator.clipboard.writeText(location.href); notify("Product link copied."); }
          } catch { notify("Share this piece using its page address."); }
        }}>Share this piece <ArrowUpRight size={15}/></button>
        <details><summary>Details & care <Plus size={16}/></summary><p>{product.details || "Materials, dimensions and care details would be supplied with the final catalogue."}</p><p>Product code: {product.code}</p></details>
        <details><summary>Shipping & ordering <Plus size={16}/></summary><p>Delivery costs and timelines would be confirmed before payment.</p><a className="text-link" href={demoHref("/how-to-order")}>How to order <ArrowUpRight size={14}/></a></details>
        <details><summary>Returns & support <Plus size={16}/></summary><a className="text-link" href={demoHref("/returns")}>Read returns information <ArrowUpRight size={14}/></a></details>
      </div>
    </section>
    <section className="section featured"><Heading kicker="A LOVELY LITTLE ADDITION" title="You might also love." href={demoHref("/shop")} link="View all pieces"/><ProductGrid products={products.filter(p => p.id !== product.id).slice(0, 4)}/></section>
    {zoom && <Dialog title={"Photograph of " + product.name} className="zoom-dialog" close={() => setZoom(false)}><Photo product={product} image={image}/></Dialog>}
  </>;
}

function EnquiryBag({ count }: { count: number }) {
  const { products, bag, setBag, enquire } = useShop();
  const rows = bag.flatMap(item => {
    const product = products.find(p => p.id === item.id);
    return product ? [{ item, product }] : [];
  });
  const complete = rows.every(row => row.product.price !== null);
  const total = rows.reduce((sum, row) => sum + (row.product.price || 0) * row.item.quantity, 0);
  return <section className="section page-section"><p className="eyebrow">LET’S FIND YOUR FAVOURITES</p><h1>Your enquiry bag.</h1><p className="page-intro">A few pieces you’d like to know more about.</p>
    {!rows.length ? <Empty title="Lovely things await." description="Add a piece to your enquiry bag to ask about availability and details."/> : <div className="bag-layout">
      <div>{rows.map(({ item, product }) => <article className="bag-row" key={selectionKey(item)}>
        <a href={demoHref(productPath(product))} aria-label={"Discover " + product.name}><Photo product={product}/></a>
        <div><a className="bag-item-name" href={demoHref(productPath(product))}>{product.name}</a><p>{item.colour}{item.size && " · Size " + item.size}</p><p>{price(product)}</p>
          <Quantity value={item.quantity} label={product.name + " quantity"} change={quantity => setBag(old => old.map(i => selectionKey(i) === selectionKey(item) ? { ...i, quantity } : i))}/>
        </div>
        <button className="icon" aria-label={"Remove " + product.name + " from enquiry bag"} onClick={() => setBag(old => old.filter(i => selectionKey(i) !== selectionKey(item)))}><X size={18}/></button>
      </article>)}<a className="text-link" href={demoHref("/shop")}><ArrowLeft size={15}/> Keep exploring</a></div>
      <aside className="bag-summary"><p className="eyebrow">A PERSONAL TOUCH</p><h2>Let’s talk details.</h2>
        <p>Review your sample selections and copy an example enquiry.</p>
        <div className="summary-line"><span>{count} {count === 1 ? "piece" : "pieces"}</span><span>{complete ? money(total) : "Prices to be confirmed"}</span></div>
        <div className="summary-line"><span>Delivery</span><span>Confirmed on enquiry</span></div>
        <button className="button" onClick={() => enquire(bag)}><Copy size={17}/> Copy your enquiry<ArrowUpRight size={16}/></button>
        <p className="fine">Illustrative products. Review the concept with Fazhere.</p>
      </aside>
    </div>}
  </section>;
}
function HowTo({ compact = false }: { compact?: boolean }) {
  return <section className={"section how-to " + (compact ? "" : "page-section")}>
    <Heading kicker="A LITTLE HELP, EVERY STEP" title={compact ? "From your wishlist to your wardrobe." : "How to order."} href={compact ? demoHref("/how-to-order") : undefined} link="The details"/>
    <div className="steps">{[
      ["01", "Find your favourites", "Explore the collection and choose the pieces that feel like you."],
      ["02", "Let’s talk details", "Copy the sample message with your chosen pieces and options."],
      ["03", "Make it yours", "A real boutique would confirm stock and pricing before arranging delivery and payment."]
    ].map(([number, title, copy]) => <div key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></div>)}</div>
  </section>;
}
function Information({ path }: { path: string }) {
  if (path === "/how-to-order") return <HowTo/>;
  const pages: Record<string, [string, string, string]> = {
    "/about": ["THE FABEA CONCEPT", "For the way you carry yourself.", "A storefront concept by Fazhere for a collection of bags and heels. The photography and catalogue illustrate how the boutique could look."],
    "/shipping": ["THE DETAILS", "On its way to you.", "Delivery coverage, charges and timing would be added after the boutique approves its shipping policy."],
    "/returns": ["THE DETAILS", "Returns & support.", "The boutique’s approved returns and support policy would appear here."],
    "/privacy": ["YOUR PRIVACY", "A little clarity.", "This demo keeps your favourites and sample enquiry bag in this browser. Clear the selections or your site data to remove them."],
    "/terms": ["THE DETAILS", "About this demo.", "This independent concept uses illustrative products and generated photography. Enquiries are examples for reviewing the shopping flow."]
  };
  const [kicker, title, copy] = pages[path] || ["THE COLLECTION", "This piece has slipped away.", "Take another look through the collection."];
  return <section className="section page-section information"><p className="eyebrow">{kicker}</p><h1>{title}</h1>
    <p className="information-copy">{copy}</p><a className="button" href={demoHref("/shop")}>Explore the collection <ArrowUpRight size={16}/></a>
  </section>;
}
function Footer() {
  return <footer className="footer"><div className="footer-grid">
    <div><a className="wordmark" href={demoHref("/")}>fabea</a><p>Carry your style.<br/>A considered edit of bags & heels.</p></div>
    <div><p className="eyebrow">DISCOVER</p><a href={demoHref("/shop")}>The collection</a><a href={demoHref("/shop?category=bags")}>Bags</a><a href={demoHref("/shop?category=heels")}>Heels</a><a href={demoHref("/wishlist")}>Your favourites</a></div>
    <div><p className="eyebrow">LET US HELP</p><a href={demoHref("/how-to-order")}>How to order</a><a href={demoHref("/shipping")}>Shipping</a><a href={demoHref("/returns")}>Returns & refunds</a><a href="/contact/">Contact Fazhere</a></div>
    <div><p className="eyebrow">OUR WORLD</p><a href={demoHref("/about")}>Our story</a><a href="/projects/fabea/">Project overview</a><a href="/#projects">More work by Fazhere</a></div>
  </div><div className="footer-bottom"><span>© {new Date().getFullYear()} FABEA</span><span>Independent storefront concept · Illustrative imagery</span><span><a href={demoHref("/privacy")}>Privacy</a> <a href={demoHref("/terms")}>Terms</a></span></div></footer>;
}

import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { demoHref } from "./routes";
import { money } from "./catalogue";

type Payment = "cod" | "prepaid";
type Status = "COD accepted (demo)" | "Payment simulated (demo)" | "Processing (demo)" | "Shipped (demo)";
type PreviewOrder = {
  id: string;
  quantity: number;
  amount: number;
  payment: Payment;
  status: Status;
};

const UNIT_PRICE = 1990; // Fictional demo amount — NOT FABEA's published price.
const SHIPPING = 0; // Illustration only. No delivery promises.
const PRODUCT = "The Arc · DEMO-B01";

export default function CheckoutPreview() {
  const [quantity, setQuantity] = useState(1);
  const [payment, setPayment] = useState<Payment>("cod");
  const [view, setView] = useState<"checkout" | "success" | "admin">("checkout");
  const [orders, setOrders] = useState<PreviewOrder[]>([]);
  const [activeId, setActiveId] = useState("");
  const total = UNIT_PRICE * quantity + SHIPPING;
  const activeOrder = orders.find(order => order.id === activeId);

  function createSampleOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // This is an in-memory UI walkthrough, not an order or payment transaction.
    // Never collect, persist or transmit entered contact/address data.
    const id = "DEMO-" + String(orders.length + 1).padStart(3, "0");
    const order: PreviewOrder = {
      id, quantity, amount: total, payment,
      status: payment === "cod" ? "COD accepted (demo)" : "Payment simulated (demo)"
    };
    setOrders(previous => [order, ...previous]);
    setActiveId(id);
    setView("success");
  }

  function advance(id: string) {
    setOrders(previous => previous.map(order => order.id !== id ? order : {
      ...order, status: order.status === "Processing (demo)" ? "Shipped (demo)" : "Processing (demo)"
    }));
  }

  return <section className="section page-section checkout-prototype" aria-labelledby="preview-heading">
    <div className="prototype-banner" role="note">
      <ShieldCheck size={19} aria-hidden="true"/>
      <span><strong>FAZHERE CONCEPT — NO REAL ORDERS OR PAYMENTS.</strong> Use fictional details only. Nothing is sent, saved or charged. Prices and policies below are illustrations, not FABEA offers.</span>
    </div>
    <div className="prototype-intro">
      <div>
        <p className="eyebrow">A BETTER PATH FROM AD TO ORDER</p>
        <h1 id="preview-heading">Shopping, without the extra conversation.</h1>
        <p className="page-intro">An interactive prototype of a self-service checkout, order confirmation and merchant dashboard. Built for a FABEA client discussion, not public transactions.</p>
      </div>
      <a className="text-link" href={demoHref("/enquiry")}><ArrowLeft size={16}/> Back to the boutique demo</a>
    </div>
    <div className="prototype-tabs" role="group" aria-label="Demonstration screen">
      <button type="button" className={view === "checkout" ? "active" : ""} onClick={() => setView("checkout")}>Customer checkout</button>
      <button type="button" className={view === "success" ? "active" : ""} onClick={() => setView("success")} disabled={!activeOrder}>Order confirmation</button>
      <button type="button" className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}>Merchant dashboard {orders.length > 0 ? "(" + orders.length + ")" : ""}</button>
    </div>

    {view === "checkout" && <div className="prototype-layout">
      <form className="prototype-form" onSubmit={createSampleOrder}>
        <p className="eyebrow">01 / CUSTOMER DETAILS</p>
        <h2>Where should your order go?</h2>
        <p className="prototype-help">Use sample details only. These fields are demonstrated locally and are not recorded in a customer database.</p>
        <div className="prototype-fields">
          <label>Full name<input required autoComplete="off" maxLength={80} placeholder="Example Customer" name="customer"/></label>
          <label>Mobile number<input required type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} autoComplete="off" title="Use a 10-digit Indian mobile number" placeholder="9876543210" name="phone"/></label>
          <label className="prototype-wide">Address<input required autoComplete="off" maxLength={160} placeholder="Sample street and house number" name="address"/></label>
          <label>City / district<select name="district" defaultValue="Kozhikode"><option>Kozhikode</option><option>Ernakulam</option><option>Bengaluru</option><option>Other</option></select></label>
          <label>Pincode<input required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} autoComplete="off" placeholder="673585" title="Use a 6-digit Indian pincode" name="pincode"/></label>
        </div>
        <div className="prototype-payment">
          <p className="eyebrow">02 / PAYMENT METHOD</p>
          <h2>Choose how to pay</h2>
          <label className={payment === "cod" ? "prototype-choice selected" : "prototype-choice"}>
            <input type="radio" name="payment" value="cod" checked={payment === "cod"} onChange={() => setPayment("cod")}/>
            <PackageCheck size={21} aria-hidden="true"/>
            <span><strong>Cash on delivery</strong><small>Simulate placing a COD order</small></span>
          </label>
          <label className={payment === "prepaid" ? "prototype-choice selected" : "prototype-choice"}>
            <input type="radio" name="payment" value="prepaid" checked={payment === "prepaid"} onChange={() => setPayment("prepaid")}/>
            <CreditCard size={21} aria-hidden="true"/>
            <span><strong>Prepaid</strong><small>Simulate a sandbox-success screen. No payment gateway is connected.</small></span>
          </label>
        </div>
        <button type="submit" className="button prototype-submit">{payment === "cod" ? "Simulate COD order" : "Simulate test payment"} <ArrowRight size={18}/></button>
        <p className="fine">This action creates a temporary in-browser demo reference only. There is no Razorpay integration, shipment or real order.</p>
      </form>
      <aside className="prototype-summary">
        <p className="eyebrow">YOUR SAMPLE ORDER</p>
        <div className="prototype-product">
          <div className="prototype-product-art" aria-label="Stylized sample handbag image" role="img"><span>fabea</span></div>
          <div><strong>The Arc</strong><p>Chocolate · Top-handle bag</p><small>DEMO-B01 · Sample only</small></div>
        </div>
        <div className="prototype-quantity"><span>Quantity</span>
          <div><button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(n => Math.max(1, n - 1))}>−</button><output>{quantity}</output><button type="button" aria-label="Increase quantity" disabled={quantity >= 5} onClick={() => setQuantity(n => Math.min(5, n + 1))}>+</button></div>
        </div>
        <div className="summary-line"><span>Sample price × {quantity}</span><span>{money(UNIT_PRICE * quantity)}</span></div>
        <div className="summary-line"><span>Shipping</span><span>Demo: {money(SHIPPING)}</span></div>
        <div className="summary-line prototype-total"><strong>Illustrative total</strong><strong>{money(total)}</strong></div>
        <div className="prototype-confidence"><Truck size={18} aria-hidden="true"/> Real delivery coverage, fees and return policy must be confirmed with FABEA.</div>
      </aside>
    </div>}

    {view === "success" && activeOrder && <div className="prototype-result" role="status">
      <CheckCircle2 size={42} aria-hidden="true"/>
      <p className="eyebrow">ORDER CONFIRMATION PREVIEW</p>
      <h2>{activeOrder.payment === "cod" ? "Your sample COD request is confirmed." : "Your sample test payment succeeded."}</h2>
      <p>No actual order or payment has taken place. This is how a real online confirmation could look after the backend verifies the order or transaction.</p>
      <div className="prototype-ticket"><span>Demo reference</span><strong>{activeOrder.id}</strong><span>Payment</span><strong>{activeOrder.payment === "cod" ? "COD" : "Simulated prepaid"}</strong><span>Illustrative total</span><strong>{money(activeOrder.amount)}</strong><span>Order status</span><strong>{activeOrder.status}</strong></div>
      <div className="prototype-actions"><button className="button" onClick={() => setView("admin")}>See merchant dashboard <ArrowRight size={16}/></button><button className="button outline" onClick={() => setView("checkout")}>Try another order</button></div>
    </div>}

    {view === "admin" && <div className="prototype-admin">
      <div className="prototype-admin-heading"><div><p className="eyebrow">MERCHANT VIEW / DEMONSTRATION</p><h2>Orders without the WhatsApp back-and-forth.</h2><p>Inspect demo orders and change their simulated processing statuses.</p></div><span className="prototype-count">{orders.length} sample {orders.length === 1 ? "order" : "orders"}</span></div>
      {orders.length === 0 ? <div className="prototype-admin-empty"><PackageCheck size={35}/><h3>No sample orders yet.</h3><p>Complete the checkout preview to see how a new order appears here automatically.</p><button className="button" onClick={() => setView("checkout")}>Try customer checkout <ArrowRight size={16}/></button></div> : <div className="prototype-order-list">{orders.map(order => <article key={order.id} className="prototype-order">
        <div><p className="eyebrow">{order.id}</p><strong>{PRODUCT}</strong><p>{order.quantity} piece(s) · {money(order.amount)} · {order.payment === "cod" ? "COD" : "Simulated prepaid"}</p></div>
        <div><span className="prototype-status">{order.status}</span><button type="button" className="text-link" disabled={order.status === "Shipped (demo)"} onClick={() => advance(order.id)}>{order.status === "Shipped (demo)" ? "Sample fulfilled" : "Advance sample status"} <ArrowRight size={15}/></button></div>
      </article>)}</div>}
      <p className="fine">All sample orders disappear on reload. A real merchant dashboard requires secure authentication, a backend database, verified payments and access controls.</p>
    </div>}
  </section>;
}

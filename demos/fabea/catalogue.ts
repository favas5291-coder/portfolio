import { demoHref } from "./routes";

export type Product = {
  id: string; name: string; code: string; category: "bags" | "heels";
  type: string; description: string; price: number | null; colours: string[];
  sizes: string[]; stock: "confirm" | "available" | "unavailable"; images: string[];
  imageIndex: number; featured: boolean; newArrival: boolean; published: boolean;
  sample: boolean; sort: number; details: string;
};
export type Selection = { id: string; colour: string; size: string; quantity: number };

const sampleDefaults = {
  price: null, stock: "confirm" as const, images: [], sizes: [], featured: true,
  newArrival: false, published: true, sample: true, details: ""
};
export const samples: Product[] = [
  { ...sampleDefaults, id: "the-arc-top-handle", name: "The Arc", code: "DEMO-B01", category: "bags", type: "Top-handle bag", description: "A sculptural silhouette for days that turn into evenings. A little structure in a rich chocolate shade.", colours: ["Chocolate"], imageIndex: 0, sort: 1 },
  { ...sampleDefaults, id: "the-muse-shoulder-bag", name: "The Muse", code: "DEMO-B02", category: "bags", type: "Shoulder bag", description: "A clean shape and a rich shade of wine. An effortless finishing touch to your everyday edit.", colours: ["Burgundy"], imageIndex: 1, sort: 2 },
  { ...sampleDefaults, id: "the-daylight-tote", name: "The Daylight", code: "DEMO-B03", category: "bags", type: "Everyday tote", description: "An easy companion for full calendars and unhurried weekends, in a soft neutral shade.", colours: ["Sand"], imageIndex: 2, sort: 3 },
  { ...sampleDefaults, id: "the-evening-slingback", name: "The Evening", code: "DEMO-H01", category: "heels", type: "Slingback heels", description: "A pointed silhouette and a deep wine shade, styled for dinners and celebrations.", colours: ["Burgundy"], imageIndex: 3, sort: 4 },
  { ...sampleDefaults, id: "the-luna-shoulder-bag", name: "The Luna", code: "DEMO-B04", category: "bags", type: "Crescent bag", description: "A quiet curve in classic black. A small statement for wherever the day takes you.", colours: ["Black"], imageIndex: 4, sort: 5 },
  { ...sampleDefaults, id: "the-dusk-sandals", name: "The Dusk", code: "DEMO-H02", category: "heels", type: "Strappy heels", description: "Fine straps and an open silhouette bring a little occasion to your wardrobe.", colours: ["Espresso"], imageIndex: 5, sort: 6 }
];

export const money = (n: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2
}).format(n);
export const price = (p: Product) => p.price === null ? "Price on request" : money(p.price);
export const productPath = (p: Product) => "/product/" + p.id;
export const selectionKey = (item: Selection) => JSON.stringify([item.id, item.colour, item.size]);
export const isValidSelection = (item: Selection, product: Product) =>
  product.published && product.stock !== "unavailable" && product.colours.includes(item.colour) &&
  (product.sizes.length ? product.sizes.includes(item.size) : item.size === "") &&
  Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 10;

export function enquiryText(items: Selection[], products: Product[], origin: string) {
  const lines = ["Hello FABEA, I would like to enquire about:", ""];
  for (const item of items) {
    const product = products.find(p => p.id === item.id);
    if (!product || !isValidSelection(item, product)) continue;
    lines.push(
      product.name + " · " + product.code,
      "Colour: " + item.colour + (item.size ? " | Size: " + item.size : "") + " | Quantity: " + item.quantity,
      product.price === null ? price(product) : price(product) + " each",
      origin + demoHref(productPath(product)), ""
    );
  }
  lines.push("Please confirm availability, delivery charges and the total payable. Thank you!");
  return lines.join("\n");
}

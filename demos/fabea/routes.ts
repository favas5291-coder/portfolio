const BASE = "/demos/fabea/";

export function demoHref(path: string) {
  return path === "/" ? BASE : BASE + "#" + path;
}

export function readDemoRoute(hash: string) {
  const value = hash.slice(1);
  const local = value.startsWith("/") && !value.startsWith("//") ? value : "/";
  const url = new URL(local, "https://example.invalid");
  return {
    path: url.pathname.replace(/\/$/, "") || "/",
    query: Object.fromEntries(url.searchParams),
    anchor: url.hash.slice(1)
  };
}

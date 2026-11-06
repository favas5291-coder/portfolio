import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Storefront from "./Storefront";
import { samples } from "./catalogue";
import { readDemoRoute } from "./routes";
import "./storefront.css";

function Demo() {
  const [route, setRoute] = useState(() => readDemoRoute(location.hash));
  useEffect(() => {
    const update = () => setRoute(readDemoRoute(location.hash));
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    if (route.anchor) document.getElementById(route.anchor)?.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: "instant" });
  }, [route]);
  return <Storefront products={samples} path={route.path} query={route.query}/>;
}

createRoot(document.getElementById("root")!).render(<Demo/>);

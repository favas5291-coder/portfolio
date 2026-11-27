"""Authoring-only close-ups of the shipped GLBs via the local Vite dev server."""
import argparse
import asyncio
import os
from pathlib import Path
import shutil
from urllib.parse import urlparse

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[2]
# Eye and target in Blender's (east, north, up), lens in vertical degrees.
DETAILS = {
    "door-trim": ([7.27,-6.245,.985],[7.34,-5.945,.828],57),
    "threshold": ([4.90,-3.18,1.06],[3.95,-1.28,.23],56),
    "screen-reveal": ([6.30,-2.83,4.04],[7.16,-.10,4.57],51),
    "branch-junction": ([2.60,.32,2.24],[1.67,1.86,2.15],51),
}


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:4173/")
    parser.add_argument("--out", type=Path, default=ROOT/"docs/appointment/gate-1")
    args = parser.parse_args()
    if urlparse(args.url).hostname not in ("127.0.0.1", "localhost", "::1"):
        raise ValueError("Use a local Vite development server")
    args.out.mkdir(parents=True,exist_ok=True)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path=os.environ.get("CHROME_PATH") or shutil.which("chromium"),
            args=["--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-dev-shm-usage"])
        page = await b.new_page(viewport={"width":1080,"height":700})
        page.on("pageerror",lambda exc: print(str(exc),flush=True))
        page.on("console",lambda msg: print(msg.text[:350],flush=True) if msg.type=="error" else None)
        # Same origin as the real module graph and GLB fetches. Only this
        # Playwright page sees the tool's canvas and inspection-camera export.
        await page.route("**/camera-inspection",lambda route:route.fulfill(content_type="text/html",
            body='<style>*{margin:0}canvas{width:100vw;height:100vh;display:block}</style><canvas></canvas>'))
        await page.goto(args.url.rstrip("/")+"/camera-inspection")
        await page.evaluate("""async () => {
          const {mountStudio} = await import('/src/appointment/scene.js');
          const canvas = document.querySelector('canvas');
          let shot = null, engine;
          const loaded = new Promise((resolve,reject) => {
            engine = mountStudio(canvas,{progress:()=>0,capture:true,blankScreens:true,onReady:resolve,
              onFailure:reject, composeCamera: (camera) => {
                if (!shot) return;
                const [[x,y,z],[a,b,c],fov]=shot;
                camera.position.set(x,z,-y);
                camera.up.set(0,1,0); camera.lookAt(a,c,-b); camera.fov=fov;
              }});
          });
          await loaded;
          window.detail = async pose => {
            shot=pose; engine.invalidate();
            await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
          };
        }""")
        for name,pose in DETAILS.items():
            await page.evaluate("p=>detail(p)",pose)
            await page.screenshot(path=str(args.out/f"{name}.png"),timeout=90000)
        await b.close()

if __name__ == "__main__":
    asyncio.run(main())

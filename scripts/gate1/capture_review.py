"""Record the local Gate 1 build through Chromium and native browser scrolling.

Needs Python Playwright, chromium and ffmpeg. Defaults to npm run preview on
127.0.0.1:4173. The video samples Chromium's actual compositor frames and
preserves wall-clock holds and stalls. No app or camera state is injected.
"""
import argparse
import asyncio
import base64
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
from urllib.parse import urlparse

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[2]
MOBILE = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36"


class Recording:
    def __init__(self, session, directory):
        self.session = session
        self.directory = directory
        self.frames = []

    async def frame(self, event):
        index = len(self.frames)
        path = self.directory / f"frame-{index:05d}.jpg"
        self.frames.append((event["metadata"]["timestamp"], path))
        path.write_bytes(base64.b64decode(event["data"]))
        await self.session.send("Page.screencastFrameAck", {"sessionId": event["sessionId"]})

    async def start(self):
        self.session.on("Page.screencastFrame", self.frame)
        await self.session.send("Page.startScreencast", {
            "format": "jpeg", "quality": 95, "maxWidth": 390, "maxHeight": 844, "everyNthFrame": 1,
        })

    async def finish(self, output):
        end = time.time()
        await self.session.send("Page.stopScreencast")
        self.session.remove_listener("Page.screencastFrame", self.frame)
        if len(self.frames) < 3:
            raise RuntimeError("Chromium produced too few compositor frames")
        manifest = self.directory / "frames.ffconcat"
        lines = ["ffconcat version 1.0"]
        for i, (at, path) in enumerate(self.frames):
            next_at = self.frames[i + 1][0] if i < len(self.frames) - 1 else end
            lines.extend([f"file {path.name}", f"duration {max(0, next_at-at):.5f}"])
        lines.append(f"file {self.frames[-1][1].name}")
        manifest.write_text("\n".join(lines) + "\n")
        subprocess.run([
            "ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(manifest),
            "-vf", "fps=25", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", str(output),
        ], check=True)
        return {"compositorFrames": len(self.frames), "durationSeconds": round(end-self.frames[0][0], 2),
                "bytes": output.stat().st_size}


async def state(page):
    return await page.evaluate(r"""() => {
      const stage = document.querySelector('.ap-stage'), canvas = document.querySelector('.ap-canvas');
      const area = canvas.getBoundingClientRect(), visit = document.querySelector('.ap-visit');
      return {scrollY, progress: +stage.dataset.progress, chapter:visit.dataset.chapter,
        renderer:visit.dataset.render, viewOrigin:[area.x,area.y], display:[area.width,area.height], buffer:[canvas.width,canvas.height],
        overflow:document.documentElement.scrollWidth-innerWidth,
        assets:performance.getEntriesByType('resource').filter(e=>/\.glb($|\?)/.test(e.name))
          .map(e=>({file:new URL(e.name).pathname, bytes:e.encodedBodySize}))};
    }""")


async def offsets(page):
    return await page.evaluate("""() => [...document.querySelectorAll('[data-room]')].map(el => ({
      id: el.id, y: Math.max(0,Math.round(el.getBoundingClientRect().top+scrollY-
            parseFloat(getComputedStyle(el).scrollMarginTop || '0')))}))""")


async def settle(page):
    await page.evaluate("""async () => {
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    }""")
    await page.wait_for_timeout(400)


async def screenshot(page, directory, name):
    await settle(page)
    await page.screenshot(path=str(directory / (name + ".png")), timeout=90000)


async def touch_scroll_to(page, session, target):
    # Dispatch touch points into Chromium's native scrolling path. Sample scrollY
    # as a user would watch the page. Holding the finger still prevents flinging.
    async def touch(kind, y=None):
        points = [{"x":220,"y":y}] if y is not None else []
        await session.send("Input.dispatchTouchEvent", {"type":kind,"touchPoints":points})
    for _ in range(5):
        start = await page.evaluate("scrollY")
        delta = target-start
        if abs(delta) <= 8:
            return
        direction = 1 if delta > 0 else -1
        origin = 740 if direction > 0 else 110
        # Chromium's touch slop consumes about 15 CSS pixels at pointer-down.
        # Send the finger path on a human-time clock; do not let GPU round
        # trip latency extend every 10px move into a separate gesture.
        distance = min(610, abs(delta) + 15)
        await touch("touchStart", origin)
        pending = []
        for step in range(10,distance+10,10):
            y = origin - direction*min(step,distance)
            pending.append(asyncio.create_task(touch("touchMove",y)))
            await asyncio.sleep(.045)
        await asyncio.gather(*pending)
        await page.wait_for_timeout(230)
        await touch("touchEnd")
        await page.wait_for_timeout(200)
    if abs(target-await page.evaluate("scrollY")) > 8:
        raise RuntimeError(f"Native touch scroll did not reach {target}")


async def look(page, directory, width, record):
    errors = []
    failed_resources = []
    page.on("response", lambda r: failed_resources.append({"status":r.status,"url":r.url}) if r.status>=400 else None)
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.on("console", lambda m: print("Browser:",m.text[:450],flush=True) if m.type=="error" else None)
    await page.goto(record.url, wait_until="load", timeout=120000)
    await page.evaluate("document.fonts.ready")
    await page.locator(".ap-poster").first.evaluate("(img) => img.decode()")
    await page.get_by_role("button", name="Ambient sound").wait_for(state="attached")
    await page.get_by_role("button", name="Use still views").wait_for(state="attached")
    await page.keyboard.press("Home")
    await page.locator('.ap-visit[data-render="live"]').wait_for(timeout=120000)
    await settle(page)
    if not (await state(page))["assets"]:
        raise RuntimeError("Expected authored GLBs. Refusing to capture the previous scene.")
    await screenshot(page, directory, f"passenger-{width}")
    initial = await state(page)
    if initial["progress"] != 0 or initial["overflow"] > 1:
        raise RuntimeError(f"Opening missed its intended position: {initial}")
    opening = await page.locator(".ap-invitation").evaluate("""el=>[...el.querySelectorAll(
        '.ap-byline,.ap-offer,.ap-opening-links a,.ap-cue,h1')].filter(e=>e.offsetHeight)
      .map(e=>({text:e.textContent.trim(), bounds:e.getBoundingClientRect().toJSON(), href:e.href}))""")
    chapters = {stop["id"]:stop["y"] for stop in await offsets(page)}
    result = {"opening":initial, "openingHTML":opening, "roomOffsets":chapters}
    between = lambda a,b,t: round(chapters[a] + (chapters[b]-chapters[a])*t)
    if width == 390:
        cdp = await page.context.new_cdp_session(page)
        with tempfile.TemporaryDirectory() as temp:
            video = Recording(cdp, Path(temp))
            await video.start()
            await page.wait_for_timeout(900)
            route = [
                ("crossing-sill",between("arrival","pavement",record.mid/.2)),
                ("reverse-into-seat",between("arrival","pavement",.2)),
                ("same-crossing",between("arrival","pavement",record.mid/.2)),
                ("pavement",chapters["pavement"]),
                ("threshold",between("pavement","reception",.55)),
                ("entered",chapters["reception"]),
            ]
            actual = []
            for label,target in route:
                await touch_scroll_to(page, cdp, target)
                await settle(page)
                fact = await state(page)
                fact["landmark"] = label
                actual.append(fact)
                print(label, round(fact["progress"],4), "at", fact["scrollY"], flush=True)
                if label == "crossing-sill":
                    await page.screenshot(path=str(directory / "sill-crossing-390.png"))

            await page.wait_for_timeout(900)
            result["recording"] = await video.finish(directory / "phone-reversal.mp4")
            result["route"] = actual
        if not actual[1]["progress"] < actual[0]["progress"] < actual[3]["progress"]:
            raise RuntimeError("Native scroll did not reverse at the crossing")
        if abs(actual[2]["progress"] - actual[0]["progress"]) > .005:
            raise RuntimeError("Native scroll missed the same crossing on the second pass")
    await page.locator('#office').evaluate('e=>e.scrollIntoView({behavior:"instant",block:"start"})')
    await page.wait_for_function("document.querySelector('.ap-visit').dataset.chapter==='office'")
    await screenshot(page, directory, f"office-{width}")
    result["office"] = await state(page)
    result["pageErrors"] = errors
    result["failedResources"] = failed_resources
    if errors or result["office"]["renderer"] != 'live':
        raise RuntimeError(f"Local scene did not stay live: {result}")
    return result


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:4173/")
    parser.add_argument("--out", type=Path, default=ROOT / "docs/appointment/gate-1")
    parser.add_argument("--width", type=int, choices=(390,1440))
    parser.add_argument("--mid", type=float, default=.105, help="Normalized progress at the open door sill")
    args = parser.parse_args()
    if urlparse(args.url).hostname not in ('localhost','127.0.0.1','::1'):
        raise ValueError("Capture from a loopback copy of the local build")
    args.out.mkdir(parents=True,exist_ok=True)
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path=os.environ.get("CHROME_PATH") or shutil.which("chromium"),
            args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
        for width in ([args.width] if args.width else [1440,390]):
            phone = width == 390
            context = await browser.new_context(viewport={"width":width,"height":844 if phone else 900},
                is_mobile=phone, has_touch=phone, device_scale_factor=1,
                **({"user_agent":MOBILE} if phone else {}))
            try:
                result = await look(await context.new_page(),args.out,width,args)
                result.update(browser=browser.version,phoneEmulation=phone,devicePixelRatio=1,
                    graphics="ANGLE SwiftShader, Chromium headless")
                (args.out/f"capture-{width}.json").write_text(json.dumps(result,indent=2)+"\n")
            finally:
                await context.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

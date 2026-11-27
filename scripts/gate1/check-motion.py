"""Measure the local review clip and record a native touch reversal in emulated Chromium."""

import argparse
import asyncio
from collections import defaultdict
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import hashlib
import math
import os
from pathlib import Path
import re
import shutil
import tempfile
import threading
import time
from urllib.parse import urlsplit
from playwright.async_api import async_playwright
from capture_review import MOBILE, Recording

ROOT = Path(__file__).resolve().parents[2]
DEFAULT = ROOT / "docs/appointment/gate-1/media-proof"


def run_server(directory, sent):
    class Handler(SimpleHTTPRequestHandler):
        def do_GET(self):
            name = urlsplit(self.path).path.strip("/") or "index.html"
            if "/" in name or name.startswith("."):
                return self.send_error(404)
            path = directory / name
            if not path.is_file():
                return self.send_error(404)
            body = path.read_bytes()
            start, end = 0, len(body) - 1
            range_spec = self.headers.get("Range", "")
            if range_spec:
                bounds = re.fullmatch(r"bytes=(\d+)-(\d*)", range_spec)
                if not bounds:
                    return self.send_error(416)
                start = int(bounds[1])
                end = min(end, int(bounds[2])) if bounds[2] else end
                if start > end:
                    return self.send_error(416)
            self.send_response(206 if range_spec else 200)
            self.send_header("Content-Type", self.guess_type(name))
            self.send_header("Content-Length", str(end - start + 1))
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Cache-Control", "public, max-age=3600")
            if range_spec:
                self.send_header("Content-Range", f"bytes {start}-{end}/{len(body)}")
            self.end_headers()
            try:
                self.wfile.write(body[start : end + 1])
                sent[name] += end - start + 1
            except (BrokenPipeError, ConnectionResetError):
                pass

        def log_message(self, *_args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


async def instrument(page, origin):
    await page.add_init_script("""(() => {
        window.mediaTrace = [];
        addEventListener('DOMContentLoaded', () => {
          const clip = document.querySelector('video');
          function painted(now, info) {
            window.lastFrame = Math.round(info.mediaTime * 24);
            window.mediaTrace.push({kind:'frame', n:window.lastFrame, at:performance.now(), mediaTime:info.mediaTime});
            clip.requestVideoFrameCallback(painted);
          }
          clip.requestVideoFrameCallback(painted);
          addEventListener('scroll', () => {
            const n=Math.round(60*scrollY/(document.documentElement.scrollHeight-innerHeight));
            window.mediaTrace.push({kind:'scroll',n,at:performance.now()});
          },{passive:true});
        });
    })()""")
    await page.goto(origin)
    await page.wait_for_function("window.lastFrame === 0", timeout=30000)
    await page.wait_for_function("""document.querySelector('video').readyState >= 3""")


async def seek_sample(page, target):
    # Scroll the real document, then wait for the corresponding compositor callback.
    before = await page.evaluate("window.mediaTrace.length")
    await page.evaluate(
        "(f)=>scrollTo(0,Math.round((document.documentElement.scrollHeight-innerHeight)*f/60))",
        target,
    )
    await page.wait_for_function("(f)=>window.lastFrame===f", arg=target, timeout=5000)
    rows = await page.evaluate("(i)=>window.mediaTrace.slice(i)", before)
    first = next(r for r in rows if r["kind"] == "scroll" and r["n"] == target)
    frame = next(r for r in rows if r["kind"] == "frame" and r["n"] == target)
    return round(frame["at"] - first["at"], 2)


async def native_touch(session, page, delta):
    # A short stationary hold releases the finger without a fling.
    def points(y):
        return [{"x": 190, "y": y}]

    y = 690 if delta > 0 else 180
    await session.send(
        "Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": points(y)}
    )
    steps = max(1, math.ceil(abs(delta) / 17))
    for _ in range(steps):
        y -= delta / steps
        await session.send(
            "Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": points(y)}
        )
        await asyncio.sleep(0.045)
    await asyncio.sleep(0.23)
    await session.send(
        "Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []}
    )
    await asyncio.sleep(0.25)
    return await page.evaluate(
        """() => ({frame:window.lastFrame, scrollY, time:document.querySelector('video').currentTime})"""
    )


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--directory", type=Path, default=DEFAULT)
    args = ap.parse_args()
    sent = defaultdict(int)
    server = run_server(args.directory, sent)
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                executable_path=os.environ.get("CHROME_PATH")
                or shutil.which("chromium"),
                args=["--disable-dev-shm-usage"],
            )
            phone = await browser.new_context(
                viewport={"width": 390, "height": 844},
                device_scale_factor=1,
                is_mobile=True,
                has_touch=True,
                user_agent=MOBILE,
            )
            page = await phone.new_page()
            origin = f"http://127.0.0.1:{server.server_port}/"
            await instrument(page, origin)
            # First test 40 control points including non-adjacent random-access frames.
            path = [
                8,
                16,
                24,
                32,
                40,
                48,
                56,
                60,
                51,
                43,
                35,
                27,
                19,
                11,
                3,
                0,
                29,
                55,
                30,
                4,
                34,
                58,
                23,
                0,
                18,
                36,
                54,
                48,
                31,
                11,
                33,
                6,
                39,
                16,
                49,
                26,
                57,
                37,
                12,
                0,
            ]
            measures = []
            last = 0
            same_frames = []
            for n in path:
                ms = await seek_sample(page, n)
                measures.append(
                    {
                        "frame": n,
                        "direction": "forward" if n > last else "reverse",
                        "ms": ms,
                    }
                )
                if n == 48:
                    pixels = await page.locator("video").evaluate("""video=>{
                      const c=document.createElement('canvas'); c.width=78;c.height=78;
                      c.getContext('2d').drawImage(video,0,0,c.width,c.height);
                      return c.toDataURL();
                    }""")
                    same_frames.append(hashlib.sha256(pixels.encode()).hexdigest())
                last = n
            assert len(same_frames) == 2 and same_frames[0] == same_frames[1], (
                "Reverse seek changed decoded frame 48"
            )
            client = await phone.new_cdp_session(page)
            with tempfile.TemporaryDirectory() as working:
                rec = Recording(client, Path(working))
                await rec.start()
                await asyncio.sleep(0.4)
                facts = []
                for delta in (405, 332, -402, 407, 397):
                    facts.append(await native_touch(client, page, delta))
                await asyncio.sleep(0.52)
                record = await rec.finish(args.directory / "reverse-seeking-390.mp4")
            if not (
                facts[2]["frame"] < facts[1]["frame"]
                and facts[3]["frame"] > facts[2]["frame"]
            ):
                raise AssertionError(f"No rendered reversal: {facts}")
            meta = await page.evaluate("""() => {
              const v=document.querySelector('video'), entries=performance.getEntriesByType('resource');
              return {source:v.currentSrc.split('/').at(-1), width:v.videoWidth,height:v.videoHeight, duration:v.duration,
                 canPlayType:v.canPlayType('video/mp4; codecs="avc1.64001f"'), devicePixelRatio,
                 resourceTiming:entries.filter(e=>e.name.endsWith('.mp4')).map(e=>({encodedBodySize:e.encodedBodySize,transferSize:e.transferSize}))};
            }""")
            all_ms = sorted(m["ms"] for m in measures)
            reverse = sorted(m["ms"] for m in measures if m["direction"] == "reverse")
            p95 = lambda values: values[math.ceil(0.95 * len(values)) - 1]
            output = {
                "testedUTC": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "browser": browser.version,
                "hostCpu": next(
                    (
                        r.split(":", 1)[1].strip()
                        for r in Path("/proc/cpuinfo").read_text().splitlines()
                        if r.startswith("model name")
                    ),
                    "Unknown",
                ),
                "viewport": [390, 844],
                "emulation": "Linux headless Chromium, touch enabled, DPR 1, local HTTP range server, no throttling. Warm seeks after initial buffering.",
                "latencyMethod": "Native scroll event to requestVideoFrameCallback matching requested frame. 40 discrete scrollTo steps with a hold until presentation.",
                "latencyP95ms": p95(all_ms),
                "reverseP95ms": p95(reverse),
                "reverseSamples": len(reverse),
                "matchedDecodedFrame48": same_frames[0],
                "measuredSeeks": measures,
                "touchStops": facts,
                "evidenceRecording": record,
                "video": meta,
                "httpBodyBytesActuallyServed": dict(sent),
                "encodedBytes": {
                    n: (args.directory / n).stat().st_size
                    for n in ["compact.mp4", "wide.mp4"]
                },
            }
            assert meta["source"] == "compact.mp4" and sent["wide.mp4"] == 0
            # Independently check responsive media selection without mixing the two transfer counts.
            desktop = await browser.new_page(viewport={"width": 1440, "height": 900})
            await instrument(desktop, origin)
            output["desktopSelected"] = await desktop.locator("video").evaluate(
                "v=>({file:v.currentSrc.split('/').at(-1),width:v.videoWidth,height:v.videoHeight})"
            )
            assert output["desktopSelected"]["file"] == "wide.mp4"
            (args.directory / "measurements.json").write_text(
                json.dumps(output, indent=2) + "\n"
            )
            print(
                json.dumps(
                    {
                        k: output[k]
                        for k in (
                            "latencyP95ms",
                            "reverseP95ms",
                            "encodedBytes",
                            "touchStops",
                            "httpBodyBytesActuallyServed",
                            "desktopSelected",
                        )
                    }
                )
            )
            await browser.close()
    finally:
        server.shutdown()


if __name__ == "__main__":
    asyncio.run(main())

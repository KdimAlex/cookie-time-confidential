#!/usr/bin/env python3
"""Visual Discovery 2026 — sky and sheets on one port."""

from __future__ import annotations

import argparse
import json
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

APP = Path(__file__).resolve().parent
ROOT = APP.parent
STATIC = APP / "static"
SKY = ROOT / "data" / "sky"
PATENTS = ROOT / "data" / "patents"
CUTAWAY = ROOT / "data" / "cutaway"
ARCHIVE = ROOT / "data" / "archive"
DEFAULT_PORT = 8881

SHEET_TITLES = {
    "INDEX": "Index",
    "US1693969": "US 1,693,969 — Zeiss dumbbell",
    "US2748652": "US 2,748,652 — star sphere",
    "US1825462": "US 1,825,462 — Link trainer",
    "US2364539": "US 2,364,539 — navigation trainer",
    "NASA-19700015844": "Kollsman optical subsystem, vol. I",
    "NASA-19700015845": "Kollsman optical subsystem, vol. II",
}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path in ("/", "/sky"):
            return self._file(STATIC / "index.html", "text/html; charset=utf-8")
        if path == "/patch":
            return self._file(STATIC / "patch.html", "text/html; charset=utf-8")
        if path == "/journey":
            return self._file(STATIC / "journey.html", "text/html; charset=utf-8")
        if path == "/orient":
            return self._file(STATIC / "orient.html", "text/html; charset=utf-8")
        if path == "/find":
            return self._file(STATIC / "orient.html", "text/html; charset=utf-8")
        if path == "/constellation-run":
            return self._file(STATIC / "constellation-run.html", "text/html; charset=utf-8")
        if path == "/guiding-stars":
            return self._file(STATIC / "guiding-stars.html", "text/html; charset=utf-8")
        if path == "/transition":
            return self._file(STATIC / "transition.html", "text/html; charset=utf-8")
        if path == "/editor":
            return self._file(STATIC / "editor.html", "text/html; charset=utf-8")
        if path == "/kiosk":
            return self._file(STATIC / "kiosk.html", "text/html; charset=utf-8")
        if path == "/sheets":
            return self._file(STATIC / "sheets.html", "text/html; charset=utf-8")
        if path == "/api/sky":
            return self._file(SKY / "view.json", "application/json")
        if path == "/api/sheets":
            return self._sheets()
        if path.startswith("/patents/"):
            name = path.removeprefix("/patents/")
            return self._safe(PATENTS, name, "application/pdf")
        if path.startswith("/cutaway/"):
            name = path.removeprefix("/cutaway/")
            return self._safe(CUTAWAY, name, "image/svg+xml")
        if path.startswith("/archive/"):
            name = path.removeprefix("/archive/")
            return self._safe(ARCHIVE, name, self._kind(name))
        return super().do_GET()

    def _sheets(self):
        items = []
        index = PATENTS / "INDEX.md"
        if index.is_file():
            items.append({"id": "index", "title": "Index", "href": "/patents/INDEX.md", "kind": "note"})
        if PATENTS.is_dir():
            for pdf in sorted(PATENTS.glob("*.pdf")):
                items.append(
                    {
                        "id": pdf.stem,
                        "title": SHEET_TITLES.get(pdf.stem, pdf.stem),
                        "href": f"/patents/{pdf.name}",
                        "kind": "pdf",
                    }
                )
        svg = CUTAWAY / "gemini-trainer.svg"
        if svg.is_file():
            items.append(
                {
                    "id": "cutaway",
                    "title": "Gemini trainer cutaway",
                    "href": "/cutaway.html",
                    "kind": "svg",
                    "note": "Reconstruction. Not a shop drawing.",
                }
            )
        body = json.dumps({"sheets": items}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _kind(self, name: str) -> str:
        lower = name.lower()
        if lower.endswith((".jpg", ".jpeg")):
            return "image/jpeg"
        if lower.endswith(".png"):
            return "image/png"
        if lower.endswith(".webp"):
            return "image/webp"
        if lower.endswith(".svg"):
            return "image/svg+xml"
        if lower.endswith(".pdf"):
            return "application/pdf"
        if lower.endswith(".md"):
            return "text/plain; charset=utf-8"
        return "application/octet-stream"

    def _safe(self, folder: Path, name: str, content_type: str):
        if not name or "/" in name or ".." in name:
            self.send_error(404)
            return
        path = folder / name
        if not path.is_file():
            self.send_error(404)
            return
        kind = content_type
        if name.endswith(".md"):
            kind = "text/plain; charset=utf-8"
        self._file(path, kind)

    def _file(self, path: Path, content_type: str):
        if not path.is_file():
            self.send_error(404)
            return
        data = path.read_bytes()
        start, end = 0, len(data) - 1
        status = 200
        range_header = self.headers.get("Range")
        if range_header and range_header.startswith("bytes=") and data:
            spec = range_header.removeprefix("bytes=").split(",")[0].strip()
            left, _, right = spec.partition("-")
            try:
                if left:
                    start = int(left)
                if right:
                    end = int(right)
                if not left and right:
                    start = max(0, len(data) - int(right))
                    end = len(data) - 1
            except ValueError:
                start, end = 0, len(data) - 1
            else:
                if start > end or start >= len(data):
                    self.send_error(416)
                    return
                end = min(end, len(data) - 1)
                status = 206
        chunk = data[start : end + 1] if data else b""
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(len(chunk)))
        if status == 206:
            self.send_header("Content-Range", f"bytes {start}-{end}/{len(data)}")
        self.end_headers()
        self.wfile.write(chunk)

    def log_message(self, fmt: str, *args):
        return


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("-p", "--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--open", action="store_true")
    args = parser.parse_args()
    httpd = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    url = f"http://127.0.0.1:{args.port}/"
    print(f"Visual Discovery → {url}", flush=True)
    if args.open:
        webbrowser.open(url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nbye", flush=True)


if __name__ == "__main__":
    main()

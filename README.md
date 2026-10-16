# Cookie Time Confidential

Children’s-museum kiosk for Visual Discovery 2026 at UNC Morehead Planetarium. Players move through astronaut training, and the kiosk builds a personal space badge from the session.

This repository is the website source, shared so Alex and Gaby can both run and edit it.

## Run

```bash
cd app && python3 server.py
```

- Kiosk: http://127.0.0.1:8881/kiosk
- Sky: http://127.0.0.1:8881/
- Patent sheets: http://127.0.0.1:8881/sheets

The server uses the Python standard library. No install step. Start at the kiosk link and use Next, or the right arrow, to move through the whole session.

The screens, games, badge, artwork, and sound effects are in this repo, so the kiosk runs from these files. The background song under Align and Find streams from YouTube, so that one track needs an internet connection.

## What’s in this repo

| Path | What |
|------|------|
| `app/` | Server, kiosk pages, brand, art, audio, and badge kit |
| `data/sky/` | Star catalog and the dome view the sky page serves |
| `data/patents/` | Public patent PDFs for the sheets page |
| `data/cutaway/` | Gemini trainer reconstruction |
| `data/archive/` | Reference photos the site can serve |
| `notes/` | Kiosk storyline, Morehead research, and asset to-dos |
| `exports/mission-badge.svg` | Completed badge for Figma. Rings are circles, with the thin green outside stroke. |
| `exports/badge/` | Smaller badge movies (mp4 and webm). The large `.mov` masters stay off GitHub because files over 100MB are rejected. |

`Space Proj.pdf` at the repo root is the project design PDF.

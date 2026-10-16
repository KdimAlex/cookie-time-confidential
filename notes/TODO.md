# Asset to-dos

Style for all three: cream points (`#fff3d8` / `#fdf2da`) on charcoal (`#0a0a0c`, porthole disc `#24252e`). Hard circles, thin cream strokes. Same look as the sky canvas, the patch, and Align.

## 1. Looping night sky

A seamless loop of the night sky in that style. The live sky is the WebGL canvas at `/` (`app/static/sky.js`): point stars, no glow. The loop should read as that sky turning, not a stock planetarium plate.

## 2. Badge filling in

A take of the patch ceremony at `/patch`. Blank cloth, name sewn along the arc, then the four pieces stitch in: mission, constellation, rank, designation. Needle travels the ring, the piece fills, then the stitch settles. Replay is “Replay the awarding” in `app/static/badge.js`.

## 3. Hard-plate sky → align window

HTML first, then a video. Page: http://127.0.0.1:8881/transition

Open on the hard-mode plate, expanded past the frame and slowly turning. The disc narrows to the align porthole (same center and diameter as the ship window). It holds, then fades to the align game’s first frame: the cockpit, the five-star study chart, the console line, and the stick.

# Mission badge

This folder is the sticker and nothing else. Copy it into the interactive site. The page loads three scripts, mounts one element, and calls the actions in order.

```html
<link rel="stylesheet" href="./badge.css" />
<div id="badge"></div>
<script src="./vendor/gsap.min.js"></script>
<script src="./classify.js"></script>
<script src="./player.js"></script>
<script>
  const badge = await MissionBadge.mount(document.querySelector("#badge"));
</script>
```

`mount` resolves when the cloth and the patch art have loaded. Asset paths are next to `player.js` (`assets/`, `font/`).

## The five beats

Each beat is one clip. It starts from a resting pose and ends at the next one, so the beats can later be exported as separate transparent assets. Between beats the sticker sits small in the top-right corner while a lesson plays. `award(record)` runs all five with a short corner hold standing in for that lesson.

| Call | Clip |
|---|---|
| `badge.appear(name)` | Blank cloth rises from the bottom, the name types on the lower arc, the sticker parks in the corner. |
| `badge.receiveMission(id)` | Recalls to center, seats the flight patch, parks. `apollo`, `skylab`, `mercury`, `gemini`. |
| `badge.receiveConstellation(id)` | Recalls, seats the constellation, parks. `cassiopeia`, `aquila`, `canis-major`, `scorpius`, `ursa-major`. |
| `badge.receivePerformance(id)` | Recalls, seats the performance medal, parks. Today the only medal is `"cookie"`. |
| `badge.designate(title)` | Recalls, slides into the left half (the report occupies the right), types the designation, pauses, then feeds off the bottom. |

```js
await badge.appear("Rusty Schweickart");
await badge.receiveMission("apollo");
await badge.receiveConstellation("cassiopeia");
await badge.receivePerformance(result.rank);
await badge.designate(result.title);
```

The flight choice and the dominant constellation are inputs from the site. They are not scores. The rank medal and the top line come from `classify`.

## How the games score

Align and Find live in `orient.js`. Copy the mark objects they already push. Do not invent a second formula.

**Align.** Each locked level pushes `{ name, error, percent, weight }`.

- `percent` is `round(10 + 90 * (1 - error / 180))`. A perfect angle is 100. A reversed ship is 10. The floor is 10, not 0.
- Weights are Easy `1`, Intermediate `1.5`, Hard `2`.
- The number on the result screen is the weighted average: `round(sum(percent * weight) / sum(weight))`.

Pass either the finished percent as `align`, or the raw array as `alignMarks`.

**Find.** Each locked star pushes `{ name, right }`. There are 3 rounds. The result screen does not use the level weights. It is `round((correct / 3) * 100)`, so the only totals are 0, 33, 67, and 100.

Pass `find` or `findMarks`.

**Constellation.** Nothing in the games writes this yet. It is the dominant figure the player was asked to name. Pass that figure as `dominant` (`"cassiopeia"` and the rest of the list above). Pass how they did as `constellationScore` from 0 to 100, or as `constellationMarks: [{ right: true }]`. One right answer is 100. One wrong answer is 0.

## Composite

```js
const result = MissionClassify.classify({
  mission: "apollo",
  dominant: "cassiopeia",
  constellationMarks: [{ right: true }],
  alignMarks: [
    { name: "Easy", percent: 96, weight: 1 },
    { name: "Intermediate", percent: 88, weight: 1.5 },
    { name: "Hard", percent: 74, weight: 2 },
  ],
  findMarks: [
    { name: "Easy", right: true },
    { name: "Intermediate", right: true },
    { name: "Hard", right: false },
  ],
});

await badge.award({
  name: "Rusty Schweickart",
  mission: result.mission,
  dominant: result.dominant,
  rank: result.rank,
  title: result.title,
});
```

`classify` returns:

| Field | Meaning |
|---|---|
| `align`, `find`, `constellation` | Each game as 0–100, or `null` if it was not played. |
| `sky` | Mean of the constellation and Find scores that exist. |
| `ship` | The Align score. |
| `composite` | Mean of whichever of the three exist. |
| `rankScore` | Mean of Align and Find only. This is the performance medal, not the sky. |
| `rank` | `"cookie"` when `rankScore` exists, otherwise `null`. |
| `role` | `Navigator`, `Pilot`, `Engineer`, or `Commander`. |
| `title` | The top arc. `MASTER STAR NAVIGATOR`, `PILOT`, `ENGINEER`, or `COMMANDER`. |

The title uses sky against ship:

- Both at least 70 and within 12 points: `COMMANDER`.
- Sky at least 75 and sky leads or ship is missing: `MASTER STAR NAVIGATOR`.
- Ship at least 75 and ship leads or sky is missing: `PILOT`.
- Sky still leads below that line: `MASTER STAR NAVIGATOR`.
- Anything else with a ship score: `ENGINEER`.

A game left out is `null` and is dropped from the means. It does not count as zero.

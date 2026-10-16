/* Composite for the mission badge.
   Scores come from the games in app/static/orient.js. This file does not touch the DOM. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MissionClassify = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  /* Align levels, orient.js LEVELS. Hard counts double Easy. */
  const ALIGN_WEIGHTS = { Easy: 1, Intermediate: 1.5, Hard: 2 };

  /* Find has the same three names and weights, but the result screen ignores the weights.
     showResult() is Math.round((correct / 3) * 100). */

  const TITLES = {
    Navigator: "MASTER STAR NAVIGATOR",
    Pilot: "PILOT",
    Engineer: "ENGINEER",
    Commander: "COMMANDER",
  };

  function clampPercent(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  /* Same curve as matchPercent() in orient.js. 0° is 100. 180° is 10. */
  function alignPercentFromError(errorDeg) {
    const wrapped = ((errorDeg % 360) + 360) % 360;
    const error = wrapped > 180 ? 360 - wrapped : wrapped;
    return clampPercent(10 + 90 * (1 - error / 180));
  }

  /* marks: [{ percent, weight }] as lock() pushes them.
     total matches showResult() for Align. */
  function alignScore(marks) {
    if (!Array.isArray(marks) || !marks.length) return null;
    const weightSum = marks.reduce((sum, mark) => sum + (mark.weight || 0), 0);
    if (!weightSum) return null;
    const total = marks.reduce((sum, mark) => sum + mark.percent * mark.weight, 0) / weightSum;
    return clampPercent(total);
  }

  /* marks: [{ right }] as lockFind() pushes them. Always out of 3 rounds. */
  function findScore(marks) {
    if (!Array.isArray(marks) || !marks.length) return null;
    const correct = marks.filter((mark) => mark.right).length;
    return clampPercent((correct / 3) * 100);
  }

  /* No constellation game writes a score yet.
     Pass attempts as [{ right }] for naming the dominant figure.
     One right answer is 100. One wrong answer is 0. */
  function constellationScore(marks) {
    if (!Array.isArray(marks) || !marks.length) return null;
    const correct = marks.filter((mark) => mark.right).length;
    return clampPercent((correct / marks.length) * 100);
  }

  function mean(values) {
    const nums = values.filter((value) => value != null);
    if (!nums.length) return null;
    return clampPercent(nums.reduce((sum, value) => sum + value, 0) / nums.length);
  }

  function readPercent(given, marks, scorer) {
    if (typeof given === "number" && Number.isFinite(given)) return clampPercent(given);
    return scorer(marks);
  }

  /* Sky is constellation + find. Ship is align.
     Commander: both sides are strong and close.
     Master Star Navigator: the sky leads.
     Pilot: they righted the ship cleanly and the sky did not.
     Engineer: they worked the instrument without owning either side. */
  function titleFor(sky, ship) {
    if (sky == null && ship == null) return { role: "", title: "" };
    if (sky != null && ship != null && sky >= 70 && ship >= 70 && Math.abs(sky - ship) <= 12) {
      return { role: "Commander", title: TITLES.Commander };
    }
    if (sky != null && sky >= 75 && (ship == null || sky >= ship)) {
      return { role: "Navigator", title: TITLES.Navigator };
    }
    if (ship != null && ship >= 75 && (sky == null || ship > sky)) {
      return { role: "Pilot", title: TITLES.Pilot };
    }
    if (sky != null && (ship == null || sky > ship)) {
      return { role: "Navigator", title: TITLES.Navigator };
    }
    if (ship != null && ship >= 80) return { role: "Pilot", title: TITLES.Pilot };
    return { role: "Engineer", title: TITLES.Engineer };
  }

  function classify(input) {
    const record = input || {};
    const align = readPercent(record.align, record.alignMarks, alignScore);
    const find = readPercent(record.find, record.findMarks, findScore);
    const constellationGiven = record.constellationScore != null
      ? record.constellationScore
      : (typeof record.constellation === "number" ? record.constellation : null);
    const constellation = readPercent(constellationGiven, record.constellationMarks, constellationScore);
    const sky = mean([constellation, find]);
    const ship = align;
    const named = titleFor(sky, ship);
    const rankScore = mean([align, find]);
    return {
      align,
      find,
      constellation,
      sky,
      ship,
      composite: mean([constellation, align, find]),
      rankScore,
      /* The only rank medal drawn today. Null until Align or Find has a score. */
      rank: rankScore == null ? null : "cookie",
      role: named.role,
      title: named.title,
      dominant: record.dominant || null,
      mission: record.mission || record.flight || null,
    };
  }

  return {
    ALIGN_WEIGHTS,
    TITLES,
    alignPercentFromError,
    alignScore,
    findScore,
    constellationScore,
    classify,
  };
});

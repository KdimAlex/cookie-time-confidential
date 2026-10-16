#!/usr/bin/env python3
"""Reduce Hipparcos to two views from the Morehead dome.

Frame A is the public sky at Chapel Hill on a conference night.
Frame B rolls the latitude axis to 35 south and parks Canopus on the meridian,
then keeps the 60-degree window around it.
"""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKY = ROOT / "data" / "sky"
TSV = SKY / "hipparcos.tsv"
APOLLO = SKY / "apollo_nav_stars.json"
OUT = SKY / "view.json"

LAT = 35.913611
LON = -79.050556  # east-positive
INSTANT = datetime(2026, 10, 13, 2, 0, tzinfo=timezone.utc)  # 10 p.m. EDT, Oct 12
# Colossus 249 star vectors are in the basic frame of that assembly, not J2000.
GUIDE_EPOCH = datetime(1968, 10, 28, tzinfo=timezone.utc)
MAG_LIMIT = 6.5
WINDOW_LAT = -35.0
WINDOW_RADIUS = 30.0

ARCSEC = math.pi / (180.0 * 3600.0)


def jd(moment: datetime) -> float:
    unix = moment.timestamp()
    return unix / 86400.0 + 2440587.5


def precess_matrix(centuries: float) -> list[list[float]]:
    """IAU 1976 precession from J2000 to T centuries after J2000. R3(-z) R2(theta) R3(-zeta)."""
    t = centuries
    zeta = (2306.2181 * t + 0.30188 * t * t + 0.017998 * t**3) * ARCSEC
    zee = (2306.2181 * t + 1.09468 * t * t + 0.018203 * t**3) * ARCSEC
    theta = (2004.3109 * t - 0.42665 * t * t - 0.041833 * t**3) * ARCSEC
    cz, sz = math.cos(zeta), math.sin(zeta)
    cZ, sZ = math.cos(zee), math.sin(zee)
    ct, st = math.cos(theta), math.sin(theta)
    # R3(-zeta) and R3(-z): frame rotation by a negative angle.
    r3z = ((cz, -sz, 0.0), (sz, cz, 0.0), (0.0, 0.0, 1.0))
    r2 = ((ct, 0.0, -st), (0.0, 1.0, 0.0), (st, 0.0, ct))
    r3Z = ((cZ, -sZ, 0.0), (sZ, cZ, 0.0), (0.0, 0.0, 1.0))
    return mul(r3Z, mul(r2, r3z))


def mul(a, b):
    return tuple(
        tuple(sum(a[i][k] * b[k][j] for k in range(3)) for j in range(3))
        for i in range(3)
    )


def apply(m, v):
    return tuple(sum(m[i][k] * v[k] for k in range(3)) for i in range(3))


def sph_to_vec(ra_deg: float, dec_deg: float):
    ra, dec = math.radians(ra_deg), math.radians(dec_deg)
    c = math.cos(dec)
    return (c * math.cos(ra), c * math.sin(ra), math.sin(dec))


def vec_to_sph(v):
    x, y, z = v
    dec = math.degrees(math.asin(max(-1.0, min(1.0, z))))
    ra = math.degrees(math.atan2(y, x)) % 360.0
    return ra, dec


def proper_motion(ra_deg, dec_deg, pm_ra, pm_de, years: float):
    """pm_ra is μ_α cos δ in mas/yr, the Hipparcos convention."""
    if pm_ra is None and pm_de is None:
        return ra_deg, dec_deg
    dec = math.radians(dec_deg)
    cos_d = math.cos(dec) or 1e-9
    dra = ((pm_ra or 0.0) / cos_d) * years / 3_600_000.0
    dde = (pm_de or 0.0) * years / 3_600_000.0
    return ra_deg + dra, dec_deg + dde


def gmst_deg(moment: datetime) -> float:
    d = jd(moment) - 2451545.0
    return (280.46061837 + 360.98564736629 * d) % 360.0


def alt_az(ra_deg, dec_deg, lst_deg, lat_deg):
    ha = math.radians((lst_deg - ra_deg + 540.0) % 360.0 - 180.0)
    dec, lat = math.radians(dec_deg), math.radians(lat_deg)
    sin_alt = math.sin(dec) * math.sin(lat) + math.cos(dec) * math.cos(lat) * math.cos(ha)
    sin_alt = max(-1.0, min(1.0, sin_alt))
    alt = math.asin(sin_alt)
    cos_alt = math.cos(alt) or 1e-9
    sin_az = -math.cos(dec) * math.sin(ha) / cos_alt
    cos_az = (math.sin(dec) * math.cos(lat) - math.cos(dec) * math.cos(ha) * math.sin(lat)) / cos_alt
    az = math.degrees(math.atan2(sin_az, cos_az)) % 360.0
    return math.degrees(alt), az


def refract(alt_deg: float) -> float:
    if alt_deg <= -1.0:
        return alt_deg
    arg = math.radians(alt_deg + 10.3 / (alt_deg + 5.11))
    bend = 1.02 / math.tan(arg) / 60.0
    return alt_deg + bend


def sep(alt1, az1, alt2, az2) -> float:
    a1, a2 = math.radians(alt1), math.radians(alt2)
    daz = math.radians(az1 - az2)
    c = math.sin(a1) * math.sin(a2) + math.cos(a1) * math.cos(a2) * math.cos(daz)
    return math.degrees(math.acos(max(-1.0, min(1.0, c))))


def parse_tsv(path: Path):
    rows = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if not line or line.startswith("#") or line.startswith("-") or line.startswith("HIP") or line.startswith(" "):
            continue
        if line.startswith("deg") or "mas/yr" in line:
            continue
        parts = line.split("\t")
        if len(parts) < 8:
            continue
        try:
            ra = float(parts[0])
            dec = float(parts[1])
            hip = int(parts[2])
        except ValueError:
            continue

        def num(token):
            token = token.strip()
            if not token:
                return None
            try:
                return float(token)
            except ValueError:
                return None

        rows.append(
            {
                "hip": hip,
                "ra": ra,
                "dec": dec,
                "pm_ra": num(parts[3]),
                "pm_de": num(parts[4]),
                "plx": num(parts[5]),
                "vmag": num(parts[6]),
                "bv": num(parts[7]),
            }
        )
    return rows


def load_guides(moment: datetime):
    payload = json.loads(APOLLO.read_text(encoding="utf-8"))
    t_from = (jd(GUIDE_EPOCH) - 2451545.0) / 36525.0
    t_to = (jd(moment) - 2451545.0) / 36525.0
    into_2000 = tuple(tuple(precess_matrix(t_from)[j][i] for j in range(3)) for i in range(3))
    forward = mul(precess_matrix(t_to), into_2000)
    guides = []
    for s in payload["stars"]:
        ra, dec = vec_to_sph(apply(forward, sph_to_vec(s["ra_deg"], s["dec_deg"])))
        guides.append({"name": s["name"], "ra": ra, "dec": dec})
    return guides


def nearest_guide(ra, dec, guides, taken: set[str]) -> str | None:
    best, best_d = None, 0.2
    for g in guides:
        if g["name"] in taken:
            continue
        # rough chord on the sphere, degrees
        dra = (ra - g["ra"] + 180) % 360 - 180
        d = math.hypot(dra * math.cos(math.radians(dec)), dec - g["dec"])
        if d < best_d:
            best, best_d = g["name"], d
    return best


def main() -> None:
    if not TSV.is_file():
        raise SystemExit(f"missing {TSV}")
    stars = parse_tsv(TSV)
    guides = load_guides(INSTANT)
    years = (jd(INSTANT) - 2451545.0) / 365.25
    pmat = precess_matrix((jd(INSTANT) - 2451545.0) / 36525.0)
    lst = (gmst_deg(INSTANT) + LON) % 360.0

    placed = []
    taken: set[str] = set()
    for s in stars:
        mag = s["vmag"]
        if mag is None or mag > MAG_LIMIT:
            continue
        ra, dec = proper_motion(s["ra"], s["dec"], s["pm_ra"], s["pm_de"], years)
        ra, dec = vec_to_sph(apply(pmat, sph_to_vec(ra, dec)))
        name = nearest_guide(ra, dec, guides, taken)
        if name:
            taken.add(name)
        placed.append({**s, "ra_now": ra, "dec_now": dec, "mag": mag, "name": name})

    dome = []
    polaris_alt = None
    for s in placed:
        alt, az = alt_az(s["ra_now"], s["dec_now"], lst, LAT)
        alt = refract(alt)
        if alt <= 0:
            continue
        dome.append(record(s, alt, az))
        if s["name"] == "Polaris":
            polaris_alt = round(alt, 3)

    missing = [g["name"] for g in guides if g["name"] not in taken]
    if missing:
        print("unmatched guides:", ", ".join(missing))
    canopus = next(s for s in placed if s["name"] == "Canopus")
    lst_b = canopus["ra_now"]  # hour angle zero
    south = []
    bore_alt, bore_az = alt_az(canopus["ra_now"], canopus["dec_now"], lst_b, WINDOW_LAT)
    for s in placed:
        alt, az = alt_az(s["ra_now"], s["dec_now"], lst_b, WINDOW_LAT)
        alt = refract(alt)
        if alt <= 0 or sep(alt, az, bore_alt, bore_az) > WINDOW_RADIUS:
            continue
        # project inside the window cone, not the whole dome
        south.append(record(s, alt, az))

    OUT.write_text(
        json.dumps(
            {
                "instant_utc": INSTANT.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "catalog": "Hipparcos I/239 via VizieR. Positions are _RAJ2000/_DEJ2000 (epoch J2000, proper motion already applied from J1991.25 to J2000).",
                "reduction": "Proper motion J2000 to the instant, then IAU 1976 precession to the equator of date, then altitude and azimuth. Refraction from Saemundsson. Nutation and aberration are not applied. Each star is a point: east, north, and up in parsecs from the parallax, from the theater.",
                "star": ["hip", "alt_deg", "az_deg", "vmag", "bv", "plx_mas", "name"],
                "navigation": navigation_in_view(dome),
                "mag_limit": MAG_LIMIT,
                "catalog_rows": len(stars),
                "dome": {
                    "lat_deg": LAT,
                    "lon_deg": LON,
                    "lst_deg": round(lst, 4),
                    "polaris_alt_deg": polaris_alt,
                    "count": len(dome),
                    "stars": dome,
                },
                "window": {
                    "lat_deg": WINDOW_LAT,
                    "note": "35° south. Canopus on the meridian.",
                    "boresight_alt_deg": round(bore_alt, 2),
                    "boresight_az_deg": round(bore_az, 2),
                    "radius_deg": WINDOW_RADIUS,
                    "count": len(south),
                    "stars": south,
                },
            }
        )
        + "\n",
        encoding="utf-8",
    )
    print(
        f"catalog {len(stars)}  plotted {len(placed)}  dome {len(dome)}  window {len(south)}  "
        f"polaris_alt {polaris_alt}  guides {len(taken)}/37"
    )


def navigation_in_view(dome):
    """Apollo list order, only the guide stars above the Chapel Hill horizon."""
    payload = json.loads(APOLLO.read_text(encoding="utf-8"))
    by_name = {row[6]: row for row in dome if row[6]}
    listed = []
    for star in payload["stars"]:
        row = by_name.get(star["name"])
        if not row:
            continue
        listed.append(
            {
                "index": star["decimal_index"],
                "octal": star["octal"],
                "name": star["name"],
                "alt": row[1],
                "az": row[2],
                "mag": row[3],
            }
        )
    return listed


def record(star, alt, az):
    plx = star["plx"]
    return [
        star["hip"],
        round(alt, 2),
        round(az, 2),
        round(star["mag"], 2),
        star["bv"],
        None if plx is None else round(plx, 2),
        star["name"],
    ]


if __name__ == "__main__":
    main()

# Morehead Planetarium — research for the two mockups

VDC 2026 student guide, "Chapel Hill to the Moon." This note is the research behind two assets in this project:

- `data/sky/` — astronomy data for the view from the dome
- `data/cutaway/gemini-trainer.svg` — a parts section of the training rig under that dome

The guide's suggested pictures (a navigation diagram, a training-device cutaway, a Chapel Hill-to-space map, a timeline, annotated photographs, a step-by-step of how stars guide a course) all hang off one fact: the sky on the dome and the sky in the window are not the same picture.

## The building

Morehead Planetarium, 250 East Franklin Street, Chapel Hill. Dedicated 10 May 1949. First planetarium in the South, sixth Zeiss installation in the United States by the planetarium database's count. Architects Eggers and Higgins. John Motley Morehead III, UNC class of 1891, chemist, Union Carbide, ambassador to Sweden, bought the projector in Sweden because Zeiss had lost most of its factories in the war. The instrument had been shown at the 1930 Stockholm exhibition, then stored in Stockholm and Göteborg.

Dome still quoted by Morehead as 68 feet in diameter and 44 feet high. Original seating about 330. After the later renovation the fulldome theater is listed at 229. Coordinates used here: 35°54'49" N, 79°03'02" W, 144 m.

The East Wing and the Morehead Observatory (24-inch Schmidt-Cassegrain, physics and astronomy) opened in 1973. That telescope is a different instrument from the star projector in the theater. It is not the trainer.

## Two projectors, one pit

| Years | Instrument | What it threw |
| --- | --- | --- |
| 10 May 1949 – 19 Mar 1969 | Zeiss Model II | About 8,900 stars, limit near magnitude 6.5, two 1,000 W lamps |
| 19 Mar 1969 – April 2011 | Zeiss Model VI | About 8,900 stars, 1,200 W lamps, clearer field, eclipse devices |
| 2010 – now | Digital fulldome | GSK Fulldome Theater. The Zeiss is gone |

A 1959 servicing of the Model II is described two ways. The planetarium database calls it an upgrade toward Model III. RocketSTEM says the 42 brightest stars were corrected. Mercury and Gemini training happened on the Model II. Neil Armstrong was the first astronaut to train on the Model VI. The Model VI was decommissioned in April 2011 and removed by August 2011. A drawing of the training sky is a reconstruction.

Both Zeiss machines are dumbbells. Two star spheres, northern and southern, with a cage between them for the Sun, Moon, and planets. A latitude axis lets the operator show a sky from somewhere other than Chapel Hill. Rotation about the long axis shows precession. Daily motion and annual motion are separate drives. Horizon shutters on the lenses cut the stars that would be below the ground. Didactic projectors draw the meridian, equator, ecliptic, and horizon circles. The Model II also had a nautical-triangle projector, which is the diagram the navigation lesson was built on.

Class anatomy, published for the Model II and not calipered on Morehead's Göteborg machine: star spheres about 29 inches across in sheet brass; perforated plates with on the order of 65 hole sizes for magnitude; a lamp in each sphere; sixteen projector assemblies a side on the Buhl instrument's description. Treat those figures as the family of machine, and label them that way on the drawing. Morehead's own plates are not in this folder.

## How Chapel Hill got the astronauts

NASA needed a planetarium that was not a detour. Adler in Chicago and the Hayden in New York were off the route between Langley, the Cape, and Houston. Crews in T-33s and T-38s flew over Chapel Hill. Tony Jenzano, director from 1951, had assembled the Model II himself. He took the work.

The campus timeline says astronauts began in 1959. The historical narrative and the state marker (G-132) say 1960 through 1975. Sixty-two astronauts, including eleven of the twelve who walked on the Moon. Deke Slayton was the last, in 1975, for Apollo-Soyuz. Visits were not publicized. Staff called a training day "Cookie Time."

Griffith Observatory's Samuel Oschin Planetarium trained twenty-six astronauts between 1967 and 1972, overlapping Morehead, partly because crews were in California while the Apollo command module was redesigned. Burke Baker in Houston later trained shuttle crews. The mockups in this folder are Morehead's rig, not those.

A training day, as RocketSTEM reconstructed it from the program: 8:30 introduction to the building and the Zeiss. James Batten, then a doctoral candidate, taught the celestial coordinates used to name a star as it crossed a viewport. The rest of day one was the zodiac constellations and their stars in order. Day two was identification along the mission's orbital path, including the lamp-off shift called spin-the-world, which put the spacecraft "off course" until the astronaut recognized the field. Armstrong logged about 130 hours over 20 days, the most of anyone, and practiced again from the cockpit of a T-38 at 40,000 feet with the lights out.

## Ask to see the guiding stars

A friend on the Morehead staff said to ask to see the 27 guiding stars. Use that sentence at the desk. No published list of 27 turned up. Staff accounts in print use two other counts, and they are not the same set:

- 37 is the Apollo computer catalog. Lovell said the crews had to know those. Our State quotes McColman on memorizing 37, then coming back for the mission. That list, with positions, is `data/sky/apollo_nav_stars.json`.
- 42 is what McColman told UNC in 2015: the general course taught 42 guide stars that keyed the sky into regions, before the mission-specific pass. RocketSTEM's "42 brightest stars" is a third thing, a 1959 correction of the Zeiss plates, not a memorized list.

If 27 does not ring a bell, ask for the astronaut guide stars and which count they use. Ask them to roll the sky off the Chapel Hill latitude so southern ones can enter a window-sized patch: Canopus, Acrux, Peacock. That roll is the training view. The public show leaves the latitude parked on Chapel Hill.

## The view is a window, not the dome

Richard McColman, Morehead's fulldome manager, put the constraint cleanly: astronomers get a panoramic sky; astronauts got nothing more than about a 60 degree patch through a spacecraft window. Instructors ran the projector so that patch sat in the right place along a virtual flight path. The latitude axis is why southern stars (Canopus, the Southern Cross, Peacock) could be taught in a dome at 36 degrees north.

The Apollo computer carried 37 guide stars, nearly all first or second magnitude, spread over the sphere, plus the Sun, Earth, and Moon. Jim Lovell: "Apollo had 37 navigable stars in its space on the computer, so we had to know where those stars were." Normally a check used three. The octal codes, vectors, and converted positions are in `data/sky/apollo_nav_stars.json`, taken from the Colossus 249 star table (public domain) and the Luminary 209 reference card. They are late-1960s places in the computer's basic reference frame, not a J2000 catalog.

Three of the names are Morehead's fingerprint. In 1966 Gus Grissom coined star names from the Apollo 1 crew spelled backward. Jenzano entered them on the NASA list: Navi for Virgil "Ivan" Grissom (Gamma Cassiopeiae), Regor for Roger Chaffee (Gamma Velorum), Dnoces for Edward White II (Iota Ursae Majoris, "Second" backward). David Scott later said the names stayed in the catalog in admiration of that crew. A secondary writeup (Sand and Stars) mis-identifies Regor as Sigma Puppis and Mirfak as Alpha Pegasi. The Luminary card says Gamma Velorum and Alpha Persei. Use the card.

Times the training was the backup that flew:

- Faith 7, the last Mercury flight. After the automatic controls failed, Gordon Cooper held the 34 degree reentry attitude by the stars. Splashdown was the most accurate of the program. Accounts do not name which stars.
- Apollo 12. Lightning at thirty-six seconds knocked out the command module's navigation. "SCE to AUX" restored power. Pete Conrad, Dick Gordon, and Alan Bean realigned by sighting key stars. Accounts used here do not name them.
- Apollo 13. An oxygen-tank explosion forced the guidance computer off, and the debris field looked like false stars. Lovell used the Earth's terminator, a trick he had practiced on Apollo 8, when the field could not be trusted. RocketSTEM names Altair and Vega as the pair John Swigert found once the debris cleared, hours before reentry, and quotes Lovell on Antares and Nunki as the two stars seen going into the Moon's shadow. Those four are the only named sightings in this note. The UNC account of Lovell's later visit stresses the terminator and the dust. Both moments fit on one flight. Do not collapse them into a single pair.

In 1995 Lovell wrote Jenzano that he had taught Tom Hanks the stars for the film, and took him flying at night to point out Antares and Nunki.

## The training equipment

The Zeiss is the sky. The trainer is the crop. Staff built a different cockpit for each program, out of planetarium-show scrap as much as flight hardware.

**Mercury.** A small mechanical flight simulator from World War II pilot training, a Link trainer, modified so it stood in for the yaw thrusters of the capsule. The astronaut put his head in a canopy taken from a fighter-pilot trainer. That canopy is the restricted view.

**Gemini.** Morehead's own history page: plywood, cloth, foam rubber, and paper, mounted on two barber's chairs. Openings cut to the size and shape of the spacecraft windows. Astronauts drove the star field to simulate pitch and roll. Technicians turned the chairs to simulate yaw. UNC's later article, quoting McColman, says a plywood box on one swiveling barber-chair base. The section drawing follows the two-chair account on Morehead's history page and marks the conflict. No window dimensions were found in the secondary sources. The drawing does not invent a measured Gemini window.

**Apollo.** Another custom simulator. The window holes were replaced by an optical device. Separate "orbital line projectors" put the flight path on the dome. One special projector was assembled from old car-wax cans and miniature bulbs.

The section in `data/cutaway/gemini-trainer.svg` is the Gemini rig plus the dumbbell, because that is the system with the most published parts and because the student guide asks for a training-device cutaway. Mercury and Apollo are notes on the sheet, not extra plates. Nothing on the sheet is a shop drawing. Wilson Library finding aid 70177 (Morehead records, 1945–2002) and the JSTOR Morehead historical archive are where measured drawings would be, if they were kept. This pass did not read them.

## The small moment worth drawing

Not the lightning bolt and not the explosion. Those are famous without Chapel Hill. The moment that only this building owns is Jenzano writing Navi, Regor, and Dnoces onto the list the computer would fly with, on stars the crews had already memorized under this dome.

## Sources

- Morehead Planetarium, [History](https://moreheadplanetarium.org/learn-more/history/) and [timeline](https://moreheadplanetarium.org/learn-more/history/history-timeline/). Two chairs, wax-can projector, Model II then Model VI, Armstrong first on the VI, 62 astronauts, Griffith overlap.
- NC DNCR, [Astronaut Training marker G-132](https://www.dncr.nc.gov/blog/2023/12/20/astronaut-training-g-132). Link trainer, Gemini window box on a barber chair, Apollo optical device, orbital-line projectors, Cookie Time.
- UNC, [Early space journeys began at Morehead](https://www.unc.edu/discover/early-space-journeys/). McColman on the 60 degree patch and on pitch, roll, and yaw.
- UNC, [Apollo 13 commander returns](https://www.unc.edu/discover/apollo-13-commander-returns-morehead-planetarium/). Lovell on the 37 stars and on the terminator.
- Tony Rice, [Learning celestial navigation at Morehead Planetarium](https://www.rocketstem.org/2014/07/14/learning-celestial-navigation-morehead-planetarium/), RocketSTEM, 14 July 2014. Day-by-day drill, 42-star upgrade, Faith 7 at 34 degrees, Altair and Vega, Antares and Nunki, Armstrong's hours.
- Zeiss, [Planetarium models](https://www.zeiss.com/planetariums/en/about-us/planetarium-models.html). Model II dumbbell, 8,900 stars, 1,000 W, latitude and precession. Model VI from 1966, 1,200 W, eclipses.
- Worldwide Planetariums Database, sheet for this theater. Coordinates, 20.7 m dome, 10 May 1949, 19 March 1969, 1959 upgrade wording, seat counts.
- Save the Buhl, Zeiss Model II notes. Sphere size, plate thickness, hole sizes. Class anatomy only.
- NASA / MIT Instrumentation Laboratory, Colossus 249 `STAR_TABLES.agc` (public domain, Virtual AGC) and the Luminary 209 reference card (ibiblio). The 37 vectors and the octal codes.
- Sand and Stars, "Apollo Navigation Stars," for the Grissom / Jenzano naming story and Scott's later remark. Bayer names were checked against the Luminary card, not against that page.

## Gaps left on purpose

- No measured drawing of the Gemini windows, the chair travel, or Morehead's own star plates.
- No claim about which stars Cooper or the Apollo 12 crew actually sighted.
- No copy of archival photographs. The cutaway is drawn from the sentences above.

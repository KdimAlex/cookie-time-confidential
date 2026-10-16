# Cookie Time Confidential — kiosk storyline

Screens 1–33 are the full kiosk, from the Cookie Time idle through the printed badge. Frame order follows the comps.

The kiosk is a children’s-museum simulation of astronaut training at Morehead Planetarium. Choices and scores write a personal space badge. The kiosk prints that permutation.

Frame order below follows the attached comps. The local badge ceremony already plays the enlarge / award / park motion. These comps supply the Morehead background it sits on.

## Stage

After the idle screen, every frame shares one set:

- Morehead’s portico: pediment, columns, and dome, drawn as a dark teal line on black.
- The instructor: a small astronaut, lower left, with a thruster flame at the feet.
- A terminal dialogue box along the bottom. Green type on a dark green field. The speaker label “Instructor” sits at the box’s upper right.
- Once the badge has been given, it idles as a small disc in the top right. Award beats recall it to center, then park it again.

The idle screen is its own black field. It does not use the portico.

## What the player carries

| Fact | Set on | Used for |
|---|---|---|
| Name | Screen 3 | Dialogue, and the name on the badge |
| Mission | Screen 6 | The first patch |
| Constellation | Game 1, screen 21 | The second pin. The comp seats it from how the round went |
| Align | Game 2, screen 27 | The third pin. The comp calls this the final achievement |
| Find | Game 3, screen 31 | No new socket in the comps. It joins the whole-session title |
| Title | Screen 33 | The designation on the finished badge, from the whole session |

Three games sit in the lesson. The landmarks widget and **Constellation ID** come from Gaby’s GitHub repo, [gabriellaec/MoreheadPlanetarium](https://github.com/gabriellaec/MoreheadPlanetarium). **Align** (`/orient`, “Spin the World”) and **Find** (`/find`, “id the guiding star”) are the local games.

## Screens

### 1. Idle — Cookie Time

Black field. Large white **COOKIE TIME**. Under it, a cyan outline of a bitten cookie. **Tap to Start** sits on the cookie.

This is the attract loop. Tap begins the training.

### 2. Arrival

Same portico stage.

> Welcome to Morehead Planetarium, the heart of North Carolina’s secret space town!

### 3. Name

The instructor asks:

> What’s your name, cadet?

A terminal field sits in the middle of the portico: a cursor and **Insert name here**.

### 4. The name, and why “Cookie Time”

> Nice to meet you, [NAME]. At Morehead, we called astronaut training sessions “Cookie Time” to keep them secret. We laid out cookies and drinks whenever they visited, so the name stuck.

### 5. The blank badge

A large blank disc, centered, with **[USER NAME]** on it. The instructor says:

> Here’s your badge. You will fill it in as you complete each lesson.

This is the local `appear` beat: blank cloth, the name written on, then the disc parks in the top right. The comp shows the large pose. The parked pose is the white disc already in the corner on the next frames.

### 6. Choose a mission

The parked badge stays in the top right. A yellow case file opens over the portico, with green arrows to swipe and a **Confirm Mission** button.

The comp shows **PROJECT MERCURY**:

- NASA’s first human spaceflight program; single pilot-spacecraft.
- Mission objective: put a human-operated spacecraft in orbit, bring the pilot back safely, and test human survival in space. Twenty unmanned flights before a human, including four chimpanzees.

The instructor:

> To begin your training, choose your mission.

The files are missions whose astronauts actually trained at Morehead. The other files are not in this comp. Confirming writes the mission slot.

### 7. First award

The badge recalls from the corner and fills the center. A blue ring is on, and one empty socket shows where the mission patch seats. The comp still says **[USER NAME]** only. The patch art is the local ceremony, overlaid on this background.

> Congratulations, [NAME], you’ve collected your first achievement!

### 8. Park

The large badge leaves. An arrow in the comp points at the white disc in the top right. The congratulations line is still in the terminal. This is the park half of the same award beat.

### 9. Star navigation, continued

The badge stays parked. The lesson goes on:

> All right, let’s get you space-ready! When you are floating in space, Star Navigation helps you answer: “Which direction am I facing?” and “Where am I?”

### 10. Stars as landmarks

Gaby’s landmarks widget, played here. Two stacked panels, **ON EARTH** and **IN SPACE**. Near things move. Far things stay put. On Earth a tree slides and a mountain holds while the caption says **DRIVING**. In space the Moon slides and a constellation holds while it says **FLYING**.

> Certain stars act as landmarks. Far-away objects, like a distant mountain peak, stay put in our field of vision, so we can use them to orient ourselves as we move.

### 11. Guiding stars

A star globe in a blue compass rose, with orbital rings.

> We call these fixed stars “Guiding stars”, and astronauts had to memorize 37 of them! Computers used to be very unreliable, so Astronauts had to manually check if they were still on course using these stars.

### 12. Rusty, at Morehead

The same globe.

> Astronaut Russel L. “Rusty” Schweickart practiced this during his training at Morehead Planetarium in the 1960s.

The comp spells Russel. The card on the next screen spells Russell.

### 13. Rusty’s quote

The portico stays behind. The instructor gives the floor to a portrait: suit, helmet in hand, a NASA speech bubble, and an ID card.

> “NASA wanted us to carry a solid mental picture of the star field, because we were part of the spacecraft’s navigation system. If the computer quit, the stars were all we had, so we had to know the constellations on sight.”

Card: **Russell L. “Rusty” Schweickart.** Apollo 9. Lunar Module Pilot. Fun fact: born in Neptune, New Jersey.

### 14. Constellations as a map

Back to the instructor.

> To locate those Guiding Stars, astronauts used constellations. Constellations divide the night sky into familiar regions, and certain stars within a constellation act as pointers to Guiding Stars.

### 15. The Big Dipper

A diagram still to draw, marked `[Diagram]` in the comp.

> For example, the two outer stars of the Big Dipper (part of Ursa Major) point directly to Polaris (the North Star) in Ursa Minor.

### 16. Charlie Duke, setup

> For astronaut Charlie Duke, learning the constellations was one of the most critical parts of his training:

### 17. Charlie’s quote

Same portrait layout as Rusty.

> “We had 37 stars in our onboard computer so we needed to know that the one we had selected for a sighting was the correct one. At Morehead we learned to identify constellations so we were sure that we had the correct star. It was very beneficial training.”

Card: **Charles M. Duke Jr.** Apollo 16. Lunar Module Pilot. Fun fact: youngest man on the moon.

### 18. Look at the shapes

> These are a few of the most famous constellations in our sky! Look at their shapes carefully, these constellations will come in handy soon.

### 19. Constellation files

Three yellow case files in a carousel. The parked badge is still in the corner. A **Start Game** button sits on the front file.

| File | Alias | What the card says |
|---|---|---|
| 01 Ursa Major | The Great Bear | Pointer stars toward the North Star, and no guiding stars. The side of the card is covered |
| 02 Canis Major | The Greater Dog | Guiding star Sirius. Find that bright star first, then the rest of the dog |
| 03 Scorpius | Scorpion | A red guiding star marks the scorpion’s heart. The side of the card is covered |

### 20. Remember them

The files dim. The instructor steps in front.

> Let’s see how many you remember! Steer your ship towards the correct constellation.

### 21. Game 1 — Constellation ID

Gaby’s game, pulled from GitHub. The comp is a Lovable build titled **Game 1: Constellation ID**.

A moving star field. Two round windows, each holding a constellation. A ship pointer at the bottom. The board says **FIND URSA MAJOR**, round **1/5**, **LEVEL 3/5**, with a row of right/wrong marks.

Finishing writes the second pin, from how the round went.

### 22. Second award

Back on the portico. The badge recalls and shows two sockets.

> Congratulations, [NAME], you’ve collected your second achievement!

Same ceremony as the mission award: recall, seat the pin, park. The comp shows the sockets empty. The pin art is the local badge, from the constellation just played.

### 23. Two stars fix a position

A playable lesson, titled **star-navigation animation**. The comp is **STEP 1 OF 3**, **MEASURE ONE ANGLE**. A guide star, the ship, Earth, and the Moon. The angle on screen is 135°. A readout has **STAR TO EARTH 135°** and **STAR TO MOON** still blank. A pause control sits at the lower right.

> But every spot on the green line sees Earth at exactly 135° too. One angle gives a line, not a single spot.

The instructor:

> Great job! These constellations are our road signs in space. Use them to identify any two guiding stars, and you’ll know where you are.

Steps 2 and 3 are not in this comp.

### 24. A window, not a sky

The comp is a gray field and a black disc, labeled `[DIAGRAM OF SPACE THROUGH WINDOW + SKYMAP]`.

> But that’s only half the story. In a spaceship, you can’t look at the whole sky at once! Instead, you see a small piece of it through your ship’s window.

This plate is the wide-sky-to-porthole animation already built locally. The dialogue sits on top of that pinch.

### 25. The ship can be tilted

A capsule with a round window, and arrows turning it.

> Astronauts have to identify which section of the sky they are seeing through that small window. To complicate things further, the spacecraft could be tilted in any direction, so they had to recognize constellations in different orientations!

This line plays over the porthole freeze, the held last frame of that pinch, before Align starts.

### 26. Start Align

A **Start Game** button.

> Try it out yourself! Use the joystick to shift the constellations into their original orientation

### 27. Game 2 — Spin the World

Placeholder frame: **Insert game 2 here.** The parked badge sits in the corner of the game screen.

This is the local Align game at `/orient`. A live demo fills this frame. Finishing writes the third pin.

### 28. Third award

The badge recalls with a blue ring and three sockets.

> Congratulations, [NAME], you’ve collected your final achievement!

The comp calls it final. The Find game is still ahead, and it does not add a fourth socket.

### 29. Almost done

> Great job! You are almost done with your training.

### 30. The thunderstorm

A **Save the Ship!** button, with a hand cursor on it.

> But oh, no! A thunderstorm is approaching. Your navigation systems could get damaged. Can you identify the guiding star after getting struck by lightning? Use the pointer to click on the labeled star after your navigation system is struck.

This is the setup for the local Find game. The lightning strike is the scramble already in that game.

### 31. Game 3 — identify the guiding star

Placeholder frame: **Insert game 3 here.** Title on the comp: **Game 3: EMERGENCY: id the guiding star.**

This is the local Find game at `/find`.

### 32. Certified

> Great work, cadet [NAME]! Congratulations on completing your training. You are now a certified Space Navigator!

The comp states Navigator. The print screen is where the session’s real title appears.

### 33. Print

White field. The finished badge, large, with **[USER NAME]** and a note `[completed badge with title]`. An arrow points at the badge. Under it:

> You are a:
> **[SPECIAL TITLE]**
>
> YOUR BADGE IS PRINTING…
> PLAY AGAIN

This is the stats breakdown and the last ceremony together. The title is the holistic result of the whole session, including the commander case when the scores are close and strong. The badge enlarges one last time, moves aside for that breakdown, then slides down. That downward move is the sticker coming out of the kiosk as a print.

## Notes for the rebuild

- Dialogue copy above is the comp text, including the bracketed `[NAME]`, `[USER NAME]`, and `[SPECIAL TITLE]` tokens.
- The gray disc in the comps is a stand-in. The cloth, the arc type, and the patch seating come from the badge kit already built locally.
- Screens 7–8, 22, and 28 are the same ceremony: recall, seat the next pin, park.
- Screen 33 is the designate beat: the finished badge, the session title, then the sticker feeds out as the print.
- Quote screens (13 and 17) keep the portico and replace the instructor with a portrait and a NASA card.
- Game screens (21, 27, 31) are full-frame. The badge stays parked in the corner.
- Screen 24’s background is the local pinch at `/transition`. Screen 25 holds on its last frame.

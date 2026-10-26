# Playroom

A calm, wordless "digital playroom" of open-ended toys for ages 2–7.
Plain HTML, CSS and vanilla JavaScript: no frameworks, no build step, no server.
Open `index.html` and it works. Sound, saving and every toy also work from `file://`;
installing and offline mode need it served over https (e.g. GitHub Pages).

Live (once Pages is on): `https://isaacjana.github.io/playroom/`

## The toys
| Toy | What little hands do |
| --- | --- |
| Wobbly Blocks | Tap empty space for a new block, drag blocks to stack, watch them topple and pull faces |
| Doodle Pad | Finger paint with chunky brushes, rainbow, stamps, eraser. Frame = save to gallery; fresh page keeps the old one in the gallery |
| Sound Blobs | Drag blobs onto the 8-step loop. Higher = higher note (pentatonic), color = voice. Drag off to remove |
| Tiny Town | Drag sideways to explore. Tap doors, windows, cars, people, the dog, duck, clouds, flowers, swing, chimney, sun/moon |
| Busy Board | Switches + lights, knobs, sliders, push buttons, spinner, peekaboo door, sliding beads |
| Marble Run | Drag ramps / bells / bouncy pads out of the tray, tap a ramp to turn it, tap anywhere to drop a marble |

**Grown-ups:** press and hold the faint dots in the top-right corner of the playroom floor for 3 seconds.
There you can mute sound, view / download / delete drawings, clear all data, and read tips on
Guided Access (iOS) and App Pinning (Android).

## Files
```
index.html             playroom home + grown-up area
css/style.css          all styles; palette as CSS variables in :root
js/app.js              storage, navigation, zoom transition, home button, parent gate, PWA
js/audio.js            Web Audio synth (soft sine/triangle tones, no audio files)
js/physics.js          tiny 2D rigid-body engine used by Blocks and Marble Run
js/toys/*.js           one file per toy (blocks, doodle, blobs, town, busyboard, marbles, bubbles, animals, twinkle, piano; bubbles/animals/twinkle suit babies): PR.toys.<name> = { init(container), destroy(), save() }
assets/art.js          inline SVG art: wobbly shapes, diverse characters, tiles
assets/icon*.svg/png   app icons
manifest.json, sw.js   installable PWA, works offline
```
Toys register on a global (`window.PR.toys`) instead of using ES `export`, because browsers
block ES modules on `file://`. That is what lets you simply double-click `index.html`.

## Renaming
Change "Playroom" in `index.html` (`<title>`, `apple-mobile-web-app-title`) and in
`manifest.json` (`name`, `short_name`).

## Updating after you change files
Bump `VERSION` in `sw.js` (e.g. `playroom-v3`) so installed copies fetch the new files.

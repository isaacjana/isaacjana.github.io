# Cozy Tales

A cosy shelf of read-along picture books for little ones, in the same soft, hand-drawn world as
[Playroom](../playroom/). Plain HTML, CSS and vanilla JavaScript: no frameworks, no build step,
no server, no image files. Open `index.html` and it works. Installing and offline mode need it
served over https (e.g. GitHub Pages).

Live (once Pages is on): `https://isaacjana.github.io/storybook/`

## Using it
- Tap a book on the shelf; it zooms open. Swipe or tap the big arrows to turn pages.
- Tap the pictures: animals hop, the moon chimes, balloons float, bubbles pop. Every sound is synthesised.
- Speaker button (top right) reads each page aloud with the device voice and highlights the words.
  Tap any single word to hear it on its own.
- The last page has replay, back-to-shelf and next-story buttons. Finished books get a star.
- Works upright (picture above words) and sideways (picture beside words), on phones and tablets.

**Grown-ups:** press and hold the faint dots in the top-right corner of the shelf for 3 seconds.
Settings for auto read-aloud, reading speed, sound effects, resetting progress, plus install and
Guided Access / App Pinning tips.

## The stories
| Book | About |
| --- | --- |
| Bobo and the Moon | A sleepless bear tries to catch the moon |
| Pip and the Puddle | A little duck who does not like water finds a puddle |
| Bunny's Red Balloon | Friends stack up to rescue a runaway balloon |
| Fox's Giant Sneeze | Ah... ah... ACHOO! |
| Finn and the Falling Star | A fish helps a tired star get home |

## Files
```
index.html            shelf + reader + grown-up area
css/style.css         all styles; palette as CSS variables in :root (same as Playroom)
js/art.js             inline SVG art: wobbly shapes, animal characters, scenery, icons, covers
js/stories.js         the stories: { text, art() } per page
js/audio.js           Web Audio synth for every sound (no audio files)
js/app.js             storage, shelf, zoom-open, page turns, tap reactions, read-aloud, settings, PWA
assets/icon*.svg/png  app icons
manifest.json, sw.js  installable PWA, works offline
```
Scripts attach to a global (`window.SB`) instead of using ES `export`, so the app also runs from `file://`.

## Adding a story
Add an object to `SB.stories` in `js/stories.js`:
```js
{ id: 'myStory', title: 'My Story', color: 'pink', dark: 'pink-d', win: 'day', theme: 'lilac',
  cover: () => /* svg for the round window on the book cover, 200 x 170 */,
  pages: [{ text: 'Once upon a *time*...', art: () => /* svg for a 400 x 300 scene */ }] }
```
Draw with the helpers in `SB.art` (`critter`, `sky`, `hill`, `tree`, `cloud`, `pond`, ...). Wrap anything
tappable with `A.tp(inner, animation, sound)` where animation is `hop | wiggle | spin | pop | shake | float | splash`
and sound is a name from `js/audio.js`. `*Starred words*` are shown big and colourful.
Then list the new story in the `SB.stories` array at the bottom of the file.

## Updating after you change files
Bump `VERSION` in `sw.js` (e.g. `cozytales-v2`) and add any new files to its `FILES` list so
installed copies fetch the update.

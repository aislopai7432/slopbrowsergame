# Bubble Bliss

A 3D, third-person take on agar.io that runs in the browser. Eat pellets to grow, eat blobs smaller than you, and run from bigger ones.

## Play

Open `index.html` in a browser, or play the GitHub Pages version if it's enabled. It loads three.js from a CDN, so it needs internet.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Fly where the camera looks |
| R / F | Float straight up / down |
| Mouse | Turn the camera (click to lock the pointer) |
| Space | Split: half of each cell launches forward |
| E (hold) | Drop pellets of your own mass |
| Shift | Speed boost (costs a little mass) |
| Esc / P | Pause |

You fly freely in 3D. You can eat any blob with 8% less mass than you just by bumping into it (bots need a 20% edge). Split cells pull back together and merge after a few seconds. The main menu lets you set your name, colour and difficulty.

## Goal

Grow until you physically fill the whole box (as wide as the box, pressing on every wall) and you win. The radar in the top left shows nearby blobs: red can eat you, green you can eat, and arrows mean above or below you. The screen edges glow red when something dangerous is close.

## Classes

| Class | Upside | Downside |
| --- | --- | --- |
| Balanced | No weaknesses | No strengths |
| Speed | 35% faster, quicker boost | Anything 10% bigger can eat you |
| Tank | Blobs must be 50% bigger to eat you | 20% slower |
| Magnet | Pulls pellets in from 3x further | Slower, needs a 15% edge to eat blobs |
| Hunter | Eats blobs only 3% smaller than you | Loses mass twice as fast when big |
| Splitter | Splits fly further, merge faster, up to 32 cells | Starts smaller |
| Ghost | Untouchable while boosting | Boosting costs 3x the mass |

On phones, drag the left side to fly, drag the right side to look, and use the on-screen buttons.

See [CHANGELOG.md](CHANGELOG.md) for patch notes, or the **Patch notes** button in the game menu.

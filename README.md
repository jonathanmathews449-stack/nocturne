# Nocturne — A Living Poem

**Live: https://jonathanmathews449-stack.github.io/nocturne/**

Nocturne is a cinematic, dependency-free interactive experience built for the modern
web. It is a suite of three fields — three poems, three constellations, three
atmospheres. Move through a generative star field, awaken the five memory stars of a
field, and its poem reveals one line at a time. Finish a field and the next sky opens;
finish all three and the suite closes.

Progress is kept in `localStorage` behind guards, so the site resumes where you left
off and still works perfectly where storage is blocked — it simply forgets.

## Features

- Responsive animated canvas with cursor parallax and particle effects
- Three fields, each with its own poem, constellation and atmosphere
- Five-part constellation discovery per field, with a field journal on the title screen
- Saved progress that resumes at the first unfinished field
- Procedurally generated ambient chimes with the Web Audio API
- Three live color atmospheres
- Keyboard-accessible discovery controls
- Fullscreen mode, clipboard support, and reduced-motion support
- No framework, build step, tracking, or runtime dependencies

## Deployment

The site is designed for direct deployment to GitHub Pages from the `main` branch.

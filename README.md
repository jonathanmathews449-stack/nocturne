# Nocturne — A Living Poem

**Live: https://jonathanmathews449-stack.github.io/nocturne/**

Nocturne is a cinematic, dependency-free interactive experience built for the modern
web. It is a suite of three fields — three poems, three constellations, three
atmospheres — and one arc: it opens grateful about the earth and does not stay that
way.

Each memory star plays a short sequence across five satellites and asks you to echo
it back. The sequences lengthen as you go deeper, and the final field asks for them
backwards. There is no fail state; a wrong answer simply plays the sequence again.

Progress is kept in `localStorage` behind guards, so the site resumes where you left
off and still works perfectly where storage is blocked — it simply forgets.

## Features

- Responsive animated canvas with cursor parallax and particle effects
- Three fields, each with its own poem, constellation and atmosphere
- Five sequence puzzles per field — each star plays a pattern you echo back
- Sequences lengthen as you go deeper, and the last field asks for them backwards
- A field journal on the title screen, with replay for finished fields
- Saved progress that resumes at the first unfinished field
- Procedurally generated ambient chimes with the Web Audio API
- Three live color atmospheres
- Keyboard-accessible discovery controls
- Fullscreen mode, clipboard support, and reduced-motion support
- No framework, build step, tracking, or runtime dependencies

## Deployment

The site is designed for direct deployment to GitHub Pages from the `main` branch.

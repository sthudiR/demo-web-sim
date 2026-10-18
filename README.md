# Pocket Tides

An interactive tide simulator. Sliders for moon distance, moon phase and sun alignment drive a live 3D shoreline
(three.js via react-three-fiber) and a calculator that shows the formula (KaTeX) plus computed high and low tides.
A second tab is a plain-input tide table calculator, and a Video tab embeds a YouTube clip.

Framework: Vite + React + TypeScript. The model is a sum of two constituents, M2 (lunar) and S2 (solar).

## Run locally

    npm install
    npm run dev

## Build

    npm run build     # tsc --noEmit && vite build, output in dist/
    npm run preview

three.js and KaTeX are split into separate chunks and the 3D scene is lazy loaded.

## Deploy

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on push to `main` (or manually). If the
`HUB_DISPATCH_TOKEN` secret exists it also notifies `sthudiR/demo-web-hub`.

## Routing and base path

The site is served under `/demo-web-sim/` (`base` in `vite.config.ts`). Tabs use hash links (`#/sim`, `#/table`,
`#/video`) so there is no 404 problem on Pages. Keep `public/site.json` and `public/thumbnail.svg`; they are copied to the output root.

## Embedding the video

The Video tab (`src/App.tsx`, `Video` component) uses
`https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ` in a responsive 16:9 lazy-loaded iframe. Change the id there.

## Licence
Public domain (CC0). Everything here is made up for a demo; use and share it freely. See `LICENSE`.

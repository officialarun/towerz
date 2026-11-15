# The Plaza — frontend-only explorer

A Next.js / React / TypeScript website for the plaza opposite Inayat Nagar Police Station, along Ayodhya–Raebareli Road / SH15. The project exports static HTML, CSS, JavaScript and images; it needs no application server, database, login or API.

The landing page opens directly in the interactive 3D model. Final Look remains available as a full-viewport image banner, alongside the Floor Plan tab.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev -- --port 3001
```

To build and preview the static site:

```bash
npm run build
npm start -- --port 3000
```

The build produces the deployable `out/` directory. The start command is a local file preview, serving the exported files without application logic.

## Content and forms

- Edit the public shop inventory, floor labels, plaza description, amenities and contact details in `src/data/demo.ts`.
- Edit the supplied address, landmark descriptions and directions in `src/data/site.ts`.
- Put images in `public/` and reference their public paths from the content files. All content in these files is public and included in the site build.
- The shortlist is saved only in the visitor’s browser using localStorage.
- The enquiry form is a UI preview. Its submit button is disabled and it makes no network requests or saves entries. Submission integration can be added later.
- `.env.example` contains one optional public WhatsApp number. No environment variables are required to run or build the site.

Content changes take effect after rebuilding the static site. All 32 shop detail pages are generated at build time, so their URLs work when opened directly or refreshed.

## Deploy the static files

Run `npm run build` and publish the contents of `out/` to a static host. Keep the exported directory structure, including each route’s `index.html` and the `_next/` asset directory.

For Vercel, import the repository with the **Next.js** framework preset and leave the **Output Directory** override disabled. Vercel detects the Next.js build and its static export automatically. The included `vercel.json` runs `npm run build` and defines response headers at the hosting layer.

There are no serverless functions or runtime credentials to configure. Other static hosts can serve the contents of `out/` directly.

Next Image serves the supplied image files directly, so an image optimization server is not required. Deployment itself is not performed automatically.

## Pages

| Route           | Purpose                                             |
| --------------- | --------------------------------------------------- |
| `/`             | 3D landing page, Final Look banner and introduction |
| `/explore/`     | Dedicated 3D site explorer                          |
| `/floor-plans/` | Interactive floor plans                             |
| `/shops/`       | Shop browsing, filters and search                   |
| `/shops/G-01/`  | Example static shop detail page                     |
| `/amenities/`   | Plaza features                                      |
| `/location/`    | Site setting, landmark and directions               |
| `/contact/`     | Contact information and enquiry form preview        |

## Model and presentation

The model contains **B — semi-basement, GF — raised ground, 1F — first and 2F — second**, plus roof and parapet. The photographed lower frame guides the structural grid; upper floors extend the same grid and are marked as extrapolated. Two recessed front stair flights rise behind the front column line and arrive on a shared walkway before the shopfronts. A separate provisional stair descends from the open forecourt to the semi-basement. Left and recessed right turning stairs connect GF, 1F and 2F through landings and passages. Entrance stair barriers remain removed.

The Structural Frame and Proposed 3D views use the same geometry. Floor isolation, cutaways, exploded floors, shop selection and simplified interiors remain available. The five-icon tray contains reset, rotate/pause, zoom in, zoom out and opposite-side context. Other options, including Split View, remain under Controls. No fullscreen button is used.

`src/data/building.ts` contains the configurable elevations, column grid, forecourt, stairs, walkway and shop footprints. `src/lib/three/circulation.ts` connects the flights and landings. See [structural reconstruction notes](docs/structural-reconstruction.md) for reference observations, provisional dimensions, route connections and verification. Existing G/S1/S2 inventory references remain stable; the new S3 references describe the added Second Floor.

Final Look uses `public/kedarnath-plaza-final-look.png` as an edge-to-edge banner. Navigation, image zoom/reset, text and enquiry actions overlay the image. Mobile screens fit the full image so the neighbouring buildings remain visible. Switching between Final Look and 3D preserves the selected shop and camera.

Three.js WebGL and the SVG compatibility renderer share `src/lib/three/site-model.ts` and `src/lib/three/site-state.ts`. Label detail scales with camera zoom through `src/lib/three/label-detail.ts`. Typography uses the shared 130% font scale; 3D starts at 100% zoom and floor plans at 120%.

Roads, the median, neighbouring shops, trees, the small shrine and the opposite police-station compound are approximate context. The supplied images do not establish surveyed dimensions or verified rentable divisions. Unit areas, availability, finishes and tenant signage are illustrative.

## Structure

```text
src/app/                  Public pages and responsive styles
src/components/three/     Explorer, controls, Final Look and renderers
src/components/floor-plan/ Interactive SVG floor plan
src/components/leasing/   Catalog, details, shortlist and form preview
src/data/                 Public content, inventory and geometry parameters
src/store/                Browser-side explorer and shortlist state
src/lib/three/            Shared model, visibility, camera and labels
public/                   Static image assets
scripts/serve-static.mjs   Local preview of the exported files
out/                      Build output, generated and ignored
```

## Checks

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Browser checks use installed Chrome (`/usr/bin/google-chrome`, or `CHROME_PATH`) and serve the exported `out/` directory on port 3002. They cover static deep links, shop filtering, browser-only shortlist persistence, the non-submitting enquiry form, 3D controls, Final Look transitions, responsive layouts, label scaling and graphics fallback. They need no test database or administrator.

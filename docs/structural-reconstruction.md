# Structural geometry and pedestrian circulation

The active scene remains a frontend-only Three.js model shared by WebGL and SVG. This update corrects the existing frame and circulation rather than replacing the website or introducing a new architectural design.

## Reference basis

The frontal construction view (`Screenshot from 2026-11-15 02-04-35.png`) and the oblique left view (`Screenshot from 2026-11-15 02-04-11.png`) establish the visible lower RCC frame, separated front stair approaches, semi-basement openings and exposed turning stair at the left. The right stair is obscured by the tree. The final-look rendering supplies an outlook reference, not authoritative structural measurements.

Column centres, footprint depth and circulation dimensions are visual estimates. In particular, the right stair arrangement, basement stair position, corridor widths, shop subdivisions and upper-floor extension require measured drawings. The structural-frame view labels the upper floors as extrapolated; it does not claim that the complete four-level frame is currently built.

## Configurable geometry

`src/data/building.ts` is the shared parameter source for the model, circulation layout, camera bounds and floor plan. Road grade is zero and +Z points toward SH15, without claiming a surveyed compass bearing.

| Datum              | Model elevation |
| ------------------ | --------------: |
| B — semi-basement  |         −1.45 m |
| GF — raised ground |         +2.80 m |
| 1F — first         |         +7.05 m |
| 2F — second        |        +11.30 m |
| Roof slab datum    |        +15.55 m |

The defaults derive from one base elevation and a 4.25 m floor-to-floor parameter. These are model settings, not approved building dimensions.

The four main column centres are X = −12.2, −4.4, +3.1 and +11.4 m, with depth rows at Z = −6.7, −0.8 and +9 m. The resulting front bays are deliberately unequal. Every floor uses the same centres; storefront positions do not move columns. The slab spans X = −13…+13 m and Z = −7.25…+9.25 m. Slabs and ceiling skins share their opening definitions.

## Connected routes

1. **Road → forecourt:** the open site forecourt remains at grade. It extends to Z = +16.3 m, leaving visible space before the front column line at Z = +9 m. The former long raised entrance bridges and full-width forecourt excavation are removed.
2. **Forecourt → GF:** two distinct flights start behind the front column line, within separate structural bays. Each has 16 risers and 0.28 m treads. Concrete waist slabs support the individual treads and risers; these are not floating triangular approximations.
3. **Landings → shared walkway → shops:** both flights finish on the same GF walkway, approximately 1.82 m deep. Shopfront glazing is recessed behind it, and real gaps in the glazing represent doors. Visitors can turn left or right without entering a shop.
4. **Walkway → internal corridor:** the central corridor extends into the building and meets a transverse passage. The passage connects to the recessed right staircase without passing through a commercial unit.
5. **Forecourt → B:** a separate, narrow descending flight reaches a lower landing and the central basement corridor. Its position is explicitly provisional. The semi-basement remains partly visible above street grade; there is no vehicle ramp or new garage.
6. **GF → 1F → 2F, left:** the exposed left staircase has two reversing flights and a mid-landing for each level transition. Floor landings connect directly to the front walkway. Its flights run along the depth of the building.
7. **GF → 1F → 2F, right:** a separately configured transverse switchback sits inside a recessed structural bay. Its flights run across the building rather than mirroring the left stair. It joins the transverse passage through its own floor landings. This arrangement is a configurable placeholder until drawings establish the obscured route.

The GF slab and basement ceiling contain the two front-flight openings. The 1F and 2F slabs and corresponding ceiling skins contain the recessed right-stair opening. The clear openings avoid the existing beam and column lines. The left stair sits outside the main slab and joins its edge at the shared floor landings.

## Semi-basement commercial provision

A small SBI ATM provision is placed inside the front-right basement bay G-05. Its cabinet sits away from the shop door and the central access route. This is an illustrative fit-out allocation, not a confirmed tenancy. Basement commercial footprints and circulation remain accessible through the separate descending route.

## Inventory and presentation

The existing G, S1 and S2 references remain stable. Eight S3 references represent the added Second Floor, for 32 demonstration units. Footprints, displayed frontages/depths and approximate areas derive from the same local layout, including space reserved for circulation. These are not verified rentable divisions.

The floor plan uses the model coordinates for columns, commercial footprints, front walkway, corridor, cross-passage, landings and stair directions. All four floors support selection, cutaways, explosion, labels, shortlists, static detail pages and the existing form preview. The five-button tray and Final Look presentation remain in place.

## Verification

The circulation checks cover:

- Separate, recessed front flights and an open ground setback.
- Stair endpoints joining grade, same-height landings or the shared walkway.
- Return-flight direction changes on both sides and connections through 2F.
- Flight footprints avoiding the RCC columns and commercial volumes.
- Neighbouring masses and awnings staying clear of the exposed left stair.
- Clear corridors and cross-passage outside shop footprints.
- Actual slab openings and an unobstructed 1.8 m vertical sample above stair treads.
- Clear shop door openings and the ATM cabinet staying inside its basement bay.

The head-space sample is a geometry regression check, not a regulatory or structural approval. The front camera supports visual comparison with the construction photographs; it is an approximate perspective, not a calibrated photogrammetric reconstruction.

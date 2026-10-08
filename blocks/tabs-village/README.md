# tabs-village

Custom **tabs** block: a UK map with one pin (tab) per village, and a village card (tab panel).

## Authoring

One row per village:

| Tab label (village name, location) | Card (image, heading, location, description, CTA link) |
| --- | --- |

The section's default content (h2 intro, intro paragraph, "Explore all villages" link and the
optional `h4` + `p` hint "Not sure where you want to go?") is laid out around the map by the
block CSS (section-level rules at the end of `tabs-village.css`).

## Village selected on load

1. A row whose tab label is (partly) **bold** is the authored default marker.
2. Otherwise the village named `DEFAULT_VILLAGE` in `tabs-village.js` (`Sherwood Forest`,
   matching the source site).
3. Otherwise the first row.

## Supported variations

No variations.

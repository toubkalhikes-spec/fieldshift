# Fieldshift

A responsive crop rotation planning demo for Taroudant, Morocco, built from the seven final Figma screens for team MarshmallowMoon. Plain HTML, CSS and JavaScript. All images and datasets ship with the app.

## Run

From this folder run `python3 -m http.server 8000` and open http://localhost:8000. Serve over HTTP so the browser can load modules and the bundled data.

## Publish

Extract the ZIP and upload its contents (including index.html, assets and data) to the root of your GitHub repository. For GitHub Pages select the branch and root directory. For Vercel import that repository as a static project (Other), leave the build command empty and publish the repository root. No keys or install step. Hash routes support bookmarks and reloads.

## Planning workflow

Use the farm form to save a draft or continue. Select a priority, compare three illustrative plans, inspect their evidence, then save, remove or restore plans. Farm details, preferences and saved plan IDs are stored on this browser only. Saved entries reflect the current workspace profile. Crop exclusions are reminders for manual review. This version is in English.

## Data and limits

The Data sources screen links to the original NASA POWER JSON and a daily CSV for the Taroudant reference point in 2025. See data/provenance.json for the retrieval record and data/crop_catalog.json for local sources. Editing coordinates does not fetch a new climate sample. Unknown inputs remain visible. No validated ranking, water savings, planting dates or yield forecasts are calculated.

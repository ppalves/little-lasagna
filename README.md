# Little Lasagna and Big Pancake

A scroll-driven photo timeline of love and laughs, adapted from the Evans Halshaw Bond Cars interactive timeline.

Serve the folder with a static web server:

```powershell
python -m http.server 4173
```

Then visit `http://localhost:4173`.

## Page structure

- `index.html` combines the unique title screen with the generated timeline so scrolling moves naturally between them.
- `timeline.html` is the reusable timeline-only page for direct scene links such as `timeline.html#id18`.
- `Static/Content/LittleLasagna/data/little-lasagna-timeline.json` contains every scene's title, subtitle, date, image, description, colors, date placement, and photo orientation (`landscape`, `portrait`, or `square`).
- `Static/Content/LittleLasagna/data/letter.json` contains the final letter page shown after the last timeline scene (greeting, paragraphs, closing, signature, image, and colors). It is linked as `#letter`; delete the file to hide the page.
- `Static/Content/LittleLasagna/little-lasagna-css/main.css` contains all styles.
- `Static/Content/LittleLasagna/little-lasagna-img/` holds the title artwork and timeline photos.
- `Static/Content/LittleLasagna/little-lasagna-js/timeline.js` fetches the JSON, renders the scenes, and drives the scroll transitions with browser-native JavaScript.

Add or edit timeline pages by changing the JSON array rather than creating another HTML file.

The site has no framework or runtime package dependencies.

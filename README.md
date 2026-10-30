# Little Lasagna and Big Pancake

A scroll-driven photo timeline of love and laughs

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

## Installing as an app

The site is a Progressive Web App, so it can be added to a phone's home screen and opens full screen like an app.

- `manifest.webmanifest` sets the app name, colors, and icons (in `Static/Content/LittleLasagna/icons/`).
- `sw.js` is the service worker. It caches the site so it opens quickly and works offline. Pages, styles, scripts, and JSON are always fetched fresh when online. Images are served from the cache, so give a replaced photo a new file name (or bump `CACHE` in `sw.js`) so installed apps pick it up.
- `Static/Content/LittleLasagna/little-lasagna-js/pwa.js` registers the service worker and shows a dismissible "Get the app" hint on phones: an Install button on Android, and "Share → Add to Home Screen" instructions on iPhone, which has no install prompt.

Add or edit timeline pages by changing the JSON array rather than creating another HTML file.

The site has no framework or runtime package dependencies.

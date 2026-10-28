# Bond Cars

Authorized local adaptation of the Evans Halshaw Bond Cars interactive timeline.

Serve the folder with a static web server:

```powershell
python -m http.server 4173
```

Then visit `http://localhost:4173`.

## Page structure

- `index.html` combines the unique title screen with the generated timeline so scrolling moves naturally between them.
- `cars.html` is the reusable timeline-only page for direct scene links such as `cars.html#c18`.
- `Static/Content/BondCars/data/cars.json` contains every scene's title, subtitle, date, image, description, colors, date placement, and photo orientation.
- `Static/Content/BondCars/bond-js/timeline-data.js` fetches the JSON and renders the navigation and scene markup before starting the timeline runtime.

Add or edit timeline pages by changing the JSON array rather than creating another HTML file.

The original `c1.html` through `c26.html` files remain unchanged as recovery and implementation references. They are no longer used by the data-driven timeline.

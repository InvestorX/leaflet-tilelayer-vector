# (Development) Fork 
of [glenrobertson/leaflet-tilelayer-geojson](https://github.com/glenrobertson/leaflet-tilelayer-geojson)

-work in progress-

### additions to leaflet-tilelayer-geojson:

* based on Leaflet Path vector classes instead of GeoJSON
* async queue for adding tiles to let UI render each tile immediately
* remove tiles/vectors outside viewport
* deduplication for unclipped tiles, remove common features only when no more references
* overzooming (reuse tiles for multiple zoom levels)
* loading/progress tiles
* Web Worker support

### Todo

* early adoption of Leaflet master (0.8-dev) refactorings
* cleanup, refactoring<br>
configurable modules for tile loading (streams?): e.g. request > worker > queue > add
* debug layer
* performance
* clipped tiles support
* ...
* discuss if and what to merge back

### Leaflet versions

* current development on dev Branch is already for Leaflet master (0.8-dev)<br>
install Leaflet with [bower](https://github.com/bower/bower#installing-bower):

```
bower install
```
* for Leaflet stable (v0.7) and v0.6 see [Tags](https://github.com/nrenner/leaflet-tilelayer-vector/tags)/[Releases](https://github.com/nrenner/leaflet-tilelayer-vector/releases)

### Usages

* [Mapsplit map](https://github.com/nrenner/mapsplit-map) using OSM PBF vector tiles.

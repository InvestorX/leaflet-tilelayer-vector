// Load data tiles using the JQuery ajax function
L.TileLayer.Ajax = L.TileLayer.extend({
    onAdd: function (map) {
        L.TileLayer.prototype.onAdd.call(this, map);
        this.on('tileunload', this._unloadTile);
    },
    onRemove: function (map) {
        L.TileLayer.prototype.onRemove.call(this, map);
        this.off('tileunload', this._unloadTile);
    },
    _addTile: function(tilePoint, container) {
        var key = tilePoint.x + ':' + tilePoint.y;
        var tile = { key: key, datum: null };
        this._tiles[key] = tile;
        this._loadTile(tile, tilePoint);
    },
    _addTileData: function(tile) {
        // override in subclass
    },
    // XMLHttpRequest handler; closure over the XHR object, the layer, and the tile
    _xhrHandler: function (req, layer, tile) {
        return function() {
            if (req.readyState != 4) {
                return;
            }
            var s = req.status;
            if ((s >= 200 && s < 300) || s == 304) {
                // check if request is about to be aborted, avoid rare error when aborted while parsing
                if (tile._request) {
                    tile._request = null;
                    layer.fire('tileresponse', {tile: tile, request: req});
                    tile.datum = req.responseText;
                    layer._addTileData(tile);
                }
            } else {
                layer.fire('tileerror', {tile: tile});
                layer._tileLoaded();
            }
        }
    },
    // Load the requested tile via AJAX
    _loadTile: function (tile, tilePoint) {
        this._adjustTilePoint(tilePoint);
        var layer = this;
        var req = new XMLHttpRequest();
        tile._request = req;
        req.onreadystatechange = this._xhrHandler(req, layer, tile);
        this.fire('tilerequest', {tile: tile, request: req});
        req.open('GET', this.getTileUrl(tilePoint), true);
        req.send();
    },
    _unloadTile: function(evt) {
        var tile = evt.tile,
            req = tile._request;
        if (req) {
            tile._request = null;
            req.abort();
            this.fire('tilerequestabort', {tile: tile, request: req});
        }
    },
    _update: function() {
        //console.log('_update');
        if (this._map._panTransition && this._map._panTransition._inProgress) { return; }
        if (this._tilesToLoad < 0) this._tilesToLoad = 0;
        L.TileLayer.prototype._update.apply(this, arguments);
    }
});

L.TileLayer.Vector = L.TileLayer.Ajax.extend({
    options: {
        // factory function to create the vector tile layers (defaults to L.GeoJSON)
        layerFactory: L.geoJson,
        // factory function to create a web worker for parsing/preparing tile data
        workerFactory: L.communistWorker
    },
    initialize: function (url, options, vectorOptions) {
        L.TileLayer.Ajax.prototype.initialize.call(this, url, options);
        this.vectorOptions = vectorOptions || {};
        this._worker = this.options.workerFactory(L.TileLayer.Vector.parseData);
        this._addQueue = new L.TileQueue(L.bind(this._addTileDataInternal, this));
    },
    onAdd: function (map) {
        this._map = map;
        
        this._updateZoom();

        L.TileLayer.Ajax.prototype.onAdd.call(this, map);

        map.on('viewreset', this._updateZoom, this);

        // root vector layer, contains tile vector layers as children 
        this.vectorLayer = this._createVectorLayer(); 
        map.addLayer(this.vectorLayer);

        // workaround for v0.5.1:
        // Error in projectLatlngs because L.Path._map is null, when layer has been removed 
        // in the same viewreset event (tileunload) and listeners are not removed yet.
        // Not needed for current master (> v0.5.1), because listeners are removed immediately.
        // 
        // Simply removes viewreset listeners right after they have been added, assuming that 
        // we always remove layers on viewreset and therefore projectLatlngs is unnecessary. 
        map.on('layeradd', this._removeViewresetForPaths, this);
        
        this._worker.onAdd(map);
    },
    onRemove: function (map) {
        // unload tiles (L.TileLayer only calls _reset in onAdd)
        this._reset();
        map.removeLayer(this.vectorLayer);

        L.TileLayer.Ajax.prototype.onRemove.call(this, map);

        map.off('viewreset', this._updateZoom, this);
        map.off('layeradd', this._removeViewresetForPaths, this);

        this._worker.onRemove(map);

        this.vectorLayer = null;
        this._map = null;
    },
    _createVectorLayer: function() {
        return this.options.layerFactory(null, this.vectorOptions);
    },
    _removeViewresetForPaths: function(evt) {
        var layer = evt.layer;
        if (layer.projectLatlngs && this._map) {
            this._map.off('viewreset', layer.projectLatlngs, layer);
        }
    },
    _createTileLayer: function() {
        return this._createVectorLayer();
    },
    _addTileData: function(tile) {
        this._worker.process(tile, L.bind(function(tile) {
            this._addQueue.add(tile);
        },this));
    },
    _addTileDataInternal: function(tile) {
        try {
            var tileLayer = this._createTileLayer();
            if (!tile.parsed) {
                tile.parsed = L.TileLayer.Vector.parseData(tile.datum);
                tile.datum = null;
            }
            tileLayer.addData(tile.parsed);
            tile.layer = tileLayer;
            this.vectorLayer.addLayer(tileLayer);
        } catch (e) {
            console.error(e.toString());
        }
        this.fire('tileload', {tile: tile});
        this._tileLoaded();
    },
    _unloadTile: function(evt) {
        L.TileLayer.Ajax.prototype._unloadTile.apply(this, arguments);

        var tile = evt.tile,
            tileLayer = tile.layer;
        this._addQueue.remove(tile);
        this._worker.abort(tile);
        if (tileLayer) {
            // L.LayerGroup.hasLayer > v0.5.1 only 
            if (this.vectorLayer._layers[L.stamp(tileLayer)]) {
                this.vectorLayer.removeLayer(tileLayer);
            }
        }
    },
    _reset: function() {
        L.TileLayer.Ajax.prototype._reset.apply(this, arguments);
        this._addQueue.clear();
    }
});

L.extend(L.TileLayer.Vector, {
    parseData: function(data) {
        return JSON.parse(data);
    }
});

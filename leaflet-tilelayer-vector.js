;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
L.AbstractWorker = L.Class.extend({
    initialize: function () {
    },

    onAdd: function (map) {
    },

    onRemove: function (map) {
    },

    process: function(tile, callback) {
        callback(tile);
    },
    
    abort: function(tile) {
    },
    
    clear: function() {
    }
});

// dummy worker (= no worker) when used directly
L.noWorker = function () {
    return new L.AbstractWorker();
};

},{}],2:[function(require,module,exports){

// patch Leaflet.label plugin to avoid null error on viewreset when label has
// already been removed (v0.5.1), also see comment in L.TileLayer.Vector.onAdd
if (L.Label) {
    var orig = L.Label.prototype._updatePosition;
    L.Label.prototype._updatePosition = function() {
        if (this._map) {
            orig.apply(this, arguments);
        }
    };
}
},{}],3:[function(require,module,exports){
L.Request = {
    get: function (url, callback, responseType) {
        var req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            if (req.readyState != 4) {
                return;
            }
            var s = req.status,
                data;

            data = L.Request._getResponse(req, responseType);

            // status 0 + response check for file:// URLs
            if ((s >= 200 && s < 300) || s == 304 || (s == 0 && data)) {
                callback(null, data);
            } else {
                callback(s + ': ' + req.statusText, null);
            }
        };
        req.open('GET', url, true);
        if (responseType) {
            req.responseType = responseType;
        }
        req.send();

        return req;
    },
            
    binaryGet: function (url, callback) {
        return L.Request.get(url, callback, 'arraybuffer');
    },
            
    _getResponse: function(req, responseType) {
        var response;
        if (responseType && responseType === 'arraybuffer') {
            response = req.response;
        } else {
            response = req.responseText;
        }
        return response;
    }
};

},{}],4:[function(require,module,exports){
/**
 * Simple tile cache to keep tiles while zooming with overzoom
 */
L.TileCache = function() {
};

L.TileCache.prototype = {
    // cache key: tile (String: Object)
    _cache: {},

    // flag to determine switch between tile unloading (put) and loading (get) phase
    _unloading: false,

    // flag to only cache tiles when zooming, not when moving
    _zooming: false,

    onAdd: function(map) {
        this._map = map;
        
        map.on('zoomstart', this._onZoomStart, this);
        map.on('zoomend', this._onZoomEnd, this);
    },

    onRemove: function(map) {
        this._map = null;

        map.off('zoomstart', this._onZoomStart, this);
        map.off('zoomend', this._onZoomEnd, this);
    },

    _onZoomStart: function(evt) {
        this._zooming = true;
    },

    _onZoomEnd: function(evt) {
        this._zooming = false;
    },

    get: function(key, urlZoom) {
        var ckey = this._getCacheKey(key, urlZoom);
        var tile = this._cache[ckey];
        this._unloading = false;
        //console.log('cache ' + (tile ? 'hit ' : 'miss') + ': ' + ckey);
        return tile;
    },
    
    put: function(tile) {
        if (!this._zooming) return;

        if (!this._unloading) {
            // clear old entries before adding newly removed tiles after zoom or move
            this.clear();
            this._unloading = true;
        }

        var ckey = this._getCacheKeyFromTile(tile);
        if (!(ckey in this._cache)) {
            // vector layer is recreated because of feature filter
            delete tile.layer;
            this._cache[ckey] = tile;
            //console.log('cache put : ' + ckey + ' (' + Object.keys(this._cache).length + ')');
        }
    },
    
    clear: function() {
        //console.log('cache clear');
        this._cache = {};
    },

    _getCacheKeyFromTile: function(tile) {
        return this._getCacheKey(tile.key, tile.urlZoom);
    },

    _getCacheKey: function(key, urlZoom) {
        return urlZoom + ':' + key
    }
};

L.tileCache = function() {
    return new L.TileCache();
};

// dummy impl. to turn caching off
L.tileCacheNone = function() {
    return {
        onAdd: function(map) {},
        onRemove: function(map) {},
        get: function(key, urlZoom) {},
        put: function(tile) {},
        clear: function() {}
    };
};

},{}],5:[function(require,module,exports){
/*
 * Debug layer for L.TileLayer.Vector
 */
L.TileLayer.Debug = L.TileLayer.Div.extend({

    _requestCount: 0,

    initialize: function (vectorLayer) {
        L.TileLayer.Div.prototype.initialize.call(this, vectorLayer);
    },

    onAdd: function (map) {
        map.on('moveend', this._onMoveend, this);
        L.TileLayer.Div.prototype.onAdd.apply(this, arguments);
    },

    onRemove: function (map) {
        L.TileLayer.Div.prototype.onRemove.apply(this, arguments);
        map.off('moveend', this._onMoveend, this);
    },

    createTile: function (coords) {
        var tile = document.createElement('div'),
            key = this._tileCoordsToKey(coords);

        tile.style.color = 'red';
        tile.style.border = 'solid rgba(255, 0, 0, 1)';
        tile.style.borderWidth = '1px 0 0 1px';
        tile.style.boxSizing = 'border-box';
        tile.style.MozBoxSizing = 'border-box';
        
        tile.innerHTML = [this._getZoomForUrl(), coords.x, coords.y].join('/')
            + '  ' + '(zoom ' + this._map.getZoom() + ', key ' + key + ')';

        return tile;
    },

    onTileRequest: function(key) {
        this._requestCount++;
        console.log('request-start: ' + key + ' - ' + this._requestCount);
    },

    onTileResponse: function(key) {
        this._requestCount--;
        console.log('request-end  : ' + key + ' - ' + this._requestCount);

    },

    onTileRequestAbort: function(key) {
        this._requestCount--;
        console.log('request-abort: ' + key + ' - ' + this._requestCount);
    },

    onTileLoad: function(key) {
        console.log('loaded       : ' + key);
    },

    onTileUnload: function(key) {
        console.log('unload       : ' + key);
    },
    
    _onMoveend: function(evt) {
        console.log('--- update ---');
    }
});


},{}],6:[function(require,module,exports){
L.TileLayer.Div = L.TileLayer.extend({

    initialize: function (vectorLayer) {
        L.TileLayer.prototype.initialize.call(this, null, vectorLayer.options);

        this.vectorLayer = vectorLayer;
    },
            
    onAdd: function (map) {
        this.vectorLayer.on('tileloadstart', this._onTileLoadStart, this);
        this.vectorLayer.on('tilerequest', this._onTileRequest, this);
        this.vectorLayer.on('tileresponse', this._onTileResponse, this);
        this.vectorLayer.on('tilerequestabort', this._onTileRequestAbort, this);
        this.vectorLayer.on('tileerror', this._onTileError, this);
        this.vectorLayer.on('tileload', this._onTileLoad, this);
        this.vectorLayer.on('tileunload', this._onTileUnload, this);
        
        L.TileLayer.prototype.onAdd.apply(this, arguments);
    },
            
    onRemove: function (map) {
        L.TileLayer.prototype.onRemove.apply(this, arguments);

        this.vectorLayer.off('tileloadstart', this._onTileLoadStart, this);
        this.vectorLayer.off('tilerequest', this._onTileRequest, this);
        this.vectorLayer.off('tileresponse', this._onTileResponse, this);
        this.vectorLayer.off('tilerequestabort', this._onTileRequestAbort, this);
        this.vectorLayer.off('tileerror', this._onTileError, this);
        this.vectorLayer.off('tileload', this._onTileLoad, this);
        this.vectorLayer.off('tileunload', this._onTileUnload, this);
    },

    _onTileLoadStart: function(evt) {
        this.onTileLoadStart(evt.tile.key);
    },

    _onTileRequest: function(evt) {
        this.onTileRequest(evt.tile.key);
    },
            
    _onTileResponse: function(evt) {
        this.onTileResponse(evt.tile.key);
    },

    _onTileRequestAbort: function(evt) {
        this.onTileRequestAbort(evt.tile.key);
    },
            
    _onTileError: function(evt) {
        this.onTileError(evt.tile.key);
    },

    _onTileLoad: function(evt) {
        this.onTileLoad(evt.tile.key);
    }, 
            
    _onTileUnload: function(evt) {
        this.onTileUnload(evt.tile.key);
    },
            
    onTileLoadStart: function(key) {},
    onTileRequest: function(key) {},
    onTileResponse: function(key) {},
    onTileRequestAbort: function(key) {},
    onTileError: function(key) {},
    onTileLoad: function(key) {},
    onTileUnload: function(key) {}
});

},{}],7:[function(require,module,exports){
L.TileLayer.Vector = L.TileLayer.extend({
    options: {
        tileRequestFactory: L.tileRequest,
        ajax: L.Request.get,
        // use L.tileCacheNone to turn caching off
        tileCacheFactory: L.tileCache,
        // factory function to create the vector tile layers (defaults to L.GeoJSON)
        layerFactory: L.geoJson,
        // factory function to create a web worker for parsing/preparing tile data
        //workerFactory: L.communistWorker
        workerFactory: L.noWorker
    },

    initialize: function (url, options, vectorOptions) {
        L.TileLayer.prototype.initialize.call(this, url, options);

        this.vectorOptions = vectorOptions || {};

        this._tileRequest = this.options.tileRequestFactory(this, this.options.ajax);
        this._tileCache = this.options.tileCacheFactory();
        // reference to a standalone function that can be stringified for a web worker
        this._parseData = this.options.parseData || L.TileLayer.Vector.parseData;
        this._worker = this.options.workerFactory(this._parseData);
        this._addQueue = new L.TileQueue(L.bind(this._addTileDataInternal, this));
        
    },

    onAdd: function (map) {
        L.TileLayer.prototype.onAdd.call(this, map);

        this.on('tileunload', this._unloadTile);

        // root vector layer, contains tile vector layers as children 
        this.vectorLayer = this._createVectorLayer(); 
        map.addLayer(this.vectorLayer);

        this._worker.onAdd(map);
        this._tileCache.onAdd(map);
    },

    onRemove: function (map) {
        // unload tiles (L.TileLayer only calls _reset in onAdd)
        this._reset();
        map.removeLayer(this.vectorLayer);

        L.TileLayer.prototype.onRemove.call(this, map);

        this.off('tileunload', this._unloadTile);

        this._worker.onRemove(map);
        this._tileCache.onRemove(map);

        this.vectorLayer = null;
    },

    _addTile: function(coords, container) {
        var cached = null;
        this._wrapCoords(coords);
        var key = this._tileCoordsToKey(coords);
        var urlZoom = this._getZoomForUrl();
        var tile = cached = this._tileCache.get(key, urlZoom);
        if (!tile) {
            tile = { key: key, urlZoom: urlZoom, datum: null, loading: true };
        } else {
            tile.loading = true;
        }

        this._tiles[key] = tile;
        this.fire('tileloadstart', {tile: tile});

        if (cached) {
            this._addTileData(tile);
        } else {
            this._loadTile(tile, coords);
        }
    },

    _loadTile: function (tile, coords) {
        var url = this.getTileUrl(coords);
        this._tileRequest.get(url, tile, L.bind(function(err, tile) {
            if (!err) {
                this._addTileData(tile);
            } else {
                this._tileLoaded();
            }
        },this));
    },

    // TODO _tileLoaded replaced by _tileReady + _visibleTilesReady, 
    // but cannot use because tile assumed to be component (L.DomUtil.addClass)?
    _tileLoaded: function () {
        this._tilesToLoad--;

        if (this._tilesToLoad === 0) {
            this.fire('load');
        }
    },

    _createVectorLayer: function() {
        return this.options.layerFactory(null, this.vectorOptions);
    },

    _createTileLayer: function() {
        return this._createVectorLayer();
    },

    _addTileData: function(tile) {
        if (!tile.parsed) {
            this._worker.process(tile, L.bind(function(tile) {
                this._addQueue.add(tile);
            },this));
        } else {
            // from cache
            this._addQueue.add(tile);
        }
    },

    _addTileDataInternal: function(tile) {
        var tileLayer = this._createTileLayer();
        if (!tile.parsed) {
            // when no worker for parsing
            tile.parsed = this._parseData(tile.datum);
            tile.datum = null;
        }
        tileLayer.addData(tile.parsed);
        tile.layer = tileLayer;
        this.vectorLayer.addLayer(tileLayer);

        tile.loading = false;
        this.fire('tileload', {tile: tile});
        this._tileLoaded();
    },

    _unloadTile: function(evt) {
        var tile = evt.tile,
            tileLayer = tile.layer;

        this._tileRequest.abort(tile);

        if (tile.loading) {
            this._addQueue.remove(tile);
            // not from cache or not loaded and parsed yet
            if (!tile.parsed) {
                this._worker.abort(tile);
            }
            this.fire('tileabort', {tile: tile});
            this._tileLoaded();
        }
        if (tileLayer && this.vectorLayer.hasLayer(tileLayer)) {
            this.vectorLayer.removeLayer(tileLayer);
        }

        if (tile.parsed) {
            this._tileCache.put(tile);
        }
    },

    _reset: function() {
        L.TileLayer.prototype._reset.apply(this, arguments);
        this._addQueue.clear();
        this._worker.clear();
    }
});

L.extend(L.TileLayer.Vector, {
    parseData: function(data) {
        return JSON.parse(data);
    }
});

},{}],8:[function(require,module,exports){
L.TileLayer.Overzoom = {
    
    overzoomOptions: {
        // List of available server zoom levels in ascending order. Empty means all  
        // client zooms are available (default). Allows to only request tiles at certain
        // zooms and resizes tiles on the other zooms.
        serverZooms: []
    },

    // override _getTileSize to add serverZooms (when maxNativeZoom is not defined)
    _getTileSize: function() {
        var map = this._map,
            options = this.options,
            zoom = map.getZoom() + options.zoomOffset,
            zoomN = options.maxNativeZoom || this._getServerZoom(zoom);

        // increase tile size when overscaling
        //return zoomN && zoom > zoomN ?
        var tileSize = zoomN && zoom !== zoomN ?
            Math.round(map.getZoomScale(zoom) / map.getZoomScale(zoomN) * options.tileSize) :
            options.tileSize;

        //console.log('tileSize = ' + tileSize + ', zoomOffset = ' + this.options.zoomOffset + ', serverZoom = ' + zoomN + ', zoom = ' + zoom);
        return tileSize;
    },

    _getZoomForUrl: function () {
        var zoom = L.TileLayer.prototype._getZoomForUrl.call(this);
        var result = this._getServerZoom(zoom);
        //console.log('zoomForUrl = ' + result);
        return result;
    },

    // Returns the appropriate server zoom to request tiles for the current zoom level.
    // Next lower or equal server zoom to current zoom, or minimum server zoom if no lower 
    // (should be restricted by setting minZoom to avoid loading too many tiles).
    _getServerZoom: function(zoom) {
        var serverZooms = this.options.serverZooms || [],
            result = zoom;
        // expects serverZooms to be sorted ascending
        for (var i = 0, len = serverZooms.length; i < len; i++) {
            if (serverZooms[i] <= zoom) {
                result = serverZooms[i];
            } else {
                if (i === 0) {
                    // zoom < smallest serverZoom
                    result = serverZooms[0];
                }
                break;
            }
        }
        return result;
    }
};

if (typeof L.TileLayer.Vector !== 'undefined') {
    L.TileLayer.Vector.include(L.TileLayer.Overzoom);
    L.TileLayer.Vector.mergeOptions(L.TileLayer.Overzoom.overzoomOptions);
}

if (typeof L.TileLayer.Div !== 'undefined') {
    L.TileLayer.Div.include(L.TileLayer.Overzoom);
    L.TileLayer.Div.mergeOptions(L.TileLayer.Overzoom.overzoomOptions);
}

},{}],9:[function(require,module,exports){
/*
 * Loading progress info layer for L.TileLayer.Vector
 */
L.TileLayer.Progress = L.TileLayer.Div.extend({
    _adding: false,

    /* key hash of vector tiles currently loading {String: true} */
    _loadingTiles: {},
    
    initialize: function (vectorLayer) {
        L.TileLayer.Div.prototype.initialize.call(this, vectorLayer);
    },

    onAdd: function (map) {
        this._adding = true;
        map.on('layerremove', this._onVectorLayerRemove, this);
        L.TileLayer.Div.prototype.onAdd.apply(this, arguments);
        this._adding = false;
    },

    onRemove: function (map) {
        L.TileLayer.Div.prototype.onRemove.apply(this, arguments);
        this._loadingTiles = {};
    },

    createTile: function (coords) {
         var tile = document.createElement('div'),
            key = this._tileCoordsToKey(coords),
            vectorTile;

        tile.style.backgroundColor = 'rgba(128, 128, 128, 0.3)';
        tile.style.border = '1px solid rgba(128, 128, 128, 0.8)';
        tile.style.boxSizing = 'border-box';
        tile.style.MozBoxSizing = 'border-box';

        L.DomUtil.addClass(tile, 'leaflet-tile-loaded');

        if (!this._loadingTiles[key]) {
            this._hide(tile);
        }

        // check for already loading tiles, because initial tileloadstart
        // events might have been missed when layer is added
        if (this._adding) {
            vectorTile = this.vectorLayer._tiles[key];
            if (vectorTile && vectorTile.loading) {
                this._show(tile);
            }
        }

        return tile;
    },
            
    _tileReady: function (err, tile) {
        // override to disable adding leaflet-tile-loaded class
    },

    _onVectorLayerRemove: function(evt) {
        if (evt.layer === this.vectorLayer) {
            this._hideAll();
        }
    },

    _hideAll: function() {
        for (var key in this._tiles) {
            var tile = this._tiles[key];
            this._hide(tile);
        }
    },

    onTileLoadStart: function(key) {
        var tile = this._tiles[key];
        if (tile) {
            this._show(tile);
        } else {
            this._loadingTiles[key] = true;
        }
    },

    onTileLoad: function(key) {
        var tile = this._tiles[key];
        this._hide(tile);
        delete this._loadingTiles[key];
    },

    onTileUnload: function(key) {
        this.onTileLoad(key);
    },

    onTileError: function(key) {
        var tile = this._tiles[key];
        if (tile) {
            tile.style.backgroundColor = 'rgba(128, 128, 128, 0.7)';
            tile.style.border = 'none';
        }
        delete this._loadingTiles[key];
    },
    
    _show: function(tile) {
        if (tile) {
            tile.classList.add('leaflet-tile-loaded');
        }
    },
    
    _hide: function(tile) {
        if (tile) {
            tile.classList.remove('leaflet-tile-loaded');
        }
    }
});


},{}],10:[function(require,module,exports){
/*
 * Tile layer for unclipped vector tiles where features spanning multiple tiles are contained with
 * their full geometry in each tile (as opposed to clipping geometries at tile boundary).
 * 
 * This layer loads such duplicated features only once by using a 'unique' function given in the options
 * to identify identical features and to keep track of the tiles that are referencing the same feature.
 * 
 * Uses a filter to remove duplicates, so a vector layer set with options.layerFactory must support 
 * feature filtering like in L.GeoJSON.
 */
L.TileLayer.Vector.Unclipped = L.TileLayer.Vector.extend({
    // hash: unique featureKey -> number of tiles referencing the feature
    featureRefCounts: {},
    // hash: unique featureKey -> feature layer
    commonFeatures: {},

    initialize: function (url, options, vectorOptions) {
        L.TileLayer.Vector.prototype.initialize.apply(this, arguments);

        if (!options || !options.unique) {
            console.warn('"unique" function missing in options, deduplicating disabled');
        }
    },

    _createTileLayer: function() {
        var tileLayer = L.TileLayer.Vector.prototype._createTileLayer.apply(this, arguments);
        if (this.options.unique) {
            if (tileLayer.options.filter) {
                tileLayer.options.filter = this._andFilter(tileLayer.options.filter, L.bind(this._filterDuplicates, tileLayer));
            } else {
                tileLayer.options.filter = L.bind(this._filterDuplicates, tileLayer);
            }
            tileLayer._tilingLayer = this;
            // common features this tile is referencing (array of unique feature keys)
            tileLayer._featureRefs = [];
        }
        return tileLayer;
    },

    // filter out duplicate features that are contained in multiple tiles
    // (true keeps, false discards feature)
    _filterDuplicates: function(feature) {
        var featureKey = this._tilingLayer.options.unique(feature);
        var refs = this._tilingLayer.featureRefCounts[featureKey];

        if (refs && refs > 0) {
            refs++;
            this._featureRefs.push(featureKey);
        } else {
            refs = 1;
        }
        this._tilingLayer.featureRefCounts[featureKey] = refs;

        return refs <= 1;
    },
    
    _andFilter: function(filterA, filterB) {
        return function(feature) {
            return filterA(feature) && filterB(feature);
        };
    },
    
    _unloadTile: function(evt) {
        var tileLayer = evt.tile.layer;
        if (tileLayer) {
            if (this.options.unique) {
                this._clearFeatureLayers(tileLayer);
                this._clearCommonFeatureLayers(tileLayer);
            }
        }        
        L.TileLayer.Vector.prototype._unloadTile.apply(this, arguments);
    },
    
    // Remove feature layers from the given tile layer and
    // decrease reference counter for all features of the tile. 
    _clearFeatureLayers: function(tileLayer) {
        tileLayer.eachLayer(function (layer) {
            if (layer.feature) {
                var featureKey = this.options.unique(layer.feature);
                var refs = this._decreaseFeatureRefCount(featureKey);
                if (refs > 0) {
                    // referenced by other tiles, keep feature (move to root vector layer)
                    this.vectorLayer.addLayer(layer);
                    this.commonFeatures[featureKey] = layer;

                    // from removeLayer: remove layer from tileLayer but not from map (not sure if necessary)
                    var id = L.stamp(layer);
                    delete tileLayer._layers[id];
                } else {
                    tileLayer.removeLayer(layer);
                }
            }
        }, this);
    },

    // Remove common features that are only referenced by the given tile
    _clearCommonFeatureLayers: function(tileLayer) {
        var featureRefs = tileLayer._featureRefs;
        for (i = 0, len = featureRefs.length; i < len; i++) {
            var featureKey = featureRefs[i];
            var refs = this._decreaseFeatureRefCount(featureKey);
            if (refs <= 0) {
                var layer = this.commonFeatures[featureKey];
                if (layer) {
                    this.vectorLayer.removeLayer(layer);
                }
            }
        }
    },

    _decreaseFeatureRefCount: function(featureKey) {
        var refs = --this.featureRefCounts[featureKey];
        if (refs <= 0) {
            delete this.featureRefCounts[featureKey];
        }
        return refs;
    }
});

},{}],11:[function(require,module,exports){
L.TileQueue = function(callback) {
    this.callback = callback;
};

L.TileQueue.prototype = {

    _queue: [],
    _queueTimeout: null,
    
    add: function(aTile) {
        this._queue.push(aTile);
        if (!this._queueTimeout) {
            this._queueTimeout = setTimeout(L.bind(function(){
                var time, timeout, start = +new Date, tile;

                // handle empty elements, see remove
                do { 
                    tile = this._queue.shift();
                }
                while (!tile && this._queue.length > 0);

                if (tile) {
                    //console.log('adding ' + tile.key + ' ...');

                    this.callback(tile);

                    // pause a percentage of adding time to keep UI responsive
                    time = +new Date - start;
                    timeout = Math.floor(time * 0.3);
                    //console.log('added  ' + tile.key + ' (' + time + 'ms > ' + timeout + 'ms)');
                    this._queueTimeout = setTimeout(L.bind(arguments.callee, this), timeout);
                } else {
                    this._queueTimeout = null;
                }
            }, this), 0);
        }
    },

    remove: function(tile) {
        var key = tile.key, 
            val;
        for (var i = 0, len = this._queue.length; i < len; i++) {
            val = this._queue[i];
            if (val && val.key === key) {
                //console.log('##### delete ' + key);
                // set entry to undefined only for better performance (?) - 
                // queue consumer needs to handle empty entries!
                delete this._queue[i];
            }
        }
    },

    clear: function() {
        if (this._queueTimeout) {
            clearTimeout(this._queueTimeout);
            this._queueTimeout = null;
        }
        this._queue = [];
    }
};
},{}],12:[function(require,module,exports){
L.TileRequest = function(layer, ajax) {
    this._layer = layer;
    this._ajax = ajax;
};

L.TileRequest.prototype = {
    get: function (url, tile, done) {
        this._layer.fire('tilerequest', {tile: tile});
        tile._request = this._ajax(url, this._xhrHandler(tile, done));
    },

    // XMLHttpRequest handler; closure over the XHR object, the layer, and the tile
    _xhrHandler: function (tile, done) {
        return L.bind(function(err, data) {
            if (!err) {
                // check if request is about to be aborted, avoid rare error when aborted while parsing
                if (tile._request) {
                    tile._request = null;
                    this._layer.fire('tileresponse', {tile: tile});
                    tile.datum = data;
                    done(null, tile);
                }
            } else {
                tile.loading = false;
                tile._request = null;

                this._layer.fire('tileerror', {tile: tile});
                done(err, tile);
            }
        }, this);
    },

    abort: function(tile) {
        var req = tile._request;
        if (req) {
            tile._request = null;
            req.abort();
            this._layer.fire('tilerequestabort', {tile: tile});
        }
    }
};

L.tileRequest = function(layer, ajax) {
    return new L.TileRequest(layer, ajax);
};

},{}],13:[function(require,module,exports){
// npm/browserify
// no explicit exports, as classes add themselves to 
// the global Leaflet package structure 
require('./AbstractWorker.js');
require('./TileCache.js');
require('./TileQueue.js');
require('./Request.js');
require('./TileRequest.js');
require('./TileLayer.GeoJSON.js');
require('./TileLayer.Vector.Unclipped.js');
require('./TileLayer.Div.js');
require('./TileLayer.Progress.js');
require('./TileLayer.Debug.js');
require('./TileLayer.Overzoom.js');
require('./Leaflet.label-patch.js');

},{"./AbstractWorker.js":1,"./Leaflet.label-patch.js":2,"./Request.js":3,"./TileCache.js":4,"./TileLayer.Debug.js":5,"./TileLayer.Div.js":6,"./TileLayer.GeoJSON.js":7,"./TileLayer.Overzoom.js":8,"./TileLayer.Progress.js":9,"./TileLayer.Vector.Unclipped.js":10,"./TileQueue.js":11,"./TileRequest.js":12}]},{},[13])
;
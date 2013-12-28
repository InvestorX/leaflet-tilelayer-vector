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


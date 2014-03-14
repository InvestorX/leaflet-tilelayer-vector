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
        this.vectorLayer.on('loading', this.onLoading, this);
        this.vectorLayer.on('load', this.onLoad, this);
        L.TileLayer.Div.prototype.onAdd.apply(this, arguments);
    },

    onRemove: function (map) {
        L.TileLayer.Div.prototype.onRemove.apply(this, arguments);
        map.off('moveend', this._onMoveend, this);
        this.vectorLayer.off('loading', this.onLoading, this);
        this.vectorLayer.off('load', this.onLoad, this);
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
        console.log('loaded       : ' + key + ' - ' + this.vectorLayer._tilesToLoad 
            + this._getUnclippedStats());
    },

    onTileUnload: function(key) {
        console.log('unload       : ' + key + this._getUnclippedStats());
    },

    _onMoveend: function(evt) {
        console.log('--- update ---');
    },
    
    onLoading: function() {
        console.log('--- loading ---');
        if (console.time) {
            console.time('load');
        }
    },

    onLoad: function() {
        if (console.time) {
            console.timeEnd('load');
        } else {
            console.log('--- load ---');
        }
    },

    _getUnclippedStats: function() {
        var s = '';
        if (this.vectorLayer.featureRefCounts && this.vectorLayer.commonFeatures) {
            s += ' - refs = ' + Object.keys(this.vectorLayer.featureRefCounts).length;
            s += ', commons = ' + Object.keys(this.vectorLayer.commonFeatures).length;
            s += ', layers = ' + Object.keys(this.vectorLayer.vectorLayer._layers).length;
        }
        return s;
    }
});


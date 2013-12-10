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


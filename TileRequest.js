L.TileRequest = function(layer, ajax) {
    this._layer = layer;
    this._ajax = ajax;
};

L.TileRequest.prototype = {
    process: function (tile, done) {
        this._layer.fire('tilerequest', {tile: tile});
        tile._request = this._ajax(tile.url, this._xhrHandler(tile, done));
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

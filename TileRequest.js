L.TileRequest = function(evented, ajax) {
    this._evented = evented;
    this._ajax = ajax;
};

L.TileRequest.prototype = {
    process: function (tile, done) {
        this._evented.fire('tilerequest', {tile: tile});
        tile._request = this._ajax(tile.url, this._xhrHandler(tile, done));
    },

    // XMLHttpRequest handler; closure over the XHR object, the layer, and the tile
    _xhrHandler: function (tile, done) {
        return L.bind(function(err, data) {
            if (!err) {
                // check if request is about to be aborted, avoid rare error when aborted while parsing
                if (tile._request) {
                    tile._request = null;
                    this._evented.fire('tileresponse', {tile: tile});
                    tile.datum = data;
                    done(null, tile);
                }
            } else {
                tile.loading = false;
                tile._request = null;

                this._evented.fire('tileerror', {tile: tile});
                done(err, tile);
            }
        }, this);
    },

    abort: function(tile) {
        var req = tile._request;
        if (req) {
            tile._request = null;
            req.abort();
            this._evented.fire('tilerequestabort', {tile: tile});
        }
    }
};

L.tileRequest = function(evented, ajax) {
    return new L.TileRequest(evented, ajax);
};

// dummy request (= no request)
L.noRequest = function () {
    return {
        process: function (tile, done) {
            return done(null, tile);
        },
        abort: function() {}
    };
};

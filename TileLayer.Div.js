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

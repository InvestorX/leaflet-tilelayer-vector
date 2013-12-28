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

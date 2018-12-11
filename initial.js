(function(callback) {
    let track_id = null;
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    function getCookie(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length === 2) {
            return parts.pop().split(";").shift();
        }
    }

    track_id = getCookie("szl_uuid")
    if (!track_id) {
        track_id = generateUUID();
        document.cookie = "szl_uuid=" + track_id + ";domain=.sezzle.com;path=/";
    }
})(function(track_id) {
    var el = document.createElement('script');
    el.src = 'https://widget.sezzle.com/v1/javascript/price-widget?uuid=' + document.sezzleConfig["merchantID"] + '&fingerprint=' + fingerprint
    document.getElementsByTagName('head')[0].appendChild(el);
});
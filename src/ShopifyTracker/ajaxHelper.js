exports.ajaxHelper = function (method, url, callback, data) {
    var ajax = new XMLHttpRequest();

    ajax.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            callback(JSON.parse(ajax.response));
        }
    };

    ajax.open(method, url, data, true);
    ajax.send();
};
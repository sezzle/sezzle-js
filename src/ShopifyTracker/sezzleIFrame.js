exports.sezzleIFrame = function () {
    window.addEventListener('message', function(event) {
        if (event.origin === "https://tracking.sezzle.com" && event.data.trackId) {
            var trackID = event.data.trackId;
            var el = document.createElement('script');
            el.src = 'https://widget.sezzle.com/v1/javascript/price-widget?uuid=7ec5dd6f-abfa-4a08-9aff-ad8f58267e7e&track_id='+trackID;
            document.getElementsByTagName('head')[0].appendChild(el);
        }
    })
    var sz_iframe = document.createElement('iframe');
    sz_iframe.width = 0;
    sz_iframe.height = 0;
    sz_iframe.style.display = 'none';
    sz_iframe.style.visibility = 'hidden';
    sz_iframe.name='szl';
    sz_iframe.src = 'https://tracking.sezzle.com';
    var count = 0;
    function renderSezzleIframe() {
        setTimeout(function() {
            if (count >= 20) {
                return;
            }
            if (document.body) {
                document.body.appendChild(sz_iframe);
            } else {
                count++;
                renderSezzleIframe();
            }
        }, 100);
    }
    renderSezzleIframe();
}
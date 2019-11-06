exports.sezzleIFrame = new Promise (function (resolve) {
    if (!window.frames.szl) {
        var sz_iframe = document.createElement('iframe');
        sz_iframe.width = 0;
        sz_iframe.height = 0;
        sz_iframe.style.display = 'none';
        sz_iframe.style.visibility = 'hidden';
        sz_iframe.name='szl';
        sz_iframe.onload = () => resolve(sz_iframe);
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
});

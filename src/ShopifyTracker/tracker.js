var helper = require('./ajaxHelper');
var sezzleIFrame = require('./sezzleIFrame');

var currentURL = window.location.href;

var shopifyTracker = (function () {
    function trackCollectionsPage () {
        logEvent('shopify-tracker-collection');
    }

    function trackProductPage () {
        logEvent('shopify-tracker-product');
    }

    function trackCartPage () {
        // Cart Payload to log
        var createPayload = function (response){
            var payload = {
                total_price: response.total_price,
                items: response.items
            };
            logEvent('shopify-tracker-cart', payload);
        };

        helper.ajaxHelper('GET', currentURL + '.js', createPayload);
    };

    function trackPaymentPage () {
        var cachePaymentNode = document.querySelector('.section--payment-method');
        if (cachePaymentNode) {
            cachePaymentNode.addEventListener('click', function (event) {
                console.log(event.target)
            });
        }
    };

    function trackSuccessPage () {

    };

    function trackFailurePage () {
         
    };

    function logEvent (eventName, payload) {
        var win = window.frames.szl;
        if (win) {
            setTimeout(function () {
                win.postMessage({
                    event_name: eventName,
                    page_url: window.location.href,
                    payload: payload
                }, 'https://tracking.sezzle.com')
            }, 100);
        }
    };

    return {
        trackCollections: trackCollectionsPage,
        trackProduct: trackProductPage,
        trackCart: trackCartPage,
        trackPayment: trackPaymentPage,
        trackSuccess: trackSuccessPage,
        trackFailure: trackFailurePage
    }
})();


sezzleIFrame.sezzleIFrame();
if (typeof(Shopify) === 'object' && Object.keys(Shopify).length > 0) {
    if (/cart/.test(currentURL)) shopifyTracker.trackCart();
    if (/collection/.test(currentURL)) shopifyTracker.trackCollections();
    if (/product/.test(currentURL)) shopifyTracker.trackProduct();
    if (/payment_method/.test(currentURL)) shopifyTracker.trackPayment();
}
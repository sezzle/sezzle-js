const helper = require('./ajaxHelper');
const sezzleIFrame = require('./sezzleIFrame');

const currentURL = window.location.href;

const shopifyTracker = (function () {
    const trackCollections = () => {
        logEvent('merchant-page-visit');
    }

    const trackProduct = () => {
        logEvent('merchant-track-product');
    }

    const trackCart = () => {
        // Cart Payload to log
        let createPayload = (response) => {
            let payload = {
                total_price: response.total_price,
                items: response.items
            };
            logEvent('merchant-cart-details', payload);
        };

        helper.ajaxHelper('GET', currentURL + '.js', createPayload);
    };

    const trackPayment = () => {
        var cachePaymentNode = document.querySelector('.section--payment-method');
        if (cachePaymentNode) {
            cachePaymentNode.addEventListener('click', function (event) {});
        }
    };

    const trackSuccess = () => {
        logEvent('merchant-checkout-complete');
    };

    const trackFailure = () => {
         
    };

    const logEvent = (event_name, payload) => {
        var win = window.frames.szl;
        const page_url = window.location.href;

        if (win) {
            setTimeout(() => {
                win.postMessage({ event_name, page_url, payload }, 'https://tracking.sezzle.com')
            }, 100);
        }
    };

    return {
        trackCollections,
        trackProduct,
        trackCart,
        trackPayment,
        trackSuccess,
        trackFailure
    }
})();

if (typeof(Shopify) === 'object' && Object.keys(Shopify).length > 0 && Shopify.shop) {
    sezzleIFrame.sezzleIFrame.then(success => {
        if (/collection/.test(currentURL)) shopifyTracker.trackCollections();
        if (/thank_you/.test(currentURL)) shopifyTracker.trackSuccess();

        //TODO: if (/cart/.test(currentURL)) window.addEventListener('unload', shopifyTracker.trackCart());
        //TODO: if (/product/.test(currentURL)) shopifyTracker.trackProduct();
        //TODO: if (/payment_method/.test(currentURL)) shopifyTracker.trackPayment();
    });
}

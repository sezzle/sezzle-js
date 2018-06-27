// Work around to enable Sezzle widgets to be dynamic and react to DOM changes in Shopify checkout

(function() {
    // always the case for Shopify checkout pages
    var currentPriceElementText = document.querySelector(".payment-due__price") ? document.querySelector(".payment-due__price").innerText : null
    
    // the most specific element possible which does not unmount from the DOM when
    // the price element changes due to gift cards or discount codes
    // this element always exists in Shopify checkout pages
    const mutationTarget = document.querySelector(".order-summary__sections")

    // only listen for changes to the direct child nodes
    const observerConfig = {
        attributes: false,
        childList: true,
        subtree: false
    }

    const mutationHandler = function(mutations) {
        // check whether the price text has changed on the price element
        var priceElement = document.querySelector(".payment-due__price")

        if (priceElement) {
            // check if there is any change in the inner text of the price element
            if (priceElement.innerText !== currentPriceElementText) {
                var sezzleWidget = document.querySelector(".sezzle-shopify-info-button")
                if (sezzleWidget) {
                    // remove the widget
                    sezzleWidget.remove()
                }
                //rerender the widget (assumes SezzleJS and document.sezzleConfig is present)
                new SezzleJS(document.sezzleConfig).init()
                //update the current price text
                currentPriceElementText = priceElement.innerText
            }
        }
    }

    // initiate a MutationObserver instance
    const observer = new MutationObserver(mutationHandler)
    // start observation
    observer.observe(mutationTarget, observerConfig)
})()
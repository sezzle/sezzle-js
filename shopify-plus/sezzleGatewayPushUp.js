// Places the Sezzle payment gateway option in Shopify checkout right below the Credit Card payment option

(function() {
    // if jQuery is defined
    if ($) {
        var sezzleGateway = $('div[data-select-gateway]:contains("Sezzle")').first()
        var sezzleSubfields = $('div[data-subfields-for-gateway]:contains("Sezzle")').first()
        var cardSubfields = $('div[data-subfields-for-gateway]:contains("Card")').first()
        if (sezzleGateway && sezzleSubfields && cardSubfields) {
            sezzleGateway.detach().insertAfter(cardSubfields)
            sezzleSubfields.detach().insertAfter(sezzleGateway)
        }
    }
    else {
        // get sezzle gateway element
        var sezzleGateway = null
        var paymentGateways = document.querySelectorAll("[data-select-gateway]")
        if (paymentGateways) {
            Array.prototype.forEach.call(paymentGateways, function(value) {
                if (value.innerText.indexOf("Sezzle") !== -1) {
                    sezzleGateway = value
                }
            })
        }

        // get sezzle subfields and card subfields elements
        var sezzleSubfields = null
        var cardSubfields = null
        var paymentSubfields = document.querySelectorAll("[data-subfields-for-gateway]")
        if (paymentSubfields) {
            Array.prototype.forEach.call(paymentSubfields, function(value) {
                if (value.innerText.indexOf("Sezzle") !== -1) {
                    sezzleSubfields = value
                }
                else if (value.innerText.indexOf("Card") !== -1) {
                    cardSubfields = value
                }
            })
        }

        if (sezzleGateway && sezzleSubfields && cardSubfields) {
            // remove sezzle gateway and sezzle subfields temporarily
            sezzleGateway.remove()
            sezzleSubfields.remove()

            // append them right below credit card subfields
            if(cardSubfields.nextElementSibling) {
                cardSubfields.parentNode.insertBefore(sezzleGateway, cardSubfields.nextElementSibling)
                sezzleGateway.parentNode.insertBefore(sezzleSubfields, sezzleGateway.nextElementSibling)
            }
            else {
                cardSubfields.parentNode.appendChild(sezzleGateway)
                sezzleGateway.parentNode.appendChild(sezzleSubfields)
            }
        }
    }
})()

/**
 *
 * @param options All widget options
 */
var SezzleJS = function(options) {
  // Configurable options
  this.xpath = options.targetXPath ? options.targetXPath.split('/') : null;
  this.forcedShow = options.forcedShow || false;
  this.alignment = options.alignment || '';
  this.merchantID = options.merchantID || '';
  this.theme = options.theme || '';
  this.widthType = options.widthType || '';
  this.widgetType = options.widthType || 'product';
  this.minPrice = options.minPrice || 0;
  this.maxPrice = options.maxPrice || 100000;
  this.imageUrl = options.imageUrl || 'https://d3svog4tlx445w.cloudfront.net/branding/sezzle-logos/png/sezzle-logo-sm-100w.png';

  // Non configurable options
  this._config = { attributes: true, childList: true, characterData: true };
  // URL to request to get ip of request
  this.countryFromIPRequestURL = 'https://freegeoip.net/json/';
  // URL to request to get css details
  this.cssForMerchantURL = 'https://widget.sezzle.com/v1/css/price-widget?uuid=' + this.merchantID;
  // Countries supported by sezzle pay. To test your country, add here.
  this.supportedCountryCodes = ['US', 'IN'];

  // Variables set by the js
  this.countryCode = null;
}

/**
 * This function fetches all the elements that has price in it based on the given x-path
 * @param xindex - Current xpath index value to be resolved [initial value is always 0]
 * @param elements - Array of current elements to be resolved [initial value is always null]
 *
 * @return All the elements with price in it that matches the xpath
 */
SezzleJS.prototype.getAllPriceElements = function(xindex = 0, elements = null) {
  // Break condition
  if (xindex === this.xpath.length) {
    return elements;
  }

  // Intialy when elements is null
  // We give document to it
  if (elements === null) {
    elements = [document];
  }
  var children = [];
  for(var elemnt of Array.from(elements)) {
    // If this is an ID
    if (this.xpath[xindex][0] === '#') {
      children.push(elemnt.getElementById(this.xpath[xindex].substr(1)));
    } else
    // If this is a class
    if (this.xpath[xindex][0] === '.') {
      Array.from(
        elemnt.getElementsByClassName(this.xpath[xindex].substr(1))
      )
      .forEach(function(el) {
          children.push(el);
      })
    } else
    // If this is a tag
    {
      var indexToTake = 0;
      if (this.xpath[xindex].split('-').length > 1) {
        if (this.xpath[xindex].split('-')[1] >= 0) {
          indexToTake = parseInt(this.xpath[xindex].split('-')[1]);
        }
      }
      Array.from(
        elemnt.getElementsByTagName(this.xpath[xindex].split('-')[0])
      )
      .forEach(function(el, index) {
          if (index === indexToTake) children.push(el);
      });
    }
  }
  children = children.filter(function(c) {return c !== null});
  return this.getAllPriceElements(xindex + 1, children);
}

/**
 * This is helper function for formatPrice
 * @param n char value
 * @return boolean [if it's numeric or not]
 */
SezzleJS.prototype.isNumeric = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * This is helper function for formatPrice
 * @param n char value
 * @return boolean [if it's alphabet or not]
 */
SezzleJS.prototype.isAlpha = function(n) {
  return /^[a-zA-Z()]+$/.test(n);
}

/**
 * This function will format the price
 * @param price - string value
 * @return float
 */
SezzleJS.prototype.parsePrice = function(price) {
  return parseFloat(this.parsePriceString(price, false));
}

/**
 * This function will return the price string
 * @param price - string value
 * @param includeComma - comma should be added to the string or not
 * @return string
 */
SezzleJS.prototype.parsePriceString = function(price, includeComma) {
  var formattedPrice = '';
  for (var i = 0; i < price.length; i++) {
    if (this.isNumeric(price[i]) || price[i] == '.' || (includeComma && price[i] == ',')) {
      // If current is a . and previous is a character, it can be something like Rs.
      // so ignore it
      if (i > 0 && price[i] == '.' && this.isAlpha(price[i - 1])) continue;
      formattedPrice += price[i];
    }
  }
  return formattedPrice;
}

/**
 * This function loads up CSS dynamically to clients page
 * @return void
 */
SezzleJS.prototype.loadCSS = function(callback) {
  this.getCSSVersionForMerchant(function(version) {
    var head = document.head;
    var link = document.createElement('link');
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.href = 'https://d3svog4tlx445w.cloudfront.net/shopify-app/assets/' + version + '';
    head.appendChild(link);
    link.onload = callback;
  }.bind(this));
}

/**
 * Add CSS alignment class as required
 * @param element Element to add to
 */
SezzleJS.prototype.addCSSAlignment = function(element) {
  switch(this.alignment) {
    case 'left':
      element.className += " sezzle-left";
      break;
    case 'right':
      element.className += " sezzle-right";
      break;
    default:
      break;
  }
}

/**
 * Add CSS width class as required
 * @param element Element to add to
 */
SezzleJS.prototype.addCSSWidth = function(element) {
  switch(this.widthType) {
    case 'thin':
      element.className += " sezzle-thin";
      break;
    default:
      break;
  }
}

/**
 * Add CSS theme class as required
 * @param element Element to add to
 */
SezzleJS.prototype.addCSSTheme = function(element) {
  switch(this.theme) {
    case 'dark':
      element.className += " szl-dark";
      break;
    default:
      element.className += " szl-light";
      break;
  }
}

/**
 * Add CSS customisation class as required
 * @param element Element to add to
 */
SezzleJS.prototype.addCSSCustomisation = function(element) {
  this.addCSSAlignment(element);
  this.addCSSWidth(element);
  this.addCSSTheme(element);
}

/**
 * Insert css class name in element
 * @param element to add class to
 */
SezzleJS.prototype.insertStoreCSSClassInElement = function(element) {
  element.className += " sezzle-" + this.merchantID;
}

/**
 * Insert css class name in element
 * @param element to add class to
 */
SezzleJS.prototype.insertWidgetTypeCSSClassInElement = function(element) {
  switch (this.widgetType) {
    case 'cart':
      element.className += " sezzle-cart-page-widget";
      break;
    case 'product-page':
      element.className += " sezzle-product-page-widget"
      break;
    case 'product-preview':
      element.className += " sezzle-product-preview-widget"
      break;
    default:
      element.className += " sezzle-product-page-widget"
      break;
  }
}

/**
 * This function will set Sezzle's elements with
 * the price element in parallel
 * @param element - This is the price element
 * @param index - Index of the element in the page
 * @return void
 */
SezzleJS.prototype.renderAwesomeSezzle = function(element, index = 0) {
  // Do not render this product if it is not eligible
  if (!this.isProductEligible(element.innerText)) return false;
  // Set data index to each price element for tracking
  element.dataset.sezzleindex = index;

  // Get parent element
  var parent = element.parentElement;

  // root node for sezzle
  var sezzle = document.createElement('div');
  sezzle.className = "sezzle-shopify-info-button"
  this.insertWidgetTypeCSSClassInElement(sezzle);
  this.insertStoreCSSClassInElement(sezzle);

  // node level - 1
  var node = document.createElement("div");
  node.className = "sezzle-checkout-button-wrapper";
  this.insertStoreCSSClassInElement(node);
  this.addCSSAlignment(node);

  // price node level - 1.1
  var priceNode = document.createElement("div");
  priceNode.className = "sezzle-button-text";
  this.addCSSAlignment(priceNode);

  // price text node level - 1.1.1
  var priceText = document.createTextNode("or 4 automatic, interest free payments");

  // Adding priceText node to priceNode level - 1.1
  priceNode.appendChild(priceText);

  // price value span node level - 1.1.1
  var priceSpanNode = document.createElement("span");
  priceSpanNode.className = "payment-amount sezzleindex-" + index;


  // price value text node level - 1.1.1.1
  var priceValueText = document.createTextNode(
    ' of ' + this.getFormattedPrice(element.innerText)
  );

  // Adding price value to priceSpanNode - level - 1.1.2
  priceSpanNode.appendChild(priceValueText)

  // Adding priceSpanNode to priceNode level - 1.1
  priceNode.appendChild(priceSpanNode);

  // Adding priceNode to main node level - 1
  node.appendChild(priceNode);

  // Logo node level - 1.1
  var logoNode = document.createElement("div");
  logoNode.className = "sezzle-checkout-button";
  this.addCSSCustomisation(logoNode);

  // Loge node first child level - 1.1.1
  var logoNode1 = document.createElement("div");
  logoNode1.className = "sezzle-inline-text";

  // Logo node first child text - 1.1.1.1
  var logoNode1Text = document.createTextNode('with ');
  logoNode1Text.className = "sezzle-inline-text"
  logoNode1.appendChild(logoNode1Text); // 1.1.1

  // Add logeNode1 to logoNode level - 1.1
  logoNode.appendChild(logoNode1);

  // Logo node second child level - 1.1.2
  var logoNode2 = document.createElement("img");
  logoNode2.className = "szl-light-image";
  logoNode2.src = this.imageUrl;

  // Add logeNode1 to logoNode level - 1.1
  logoNode.appendChild(logoNode2);

  // Loge node first child level - 1.1.4
  var logoNode4 = document.createElement("div");
  logoNode4.className = "sezzle-know-more";

  // Logo node first child text - 1.1.4.1
  var logoNode4Text = document.createTextNode(' Learn more');
  logoNode4.appendChild(logoNode4Text); // 1.1.4

  // Add logeNode1 to logoNode level - 1.1
  logoNode.appendChild(logoNode4);

  // Adding logoNode to main node
  node.appendChild(logoNode);

  // Adding main node to sezzel node
  sezzle.appendChild(node);

  // Adding sezzle to parent node
  this.insertAfter(sezzle, parent);
}

/**
 * Insert child after a given element
 * @param el Element to insert
 * @param referenceNode Element to insert after
 */
SezzleJS.prototype.insertAfter = function(el, referenceNode) {
  referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

/**
 * Is the product eligible for sezzle pay
 * @param price Price of product
 */
SezzleJS.prototype.isProductEligible = function(priceText) {
  var price = this.parsePrice(priceText);
  var priceInCents = price * 100;
  if (price >= this.minPrice && price <= this.maxPrice) {
    return true;
  } else {
    return false;
  }
}

/**
 * Formats a price as Sezzle needs it
 * @param priceText Complete price test Eg: $120.00 USD
 */
SezzleJS.prototype.getFormattedPrice = function(priceText) {
  // Get the price string - useful for formtting Eg: 120.00(string)
  var priceString = this.parsePriceString(priceText, true);

  // Get the price in float from the element - useful for calculation Eg : 120.00(float)
  var price = this.parsePrice(priceText);

  // Will be used later to replace {price} with price / 4.0 Eg: ${price} USD
  var formatter = priceText.replace(priceString, '{price}');

  // get the sezzle instalment price
  var sezzleInstalmentPrice = (price / 4.0).toFixed(2);

  // format the string
  var sezzleInstalmentFormattedPrice = formatter.replace('{price}', sezzleInstalmentPrice);

  return sezzleInstalmentFormattedPrice;
}

/**
 * Mutation observer
 * This observer observes for any change in a
 * given DOM element (Price element in our case)
 * and act on that
 */
SezzleJS.prototype.observer = new MutationObserver(function(mutations) {
  mutations
    .filter(function(mutation) { return mutation.type === 'childList' })
    .forEach(function(mutation) {
      var priceIndex = mutation.target.dataset.sezzleindex;
      var s = new SezzleJS(document.sezzleConfig);
      var price = s.getFormattedPrice(mutation.target.innerText);
      delete s;
      document.getElementsByClassName('sezzleindex-' + priceIndex)[0]
        .innerText = ' of ' + price;
    });
});

/**
 * This function starts observing for change
 * in given Price element
 * @param element to be observed
 * @return void
 */
SezzleJS.prototype.startObserve = function(element) {
  // TODO : Need a way to unsubscribe to prevent memory leak
  this.observer.observe(element, this._config);
}

/**
 * This function renders the Sezzle modal
 * Also adds the event for open and close modals
 * to respective buttons
 */
SezzleJS.prototype.renderModal = function() {
  if (!document.getElementsByClassName('sezzle-checkout-modal-lightbox').length) {
    var modalNode = document.createElement('div');
    modalNode.className = "sezzle-checkout-modal-lightbox close-sezzle-modal";
    modalNode.style.display = 'none';
    modalNode.innerHTML = '<div class="sezzle-checkout-modal sezzle-checkout-modal-hidden"><div class="sezzle-no-thanks close-sezzle-modal">x</div><div class="sezzle-modal-title"><div class="sezzle-title-text-left">How does</div><img class="sezzle-modal-logo" src="https://sezzlemedia.s3.amazonaws.com/branding/sezzle-logos/sezzle-logo.svg"><div class="sezzle-title-text-right">work?</div></div><div class="sezzle-header-text">We have partnered with Sezzle to give you the ability to Buy Now and Pay Later.</div><div class="sezzle-sub-header-text"></div><div class="sezzle-modal-flex"><div class="sezzle-modal-half"><img src="https://d3svog4tlx445w.cloudfront.net/shopify-app/assets/cal2.png"><p><b>Simple Installments</b> Sezzle splits your purchase into 4 automatic installments. Only 25% is due today. The remaining installments occur every 2 weeks.</p></div><div class="sezzle-modal-half"><img src="https://d3svog4tlx445w.cloudfront.net/shopify-app/assets/time2.png"><p><b>Quick and Easy</b> It takes only 1-2 minutes to checkout with Sezzle the first time. Future checkouts take seconds.</p></div></div><div class="sezzle-simply-select"><div class="sezzle-inline-text-left">Just select</div><img src="https://sezzlemedia.s3.amazonaws.com/branding/sezzle-logos/sezzle-logo.svg"><div class="sezzle-inline-text-right">at checkout.</div></div><div class="sezzle-footer-text">Subject to approval. Estimated payment amount excludes taxes and shipping fees. Your actual installment payments will be presented for confirmation in your checkout with Sezzle.</div></div>';
    document.getElementsByTagName('html')[0].appendChild(modalNode);

    // Event listenr for click in know more button
    Array.from(document.getElementsByClassName('sezzle-know-more'))
      .forEach(function(el) {
        el.addEventListener('click', function() {
          // Show modal node
          modalNode.style.display = 'block';
          // Remove hidden class to show the item
          modalNode.getElementsByClassName('sezzle-checkout-modal')[0].className = "sezzle-checkout-modal";
        })
      });
    // Event listenr for close in modal
    document.getElementsByClassName('close-sezzle-modal')[0]
      .addEventListener('click', function() {
        // Display the modal node
        modalNode.style.display = 'none';
        // Add hidden class hide the item
        modalNode.getElementsByClassName('sezzle-checkout-modal')[0].className = "sezzle-checkout-modal sezzle-checkout-modal-hidden";
      });
  }
}

/**
 * This function will return the ISO 3166-1 alpha-2 country code
 * from the user's IP
 * @param callback what happens after country is received
 */
SezzleJS.prototype.getCountryCodeFromIP = function(callback) {
  // make request
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) {
        var body = httpRequest.response;
        this.countryCode = body.country_code;
        callback(this.countryCode);
      }
    }
  };

  httpRequest.open('GET', this.countryFromIPRequestURL);
  httpRequest.responseType = 'json';
  httpRequest.send();
}

/**
 * This function will fetch the css file version to use for given merchant
 * @param callback What to do with the css version received
 */
SezzleJS.prototype.getCSSVersionForMerchant = function(callback) {
  // make request
  if (document.sezzleCssVersionOverride !== undefined) {
    callback(document.sezzleCssVersionOverride);
  } else {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
      if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 200) {
          var body = httpRequest.response;
          callback(body.version);
        }
      }
    };
  
    httpRequest.open('GET', this.cssForMerchantURL);
    httpRequest.responseType = 'json';
    httpRequest.send();
  }
}

/**
 * Initialise the widget if the
 * country is supported or the widget
 * is forced to be shown
 */
SezzleJS.prototype.init = function() {
  // Check if the widget should be shown
  if (this.forcedShow) {
    // show the widget
    this.initWidget();
  } else {
    // get the country and show the widget if supported
    this.getCountryCodeFromIP(function(countryCode) {
      if (this.supportedCountryCodes.indexOf(countryCode) !== -1) {
        this.initWidget();
      }
    }.bind(this));
  }
}

/**
 * All steps required to show the widget
 */
SezzleJS.prototype.initWidget = function() {
  this.loadCSS(function() {
      var els = this.getAllPriceElements();
      els.forEach(function (el, index) {
        this.renderAwesomeSezzle(el, index);
        this.startObserve(el);
      }.bind(this));
      this.renderModal();
    }.bind(this)
  );
}

// Assumes document.sezzleConfig is present
window.onload = new SezzleJS(document.sezzleConfig).init();
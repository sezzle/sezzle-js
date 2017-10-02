
/**
 *
 * @param {Array of path to the price tag (example: ['.price-class', '#product-price', 'span'])} targetXPath
 */
var SezzleJS = function(targetXPath = '', forcedShow = false) {
  // Configurable options
  this.xpath = targetXPath.split('/');
  this.forcedShow = forcedShow
  
  // Non configurable options
  this._config = { attributes: true, childList: true, characterData: true };
  // URL to request to get ip of request
  this.countryFromIPRequestURL = 'https://freegeoip.net/json/';
  // Countries supported by sezzle pay. To test your country, add here. Don't commit.
  this.supportedCountryCodes = ['US'];

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
 * This function will format the price
 * @param price - string value
 * @return float
 */
SezzleJS.prototype.parsePrice = function(price) {
  var formattedPrice = '';
  for (var i = 0; i < price.length; i++) {
    if (this.isNumeric(price[i]) || price[i] == '.') {
      formattedPrice += price[i];
    }
  }
  return parseFloat(formattedPrice);
}

/**
 * This function loads up CSS dynamically to clients page
 * @return void
 */
SezzleJS.prototype.loadCSS = function() {
  // Check if the CSS is already there
  var links = document.getElementsByTagName('link');

  var url = 'https://d3svog4tlx445w.cloudfront.net/shopify-app/assets/sezzle-shopify-styles-global0.1.120.css';
  if (!Array.from(links).find(function(link) {
    return link.href === url;
  })) {
    var link = document.createElement( "link" );
    link.href = url;
    link.type = "text/css";
    link.rel = "stylesheet";
    link.media = "screen,print";
    document.getElementsByTagName( "head" )[0].appendChild( link );
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
  // Set data index to each price element for tracking
  element.dataset.sezzleindex = index;

  // Get the price from the element
  var price = this.parsePrice(element.innerHTML);

  // Get parent elelemnt
  var parent = element.parentElement;

  // root node for sezzle
  var sezzle = document.createElement('div');
  sezzle.className = "sezzle-shopify-info-button sezzle-product-page-widget sezzle-haatichai"

  // node level - 1
  var node = document.createElement("div");
  node.className = "sezzle-checkout-button-wrapper sezzle-left sezzle-haatichai";

  // price node level - 1.1
  var priceNode = document.createElement("div");
  priceNode.className = "sezzle-button-text sezzle-left";

  // price text node level - 1.1.1
  var priceText = document.createTextNode("or 4 automatic, interest free payments");

  // Adding priceText node to priceNode level - 1.1
  priceNode.appendChild(priceText);

  // price value span node level - 1.1.1
  var priceSpanNode = document.createElement("span");
  priceSpanNode.className = "payment-amount sezzleindex-" + index;

  // price value text node level - 1.1.1.1
  var priceValueText = document.createTextNode(
    ' of $' + Math.round((price / 4) * 100) / 100
  );

  // Adding price value to priceSpanNode - level - 1.1.2
  priceSpanNode.appendChild(priceValueText)

  // Adding priceSpanNode to priceNode level - 1.1
  priceNode.appendChild(priceSpanNode);

  // Adding priceNode to main node level - 1
  node.appendChild(priceNode);

  // Logo node level - 1.1
  var logoNode = document.createElement("div");
  logoNode.className = "sezzle-checkout-button open-sezzle-modal sezzle-left szl-light";

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
  logoNode2.src = "https://d3svog4tlx445w.cloudfront.net/branding/sezzle-logos/png/sezzle-logo-sm-100w.png";

  // Add logeNode1 to logoNode level - 1.1
  logoNode.appendChild(logoNode2);

  // // Logo node third child level - 1.1.3
  // var logoNode3 = document.createElement("img");
  // logoNode3.className = "szl-dark-image";
  // logoNode3.src = "https://d3svog4tlx445w.cloudfront.net/branding/sezzle-logos/png/sezzle-logo-all-black-sm-100w.png";

  // Add logeNode1 to logoNode level - 1.1
  // logoNode.appendChild(logoNode3);

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
  parent.appendChild(sezzle);
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
      var s = new SezzleJS();
      var price = s.parsePrice(mutation.target.innerText);
      delete s;
      var priceIndex = mutation.target.dataset.sezzleindex;
      document.getElementsByClassName('sezzleindex-' + priceIndex)[0]
        .innerText = ' of $' + Math.round((price / 4) * 100) / 100;
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
    modalNode.innerHTML = '<div class="sezzle-checkout-modal sezzle-checkout-modal-hidden"> <div class="sezzle-no-thanks close-sezzle-modal"> x </div><div class="sezzle-modal-title"> <div class="sezzle-title-text-left"> How does </div><img class="sezzle-modal-logo" src="https://us.hideproxy.me/go.php?u=ahj%2F4iYOQRpedu%2Bd0gk4SRWy5JT4tNIbZU9%2BVdb0%2FIVMlARxjTdPzZ8f1vlc%2F9prz4RVq49ozLk8iqP0TdI7NK7xFOw0Fw%3D%3D&amp;b=5"> <div class="sezzle-title-text-right"> work? </div></div><div class="sezzle-header-text"> We have partnered with Sezzle to give you the ability to Buy Now and Pay Later. </div><div class="sezzle-sub-header-text"></div><div class="sezzle-modal-flex"> <div class="sezzle-modal-half"> <img src="https://us.hideproxy.me/go.php?u=ahj%2F4jFYSBZddLaM2hhtU1P25Jb5ut0QbVxmSIy5%2FY0X2QV4jCNPxYEdxOxWqtd9kY1Ov894gqZr3qn2Tw%3D%3D&amp;b=5"> <p><b>Simple Installments</b> Sezzle splits your purchase into 4 automatic installments. Only 25% is due today. The remaining installments occur every 2 weeks.</p></div><div class="sezzle-modal-half"> <img src="https://us.hideproxy.me/go.php?u=ahj%2F4jFYSBZddLaM2hhtU1P25Jb5ut0QbVxmSIy5%2FY0X2QV4jCNPxYEdxOxWqtd9kY1Ov89viqc8wvfoRpg%3D&amp;b=5"> <p><b>Quick and Easy</b> It takes only 1-2 minutes to checkout with Sezzle the first time. Future checkouts take seconds.</p></div></div><div class="sezzle-simply-select"> <div class="sezzle-inline-text-left"> Just select </div><img src="https://us.hideproxy.me/go.php?u=ahj%2F4iYOQRpedu%2Bd0gk4SRWy5JT4tNIbZU9%2BVdb0%2FIVMlARxjTdPzZ8f1vlc%2F9prz4RVq49ozLk8iqP0TdI7NK7xFOw0Fw%3D%3D&amp;b=5"> <div class="sezzle-inline-text-right"> at checkout. </div></div><div class="sezzle-footer-text"> Subject to approval. Estimated payment amount excludes taxes and shipping fees. Your actual installment payments will be presented for confirmation in your checkout with Sezzle. </div></div>';
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
  } 

  httpRequest.open('GET', this.countryFromIPRequestURL);
  httpRequest.responseType = 'json';
  httpRequest.send();
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
    var that = this;
    this.getCountryCodeFromIP(function(countryCode) {
      if (that.supportedCountryCodes.indexOf(countryCode) !== -1) {
        that.initWidget();
      }
    });
  }
}

/**
 * All steps required to show the widget
 */
SezzleJS.prototype.initWidget = function() {
  this.loadCSS();
  var els = this.getAllPriceElements();
  var that = this;
  els.forEach(function (el, index) {
    that.renderAwesomeSezzle(el, index);
    that.startObserve(el);
  });
  this.renderModal();
}


// Example

var s = new SezzleJS(
  '.product-price',
  false,
);
s.init();
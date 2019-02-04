var Helper = require('./helper');

var SezzleJS = function(options) {
  // Configurable options
  this.xpath = [];
  if (options.targetXPath) {
    if (typeof (options.targetXPath) === 'string') {
      // Only one x-path is given
      this.xpath.push(Helper.breakXPath(options.targetXPath));
    } else {
      // options.targetXPath is an array of x-paths
      this.xpath = options.targetXPath.map(function (path) {
        return Helper.breakXPath(path);
      }.bind(this));
    }
  }

  this.rendertopath = [];
  if (options.renderToPath) {
    if (typeof (options.renderToPath) === 'string') {
      // Only one respective render location is given
      this.rendertopath.push(options.renderToPath);
    } else {
      // options.renderToPath is an array of x-paths
      this.rendertopath = options.renderToPath;
    }
  }

  // Sync up the rendertopath array with
  // xpath array, place null for not defined indices
  // to follow the default behaviour
  this.xpath.forEach(function (value, index) {
    if (index in this.rendertopath) {
      this.rendertopath[index] =
        this.rendertopath[index].trim() != '' ?
          this.rendertopath[index].trim() : null;
    } else {
      this.rendertopath.push(null);
    }
  }.bind(this));

  this.ignoredPriceElements = [];
  if (options.ignoredPriceElements) {
    if (typeof (options.ignoredPriceElements) === 'string') {
      // Only one x-path is given
      this.ignoredPriceElements.push(options.ignoredPriceElements.trim().split('/')
        .filter(function (subpath) {
          return subpath !== '';
        }));
    } else {
      // options.ignoredPriceElements is an array of x-paths
      this.ignoredPriceElements = options.ignoredPriceElements.map(function (path) {
        return Helper.breakXPath(path.trim());
      }.bind(this));
    }
  }

  this.hideElements = [];
  if (options.hideClasses) {
    if (typeof (options.hideClasses) === 'string') {
      // Only one x-path is given
      this.hideElements.push(Helper.breakXPath(options.hideClasses.trim()));
    } else {
      // options.hideClasses is an array of x-paths
      this.hideElements = options.hideClasses.map(function (path) {
        return Helper.breakXPath(path.trim());
      }.bind(this));
    }
  }

  this.numberOfPayments = Math.floor(options.numberOfPayments) || 4;
  this.forcedShow = options.forcedShow || false;
  this.alignment = options.alignment || 'auto';
  this.merchantID = options.merchantID || '';
  this.widgetType = options.widgetType || 'product-page';
  this.minPrice = options.minPrice || 0;
  this.maxPrice = options.maxPrice || 250000;
  this.bannerURL = options.bannerURL || '';
  this.bannerClass = options.bannerClass || '';
  this.bannerLink = options.bannerLink || '';
  this.fontWeight = options.fontWeight || 300;
  this.alignmentSwitchMinWidth = options.alignmentSwitchMinWidth; //pixels
  this.alignmentSwitchType = options.alignmentSwitchType;
  this.marginTop = options.marginTop || 0; //pixels
  this.marginBottom = options.marginBottom || 0; //pixels
  this.marginRight = options.marginRight || 0; //pixels
  this.marginLeft = options.marginLeft || 0; //pixels
  this.scaleFactor = options.scaleFactor || 1.0;
  this.fontFamily = options.fontFamily || 'inherit';
  this.textColor = options.color || 'inherit';
  this.fontSize = options.fontSize || 12;
  this.maxWidth = options.maxWidth || 400; //pixels
  // This is used to get price of element
  this.priceElementClass = options.priceElementClass || 'sezzle-price-element';
  // This is used to tell where to render sezzle element to
  this.sezzleWidgetContainerClass = options.sezzleWidgetContainerClass || 'sezzle-widget-container';
  // splitPriceElementsOn is used to deal with price ranges which are separated by arbitrary strings
  this.splitPriceElementsOn = options.splitPriceElementsOn || '';
  this.altModalHTML = options.altLightboxHTML || '';
  // if doing widget with both Sezzle or afterpay - the modal to display:
  this.apModalHTML = options.apModalHTML || '';

  // This option is to render custom class in sezzle widget
  // This option contains an array of objects
  // each of the objects should have two properties
  // xpath -> the path from the root of sezzle element
  // className -> a string of classname that is to be added
  // index -> this is optional, if provided then only the widget with
  // the same sezzle index value will be effected with the class name
  // Example : [
  // {xpath:'.', className: 'test-1', index: 0},
  // {xpath: './.hello', className: 'test-2', index: 0}
  //]
  this.customClasses = Array.isArray(options.customClasses) ? options.customClasses : [];

  this.widgetTemplate = [];
  if (options.altVersionTemplate) {
    this.widgetTemplate = options.altVersionTemplate.split('%%');
  } else {
    var defaultWidgetTemplate = 'or ' + this.numberOfPayments + ' interest-free payments of %%price%% with %%logo%% %%info%%';
    this.widgetTemplate = defaultWidgetTemplate.split('%%');
  }

  if (this.splitPriceElementsOn) {
    this.widgetTemplate = this.widgetTemplate.map(function (subtemplate) {
      if (subtemplate === 'price') {
        return 'price-split';
      }
      return subtemplate;
    });
  }

  // Search for price elements. If found, assume there is only one in this page
  this.hasPriceClassElement = false;
  this.priceElements = Array.prototype.slice.
    call(document.getElementsByClassName(this.priceElementClass));

  this.renderElements = Array.prototype.slice.
    call(document.getElementsByClassName(this.sezzleWidgetContainerClass));

  if (this.priceElements.length == 1) {
    this.hasPriceClassElement = true;
  }

  this.theme = options.theme || '';
  if (this.theme == 'dark') {
    this.imageURL = options.imageUrl || 'https://d34uoa9py2cgca.cloudfront.net/branding/sezzle-logos/png/sezzle-logo-white-sm-100w.png';
    this.imageClassName = 'szl-dark-image';
  } else {
    this.imageURL = options.imageUrl || 'https://d3svog4tlx445w.cloudfront.net/branding/sezzle-logos/png/sezzle-logo-sm-100w.png';
    this.imageClassName = 'szl-light-image';
  }

  // Non configurable options
  this._config = { attributes: true, childList: true, characterData: true };
  // URL to request to get ip of request
  this.countryFromIPRequestURL = 'https://geoip.sezzle.com/v1/geoip/ipdetails';
  // URL to request to get css details
  this.cssForMerchantURL = 'https://widget.sezzle.com/v1/css/price-widget?uuid=' + this.merchantID;
  // Countries supported by sezzle pay. To test your country, add here.
  this.supportedCountryCodes = ['US', 'IN'];
  //private boolean variable set to true if widget is to be rendered as first child of the parent
  this.widgetIsFirstChild = false;

  // Variables set by the js
  this.countryCode = null;
  this.ip = null;
  this.fingerprint = null;
  this.productPrice = null;
}

/**
 * This function fetches all the elements that is pointed to by the given xpath
 * @param xindex - Current xpath index value to be resolved [initial value is always 0]
 * @param elements - Array of current elements to be resolved [initial value is the element root(s) of the search path]
 *
 * @return All the elements which are pointed to by the xpath
 */
SezzleJS.prototype.getElementsByXPath = function (xpath, xindex, elements) {
  var xpath = xpath || [];
  var xindex = xindex || 0;
  var elements = elements || null;

  // Break condition
  if (xindex === xpath.length) {
    return elements;
  }

  // If elements are not provided, root the search at the document object
  if (elements === null) {
    elements = [document];
  }

  var children = [];
  var elementArray = Array.prototype.slice.call(elements);

  for (var index = 0; index < elementArray.length; index++) {
    var element = elementArray[index];

    // If this is an ID
    if (xpath[xindex][0] === '#') {
      children.push(document.getElementById(xpath[xindex].substr(1)));
      // If this is a class
    } else if (xpath[xindex][0] === '.') {
      // If there is only one '.' return the element
      if (xpath[xindex].trim().length === 1) {
        children.push(element);
      }
      Array.prototype.forEach.call(element.getElementsByClassName(xpath[xindex].substr(1)), function (el) {
        children.push(el);
      });
      // If this is a tag
    } else {
      var indexToTake = 0;
      if (xpath[xindex].split('-').length > 1) {
        if (xpath[xindex].split('-')[1] >= 0) {
          indexToTake = parseInt(xpath[xindex].split('-')[1]);
        }
      }
      Array.prototype.forEach.call(element.getElementsByTagName(xpath[xindex].split('-')[0]), function (el, index) {
        if (index === indexToTake) children.push(el);
      });
    }
  }

  children = children.filter(function (c) { return c !== null });
  return this.getElementsByXPath(xpath, xindex + 1, children);
}

/**
 * This function loads up CSS dynamically to clients page
 * @return void
 */
SezzleJS.prototype.loadCSS = function (callback) {
  this.getCSSVersionForMerchant(function (version) {
    var head = document.head;
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = 'https://d3svog4tlx445w.cloudfront.net/shopify-app/assets/' + version;
    head.appendChild(link);
    link.onload = callback;
  }.bind(this));
}

/**
 * Add CSS alignment class as required based on the viewport width
 * @param element Element to add to
 */
SezzleJS.prototype.addCSSAlignment = function (element) {
  var newAlignment = '';
  if (matchMedia && this.alignmentSwitchMinWidth && this.alignmentSwitchType) {
    var queryString = '(min-width: ' + this.alignmentSwitchMinWidth + 'px)';
    var mq = window.matchMedia(queryString);
    if (!mq.matches) {
      newAlignment = this.alignmentSwitchType
    }
  }
  switch (newAlignment || this.alignment) {
    case 'left':
      element.className += ' sezzle-left';
      break;
    case 'right':
      element.className += ' sezzle-right';
      break;
    case 'center':
      element.className += ' sezzle-center';
    default:
      // if there is no alignment specified, it will be auto
      break;
  }
}

/**
 * Guesses the widget alignment based on the
 * @param priceElement price element to add the widgets to, the target element
 * this method is based on the belief that the widget alignment should follow the text-align property of the price element
 */
SezzleJS.prototype.guessWidgetAlignment = function (priceElement) {
  if (!priceElement) {
    return 'left'; //default
  }
  var textAlignment = window.getComputedStyle(priceElement).textAlign
  if (textAlignment === 'start' || textAlignment === 'justify') {
    // start is a CSS3  value for textAlign to accommodate for other languages which may be RTL (right to left), for instance Arabic
    // Since the sites we are adding to are mostly, if not all in English, it will be LTR (left to right), hence 'left' at the start
    // 'justify' will be the same as 'left'
    return 'left';
  } else if (textAlignment === 'end') {
    // end is a CSS3  value for textAlign to accommodate for other languages which may be RTL (right to left), for instance Arabic
    // Since the sites we are adding to are mostly, if not all in English, it will be LTR (left to right), hence 'right' at the end
    return 'right';
  }
  return textAlignment;
}

/**
 * Add CSS fonts styling as required
 * @param element Element to add to
 */
SezzleJS.prototype.addCSSFontStyle = function (element) {
  if (this.fontWeight) {
    element.style.fontWeight = this.fontWeight;
  }
  if (this.fontFamily) {
    element.style.fontFamily = this.fontFamily;
  }
  if (this.fontSize != 'inherit') {
    element.style.fontSize = this.fontSize + 'px';
  }
}

/**
 * Add CSS width class as required
 * @param element Element to add to
 */

SezzleJS.prototype.addCSSWidth = function (element) {
  if (this.maxWidth) {
    element.style.maxWidth = this.maxWidth + 'px';
  }
}

/**
 * Add CSS text color as required
 * @param element Element to add to
 */
SezzleJS.prototype.addCSSTextColor = function (element) {
  if (this.textColor) {
    element.style.color = this.textColor;
  }
}

/**
 * Add CSS theme class as required
 * @param element Element to add to
 */
SezzleJS.prototype.addCSSTheme = function (element) {
  switch (this.theme) {
    case 'dark':
      element.className += ' szl-dark';
      break;
    default:
      element.className += ' szl-light';
      break;
  }
}

/**
 * Add CSS customisation class as required
 * @param element Element to add to
 */
SezzleJS.prototype.addCSSCustomisation = function (element) {
  this.addCSSAlignment(element);
  this.addCSSFontStyle(element);
  this.addCSSTextColor(element);
  this.addCSSTheme(element);
  this.addCSSWidth(element);
}

/**
 * Insert css class name in element
 * @param element to add class to
 */
SezzleJS.prototype.insertStoreCSSClassInElement = function (element) {
  element.className += ' sezzle-' + this.merchantID;
}

/**
 * Insert css class name in element
 * @param element to add class to
 */
SezzleJS.prototype.insertWidgetTypeCSSClassInElement = function (element) {
  switch (this.widgetType) {
    case 'cart':
      element.className += ' sezzle-cart-page-widget';
      break;
    case 'product-page':
      element.className += ' sezzle-product-page-widget';
      break;
    case 'product-preview':
      element.className += ' sezzle-product-preview-widget';
      break;
    default:
      element.className += ' sezzle-product-page-widget';
      break;
  }
}

/**
 * Set the top and bottom margins of element
 * @param element to set margins to
 */
SezzleJS.prototype.setElementMargins = function (element) {
  element.style.marginTop = this.marginTop + 'px';
  element.style.marginBottom = this.marginBottom + 'px';
  element.style.marginRight = this.marginRight + 'px';
  element.style.marginLeft = this.marginLeft + 'px';
}

/*
 * Scale the element size using CSS transforms
 * The transform origin is set to 'top {this.alignment}'
 * scale() scales the element appropriately, maintaining the aspect ratio
 * @param element - element to set the size to
 * @return void
*/
SezzleJS.prototype.setWidgetSize = function (element) {
  element.style.transformOrigin = 'top ' + this.alignment;
  element.style.transform = 'scale(' + this.scaleFactor + ')';
}

/**
 * This function will set Sezzle's elements with
 * the price element in parallel
 * @param element - This is the price element
 * @param index - Index of the element in the page
 * @return void
 */
SezzleJS.prototype.renderAwesomeSezzle = function (element, renderelement, index) {
  var index = index || 0;

  // Do not render this product if it is not eligible
  if (!this.isProductEligible(element.innerText)) return false;
  // Set data index to each price element for tracking
  element.dataset.sezzleindex = index;
  // Get element to be rendered with sezzle's widget
  var parent = renderelement;

  //get the alignment of the widget (if widgetAlignment is auto)
  // the alignment, when set to auto follows the text-align property of the price element
  if (this.alignment === 'auto') {
    this.alignment = this.guessWidgetAlignment(element);
  }

  // root node for sezzle
  var sezzle = document.createElement('div');
  // TODO: why there is a shopify specific naming
  sezzle.className = `sezzle-shopify-info-button sezzlewidgetindex-${index}`;

  if (this.ABTestClass) {
    sezzle.className += this.ABTestClass;
  }

  this.insertWidgetTypeCSSClassInElement(sezzle);
  this.insertStoreCSSClassInElement(sezzle);
  this.setElementMargins(sezzle);
  this.setWidgetSize(sezzle);

  var node = document.createElement('div');
  node.className = 'sezzle-checkout-button-wrapper';
  this.insertStoreCSSClassInElement(node);
  this.addCSSAlignment(node);

  var sezzleButtonText = document.createElement('div');
  sezzleButtonText.className = 'sezzle-button-text';
  this.addCSSCustomisation(sezzleButtonText);

  this.widgetTemplate.forEach(function (subtemplate) {
    switch (subtemplate) {
      case 'price':
        var priceSpanNode = document.createElement('span');
        priceSpanNode.className = 'sezzle-payment-amount sezzle-button-text sezzleindex-' + index;
        var priceValueText = document.createTextNode(this.getFormattedPrice(element));
        priceSpanNode.appendChild(priceValueText);
        sezzleButtonText.appendChild(priceSpanNode);
        break;

      case 'logo':
        var logoNode = document.createElement('img');
        logoNode.className = 'sezzle-logo ' + this.imageClassName;
        logoNode.src = this.imageURL;
        sezzleButtonText.appendChild(logoNode);
        break;
      // changed from learn-more to link as that is what current altVersionTemplates use
      case 'link':
        var learnMoreNode = document.createElement('span');
        learnMoreNode.className = 'sezzle-modal-link sezzle-learn-more';
        var learnMoreText = document.createTextNode('Learn more');
        learnMoreNode.appendChild(learnMoreText);
        sezzleButtonText.appendChild(learnMoreNode);
        break;

      case 'info':
        var infoIconNode = document.createElement('code');
        infoIconNode.className = 'sezzle-modal-link sezzle-info-icon';
        infoIconNode.innerHTML = '&#9432;';
        sezzleButtonText.appendChild(infoIconNode);
        break;

      case 'question-mark':
        var questionMarkIconNode = document.createElement('img');
        questionMarkIconNode.className = 'sezzle-modal-link sezzle-question-mark-icon';
        questionMarkIconNode.src = 'https://d2uyik3j5wol98.cloudfront.net/images/question_mark_black.png';
        sezzleButtonText.appendChild(questionMarkIconNode);
        break;

      case 'afterpay-logo':
        var apNode = document.createElement('img');
        apNode.className = 'sezzle-afterpay-logo';
        apNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/ap-logo-widget.png';
        sezzleButtonText.appendChild(apNode);
        break;

      case 'afterpay-logo-grey':
        var apNode = document.createElement('img');
        apNode.className = 'sezzle-afterpay-logo';
        apNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/ap-logo-widget-grayscale.png';
        sezzleButtonText.appendChild(apNode);
        break;

      case 'afterpay-info-icon':
        var apInfoIconNode = document.createElement('code');
        apInfoIconNode.className = 'ap-modal-info-link';
        apInfoIconNode.innerHTML = '&#9432;';
        sezzleButtonText.appendChild(apInfoIconNode);
        break;

      case 'price-split':
        var priceSplitNode = document.createElement('span');
        priceSplitNode.className = 'sezzle-payment-amount sezzle-price-split sezzleindex-' + index;
        var priceElemTexts = element.innerText.split(this.splitPriceElementsOn);
        var priceSplitText = '';
        if (priceElemTexts.length == 1) { //if the text is not being splitted (this check is needed in order to support sites with multiple types of product pricing)
          //give the original element in the case there might be some ignored elements present
          priceSplitText = this.getFormattedPrice(element);
        } else {
          var priceElems = [];
          priceElemTexts.forEach(function (text) {
            var priceElemSpan = document.createElement('span');
            priceElemSpan.innerText = text;
            priceElems.push(priceElemSpan);
          });
          priceElems.forEach(function (elem, index) {
            if (index == 0) {
              priceSplitText = this.getFormattedPrice(elem);
            } else {
              priceSplitText = priceSplitText + ' ' + this.splitPriceElementsOn + ' ' + this.getFormattedPrice(elem);
            }
          }.bind(this));
        }

        var priceSplitTextNode = document.createTextNode(priceSplitText);
        priceSplitNode.appendChild(priceSplitTextNode);
        sezzleButtonText.appendChild(priceSplitNode);
        break;

      case 'line-break':
        var lineBreakNode = document.createElement('br');
        sezzleButtonText.appendChild(lineBreakNode);
        break;

      default:
        var widgetTextNode = document.createTextNode(subtemplate);
        sezzleButtonText.appendChild(widgetTextNode);
        break;
    }
  }.bind(this));

  node.appendChild(sezzleButtonText);

  // Adding main node to sezzel node
  sezzle.appendChild(node);

  this.customClasses.forEach(function(customClass) {
    if (customClass.xpath && customClass.className) {
      if (typeof(customClass.index) !== 'number') {
        customClass.index = 0; // set the default value
      }
      if (customClass.index === index) {
        var path = Helper.breakXPath(customClass.xpath);
        this.getElementsByXPath(path, 0, [sezzle])
          .forEach(function(el) {
            el.className += ' ' + customClass.className;
          })
      }
    }
  }.bind(this))

  // Adding sezzle to parent node
  if (this.widgetIsFirstChild) {
    this.insertAsFirstChild(sezzle, parent);
  } else {
    this.insertAfter(sezzle, parent);
  }
  this.logEvent('onload');
  return sezzle;
}

/**
 * This function finds out the element where Sezzle's widget
 * will be rendered. By default it would return the parent element
 * of the given price element. If the over ride path is found and
 * it leads to a valid element then that element will be returned
 * @param element - This is the price element
 * @param index - Index of the price element in this.xpath array
 * @return the element where Sezzle's widget will be rendered
 */
SezzleJS.prototype.getElementToRender = function (element, index) {
  var index = index || 0;
  var toRenderElement = null;

  if (this.rendertopath[index] !== null) {
    var path = Helper.breakXPath(this.rendertopath[index]);
    var toRenderElement = element;

    for (var i = 0; i < path.length; i++) {
      var p = path[i];

      if (toRenderElement == null) {
        break;
      } else if (p === '.') {
        continue;
      } else if (p === '..') {
        // One level back
        toRenderElement = toRenderElement.parentElement;
      } else if (p[0] === '.') {
        // The class in the element
        toRenderElement =
          toRenderElement.getElementsByClassName(p.substr(1)).length ?
            toRenderElement.getElementsByClassName(p.substr(1))[0] :
            null;
      } else if (p[0] === '#') {
        // The ID in the element
        toRenderElement =
          document.getElementById(p.substr(1));
      } else if (p === '::first-child') {
        //rendered as first child
        toRenderElement =
          toRenderElement.children.length > 0 ?
            toRenderElement.firstElementChild :
            null;
        this.widgetIsFirstChild = true;
      } else {
        // If this is a tag
        // indexes are 0-indexed (e.g. span-2 means third span)
        var indexToTake = 0;
        if (p.split('-').length > 1) {
          if (p.split('-')[1] >= 0) {
            indexToTake = parseInt(p.split('-')[1]);
          }
        }
        toRenderElement =
          toRenderElement.getElementsByTagName(p.split('-')[0]).length > indexToTake ?
            toRenderElement.getElementsByTagName(p.split('-')[0])[indexToTake] :
            null;
      }
    }
  }
  if (toRenderElement === null) {
    // No path defined
    // return the parent elelment
    return element.parentElement;
  }
  return toRenderElement;
}

/**
 * Insert child after a given element
 * @param el Element to insert
 * @param referenceNode Element to insert after
 */
SezzleJS.prototype.insertAfter = function (el, referenceNode) {
  referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

/**
 * Insert element as the first child of the parentElement of referenceElement
 * @param element Element to insert
 * @param referenceElement Element to grab parent element
 */
SezzleJS.prototype.insertAsFirstChild = function (element, referenceElement) {
  referenceElement.parentElement.insertBefore(element, referenceElement);
  //bump up element above nodes which are not element nodes (if any)
  while (element.previousSibling) {
    element.parentElement.insertBefore(element, element.previousSibling);
  }
}

/**
 * Is the product eligible for sezzle pay
 * @param price Price of product
 */
SezzleJS.prototype.isProductEligible = function (priceText) {
  var price = Helper.parsePrice(priceText);
  this.productPrice = price;
  var priceInCents = price * 100;
  if (priceInCents >= this.minPrice && priceInCents <= this.maxPrice) {
    return true;
  }
  return false;
}

/**
 * Gets price text
 * @param element Element that contains the price text
 */
SezzleJS.prototype.getPriceText = function (element) {
  if (this.ignoredPriceElements == []) {
    return element.innerText;
  } else {
    this.ignoredPriceElements.forEach(function (subpaths) {
      // get all elements pointed to by the xPath. Search is rooted at element
      this.getElementsByXPath(subpaths, 0, [element]).forEach(function (ignoredPriceElement) {
        //mark the element to be ignored
        ignoredPriceElement.classList.add('sezzle-ignored-price-element');
      });
    }.bind(this));
  }

  // if no ignored elements are found, return the whole inner text of the element
  if (!element.getElementsByClassName('sezzle-ignored-price-element').length) {
    return element.innerText;
  }

  var clone = element.cloneNode(true);

  //remove all marked elements
  Array.prototype.forEach.call(clone.getElementsByTagName('*'), function (element) {
    if (Array.prototype.slice.call(element.classList).indexOf('sezzle-ignored-price-element') !== -1) {
      clone.removeChild(element);
    }
  });

  //remove all markers
  Array.prototype.forEach.call(element.getElementsByClassName('sezzle-ignored-price-element'), function (element) {
    element.classList.remove('sezzle-ignored-price-element');
  });

  return clone.innerText;
}

/**
 * Formats a price as Sezzle needs it
 * @param element Element that contains price text
 */
SezzleJS.prototype.getFormattedPrice = function (element) {
  priceText = this.getPriceText(element);

  // Get the price string - useful for formtting Eg: 120.00(string)
  var priceString = Helper.parsePriceString(priceText, true);

  // Get the price in float from the element - useful for calculation Eg : 120.00(float)
  var price = Helper.parsePrice(priceText);

  // Will be used later to replace {price} with price / this.numberOfPayments Eg: ${price} USD
  var formatter = priceText.replace(priceString, '{price}');

  // array of strings that come up inside of elements that we want to make sure to strip out
  var ignoredPriceStrings = [
    'Subtotal',
    'Total:',
    'Sold Out',
  ];

  // replace other strings not wanted in text
  ignoredPriceStrings.forEach(function (ignoredString) {
    formatter = formatter.replace(ignoredString, '');
  }.bind(this));

  // get the sezzle installment price
  var sezzleInstallmentPrice = (price / this.numberOfPayments).toFixed(2);

  // format the string
  var sezzleInstallmentFormattedPrice = formatter.replace('{price}', sezzleInstallmentPrice);

  return sezzleInstallmentFormattedPrice;
}

/**
 * Mutation observer callback function
 * This observer observes for any change in a
 * given DOM element (Price element in our case)
 * and act on that
 */
SezzleJS.prototype.mutationCallBack = function (mutations) {
  mutations
    .filter(function (mutation) { return mutation.type === 'childList' })
    .forEach(function (mutation) {
      var priceIndex = mutation.target.dataset.sezzleindex;
      var s = new SezzleJS(document.sezzleConfig);
      var price = s.getFormattedPrice(mutation.target);
      delete s;
      var sezzlePriceElement = document.getElementsByClassName('sezzleindex-' + priceIndex)[0];
      if (!/\d/.test(price)) {
        sezzlePriceElement.parentElement.parentElement.parentElement.classList.add('sezzle-hidden');
      } else {
        sezzlePriceElement.parentElement.parentElement.parentElement.classList.remove('sezzle-hidden');
      }
      sezzlePriceElement.innerText = price;
    });
};

/**
 * This function starts observing for change
 * in given Price element
 * @param element to be observed
 * @return void
 */
SezzleJS.prototype.startObserve = function (element) {
  // TODO : Need a way to unsubscribe to prevent memory leak
  // Deleted elements should not be observed
  // That is handled
  var observer = new MutationObserver(this.mutationCallBack);
  observer.observe(element, this._config);
  return observer;
}

/**
 * This function renders the Sezzle modal
 * Also adds the event for open and close modals
 * to respective buttons
 */
SezzleJS.prototype.renderModal = function () {
  if (!document.getElementsByClassName('sezzle-checkout-modal-lightbox').length) {
    var modalNode = document.createElement('div');
    modalNode.className = 'sezzle-checkout-modal-lightbox close-sezzle-modal';
    modalNode.style.display = 'none';
    if (this.altModalHTML) {
      modalNode.innerHTML = this.altModalHTML;
    } else {
      modalNode.innerHTML = '<div class="sezzle-checkout-modal sezzle-checkout-modal-hidden"><div class="top-content"><div class="sezzle-no-thanks close-sezzle-modal">×</div><div class="sezzle-modal-title"><div class="sezzle-title-text-center">How Sezzle Works</div></div><div class="sezzle-header-text">We have partnered with Sezzle to give you the ability to Buy Now and Pay Later.</div><div class="row point"><div class="col-xs-12 col-sm-12 col-md-2 modal-icon"><img src="https://d34uoa9py2cgca.cloudfront.net/Checkout/0interest.svg"></div><div class="col-xs-12 col-sm-12 modal-description"><h2>No interest or fees</h2><p>You only pay the purchase price with Sezzle, as long as you have the installment amount.</p></div></div><div class="row point"><div class="col-xs-12 col-sm-12 col-md-2 modal-icon"><img src="https://d34uoa9py2cgca.cloudfront.net/Checkout/shipped-green.svg"></div><div class="col-xs-12 col-sm-12 modal-description"><h2>Your order is shipped right away</h2><p>We ship your order on the same timeline as other payment methods we accept.</p></div></div><div class="row point"><div class="col-xs-12 col-sm-12 col-md-2 modal-icon"><img src="https://d34uoa9py2cgca.cloudfront.net/Checkout/payments-green.svg"></div><div class="col-xs-12 col-sm-12 modal-description"><h2>Easy, automatic payments</h2><p>Sezzle splits your purchase into ' + this.numberOfPayments + ' payments, automatically deducted from your debit or credit card every two weeks.</p></div></div></div><div class="sezzle-simply-select"><div class="sezzle-inline-text-left">Just select</div><img src="https://sezzlemedia.s3.amazonaws.com/branding/sezzle-logos/sezzle-logo.svg"><div class="sezzle-inline-text-right">at checkout.</div></div><div class="sezzle-footer-text">Subject to approval. Estimated payment amount excludes taxes and shipping fees. Your actual installment payments will be presented for confirmation in your checkout with Sezzle.</div></div>';
    }
    document.getElementsByTagName('html')[0].appendChild(modalNode);
  } else {
    modalNode = document.getElementsByClassName('sezzle-checkout-modal-lightbox')[0];
  }

  // Event listener for close in modal
  Array.prototype.forEach.call(document.getElementsByClassName('close-sezzle-modal'), function (el) {
    el.addEventListener('click', function () {
      // Display the modal node
      modalNode.style.display = 'none';
      // Add hidden class hide the item
      modalNode.getElementsByClassName('sezzle-checkout-modal')[0].className = 'sezzle-checkout-modal sezzle-checkout-modal-hidden';
    });
  });

  // Event listener to prevent close in modal if click happens within sezzle-checkout-modal
  document.getElementsByClassName('sezzle-checkout-modal')[0].addEventListener('click', function (event) {
    // stop propagating the event to the parent sezzle-checkout-modal-lightbox to prevent the closure of the modal
    event.stopPropagation();
  });
}

/**
 * This function renders the Afterpay modal based on if you include ap-modal-info-link
 * Also adds the event for open and close modals
 * to respective buttons
 */
SezzleJS.prototype.renderAPModal = function () {
  var modalNode = document.createElement('div');
  modalNode.className = 'sezzle-checkout-modal-lightbox close-sezzle-modal sezzle-ap-modal';
  modalNode.style = 'position: center';
  modalNode.style.display = 'none';
  modalNode.innerHTML = this.apModalHTML;
  document.getElementsByTagName('html')[0].appendChild(modalNode);

  // Event listener for close in modal
  Array.prototype.forEach.call(document.getElementsByClassName('close-sezzle-modal'), function (el) {
    el.addEventListener('click', function () {
      // Display the modal node
      modalNode.style.display = 'none';
    });
  });

  // Event listener to prevent close in modal if click happens within sezzle-checkout-modal
  document.getElementsByClassName('sezzle-checkout-modal')[0].addEventListener('click', function (event) {
    // stop propagating the event to the parent sezzle-checkout-modal-lightbox to prevent the closure of the modal
    event.stopPropagation();
  })
}

/**
 * This function add events to the button in sezzle widget
 * to open the modal
 */
SezzleJS.prototype.addClickEventForModal = function(sezzleElement) {
  // attach click event listeners to open/close modal
  // all assets with the sezzle-modal-link class have click event listeners hooked to them
  // if the widget does not contain an element with a sezzle-modal-link, the event listener is attached to the whole widget
  Array.prototype.forEach.call(sezzleElement.getElementsByClassName('sezzle-button-text'), function (el) {
    var modalLinks = el.getElementsByClassName('sezzle-modal-link');
    var modalNode = document.getElementsByClassName('sezzle-checkout-modal-lightbox')[0];
    if (modalLinks.length == 0) {
      // attach event listener to sezzle-button-text
      // add the sezzle-modal-link class to sezzle-button-text to make it appear clickable
      // (elements with the sezzle-modal-link class appear clickable when hovered on)
      el.classList.add('sezzle-modal-link');
      el.addEventListener('click', function () {
        // Show modal node
        modalNode.style.display = 'block';
        // Remove hidden class to show the item
        modalNode.getElementsByClassName('sezzle-checkout-modal')[0].className = 'sezzle-checkout-modal';
        // log on click event
        this.logEvent('onclick');
      }.bind(this));
    } else { // attach event listener to the sezzle-modal-link(s)
      Array.prototype.forEach.call(modalLinks, function (modalLink) {
        modalLink.addEventListener('click', function () {
          // Show modal node
          modalNode.style.display = 'block';
          // Remove hidden class to show the item
          modalNode.getElementsByClassName('sezzle-checkout-modal')[0].className = 'sezzle-checkout-modal';
          // log on click event
          this.logEvent('onclick');
        }.bind(this));
      }.bind(this));
    }

    // for AfterPay
    var modalLinks = el.getElementsByClassName('ap-modal-info-link');
    Array.prototype.forEach.call(modalLinks, function (modalLink) {
      modalLink.addEventListener('click', function () {
        // Show modal node
        document.getElementsByClassName('sezzle-ap-modal')[0].style.display = 'block';
        // log on click event
        this.logEvent('onclick');
      }.bind(this));
    }.bind(this));

  }.bind(this));
}


/**
 * This function will return the ISO 3166-1 alpha-2 country code
 * from the user's IP
 * @param callback what happens after country is received
 */
SezzleJS.prototype.getCountryCodeFromIP = function (callback) {
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) {
        var body = httpRequest.response;
        if (typeof body === 'string') {
          body = JSON.parse(body);
        }
        this.countryCode = body.country_iso_code;
        this.ip = body.ip;
        callback(this.countryCode);
      }
    }
  }.bind(this);

  httpRequest.open('GET', this.countryFromIPRequestURL, true);
  httpRequest.responseType = 'json';
  httpRequest.send();
}

/**
 * This function will fetch the css file version to use for given merchant
 * @param callback What to do with the css version received
 */
SezzleJS.prototype.getCSSVersionForMerchant = function (callback) {
  // make request
  if (document.sezzleCssVersionOverride !== undefined) {
    callback(document.sezzleCssVersionOverride);
  } else {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function () {
      if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 200) {
          if (httpRequest.response.version === undefined) {
            var ParsedObject = JSON.parse(httpRequest.response);
            callback(ParsedObject.version);
          } else {
            var body = httpRequest.response;
            callback(body.version);
          }
        }
      }
    }

    httpRequest.open('GET', this.cssForMerchantURL);
    httpRequest.responseType = 'json';
    httpRequest.send();
  }
}

/**
 * Hide elements pointed to by this.hideElements
 */
SezzleJS.prototype.hideSezzleHideElements = function () {
  this.hideElements.forEach(function (subpaths) {
    this.getElementsByXPath(subpaths).forEach(function (element) {
      element.classList.add('sezzle-hidden');
    })
  }.bind(this));
}

/**
 * Replaces the afterpay banner
 *
 */
SezzleJS.prototype.replaceBanner = function () {
  var imgurl = this.bannerURL;
  var linkpath = this.bannerLink;
  var bannerClass = this.bannerClass;

  if (bannerClass != '') {
    var element = document.getElementsByClassName(bannerClass)[0];

    if (linkpath != '') {
      var link = element.getElementsByTagName('a');
      if (link[0] != null) {
        link[0].setAttribute('href', linkpath);
      }
    }

    if (imgurl != '') {
      var img = element.getElementsByTagName('img');
      if (img[0] != null) {
        img[0].setAttribute('src', imgurl);
      }
    }
  }
}

/*
* Log Event
*/
SezzleJS.prototype.logEvent = function (eventName) {
  var viewport = {
      width: null,
      height: null
  };
  try {
      if (screen && screen.width) {
          viewport.width = screen.width;
      }
      if (screen && screen.height) {
          viewport.height = screen.height;
      }

  } catch {
      // unable to fetch viewport dimensions
  }
  var sezzleConfigStr = null
  if (document.sezzleConfig) {
      sezzleConfigStr = JSON.stringify(document.sezzleConfig);
  }
  var win = window.frames.szl;
  if (win) {
    var cartId = this.getCookie('cart');
    var merchantID = this.merchantID;
    var productPrice = this.productPrice;
    var isMobileBrowser = this.isMobileBrowser();
    var ip = this.ip;
    setTimeout(function () {
      win.postMessage({
        'event_name': eventName,
        'button_version': document.sezzleButtonVersion,
        'cart_id': cartId,
        'ip_address': ip,
        'merchant_site': window.location.hostname,
        'is_mobile_browser': isMobileBrowser,
        'user_agent': navigator.userAgent,
        'merchant_uuid': merchantID,
        'page_url': window.location.href,
        'viewport': viewport,
        'product_price': productPrice,
        'sezzle_config': sezzleConfigStr,
      }, 'https://tracking.sezzle.com');
    },100);
  }
};

/*
* Get Cookie
*/
SezzleJS.prototype.getCookie = function (name) {
  var value = '; ' + document.cookie;
  var parts = value.split('; ' + name + '=');
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
}

/*
* Is Mobile Browser
*/
SezzleJS.prototype.isMobileBrowser = function () {
  return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4));
}


/**
 * Initialise the widget if the
 * country is supported or the widget
 * is forced to be shown
 */
SezzleJS.prototype.init = function () {
  // Check if the widget should be shown
  if (this.forcedShow) {
    // show the widget
    this.logEvent('request');
    this.loadCSS(this.initWidget.bind(this));
    this.getCountryCodeFromIP(function (countryCode) {
      // only inject Google tag manager for clients visiting from the United States
      if (countryCode === 'US') {
          var win = window.frames.szl;
          if (win) {
              // win.postMessage('initGTMScript', 'http://localhost:9001/');
              win.postMessage('initGTMScript', 'https://tracking.sezzle.com');
          }
      }
    }.bind(this));
  } else {
    // get the country and show the widget if supported
    this.getCountryCodeFromIP(function (countryCode) {
      if (this.supportedCountryCodes.indexOf(countryCode) !== -1) {
        this.logEvent('request');
        this.loadCSS(this.initWidget.bind(this));
        // only inject Google tag manager for clients visiting from the United States
        if (countryCode === 'US') {
            var win = window.frames.szl;
            if (win) {
              setTimeout(function () {
                win.postMessage('initGTMScript', 'https://tracking.sezzle.com');
              },100)
            }
        }
        this.hideSezzleHideElements();
        this.replaceBanner();
      }
    }.bind(this));
  }
}

/**
 * All steps required to show the widget
 */
SezzleJS.prototype.initWidget = function () {
  var els = [];
  var intervalInMs = 2000;

  // This should always happen before rendering the widget
  this.renderModal();
  // only render APModal if ap-modal-link exists
  if (document.getElementsByClassName('ap-modal-info-link').length > 0) {
    this.renderAPModal();
  }

  function sezzleWidgetCheckInterval() {
    // Look for newly added price elements
    this.xpath.forEach(function (path, index) {
      this.getElementsByXPath(path).forEach(function (e) {
        if (!e.hasAttribute('data-sezzleindex')) {
          els.push({
            element: e,
            toRenderElement: this.getElementToRender(e, index),
            deleted: false,
            observer: null
          });
        }
      }.bind(this))
    }.bind(this));
    // add the sezzle widget to the price elements
    els.forEach(function (el, index) {
      if (!el.element.hasAttribute('data-sezzleindex')) {
        var sz = this.renderAwesomeSezzle(el.element, el.toRenderElement, index);
        this.addClickEventForModal(sz);
        el.observer = this.startObserve(el.element);
      }
    }.bind(this));


    // Find the deleted price elements
    // remove corresponding Sezzle widgets if exists
    els.forEach(function(el, index) {
      if (el.element.parentElement == null && !el.deleted) { // element is deleted
        // Stop observing for changes in the element
        if (el.observer !== null) el.observer.disconnect();
        // Mark that element as deleted
        el.deleted = true;
        // Delete the corresponding sezzle widget if exist
        var tmp = document.getElementsByClassName(`sezzlewidgetindex-${index}`);
        if (tmp.length) {
          var sw = tmp[0];
          sw.parentElement.removeChild(sw);
        }
      }
    })
    setTimeout(sezzleWidgetCheckInterval.bind(this), intervalInMs)
  };

  if (this.hasPriceClassElement) {
    var sz = this.renderAwesomeSezzle(this.priceElements[0], this.renderElements[0], 0);
    this.startObserve(this.priceElements[0]);
  } else {
    sezzleWidgetCheckInterval.call(this);
  }
}

module.exports = SezzleJS;
// Assumes document.sezzleConfig is present
window.onload = new SezzleJS(document.sezzleConfig).init();
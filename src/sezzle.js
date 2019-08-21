var Helper = require('./helper');

var SezzleJS = function (options) {
  if (!options) options = {};

  // convert to new config if options passed in is old config
  var isOldConfig = typeof (options.configGroups) === 'undefined';
  if (isOldConfig) options = Helper.makeCompatible(options);

  // validate config structure
  Helper.validateConfig(options);

  // filter off config groups which do not match the current URL
  options.configGroups = options.configGroups.filter(function (configGroup) {
    // if no URL match is provided, consider the group for backwards compatability reasons
    return !configGroup.urlMatch || RegExp(configGroup.urlMatch).test(window.location.href);
  });

  // properties that do not belong to a config group
  this.merchantID = options.merchantID || '';
  this.forcedShow = options.forcedShow || false;
  this.numberOfPayments = options.numberOfPayments || 4;
  this.minPrice = options.minPrice || 0; // in cents
  this.maxPrice = options.maxPrice || 250000; // in cents
  this.altModalHTML = options.altLightboxHTML || '';
  // if doing widget with both Sezzle or afterpay - the modal to display:
  this.apModalHTML = options.apModalHTML || '';
  // if doing widget with both Sezzle or quadpay - the modal to display:
  this.qpModalHTML = options.qpModalHTML || '';
  // countries widget should show in
  this.supportedCountryCodes = options.supportedCountryCodes || ['US', 'IN', 'CA'];
  // Non configurable options
  this._config = { attributes: true, childList: true, characterData: true };
  // URL to request to get ip of request
  this.countryFromIPRequestURL = 'https://geoip.sezzle.com/v1/geoip/ipdetails';
  // URL to request to get css details
  this.cssForMerchantURL = 'https://widget.sezzle.com/v1/css/price-widget?uuid=' + this.merchantID;

  // Variables set by the js
  this.countryCode = null;
  this.ip = null;
  this.fingerprint = null;
  
  // Widget Language
  this.browserLanguage = navigator.language || navigator.browserLanguage || 'en';
  this.browserLanguage = this.browserLanguage.toLowerCase().substring(0, 2);

  // map config group props
  this.configGroups = [];
  options.configGroups.forEach(function (configGroup) {
    this.configGroups.push(Helper.mapGroupToDefault(configGroup, options.defaultConfig, this.numberOfPayments, this.browserLanguage));
  }.bind(this));
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

    // If parent path
    if (xpath[xindex] === '..') {
      children.push(element.parentElement);
    } else if (xpath[xindex][0] === '#') { // If this is an ID
      children.push(element.getElementById(xpath[xindex].substr(1)));
      // If this is a class
    } else if (xpath[xindex][0] === '.') {
      // If there is only one '.' return the element
      if (xpath[xindex].trim().length === 1) {
        children.push(element);
      }
      Array.prototype.forEach.call(element.getElementsByClassName(xpath[xindex].substr(1)), function (el) {
        children.push(el);
      });

    } else if (xpath[xindex].indexOf('child') === 0) { // If this is a child indicator
      var childNumber = xpath[xindex].split('-')[1];
      var childElement = element.childNodes[childNumber];
      if (typeof (childElement) !== 'undefined') {
        if (childElement.nodeName === '#text') { // if it's a text node we wrap it
          newSpan = document.createElement('span');
          newSpan.appendChild(document.createTextNode(childElement.nodeValue));
          element.replaceChild(newSpan, childElement)
          children.push(newSpan);
        } else {
          children.push(childElement);
        }
      } else {
        children.push(element);
      }
    } else { // If this is a tag
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
 * @param configGroupIndex index of the config group that element belongs to
 */
SezzleJS.prototype.addCSSAlignment = function (element, configGroupIndex) {
  var newAlignment = '';
  if (matchMedia && this.configGroups[configGroupIndex].alignmentSwitchMinWidth && this.configGroups[configGroupIndex].alignmentSwitchType) {
    var queryString = '(min-width: ' + this.configGroups[configGroupIndex].alignmentSwitchMinWidth + 'px)';
    var mq = window.matchMedia(queryString);
    if (!mq.matches) {
      newAlignment = this.confiGroups[configGroupIndex].alignmentSwitchType
    }
  }
  switch (newAlignment || this.configGroups[configGroupIndex].alignment) {
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
  if (!priceElement) return 'left'; //default

  var textAlignment = window.getComputedStyle(priceElement).textAlign
  if (textAlignment === 'start' || textAlignment === 'justify') {
    // start is a CSS3  value for textAlign to accommodate for other languages which may be RTL (right to left), for instance Arabic
    // Since the sites we are adding the widgets to are mostly, if not all in English, it will be LTR (left to right), which implies
    // that 'start' and 'justify' would mean 'left'
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
 * @param configGroupIndex index of the config group that element belongs to
 */
SezzleJS.prototype.addCSSFontStyle = function (element, configGroupIndex) {
  if (this.configGroups[configGroupIndex].fontWeight) {
    element.style.fontWeight = this.configGroups[configGroupIndex].fontWeight;
  }
  if (this.configGroups[configGroupIndex].fontFamily) {
    element.style.fontFamily = this.configGroups[configGroupIndex].fontFamily;
  }
  if (this.configGroups[configGroupIndex].fontSize != 'inherit') {
    element.style.fontSize = this.configGroups[configGroupIndex].fontSize + 'px';
  }
}

/**
 * Add CSS width class as required
 * @param element Element to add to
 * @param configGroupIndex index of the config group that element belongs to
 */

SezzleJS.prototype.addCSSWidth = function (element, configGroupIndex) {
  if (this.configGroups[configGroupIndex].maxWidth) {
    element.style.maxWidth = this.configGroups[configGroupIndex].maxWidth + 'px';
  }
}

/**
 * Add CSS text color as required
 * @param element Element to add to
 * @param configGroupIndex index of the config group that element belongs to
 */
SezzleJS.prototype.addCSSTextColor = function (element, configGroupIndex) {
  if (this.configGroups[configGroupIndex].textColor) {
    element.style.color = this.configGroups[configGroupIndex].textColor;
  }
}

/**
 * Add CSS theme class as required
 * @param element Element to add to
 * @param configGroupIndex index of the config group that element belongs to
 */
SezzleJS.prototype.addCSSTheme = function (element, configGroupIndex) {
  switch (this.configGroups[configGroupIndex].theme) {
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
 * @param configGroupIndex index of the config group that element belongs to
 */
SezzleJS.prototype.addCSSCustomisation = function (element, configGroupIndex) {
  this.addCSSAlignment(element, configGroupIndex);
  this.addCSSFontStyle(element, configGroupIndex);
  this.addCSSTextColor(element, configGroupIndex);
  this.addCSSTheme(element, configGroupIndex);
  this.addCSSWidth(element, configGroupIndex);
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
 * @param configGroupIndex index of the config group that element belongs to
 */
SezzleJS.prototype.insertWidgetTypeCSSClassInElement = function (element, configGroupIndex) {
  switch (this.configGroups[configGroupIndex].widgetType) {
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
 * @param configGroupIndex index of the config group that element belongs to
 */
SezzleJS.prototype.setElementMargins = function (element, configGroupIndex) {
  element.style.marginTop = this.configGroups[configGroupIndex].marginTop + 'px';
  element.style.marginBottom = this.configGroups[configGroupIndex].marginBottom + 'px';
  element.style.marginLeft = this.configGroups[configGroupIndex].marginLeft + 'px';
  element.style.marginRight = this.configGroups[configGroupIndex].marginRight + 'px';
}

/**
 * Scale the element size using CSS transforms
 * The transform origin is set to 'top {this.alignment}'
 * scale() scales the element appropriately, maintaining the aspect ratio
 * @param element - element to set the size to
 * @param configGroupIndex - index of the config group that element belongs to
 * @return void
*/
SezzleJS.prototype.setWidgetSize = function (element, configGroupIndex) {
  element.style.transformOrigin = 'top ' + this.configGroups[configGroupIndex].alignment;
  element.style.transform = 'scale(' + this.configGroups[configGroupIndex].scaleFactor + ')';
  if (this.configGroups[configGroupIndex].fixedHeight) {
    element.style.height = this.configGroups[configGroupIndex].fixedHeight + 'px';
    element.style.overflow = 'hidden';
  }
}

/**
 * Scale the widget size using CSS transforms
 * The transform origin is set to 'top {this.alignment}'
 * scale() scales the element appropriately, maintaining the aspect ratio
 * @param element - logo element
 * @param configGroupIndex - index of the config group that element belongs to
 * @return void
 */
SezzleJS.prototype.setLogoSize = function (element, configGroupIndex) {
  element.style.transformOrigin = 'top ' + this.configGroups[configGroupIndex].alignment;
  element.style.transform = 'scale(' + this.configGroups[configGroupIndex].logoSize + ')'
}

/**
 * Scale the widget size using CSS transforms
 * The transform origin is set to 'top {this.alignment}'
 * scale() scales the element appropriately, maintaining the aspect ratio
 * @param element - logo element
 * @param configGroupIndex - index of the config group that element belongs to
 * @return void
 */
SezzleJS.prototype.setLogoSize = function (element, configGroupIndex) {
  element.style.transformOrigin = 'top ' + this.configGroups[configGroupIndex].alignment;
  element.style.transform = 'scale(' + this.configGroups[configGroupIndex].logoSize + ')'
}

/**
 * This function will set Sezzle's elements with
 * the price element in parallel
 * @param element - This is the price element
 * @param renderelement Element to render the widget to
 * @param index - Index of the element in the page
 * @param configGroupIndex Index of the config group
 * @return void
 */
SezzleJS.prototype.renderAwesomeSezzle = function (element, renderelement, index, configGroupIndex) {
  var index = index || 0;

  // Do not render this product if it is not eligible
  if (!this.isProductEligible(element.textContent, configGroupIndex)) return false;
  // Do not render if sezzle ignored price element
  if (element.classList.contains('sezzle-ignored-price-element')) return false;
  // Set data index to each price element for tracking
  element.dataset.sezzleindex = index;
  // Get element to be rendered with sezzle's widget
  var parent = renderelement;

  // get the alignment of the widget (if widgetAlignment is auto)
  // the alignment, when set to auto follows the text-align property of the price element
  if (this.configGroups[configGroupIndex].alignment === 'auto') {
    this.configGroups[configGroupIndex].alignment = this.guessWidgetAlignment(element);
  }

  // root node for sezzle
  var sezzle = document.createElement('div');
  // TODO: why there is a shopify specific naming
  sezzle.className = "sezzle-shopify-info-button sezzlewidgetindex-" + index;

  // not set in the config currently
  //if (this.ABTestClass) {
  //	sezzle.className += this.ABTestClass;
  //}

  this.insertWidgetTypeCSSClassInElement(sezzle, configGroupIndex);
  this.insertStoreCSSClassInElement(sezzle);
  this.setElementMargins(sezzle, configGroupIndex);
  if (this.scaleFactor) this.setWidgetSize(sezzle, configGroupIndex);

  var node = document.createElement('div');
  node.className = 'sezzle-checkout-button-wrapper sezzle-modal-link';
  node.style.cursor = 'pointer';
  this.insertStoreCSSClassInElement(node);
  this.addCSSAlignment(node, configGroupIndex);

  var sezzleButtonText = document.createElement('div');
  sezzleButtonText.className = 'sezzle-button-text';
  this.addCSSCustomisation(sezzleButtonText, configGroupIndex);

  this.configGroups[configGroupIndex].widgetTemplate.forEach(function (subtemplate) {
    switch (subtemplate) {
      case 'price':
        var priceSpanNode = document.createElement('span');
        priceSpanNode.className = 'sezzle-payment-amount sezzle-button-text sezzleindex-' + index;
        var priceValueText = document.createTextNode(this.getFormattedPrice(element, configGroupIndex));
        priceSpanNode.appendChild(priceValueText);
        sezzleButtonText.appendChild(priceSpanNode);
        break;

      case 'logo':
        var logoNode = document.createElement('img');
        logoNode.className = 'sezzle-logo ' + this.configGroups[configGroupIndex].imageClassName;
        logoNode.src = this.configGroups[configGroupIndex].imageURL;
        sezzleButtonText.appendChild(logoNode);
        this.setLogoSize(logoNode, configGroupIndex);
        break;
      // changed from learn-more to link as that is what current altVersionTemplates use
      case 'link':
        var learnMoreNode = document.createElement('span');
        learnMoreNode.className = 'sezzle-learn-more';
        var learnMoreText = document.createTextNode('Learn more');
        learnMoreNode.appendChild(learnMoreText);
        sezzleButtonText.appendChild(learnMoreNode);
        break;

      case 'info':
        var infoIconNode = document.createElement('code');
        infoIconNode.className = 'sezzle-info-icon';
        infoIconNode.innerHTML = '&#9432;';
        sezzleButtonText.appendChild(infoIconNode);
        break;

      case 'question-mark':
        var questionMarkIconNode = document.createElement('img');
        questionMarkIconNode.className = 'sezzle-question-mark-icon';
        questionMarkIconNode.src = 'https://d2uyik3j5wol98.cloudfront.net/images/question_mark_black.png';
        sezzleButtonText.appendChild(questionMarkIconNode);
        break;

      case 'afterpay-logo':
        var apNode = document.createElement('img');
        apNode.className = 'sezzle-afterpay-logo ap-modal-info-link no-sezzle-info';
        apNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/ap-logo-widget.png';
        sezzleButtonText.appendChild(apNode);
        break;

      case 'afterpay-logo-grey':
        var apNode = document.createElement('img');
        apNode.className = 'sezzle-afterpay-logo ap-modal-info-link no-sezzle-info';
        apNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/ap-logo-widget-grayscale.png';
        sezzleButtonText.appendChild(apNode);
        break;

      case 'afterpay-info-icon':
        var apInfoIconNode = document.createElement('code');
        apInfoIconNode.className = 'ap-modal-info-link no-sezzle-info';
        apInfoIconNode.innerHTML = '&#9432;';
        sezzleButtonText.appendChild(apInfoIconNode);
        break;

      case 'afterpay-link-icon':
        var apAnchor = document.createElement('a');
        apAnchor.href = this.configGroups[configGroupIndex].apLink;
        apAnchor.target = '_blank';
        var apLinkIconNode = document.createElement('code');
        apLinkIconNode.className = 'ap-info-link';
        apLinkIconNode.innerHTML = '&#9432;';
        apAnchor.appendChild(apLinkIconNode)
        sezzleButtonText.appendChild(apAnchor);
        break;

      case 'quadpay-logo':
        var qpNode = document.createElement('img');
        qpNode.className = 'sezzle-quadpay-logo quadpay-modal-info-link no-sezzle-info';
        qpNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/qp-logo-widget.png';
        sezzleButtonText.appendChild(qpNode);
        break;

      case 'quadpay-logo-grey':
        var qpNode = document.createElement('img');
        qpNode.className = 'sezzle-quadpay-logo quadpay-modal-info-link no-sezzle-info';
        qpNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/qp-logo-widget-grayscale.png';
        sezzleButtonText.appendChild(qpNode);
        break;

      case 'quadpay-logo-white':
        var qpNode = document.createElement('img');
        qpNode.className = 'sezzle-quadpay-logo quadpay-modal-info-link no-sezzle-info';
        qpNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/qp-logo-widget-white.png';
        sezzleButtonText.appendChild(qpNode);
        break;

      case 'quadpay-info-icon':
        var quadpayInfoIconNode = document.createElement('code');
        quadpayInfoIconNode.className = 'quadpay-modal-info-link no-sezzle-info';
        quadpayInfoIconNode.innerHTML = '&#9432;';
        sezzleButtonText.appendChild(quadpayInfoIconNode);
        break;

      case 'price-split':
        var priceSplitNode = document.createElement('span');
        priceSplitNode.className = 'sezzle-payment-amount sezzle-price-split sezzleindex-' + index;
        var priceElemTexts = element.textContent.split(this.configGroups[configGroupIndex].splitPriceElementsOn);
        var priceSplitText = '';
        if (priceElemTexts.length == 1) { //if the text is not being splitted (this check is needed in order to support sites with multiple types of product pricing)
          //give the original element in the case there might be some ignored elements present
          priceSplitText = this.getFormattedPrice(element, configGroupIndex);
        } else {
          var priceElems = [];
          priceElemTexts.forEach(function (text) {
            var priceElemSpan = document.createElement('span');
            priceElemSpan.textContent = text;
            priceElems.push(priceElemSpan);
          });
          priceElems.forEach(function (elem, index) {
            if (index == 0) {
              priceSplitText = this.getFormattedPrice(elem, configGroupIndex);
            } else {
              priceSplitText = priceSplitText + ' ' + this.configGroups[configGroupIndex].splitPriceElementsOn + ' ' + this.getFormattedPrice(elem, configGroupIndex);
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

  this.configGroups[configGroupIndex].customClasses.forEach(function (customClass) {
    if (customClass.xpath && customClass.className) {
      if (typeof (customClass.index) !== 'number') {
        customClass.index = -1; // set the default value
      }
      if (typeof (customClass.configGroupIndex) !== 'number') {
        customClass.configGroupIndex = -1; // set the default value
      }
      if (customClass.index === index || customClass.configGroupIndex === configGroupIndex) {
        var path = Helper.breakXPath(customClass.xpath);
        this.getElementsByXPath(path, 0, [sezzle])
          .forEach(function (el) {
            el.className += ' ' + customClass.className;
          })
      }
    }
  }.bind(this));

  // Adding sezzle to parent node
  if (this.configGroups[configGroupIndex].widgetIsFirstChild) {
    Helper.insertAsFirstChild(sezzle, parent);
  } else {
    Helper.insertAfter(sezzle, parent);
  }
  this.logEvent('onload', configGroupIndex);
  return sezzle;
}

/**
 * This function finds out the element where Sezzle's widget
 * will be rendered. By default it would return the parent element
 * of the given price element. If the over ride path is found and
 * it leads to a valid element then that element will be returned
 * @param element - This is the price element
 * @param index - Index of the config group that element belongs to
 * @return the element where Sezzle's widget will be rendered
 */
SezzleJS.prototype.getElementToRender = function (element, index) {
  var index = index || 0;
  var toRenderElement = null;

  if (this.configGroups[index].rendertopath !== null) {
    var path = Helper.breakXPath(this.configGroups[index].rendertopath);
    var toRenderElement = element;

    for (var i = 0; i < path.length; i++) {
      var p = path[i];

      if (toRenderElement === null) {
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
        this.configGroups[index].widgetIsFirstChild = true;
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
  return toRenderElement ? toRenderElement : element.parentElement; // return the element's parent if toRenderElement is null
}

/**
 * Is the product eligible for sezzle pay
 * @param price Price of product
 */
SezzleJS.prototype.isProductEligible = function (priceText, configGroupIndex) {
  var price = Helper.parsePrice(priceText);
  this.configGroups[configGroupIndex].productPrice = price;
  var priceInCents = price * 100;
  return priceInCents >= this.minPrice && priceInCents <= this.maxPrice;
}

/**
 * Gets price text
 * @param element Element that contains the price text
 */
SezzleJS.prototype.getPriceText = function (element, configGroupIndex) {
  if (this.configGroups[configGroupIndex].ignoredPriceElements == []) {
    return element.textContent;
  } else {
    this.configGroups[configGroupIndex].ignoredPriceElements.forEach(function (subpaths) {
      // get all elements pointed to by the xPath. Search is rooted at element
      this.getElementsByXPath(subpaths, 0, [element]).forEach(function (ignoredPriceElement) {
        //mark the element to be ignored
        ignoredPriceElement.classList.add('sezzle-ignored-price-element');
      });
    }.bind(this));
  }

  // if no ignored elements are found, return the whole inner text of the element
  if (!element.getElementsByClassName('sezzle-ignored-price-element').length) {
    return element.textContent;
  }

  // deep clone
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

  return clone.textContent;
}

/**
 * Formats a price as Sezzle needs it
 * @param element Element that contains price text
 */
SezzleJS.prototype.getFormattedPrice = function (element, configGroupIndex) {
  priceText = this.getPriceText(element, configGroupIndex);

  // Get the price string - useful for formtting Eg: 120.00(string)
  var priceString = Helper.parsePriceString(priceText, true);

  // Get the price in float from the element - useful for calculation Eg : 120.00(float)
  var price = Helper.parsePrice(priceText);

  // Will be used later to replace {price} with price / this.numberOfPayments Eg: ${price} USD
  var formatter = priceText.replace(priceString, '{price}');

  // replace other strings not wanted in text
  this.configGroups[configGroupIndex].ignoredFormattedPriceText.forEach(function (ignoredString) {
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
SezzleJS.prototype.mutationCallBack = function (mutations, configGroupIndex) {
  mutations
    .filter(function (mutation) { return mutation.type === 'childList' })
    .forEach(function (mutation) {
      try {
        var priceIndex = mutation.target.dataset.sezzleindex;
        var price = this.getFormattedPrice(mutation.target, configGroupIndex);
        var sezzlePriceElement = document.getElementsByClassName('sezzleindex-' + priceIndex)[0];
        if (sezzlePriceElement) {
          if (!/\d/.test(price)) {
            sezzlePriceElement.parentElement.parentElement.parentElement.classList.add('sezzle-hidden');
          } else {
            sezzlePriceElement.parentElement.parentElement.parentElement.classList.remove('sezzle-hidden');
          }
          sezzlePriceElement.textContent = price;
        }
      } catch(e) {
        console.warn(e);
      }
    }.bind(this));
};

/**
 * This function starts observing for change
 * in given Price element
 * @param element to be observed
 * @return void
 */
SezzleJS.prototype.startObserve = function (element, callback) {
  // TODO : Need a way to unsubscribe to prevent memory leak
  // Deleted elements should not be observed
  // That is handled
  var observer = new MutationObserver(callback);
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
      modalNode.innerHTML = '<style>@import url("https://fonts.googleapis.com/css?family=Raleway:500,700");.sezzle-no-thanks:hover {transition: 0.15s; cursor: pointer;} @media (max-width: 650px) { .sezzle-modal { position: relative; top: 0 !important; left: 0; padding: 50px 0px 0px; height: 100%; max-width: 100%; min-width: 320px; overflow: auto; margin-left: -50% !important; margin-top: 0 !important; } .sezzle-modal-logo{ margin-left: 30% !important; } .bg_footer {height: 140px !important; padding: 20px 30px !important; } .sezzle-footer-text-link { line-height: 1.68 !important; padding-bottom: 0 !important;}} @media(height: 812px) {.sezzle-modal {height: 95%;}} @media(height: 823px) {.sezzle-modal {height: 90%;}}@media (max-width: 320px) { .bg_footer { height: 140px !important; } </style> <div class="sezzle-checkout-modal-hidden"> <div class="sezzle-modal" id="sezzle-modal" style="position: fixed; top: 50%; left: 50%; margin-top: -340px; margin-left: -220px; z-index:99999998;background-color:#fff; box-shadow: 0 10px 20px rgba(5, 31, 52, 0.19), 0 6px 6px rgba(5, 31, 52, 0.2); color: #000; text-transform: none; font-family: Raleway; transition: all 0.4s ease; max-width: 440px;"> <div class="top-content" style="padding: 30px 30px 20px;"> <div class="sezzle-row"><img src="https://sezzlemedia.s3.amazonaws.com/branding/sezzle-logos/sezzle-logo.svg" class="sezzle-modal-logo" style="width: 120px; height: auto; margin-bottom: 20px; margin-left: 125px;"><span style="font-size: 40pt; color: #b6bdc4; text-transform: none; font-family: Raleway, sans-serif; opacity: 0.6; transition: 0.15s; position: absolute; top: 15px; right: 40px;" onmouseout="this.style.color=\"#b6bdc4\"" onmouseover="this.style.color=\"rgba(23, 23, 23, 0.6)\"" class="sezzle-no-thanks close-sezzle-modal">×</span> </div> <div class="sezzle-modal-title-top"> <div class="sezzle-modal-title-text-center" style="text-transform: none; font-family: Raleway; font-size: 18px; font-weight: 500; line-height: 1.24; text-align: center; color: #000000; margin-bottom: 20px; margin-top: 10px">Split your purchase into four <br />easy installments</div> </div> <div class="sezzle-row modal-point"> <div class="sezzle-modal-icon" style="text-align: center;"> <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"> <g fill="none" fill-rule="evenodd"> <path fill="#FFF" d="M0 0h60v60H0z" /> <path fill="#000" d="M26.817 37.549a2.69 2.69 0 0 1-1.738.629 2.687 2.687 0 0 1-1.9-.772 2.552 2.552 0 0 1-.797-1.858c0-.693.277-1.328.723-1.793-.84-.944-1.059-2.071-.833-3.071a3.314 3.314 0 0 1 1.95-2.329c1.023-.422 2.307-.358 3.638.535 1.482.993 2.915 2 4.287 3.007.79.578 1.548 1.157 2.28 1.729V8.29c0-.514-.212-.97-.556-1.307a1.908 1.908 0 0 0-1.336-.543H17.619c-.526 0-.993.207-1.337.543a1.814 1.814 0 0 0-.555 1.307v29.385c0 .508.212.971.555 1.307.344.336.811.543 1.337.543h10.818a36.082 36.082 0 0 0-1.6-1.95l-.022-.029.002.002zm9.554-2.692l2.045 2c.41.4.416 1.057 0 1.465a1.088 1.088 0 0 1-1.504.008l-1.826-1.793a.893.893 0 0 1-.314-.172 74.55 74.55 0 0 0-3.783-2.95 115.381 115.381 0 0 0-4.23-2.964c-.71-.478-1.328-.535-1.782-.35a1.282 1.282 0 0 0-.511.385 1.49 1.49 0 0 0-.3.608c-.116.492.03 1.07.533 1.55 1.345 1.277 2.52 2.457 3.616 3.7a36.874 36.874 0 0 1 2.835 3.67.907.907 0 0 1 .38.622.817.817 0 0 1 .052.293c0 .043 0 .086-.008.129.146 1.4.387 2.457.817 3.377.468.987 1.169 1.864 2.22 2.865.38.363.393.965.022 1.336a.985.985 0 0 1-1.373.021c-1.22-1.164-2.052-2.213-2.623-3.436-.46-.979-.745-2.036-.921-3.335l-5.981.043c-.432.008-.694.193-.812.443l-.014.051a1.333 1.333 0 0 0-.073.565c.022.215.08.422.181.6.182.328.52.556.965.492.564-.086.927-.15 1.243-.2 1.293-.228 1.95-.341 3.586-.042.308.056.577.25.71.543.533 1.172 1.358 2.25 2.307 3.243.965 1.008 2.074 1.942 3.162 2.82a.94.94 0 0 1 .336.415l.388.95.241.629c.498.5 2.651.37 4.785-.086.913-.194 1.79-.45 2.541-.758.702-.293 1.285-.622 1.637-.966.19-.177.285-.336.255-.443a.742.742 0 0 1-.074-.242 173.42 173.42 0 0 0-.687-3.878c-.643-3.529-1.023-5.564-.86-10.014a2.648 2.648 0 0 0-.578-1.75c-.416-.544-1.06-1.015-1.796-1.45-1.359-.794-2.082-2.028-2.805-3.279-.556-.957-1.125-1.928-2.002-2.55v7.837-.002zm-6.444-13.642c0-4-5.98-2.908-5.98-4.822 0-.535.503-.8 1.242-.8.92 0 2.425.472 3.622 1.152l1.08-2.2c-.97-.614-2.293-1.057-3.651-1.2V11.09h-2.134v2.336c-1.958.364-3.185 1.536-3.185 3.23 0 3.92 5.982 2.75 5.982 4.706 0 .635-.57.965-1.477.965-1.176 0-2.92-.664-4.083-1.656l-1.117 2.164c1.037.836 2.425 1.436 3.878 1.657v2.45h2.133v-2.386c2.118-.236 3.688-1.379 3.688-3.335l.002-.005zm-5.91 13.435a1.344 1.344 0 0 0 .067 1.865c.255.25.605.4.993.4a1.4 1.4 0 0 0 .883-.306 46.848 46.848 0 0 0-1.944-1.957l.002-.002zm16.033-6.014c.6 1.036 1.19 2.05 2.118 2.593.927.543 1.752 1.164 2.345 1.936.644.82 1.01 1.785.965 2.942-.146 4.265.212 6.22.84 9.622.197 1.1.43 2.342.67 3.813.336.9.03 1.721-.715 2.436-.533.514-1.322.971-2.25 1.35-.876.364-1.877.664-2.878.88-2.907.613-6.025.478-6.873-.815a1.24 1.24 0 0 1-.102-.207 13.763 13.763 0 0 0-.264-.686l-.285-.715c-1.089-.88-2.206-1.829-3.207-2.872-.965-1.014-1.818-2.1-2.44-3.292-.97-.135-1.497-.043-2.416.113-.394.073-.856.15-1.301.215-1.373.207-2.39-.478-2.937-1.457a3.347 3.347 0 0 1-.41-1.336 2.983 2.983 0 0 1 .176-1.393l.036-.094c.036-.078.074-.164.116-.242h-3.622a3.864 3.864 0 0 1-2.709-1.1 3.695 3.695 0 0 1-1.125-2.65V8.293c0-1.036.432-1.972 1.125-2.65a3.864 3.864 0 0 1 2.71-1.1h14.915c1.05 0 2.008.422 2.709 1.1a3.719 3.719 0 0 1 1.125 2.65V24.87c1.93.743 2.815 2.265 3.684 3.765z" /> <path fill="#CEF3DA" d="M17.619 6.441c-1.49.8-.932-1.321-1.892 3.215-.96 4.535.17 28.8.675 29.87.32.683 7.218-.404 12.283-1.28 1.198-.208-3.386-.476-5.01-2.089-.538-.532 1.814-2.138 1.402-2.708-1.342-1.855-.76-3.897-.692-3.897.03 0 1.84-.03 3.447.97 2.893 1.8 6.37 4.984 6.418 3.797.294-7.28.424-25.365-.245-26.268-.839-1.131-5.06-2.068-6.173-2.068-.377 0-3.011.548-4.158.458-2.242-.176-5.07-.53-6.055 0z" style="mix-blend-mode:multiply" /> </g> </svg> </div> <div class="col-xs-12 col-sm-12 modal-description"> <h2 class="sezzle-header" style="text-transform: none; font-family: Raleway; font-size: 16px; font-weight: 700; text-align: center; color: #000000;">No Interest</h2> <p class="sezzle-description" style="text-transform: none; font-family: Raleway; font-size: 14px; font-weight: 500; line-height: 1.29; text-align: center; color: #44474b; margin-bottom: 20px;">Sezzle is FREE. You only pay the purchase price.</p> </div> </div> <div class="sezzle-row modal-point"> <div class="sezzle-modal-icon" style="text-align: center;"> <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"> <g fill="none" fill-rule="evenodd"> <path fill="#FFF" d="M0 0h60v60H0z" /> <path fill="#000" d="M17.65 10.445a1.11 1.11 0 0 0-1.007 1.111v3.335h-6.112v-.002h-.104A1.112 1.112 0 0 0 9.419 16v26.676a1.11 1.11 0 0 0 1.112 1.112h37.787a1.11 1.11 0 0 0 1.112-1.112V16c0-.612-.497-1.109-1.112-1.111h-6.112v-3.335.002a1.11 1.11 0 0 0-1.008-1.111.833.833 0 0 0-.104 0H36.65a1.11 1.11 0 0 0-1.112 1.111v3.335H23.312v-3.335a1.11 1.11 0 0 0-1.112-1.111h-4.445a.833.833 0 0 0-.104 0zm1.216 2.223h2.223v6.669h-2.223v-6.669zm18.894 0h2.223v6.669H37.76v-6.669zm-26.118 4.446h5.001v3.335-.003a1.11 1.11 0 0 0 1.112 1.112H22.2a1.11 1.11 0 0 0 1.112-1.112v-3.334h12.225v3.334a1.11 1.11 0 0 0 1.112 1.112h4.445a1.11 1.11 0 0 0 1.112-1.112v-3.334h5v6.669H11.643v-6.67.003zm0 8.892h35.565v15.561H11.642V26.006zm6.669 3.89c-2.749 0-5.002 2.254-5.002 5.002 0 2.748 2.253 5.002 5.002 5.002 2.366 0 4.352-1.672 4.862-3.89h6.251l-1.77 1.32v-.003a1.111 1.111 0 1 0 1.319 1.79l4.446-3.335a1.114 1.114 0 0 0 0-1.789l-4.446-3.335a1.111 1.111 0 0 0-1.32 1.789l1.771 1.337h-6.251c-.51-2.218-2.496-3.89-4.862-3.89v.002zm18.789.556v-.002a1.112 1.112 0 0 0-1.007 1.111v6.67a1.11 1.11 0 0 0 1.111 1.11h6.668a1.11 1.11 0 0 0 1.112-1.11v-6.67a1.11 1.11 0 0 0-1.112-1.111h-6.668a.836.836 0 0 0-.104 0v.002zm-18.79 1.665a2.762 2.762 0 0 1 2.779 2.779 2.762 2.762 0 0 1-2.778 2.779 2.762 2.762 0 0 1-2.779-2.78 2.762 2.762 0 0 1 2.779-2.778zm20.006.556h4.445v4.446h-4.445v-4.446z" /> <path fill="#CEF3DA" d="M37.675 29.77c11.08-.709 1.72 11.614.421.377M17.15 31.12c-10.537 9.838 9.471 7.32 2.828.555l-2.827-.556zM44.984 17.171c-.8-1.49-.628.122-5.16-.84-4.532-.96-28.776.171-29.846.676-.682.321.403 7.224 1.28 12.294.207 1.198.475-3.389 2.086-5.016.532-.537 2.137 1.817 2.707 1.404 1.853-1.343 3.893-.76 3.893-.692 0 .03 4.645-2.32 3.646-.712-1.8 2.896 23.617 1.114 23.617 0 0-.377-.09-.41 0-1.558.176-2.243-1.694-4.57-2.223-5.556z" style="mix-blend-mode:multiply" /> </g> </svg> </div> <div class="col-xs-12 col-sm-12 modal-description"> <h2 class="sezzle-header" style="text-transform: none; font-family: Raleway; font-size: 16px; font-weight: 700; text-align: center; color: #000000;">Need to Reschedule?</h2> <p class="sezzle-description" style="text-transform: none; font-family: Raleway; font-size: 14px; font-weight: 500; line-height: 1.29; text-align: center; color: #44474b; margin-bottom: 20px">It happens! Reschedule your first payment for free.</p> </div> </div> <div class="sezzle-row modal-point"> <div class="sezzle-modal-icon" style="text-align: center;"> <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"> <g fill="none" fill-rule="evenodd"> <path fill="#FFF" d="M0 0h60v60H0z" /> <path fill="#000" d="M45.369 20.02v-.06c0-.06 0-.06-.063-.117 0-.059-.063-.059-.063-.116 0 0 0-.06-.063-.06-.063-.059-.063-.116-.123-.116l-5.578-5.259a1.18 1.18 0 0 0-.744-.292H23.487c-.31 0-.556.116-.743.292l-5.578 5.26c-.063.059-.063.116-.123.116l-.063.059c0 .06-.063.06-.063.116 0 .06 0 .06-.063.117v22.265c0 .524.496.992 1.053.992h3.965c.124 0 .187 0 .31-.06.31 1.87 2.046 3.331 4.152 3.331 2.046 0 3.782-1.401 4.092-3.273H46.79c.373 1.87 2.046 3.273 4.092 3.273 2.045 0 3.781-1.401 4.091-3.273h3.162c.557 0 1.053-.468 1.053-.993V31.88c0-2.63-.806-4.851-2.292-6.369-1.426-1.46-3.41-2.22-5.641-2.22H45.43v-3.098c-.061-.057-.061-.114-.061-.174zM31.98 15.987h6.322l3.471 3.273H31.98v-3.273zm-8.118 0h5.951v3.273h-9.42l3.47-3.273zm2.356 28.574c-1.116 0-2.046-.877-2.046-1.93 0-1.052.93-1.928 2.046-1.928 1.116 0 2.046.876 2.046 1.929-.003 1.052-.932 1.929-2.046 1.929zM43.2 24.285v17.006H30.493c-.123 0-.247 0-.31.06-.556-1.578-2.106-2.69-3.965-2.69-1.86 0-3.409 1.169-3.966 2.69a1.181 1.181 0 0 0-.433-.117h-2.852V21.19h24.295v3.095h-.063zm7.56 20.277c-1.115 0-2.045-.877-2.045-1.93 0-1.052.93-1.928 2.046-1.928 1.116 0 2.046.876 2.046 1.929 0 1.052-.93 1.929-2.046 1.929zm.434-19.284c3.595 0 5.825 2.513 5.825 6.604v9.35h-2.293c-.556-1.52-2.106-2.63-3.965-2.63-1.797 0-3.346 1.11-3.905 2.63h-1.426V25.277h5.764zM5.578 24.81h8.12c.557 0 1.054.468 1.054.993 0 .525-.497.993-1.053.993h-8.12c-.558 0-1.054-.468-1.054-.993 0-.525.494-.993 1.053-.993zM0 31.238c0-.525.496-.993 1.053-.993h12.582c.557 0 1.054.468 1.054.993 0 .525-.497.993-1.054.993H1.053C.496 32.23 0 31.822 0 31.238zm14.752 5.435c0 .525-.497.993-1.054.993h-8.12c-.557 0-1.053-.468-1.053-.993 0-.525.496-.993 1.053-.993h8.12c.618 0 1.054.409 1.054.993zm9.42-5.319c0-.525.496-.993 1.053-.993h8.18l-1.426-1.344c-.433-.409-.433-1.052 0-1.402.434-.408 1.116-.408 1.487 0l3.222 3.039c.063.059.063.116.124.116 0 0 0 .06.063.06 0 .059.063.059.063.116 0 .06 0 .06.063.116v.471c0 .059 0 .059-.063.116 0 .06-.063.06-.063.116 0 0 0 .06-.063.06-.063.059-.063.116-.124.116l-3.409 3.214a1.18 1.18 0 0 1-.743.292 1.18 1.18 0 0 1-.743-.292c-.433-.409-.433-1.052 0-1.402l1.612-1.52-8.18-.002c-.557.119-1.053-.35-1.053-.877z" /> <path fill="#CEF3DA" d="M20.697 20.563c-2.038.49-1.275-.81-2.588 1.97-1.314 2.78.233 17.651.922 18.307.44.418 9.556.401 16.485-.136 1.638-.127 5.396-.477 7.594.136 3.958 1.104.27-2.464.335-3.191.402-4.462.58-15.546-.335-16.1-1.147-.693-6.922-1.267-8.444-1.267-.515 0-4.118.336-5.687.28-3.066-.107-6.935-.324-8.282 0z" style="mix-blend-mode:multiply" /> </g> </svg> </div> <div class="col-xs-12 col-sm-12 modal-description"> <h2 class="sezzle-header" style="text-transform: none; font-family: Raleway; font-size: 16px; font-weight: 700; text-align: center; color: #000000;">Shipped Right Away</h2> <p class="sezzle-description" style="text-transform: none; font-family: Raleway; font-size: 14px; font-weight: 500; line-height: 1.29; text-align: center; color: #44474b; margin-bottom: 25px;">Your order is processed and shipped right away.</p> </div> </div> <div class="bg_footer" style="margin: 40px -30px -30px; padding-top: 20px; height: auto; background-color: #f4f4f4;"> <div class="sezzle-buy-now" style=" height: 24px; text-transform: none; font-family: Raleway; font-size: 16px; font-weight: 500; letter-spacing: 1.6px; text-align: center; color: #000000;">BUY NOW. <span class="sezzle-bold-pay-later" style="height: 24px; text-transform: none; font-family: Raleway; font-size: 16px; font-weight: 700; letter-spacing: 1.6px; text-align: center; color: #000000;">PAY LATER.</span></div> <div class="sezzle-footer-select-text" style="height: 31.3px; text-transform: none; font-family: Raleway, sans-serif; font-size: 16px; font-weight: 700; text-align: center; color: #000000;">Just Select Sezzle at Checkout </div> <div class="sezzle-footer-text-link" style="text-transform: none; font-family: Raleway, sans-serif; font-size: 9px; font-weight: 500; line-height: 1.48; text-align: center; color: #44474b; margin: 0 25px; padding-bottom: 25px;">Subject to approval. Estimated payment amount excludes taxes and shipping fees. Your actual installment payments will be presented for confirmation in your checkout with Sezzle. </div> </div> </div>'
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
      modalNode.getElementsByClassName('sezzle-modal')[0].className = 'sezzle-modal sezzle-checkout-modal-hidden';
    });
  });

  // Event listener to prevent close in modal if click happens within sezzle-checkout-modal
  let sezzleModal = document.getElementsByClassName('sezzle-modal')[0]
  // backwards compatability check
  if (!sezzleModal) sezzleModal = document.getElementsByClassName('sezzle-checkout-modal')[0]
  sezzleModal.addEventListener('click', function (event) {
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
  let sezzleModal = document.getElementsByClassName('sezzle-modal')[0]
  // backwards compatability check
  if (!sezzleModal) sezzleModal = document.getElementsByClassName('sezzle-checkout-modal')[0]
  sezzleModal.addEventListener('click', function (event) {
    // stop propagating the event to the parent sezzle-checkout-modal-lightbox to prevent the closure of the modal
    event.stopPropagation();
  });
}

/**
 * This function renders the Quadpay modal based on if you include quadpay-modal-info-link
 * Also adds the event for open and close modals
 * to respective buttons
 */
SezzleJS.prototype.renderQPModal = function () {
  var modalNode = document.createElement('div');
  modalNode.className = 'sezzle-checkout-modal-lightbox close-sezzle-modal sezzle-qp-modal';
  modalNode.style = 'position: center';
  modalNode.style.display = 'none';
  modalNode.innerHTML = this.qpModalHTML;
  document.getElementsByTagName('html')[0].appendChild(modalNode);

  // Event listener for close in modal
  Array.prototype.forEach.call(document.getElementsByClassName('close-sezzle-modal'), function (el) {
    el.addEventListener('click', function () {
      // Display the modal node
      modalNode.style.display = 'none';
    });
  });

  // Event listener to prevent close in modal if click happens within sezzle-checkout-modal
  let sezzleModal = document.getElementsByClassName('sezzle-modal')[0]
  // backwards compatability check
  if (!sezzleModal) sezzleModal = document.getElementsByClassName('sezzle-checkout-modal')[0]
  sezzleModal.addEventListener('click', function (event) {
    // stop propagating the event to the parent sezzle-checkout-modal-lightbox to prevent the closure of the modal
    event.stopPropagation();
  });
}

/**
 * This function add events to the button in sezzle widget
 * to open the modal
 */
SezzleJS.prototype.addClickEventForModal = function (sezzleElement, configGroupIndex) {
  var modalLinks = sezzleElement.getElementsByClassName('sezzle-modal-link');
  Array.prototype.forEach.call(modalLinks, function (modalLink) {
    modalLink.addEventListener('click', function (event) {
      if (!event.target.classList.contains('no-sezzle-info')) {
        var modalNode = document.getElementsByClassName('sezzle-checkout-modal-lightbox')[0];
        // Show modal node
        modalNode.style.display = 'block';
        // Remove hidden class to show the item
        modalNode.getElementsByClassName('sezzle-modal')[0].className = 'sezzle-modal';
        // log on click event
        this.logEvent('onclick', configGroupIndex);
      }
    }.bind(this));
  }.bind(this));

  // for AfterPay
  var apModalLinks = sezzleElement.getElementsByClassName('ap-modal-info-link');
  Array.prototype.forEach.call(apModalLinks, function (modalLink) {
    modalLink.addEventListener('click', function () {
      // Show modal node
      document.getElementsByClassName('sezzle-ap-modal')[0].style.display = 'block';
      // log on click event
      this.logEvent('onclick-afterpay', configGroupIndex);
    }.bind(this));
  }.bind(this));

  // for QuadPay
  var qpModalLinks = sezzleElement.getElementsByClassName('quadpay-modal-info-link');
  Array.prototype.forEach.call(qpModalLinks, function (modalLink) {
    modalLink.addEventListener('click', function () {
      // Show modal node
      document.getElementsByClassName('sezzle-qp-modal')[0].style.display = 'block';
      // log on click event
      this.logEvent('onclick-quadpay', configGroupIndex);
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
        if (typeof (body) === 'string') body = JSON.parse(body);
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
 * Hide elements pointed to by this.hideClasses
 */
SezzleJS.prototype.hideSezzleHideElements = function (configGroupIndex) {
  this.configGroups[configGroupIndex].hideClasses.forEach(function (subpaths) {
    this.getElementsByXPath(subpaths).forEach(function (element) {
      if (!element.classList.contains('sezzle-hidden')) {
        element.classList.add('sezzle-hidden');
      }
    })
  }.bind(this));
}


/*
* Log Event
*/
SezzleJS.prototype.logEvent = function (eventName, configGroupIndex) {
  // We only log event when it's allowed to
  if (document.sezzleConfig && !document.sezzleConfig.noTracking) {
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

    } catch (error) {
      // unable to fetch viewport dimensions
      console.log(error);
    }
    var sezzleConfigStr = null
    if (document.sezzleConfig) {
      sezzleConfigStr = JSON.stringify(document.sezzleConfig);
    }
    var win = window.frames.szl;
    if (win) {
      var cartId = this.getCookie('cart');
      var merchantID = this.merchantID;
      var productPrice = configGroupIndex !== undefined ? this.configGroups[configGroupIndex].productPrice : null;
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
      }, 100);
    }
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
  // no widget to render
  if (!this.configGroups.length) return;

  // Check if the widget should be shown
  if (this.forcedShow) {
    // show the widget
    this.logEvent('request');
    this.loadCSS(this.initWidget.bind(this));
    this.getCountryCodeFromIP(function (countryCode) {
      // only inject Google tag manager for clients visiting from the United States or Canada
      if (countryCode === 'US' || 'CA') {
        var win = window.frames.szl;
        if (win && !document.sezzleConfig.noGtm) {
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
        // only inject Google tag manager for clients visiting from the United States or Canada
        if (countryCode === 'US' || 'CA') {
          var win = window.frames.szl;
          if (win && !document.sezzleConfig.noGtm) {
            setTimeout(function () {
              win.postMessage('initGTMScript', 'https://tracking.sezzle.com');
            }, 100);
          }
        }
      }
    }.bind(this));
  }
}

/**
 * This function start an observation on related elements to the price element
 * for any change and perform an action based on that
 */
SezzleJS.prototype.observeRelatedElements = function (priceElement, sezzleElement, targets) {
  if (targets) {
    targets.forEach(function (target) {
      if (typeof (target.relatedPath) === 'string' &&
        (typeof (target.action) === 'function' || typeof (target.initialAction) === 'function')) {
        var elements = this.getElementsByXPath(
          Helper.breakXPath(target.relatedPath),
          0,
          [priceElement]
        );
        if (elements.length > 0) {
          if (typeof (target.action) === 'function') {
            this.startObserve(elements[0], function (mutation) {
              target.action(mutation, sezzleElement);
            });
          }
          if (typeof (target.initialAction) === 'function') {
            target.initialAction(elements[0], sezzleElement);
          }
        }
      }
    }.bind(this));
  }
}

/**
 * All steps required to show the widget
 */
SezzleJS.prototype.initWidget = function () {
  const intervalInMs = 2000;
  var els = [];

  // only render the modal once for all widgets
  function renderModals() {
    // This should always happen before rendering the widget
    this.renderModal();
    // only render APModal if ap-modal-link exists
    if (document.getElementsByClassName('ap-modal-info-link').length > 0) {
      this.renderAPModal();
    }
    // only render QPModal if ap-modal-link exists
    if (document.getElementsByClassName('quadpay-modal-info-link').length > 0) {
      this.renderQPModal();
    }
  };

  function sezzleWidgetCheckInterval() {
    // Look for newly added price elements
    this.configGroups.forEach(function (configGroup, index) {
      if (configGroup.xpath === []) return;
      this.getElementsByXPath(configGroup.xpath).forEach(function (e) {
        if (!e.hasAttribute('data-sezzleindex')) {
          els.push({
            element: e,
            toRenderElement: this.getElementToRender(e, index),
            deleted: false,
            observer: null,
            configGroupIndex: index
          });
        }
      }.bind(this));
    }.bind(this));
    // add the sezzle widget to the price elements
    els.forEach(function (el, index) {
      if (!el.element.hasAttribute('data-sezzleindex')) {
        var sz = this.renderAwesomeSezzle(
          el.element, el.toRenderElement,
          index, el.configGroupIndex
        );
        if (sz) {
          el.observer = this.startObserve(el.element, function (mutations) {
            this.mutationCallBack.bind(this)(mutations, el.configGroupIndex);
          }.bind(this));
          this.addClickEventForModal(sz, el.configGroupIndex);
          this.observeRelatedElements(el.element, sz, this.configGroups[el.configGroupIndex].relatedElementActions);
        } else { // remove the element from the els array
          delete els[index];
        }
      }
    }.bind(this));
    // refresh the array
    els = els.filter(function (e) {
      return e !== undefined;
    })

    // Find the deleted price elements
    // remove corresponding Sezzle widgets if exists
    els.forEach(function (el, index) {
      if (el.element.parentElement === null && !el.deleted) { // element is deleted
        // Stop observing for changes in the element
        if (el.observer !== null) el.observer.disconnect();
        // Mark that element as deleted
        el.deleted = true;
        // Delete the corresponding sezzle widget if exist
        var tmp = document.getElementsByClassName("sezzlewidgetindex-" + index);
        if (tmp.length) {
          var sw = tmp[0];
          sw.parentElement.removeChild(sw);
        }
      }
    });

    // Hide elements ex: afterpay
    for (var index = 0, len = this.configGroups.length; index < len; index++) {
      this.hideSezzleHideElements(index);
    }

    setTimeout(sezzleWidgetCheckInterval.bind(this), intervalInMs)
  };

  var allConfigsUsePriceClassElement = true;
  this.configGroups.forEach(function (configGroup, index) {
    if (configGroup.hasPriceClassElement) {
      var sz = this.renderAwesomeSezzle(configGroup.priceElements[0], configGroup.renderElements[0], 0, index);
      this.startObserve(configGroup.priceElements[0], function (mutations) {
        this.mutationCallBack.bind(this)(mutations, index);
      });
    } else {
      allConfigsUsePriceClassElement = false;
    }
  }.bind(this));

  if (!allConfigsUsePriceClassElement) sezzleWidgetCheckInterval.call(this);
  renderModals.call(this);
}

module.exports = SezzleJS;

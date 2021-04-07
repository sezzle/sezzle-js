import Helper from './helper';
import Utils from './classBased/utils';

const SezzleJS = function (options) {
  if (!options) options = {};
  // Convert to new config if options passed in is old config
  var isOldConfig = typeof (options.configGroups) === 'undefined';
  if (isOldConfig) options = Helper.makeCompatible(options);
  // Validate config structure
  Helper.validateConfig(options);
  // filter off config groups which do not match the current URL
  options.configGroups = options.configGroups.filter(function (configGroup) {
    // if no URL match is provided, consider the group for backwards compatability reasons
    return !configGroup.urlMatch || RegExp(configGroup.urlMatch).test(window.location.href);
  });
  // config
  this.config = options;
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
  // if doing widget with both Sezzle or affirm - the modal to display:
  this.affirmModalHTML = options.affirmModalHTML || '';
  // countries widget should show in
  this.supportedCountryCodes = options.supportedCountryCodes || ['US', 'IN', 'CA'];
  // Non configurable options
  this._config = { attributes: true, childList: true, characterData: true };
  // URL to request to get ip of request
  this.countryFromIPRequestURL = `${Utils.getGeoIpBaseUrl()}/v1/geoip/ipdetails`;
  // URL to request to get css details
  this.cssForMerchantURL = `${Utils.getWidgetBaseUrl()}/v1/css/price-widget?uuid=${this.merchantID}`;
  // no tracking
  this.noTracking = !!options.noTracking;
  // no gtm
  this.noGtm = !!options.noGtm;
  // Variables set by the js
  this.countryCode = null;
  this.ip = null;
  this.fingerprint = null;
  // Widget Language
  this.browserLanguage = navigator.language || navigator.browserLanguage || 'en';
  this.browserLanguage = this.browserLanguage.substring(0, 2).toLowerCase();
  switch (typeof (options.language)) {
    case 'string':
      this.language = options.language;
      break;
    case 'function':
      this.language = options.language();
      break;
    default:
      this.language = this.browserLanguage;
  }
  if (this.language !== 'en' && this.language !== 'fr') {
    this.language = this.browserLanguage;
  }
  // map config group props
  this.configGroups = [];
  options.configGroups.forEach(function (configGroup) {
    this.configGroups.push(Helper.mapGroupToDefault(configGroup, options.defaultConfig, this.numberOfPayments, this.language));
  }.bind(this));
};

/**
 * This function fetches all the elements that is pointed to by the given xpath
 * @param xindex - Current xpath index value to be resolved [initial value is always 0]
 * @param elements - Array of current elements to be resolved [initial value is the element root(s) of the search path]
 *
 * @return All the elements which are pointed to by the xpath
 */
SezzleJS.prototype.getElementsByXPath = function (xpath = [], xindex = 0, elements = null) {
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
          element.replaceChild(newSpan, childElement);
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

  children = children.filter(function (c) { return c !== null; });
  return this.getElementsByXPath(xpath, xindex + 1, children);
};

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
    link.href = 'https://media.sezzle.com/shopify-app/assets/' + version;
    head.appendChild(link);
    link.onload = callback;
  }.bind(this));
};

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
      newAlignment = this.configGroups[configGroupIndex].alignmentSwitchType;
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
      break;
    default: ;
  }
};

/**
 * Guesses the widget alignment based on the
 * @param priceElement price element to add the widgets to, the target element
 * this method is based on the belief that the widget alignment should follow the text-align property of the price element
 */
SezzleJS.prototype.guessWidgetAlignment = function (priceElement) {
  if (!priceElement) return 'left'; //default
  var textAlignment = window.getComputedStyle(priceElement).textAlign;
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
};

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
  element.style.lineHeight = this.configGroups[configGroupIndex].lineHeight || '13px';

};

/**
 * Add CSS width class as required
 * @param element Element to add to
 * @param configGroupIndex index of the config group that element belongs to
 */

SezzleJS.prototype.addCSSWidth = function (element, configGroupIndex) {
  if (this.configGroups[configGroupIndex].maxWidth) {
    element.style.maxWidth = this.configGroups[configGroupIndex].maxWidth + 'px';
  }
};

/**
 * Add CSS text color as required
 * @param element Element to add to
 * @param configGroupIndex index of the config group that element belongs to
 */
SezzleJS.prototype.addCSSTextColor = function (element, configGroupIndex) {
  if (this.configGroups[configGroupIndex].textColor) {
    element.style.color = this.configGroups[configGroupIndex].textColor;
  }
};

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
  }
};

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
};

/**
 * Insert css class name in element
 * @param element to add class to
 */
SezzleJS.prototype.insertStoreCSSClassInElement = function (element) {
  element.className += ' sezzle-' + this.merchantID;
};


/**
 * This function will render the checkout button
 * @param configGroupIndex - Connfig group index
 *
 */
SezzleJS.prototype.createSezzleButton = function (configGroupIndex) {
  var checkoutButton = document.getElementsByName('checkout')[0]
  var checkoutButtonParent = checkoutButton  ? checkoutButton.parentElement : null;
  if (checkoutButtonParent) {
    const buttonConfig = this.configGroups[configGroupIndex].sezzleCheckoutButton;
    var sezzleCheckoutButton = document.createElement('button');
    sezzleCheckoutButton.innerHTML = this.parseButtonTemplate(buttonConfig.template, buttonConfig.theme);
    switch (buttonConfig.borderType) {
      case 'square':
        sezzleCheckoutButton.style.borderRadius = '0px';
        break;
      case 'semi-rounded':
        sezzleCheckoutButton.style.borderRadius = '5px';
        break;
      default:
        sezzleCheckoutButton.style.borderRadius = '300px';
    }
    // Adding styles to the button
    sezzleCheckoutButton.classList.add('sezzle-checkout-button');
    sezzleCheckoutButton.classList.add(`sezzle-button-${buttonConfig.theme}`);
    sezzleCheckoutButton.style.paddingLeft = buttonConfig.paddingX;
    sezzleCheckoutButton.style.paddingRight = buttonConfig.paddingX;
    this.embedButtonFont();
    sezzleCheckoutButton.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      location.replace('/checkout');
    });
    checkoutButtonParent.append(sezzleCheckoutButton);
  }
}

/**
 * This function will load comforta to DOM for the button
 */
SezzleJS.prototype.embedButtonFont = function () {
  var link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('type', 'text/css');
  link.setAttribute('href', 'https://fonts.googleapis.com/css?family=Comfortaa&display=swap" rel="stylesheet');
  document.head.appendChild(link);
}

/**
 * This function will parse template buttonConfig to generate inner html of the button
 * @param template - Template of the newly created button
 * @param theme -  Theme of the button supplied in the config
 * @return templateString  -  Inner Html of the button
 */
SezzleJS.prototype.parseButtonTemplate = function (template, theme) {
  const sezzleImage = {
    light: 'https://media.sezzle.com/branding/2.0/Sezzle_Logo_FullColor_WhiteWM.svg',
    dark: 'https://media.sezzle.com/branding/2.0/Sezzle_Logo_FullColor.svg'
  };
  var chosenImage = sezzleImage[theme]
  const templateArray = template.split(' ')
  var templateString = '';
  templateArray.forEach((subtemplate) => {
    switch (subtemplate) {
      case '%%logo%%':
        templateString += `<img class='sezzle-button-logo-img' src=${chosenImage} />`;
        break;
      default:
        templateString += `${subtemplate} `;
    }
  })
  return templateString;
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
  }
};

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
};

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
};

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
  element.style.transform = 'scale(' + this.configGroups[configGroupIndex].logoSize + ')';
};

/**
 * Add styling to logo Element incase its provided by the config
 * @param element - logo element
 * @param element - element to set styles on
 * @param configGroupIndex - index of the config group that element belongs to
 * @return void
 */
SezzleJS.prototype.setLogoStyle = function (element, configGroupIndex) {
  Object.keys(this.configGroups[configGroupIndex].logoStyle).forEach(key => {
    element.style[key] = this.configGroups[configGroupIndex].logoStyle[key];

  });
};

/**
 * This function will set Sezzle's elements with
 * the price element in parallel
 * @param element - This is the price element
 * @param renderelement Element to render the widget to
 * @param index - Index of the element in the page
 * @param configGroupIndex Index of the config group
 * @return void
 */
SezzleJS.prototype.renderAwesomeSezzle = function (element, renderelement, index = 0, configGroupIndex) {
  // Runninng Create Sezzle Checkout Button
  var sezzleCheckoutButton = document.getElementsByClassName('sezzle-checkout-button')[0]
  if(!sezzleCheckoutButton && this.configGroups[configGroupIndex].sezzleCheckoutButton) this.createSezzleButton(configGroupIndex);
  // Do not render this product if it is not eligible
  var priceText = this.getPriceText(element, configGroupIndex);
  if (!this.isProductEligible(priceText, configGroupIndex)) return false;
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
  this.insertWidgetTypeCSSClassInElement(sezzle, configGroupIndex);
  this.insertStoreCSSClassInElement(sezzle);
  this.setElementMargins(sezzle, configGroupIndex);
  if (this.configGroups[configGroupIndex].scaleFactor) this.setWidgetSize(sezzle, configGroupIndex);
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
        var priceValueText = document.createTextNode(this.getFormattedPrice(element, configGroupIndex, priceText));
        priceSpanNode.appendChild(priceValueText);
        sezzleButtonText.appendChild(priceSpanNode);
        break;
      case 'logo':
        var logoNode = document.createElement('img');
        logoNode.className = 'sezzle-logo ' + this.configGroups[configGroupIndex].imageClassName;
        logoNode.src = this.configGroups[configGroupIndex].imageURL;
        sezzleButtonText.appendChild(logoNode);
        this.setLogoSize(logoNode, configGroupIndex);
        if (this.configGroups[configGroupIndex].logoStyle != {}) this.setLogoStyle(logoNode, configGroupIndex);
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
      case 'affirm-logo':
        var affirmNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        affirmNode.setAttribute('width', '200.16');
        affirmNode.setAttribute('height', '199.56');
        affirmNode.setAttribute('viewBox', '0 0 400.16 199.56');
        affirmNode.setAttribute('class', `sezzle-affirm-logo affirm-modal-info-link no-sezzle-info`);
        affirmNode.setAttribute('style', `width:39px;height:21px;margin-bottom:5px !important; vertical-align:middle;`);
        affirmNode.innerHTML = `<defs>
          <polygon id="path-1" points="0.00278333333 0.357194444 63.9637833 0.357194444 63.9637833 73.2944444 0.00278333333 73.2944444"></polygon>
          <polygon id="path-3" points="0 167 418.529833 167 418.529833 0 0 0"></polygon>
        </defs>
        <g id="black_logo-white_bg" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <rect fill="#FFFFFF" x="0" y="0" width="420" height="167"></rect>
          <g id="Group-13">
              <g id="Group-3" transform="translate(0.000000, 93.705556)">
                  <mask id="mask-2" fill="white">
                      <use xlink:href="#path-1"></use>
                  </mask>
                  <g id="Clip-2"></g>
                  <path d="M27.44645,58.90925 C22.26945,58.90925 19.6902278,56.3671389 19.6902278,52.1643056 C19.6902278,44.3895278 28.3927833,41.7268056 44.2763389,40.0475278 C44.2763389,50.4479167 37.2437833,58.90925 27.44645,58.90925 M34.29345,0.357194444 C22.9467278,0.357194444 9.88361667,5.71047222 2.79539444,11.3606389 L9.27128333,24.9896944 C14.9585611,19.7848611 24.1528389,15.3408056 32.4471722,15.3408056 C40.3240056,15.3408056 44.6752833,17.9756944 44.6752833,23.2733056 C44.6752833,26.8545278 41.7898944,28.6544167 36.3345611,29.3595278 C15.9791167,32.0129722 0.00278333333,37.6260278 0.00278333333,53.3240278 C0.00278333333,65.7655278 8.86306111,73.2990833 22.7055056,73.2990833 C32.5770611,73.2990833 41.3723944,67.8066389 45.5566722,60.5606944 L45.5566722,71.26725 L63.9637833,71.26725 L63.9637833,26.4091944 C63.9637833,7.88147222 51.0862278,0.357194444 34.29345,0.357194444" id="Fill-1" fill="#060809" mask="url(#mask-2)"></path>
              </g>
              <path d="M219.144822,96.0871611 L219.144822,164.974661 L238.850822,164.974661 L238.850822,131.78805 C238.850822,116.00655 248.397656,111.376939 255.0591,111.376939 C257.656878,111.376939 261.163878,112.128439 263.483322,113.863383 L267.073822,95.6511056 C264.030711,94.3522167 260.848433,94.0646056 258.241378,94.0646056 C248.110044,94.0646056 241.745489,98.55505 237.542656,107.665828 L237.542656,96.0871611 L219.144822,96.0871611 Z" id="Fill-4" fill="#060809"></path>
              <path d="M358.4154,94.0664611 C347.996456,94.0664611 340.2124,100.226906 336.158011,106.164683 C332.391233,98.4919611 324.412344,94.0664611 314.865511,94.0664611 C304.446567,94.0664611 297.237733,99.8557944 293.907011,106.507961 L293.907011,96.0890167 L274.9154,96.0890167 L274.9154,164.976517 L294.630678,164.976517 L294.630678,129.51685 C294.630678,116.778461 301.292122,110.682961 307.517511,110.682961 C313.149122,110.682961 318.326122,114.329128 318.326122,123.727517 L318.326122,164.976517 L338.013567,164.976517 L338.013567,129.51685 C338.013567,116.639294 344.526567,110.682961 351.039567,110.682961 C356.2444,110.682961 361.736844,114.468294 361.736844,123.58835 L361.736844,164.976517 L381.424289,164.976517 L381.424289,117.362961 C381.424289,101.87835 371.005344,94.0664611 358.4154,94.0664611" id="Fill-6" fill="#060809"></path>
              <path d="M171.184278,96.0871611 L153.333833,96.0871611 L153.333833,89.0824389 C153.333833,79.9716611 158.538667,77.3646056 163.029111,77.3646056 C167.983444,77.3646056 171.843,79.5634389 171.843,79.5634389 L177.919944,65.6746056 C177.919944,65.6746056 171.7595,61.64805 160.561222,61.64805 C147.971278,61.64805 133.646389,68.74555 133.646389,91.0214944 L133.646389,96.0871611 L103.762667,96.0871611 L103.762667,89.0824389 C103.762667,79.9716611 108.9675,77.3646056 113.448667,77.3646056 C116.000056,77.3646056 119.432833,77.9583833 122.271833,79.5634389 L128.348778,65.6746056 C124.721167,63.5407167 118.894722,61.64805 110.990056,61.64805 C98.4001111,61.64805 84.0752222,68.74555 84.0752222,91.0214944 L84.0752222,96.0871611 L72.645,96.0871611 L72.645,111.284161 L84.0752222,111.284161 L84.0752222,164.974661 L103.762667,164.974661 L103.762667,111.284161 L133.646389,111.284161 L133.646389,164.974661 L153.333833,164.974661 L153.333833,111.284161 L171.184278,111.284161 L171.184278,96.0871611 Z" id="Fill-8" fill="#060809"></path>
              <mask id="mask-4" fill="white">
                  <use xlink:href="#path-3"></use>
              </mask>
              <g id="Clip-11"></g>
              <polygon id="Fill-10" fill="#060809" mask="url(#mask-4)" points="182.939222 164.977444 202.608111 164.977444 202.608111 96.0899444 182.939222 96.0899444"></polygon>
              <path d="M297.688633,0.00278333333 C244.508411,0.00278333333 197.108244,36.9190611 183.655467,84.3841722 L202.934689,84.3841722 C214.170078,49.0358389 252.311022,18.01095 297.688633,18.01095 C352.845022,18.01095 400.514244,60.0021722 400.514244,125.373394 C400.514244,140.050839 398.6123,153.28095 395.012522,164.97095 L413.716522,164.97095 L413.902078,164.330783 C416.963744,152.269672 418.522411,139.16945 418.522411,125.373394 C418.522411,52.4686167 365.397856,0.00278333333 297.688633,0.00278333333" id="Fill-12" fill="#0FA0EA" mask="url(#mask-4)"></path>
          </g>
        </g>`;
        sezzleButtonText.appendChild(affirmNode)
        break;
      case 'affirm-info-icon':
        var affirmInfoIconNode = document.createElement('code');
        affirmInfoIconNode.className = 'affirm-modal-info-link no-sezzle-info';
        affirmInfoIconNode.innerHTML = '&#9432;';
        sezzleButtonText.appendChild(affirmInfoIconNode);
        break;
      case 'affirm-link-icon':
        var affirmAnchor = document.createElement('a');
        affirmAnchor.href = this.configGroups[configGroupIndex].affirmLink;
        affirmAnchor.target = '_blank';
        var affirmLinkIconNode = document.createElement('code');
        affirmLinkIconNode.className = 'affirm-info-link';
        affirmLinkIconNode.innerHTML = '&#9432;';
        affirmAnchor.appendChild(affirmLinkIconNode);
        sezzleButtonText.appendChild(affirmAnchor);
        break;
      case 'afterpay-logo':
        var apNode = document.createElement('img');
        apNode.className = 'sezzle-afterpay-logo ap-modal-info-link no-sezzle-info';
        apNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/ap-logo-widget.png';
        sezzleButtonText.appendChild(apNode);
        break;
      case 'afterpay-logo-grey':
        apNode = document.createElement('img');
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
        apAnchor.appendChild(apLinkIconNode);
        sezzleButtonText.appendChild(apAnchor);
        break;
      case 'quadpay-logo':
        var qpNode = document.createElement('img');
        qpNode.className = 'sezzle-quadpay-logo quadpay-modal-info-link no-sezzle-info';
        qpNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/qp-logo-widget.png';
        sezzleButtonText.appendChild(qpNode);
        break;
      case 'quadpay-logo-grey':
        qpNode = document.createElement('img');
        qpNode.className = 'sezzle-quadpay-logo quadpay-modal-info-link no-sezzle-info';
        qpNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/qp-logo-widget-grayscale.png';
        sezzleButtonText.appendChild(qpNode);
        break;
      case 'quadpay-logo-white':
        qpNode = document.createElement('img');
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
          priceSplitText = this.getFormattedPrice(element, configGroupIndex, priceText);
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
      if (customClass.index === index || customClass.index === -1) {
        var path = Helper.breakXPath(customClass.xpath);
        this.getElementsByXPath(path, 0, [sezzle])
          .forEach(function (el) {
            el.className += ' ' + customClass.className;
          });
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
};

/**
 * This function finds out the element where Sezzle's widget
 * will be rendered. By default it would return the parent element
 * of the given price element. If the over ride path is found and
 * it leads to a valid element then that element will be returned
 * @param element - This is the price element
 * @param index - Index of the config group that element belongs to
 * @return the element where Sezzle's widget will be rendered
 */
SezzleJS.prototype.getElementToRender = function (element, index = 0) {
  var toRenderElement = null;
  if (this.configGroups[index].rendertopath !== null) {
    var path = Helper.breakXPath(this.configGroups[index].rendertopath);
    toRenderElement = element;
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
};

/**
 * Is the product eligible for sezzle pay
 * @param price Price of product
 */
SezzleJS.prototype.isProductEligible = function (priceText, configGroupIndex) {
  var price = Helper.parsePrice(priceText);
  this.configGroups[configGroupIndex].productPrice = price;
  var priceInCents = price * 100;
  return priceInCents >= this.minPrice && priceInCents <= this.maxPrice;
};

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
};

/**
 * Formats a price as Sezzle needs it
 * @param element Element that contains price text
 * @param configGroupIndex index of the config group which element belongs to
 * @param priceText (optional) if defined, it contains the proper price text parsed from element
 */
SezzleJS.prototype.getFormattedPrice = function (element, configGroupIndex, priceText) {
  if (!priceText) priceText = this.getPriceText(element, configGroupIndex);
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
};

/**
 * Mutation observer callback function
 * This observer observes for any change in a
 * given DOM element (Price element in our case)
 * and act on that
 */
SezzleJS.prototype.mutationCallBack = function (mutations, configGroupIndex) {
  mutations
    .filter(function (mutation) { return mutation.type === 'childList'; })
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
          // Check if the price is still valid for widget
          // Price may change dynamically due to any reason,
          // like, updating product category
          var priceText = this.getPriceText(mutation.target, configGroupIndex);
          if (!this.isProductEligible(priceText, configGroupIndex)) {
            sezzlePriceElement.parentElement.parentElement.parentElement.classList.add('sezzle-hidden');
          }
        }
      } catch (e) {
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
};

/**
 * @description Adds/removes styles to stop body scroll when modal is open. Also
 *              records/restores the scroll position to avoid side effects of position: fixed
 * @param boolean -> disable/enable scroll
*/
SezzleJS.prototype.disableBodyScroll = function (disable) {
  const bodyElement = document.body;
  // Add styles if modal is open
  if (disable) {
    // Cross-browser
    this.scrollDistance = pageYOffset || (document.documentElement.clientHeight ? document.documentElement.scrollTop : document.body.scrollTop) || 0;
    bodyElement.classList.add('sezzle-modal-open');
    // reset scroll in background because of previous step
    bodyElement.style.top = (this.scrollDistance * -1) + 'px';
  }
  // Remove styles if modal closes and resets body scroll position as well modal scroll to 0,0
  else {
    bodyElement.classList.remove('sezzle-modal-open');
    window.scrollTo(0, this.scrollDistance);
    bodyElement.style.top = 0;
    // reset modal scroll
    document.getElementsByClassName('sezzle-modal')[0].scrollTop = 0;
  }
};

/**
 * This function renders the Sezzle modal
 * Also adds the event for open and close modals
 * to respective buttons
 */
SezzleJS.prototype.renderModal = function () {
  // Handler function when modal is closed.
  closeModalHandler = () => {
    // Event listener for close in modal
    Array.prototype.forEach.call(document.getElementsByClassName('close-sezzle-modal'), (el) => {
      el.addEventListener('click', () => {
        this.disableBodyScroll(false);
        // Display the modal node
        modalNode.style.display = 'none';
        // Add hidden class hide the item
        modalNode.getElementsByClassName('sezzle-modal')[0].className = 'sezzle-modal sezzle-checkout-modal-hidden';
      });
    });
    // Event listener to prevent close in modal if click happens within sezzle-checkout-modal
    var sezzleModal = document.getElementsByClassName('sezzle-modal')[0];
    // backwards compatability check
    if (!sezzleModal) sezzleModal = document.getElementsByClassName('sezzle-checkout-modal')[0];
    sezzleModal.addEventListener('click', function (event) {
      // stop propagating the event to the parent sezzle-checkout-modal-lightbox to prevent the closure of the modal
      event.stopPropagation();
    });
  };

  // Renders modal via a http call to sezzle cdn
  var modalNode = document.createElement('div');
  if (!document.getElementsByClassName('sezzle-checkout-modal-lightbox').length) {
    modalNode.className = 'sezzle-checkout-modal-lightbox close-sezzle-modal';
    modalNode.style.display = 'none';
    modalNode.style.maxHeight = '100%';
    this.getModal(modalNode, closeModalHandler);
  } else {
    modalNode = document.getElementsByClassName('sezzle-checkout-modal-lightbox')[0];
  }
};

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
  let sezzleModal = document.getElementsByClassName('sezzle-modal')[0];
  // backwards compatability check
  if (!sezzleModal) sezzleModal = document.getElementsByClassName('sezzle-checkout-modal-lightbox')[0];
  sezzleModal.addEventListener('click', function (event) {
    // stop propagating the event to the parent sezzle-checkout-modal-lightbox to prevent the closure of the modal
    event.stopPropagation();
  });
};

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
  let sezzleModal = document.getElementsByClassName('sezzle-modal')[0];
  // backwards compatability check
  if (!sezzleModal) sezzleModal = document.getElementsByClassName('sezzle-checkout-modal-lightbox')[0];
  sezzleModal.addEventListener('click', function (event) {
    // stop propagating the event to the parent sezzle-checkout-modal-lightbox to prevent the closure of the modal
    event.stopPropagation();
  });
};
/**
 * This function renders the Affirm modal based on if you include affirm-modal-info-link
 * Also adds the event for open and close modals
 * to respective buttons
 */
SezzleJS.prototype.renderAffirmModal = function () {
  var modalNode = document.createElement('div');
  modalNode.className = 'sezzle-checkout-modal-lightbox close-sezzle-modal sezzle-affirm-modal';
  modalNode.style = 'position: center';
  modalNode.style.display = 'none';
  modalNode.innerHTML = this.affirmModalHTML;
  document.getElementsByTagName('html')[0].appendChild(modalNode);
  // Event listener for close in modal
  Array.prototype.forEach.call(document.getElementsByClassName('close-sezzle-modal'), function (el) {
    el.addEventListener('click', function () {
      // Display the modal node
      modalNode.style.display = 'none';
    });
  });
  // Event listener to prevent close in modal if click happens within sezzle-checkout-modal
  let sezzleModal = document.getElementsByClassName('sezzle-modal')[0];
  // backwards compatability check
  if (!sezzleModal) sezzleModal = document.getElementsByClassName('sezzle-checkout-modal-lightbox')[0];
  sezzleModal.addEventListener('click', function (event) {
    // stop propagating the event to the parent sezzle-checkout-modal-lightbox to prevent the closure of the modal
    event.stopPropagation();
  });
};
/**
 * This function add events to the button in sezzle widget
 * to open the modal
 */
SezzleJS.prototype.addClickEventForModal = function (sezzleElement, configGroupIndex) {
  var modalLinks = sezzleElement.getElementsByClassName('sezzle-modal-link');
  Array.prototype.forEach.call(modalLinks, function (modalLink) {
    modalLink.addEventListener('click', function (event) {
      if (!event.target.classList.contains('no-sezzle-info')) {
        var modalNode;
        // Makes sure to get rid of AP & QP modals in our Sezzle modal event listener
        var modals = document.getElementsByClassName('sezzle-checkout-modal-lightbox');
        Array.prototype.forEach.call(modals, function (element) {
          if (!element.classList.contains('sezzle-ap-modal' || 'sezzle-qp-modal')) {
            modalNode = element;
          }
        });
        if (modalNode) {
          this.disableBodyScroll(true);
          modalNode.style.display = 'block'; // Remove hidden class to show the item
          var modals = modalNode.getElementsByClassName('sezzle-modal');
          if (modals.length) {
            modals[0].className = 'sezzle-modal';
          }
          // log on click event
          this.logEvent('onclick', configGroupIndex);
        }
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
   // for Affirm
  var affirmModalLinks = sezzleElement.getElementsByClassName('affirm-modal-info-link');
  Array.prototype.forEach.call(affirmModalLinks, function (modalLink) {
    modalLink.addEventListener('click', function () {
      // Show modal node
      document.getElementsByClassName('sezzle-affirm-modal')[0].style.display = 'block';
      // log on click event
      this.logEvent('onclick-affirm', configGroupIndex);
    }.bind(this));
  }.bind(this));
};

/**
 * This function will return the ISO 3166-1 alpha-2 country code
 * from the user's IP
 * @param callback what happens after country is received
 */
SezzleJS.prototype.getCountryCodeFromIP = function (callback) {
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState === XMLHttpRequest.DONE || httpRequest.readyState === 4) {
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
};

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
      if (httpRequest.readyState === XMLHttpRequest.DONE || httpRequest.readyState === 4) {
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
    };
    httpRequest.open('GET', this.cssForMerchantURL);
    httpRequest.responseType = 'json';
    httpRequest.send();
  }
};

SezzleJS.prototype.getModal = function (modalNode, callback) {
  if (document.sezzleDefaultModalVersion && document.sezzleModalAvailableLanguages) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function () {
      if (httpRequest.readyState === XMLHttpRequest.DONE || httpRequest.readyState === 4) {
        if (httpRequest.status === 200) {
          // append the html to the modal node
          modalNode.innerHTML = httpRequest.response;
          document.getElementsByTagName('html')[0].appendChild(modalNode);
          callback();
        }
        else {
          return console.warn("Can't load the modal because the link provided is not found");
        }
      }
    }.bind(this);
    // Convert document.sezzleModalAvailableLanguages into Array

    var availableLanguages = document.sezzleModalAvailableLanguages.split(',').map(function (singleLanguage) {
      return singleLanguage.trim();
    });
    var modalLanguage;
    if (availableLanguages.indexOf(this.language) > -1) {
      modalLanguage = this.language;
    } else {
      modalLanguage = 'en';
    }
    var url = 'https://media.sezzle.com/shopify-app/assets/' + document.sezzleDefaultModalVersion.replace("{%%s%%}", modalLanguage);
    httpRequest.open('GET', url, true);
    httpRequest.send();
  }
};

/**
 * Hide elements pointed to by this.hideClasses
 */
SezzleJS.prototype.hideSezzleHideElements = function (configGroupIndex) {
  this.configGroups[configGroupIndex].hideClasses.forEach(function (subpaths) {
    this.getElementsByXPath(subpaths).forEach(function (element) {
      if (!element.classList.contains('sezzle-hidden')) {
        element.classList.add('sezzle-hidden');
      }
    });
  }.bind(this));
};

/*
* Log Event
*/
SezzleJS.prototype.logEvent = function (eventName, configGroupIndex) {
  // We only log event when it's allowed to
  if (!this.noTracking) {
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
    var sezzleConfigStr = null;
    sezzleConfigStr = JSON.stringify(this.config);
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
};

/*
* Is Mobile Browser
*/
SezzleJS.prototype.isMobileBrowser = function () {
  return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4));
};


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
        if (win && !this.noGtm) {
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
          if (win && !this.noGtm) {
            setTimeout(function () {
              win.postMessage('initGTMScript', 'https://tracking.sezzle.com');
            }, 100);
          }
        }
      }
    }.bind(this));
  }
};

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
};

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

    if (document.getElementsByClassName('affirm-modal-info-link').length > 0) {
      this.renderAffirmModal()
    }
  }
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
    });
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
    setTimeout(sezzleWidgetCheckInterval.bind(this), intervalInMs);
  }
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
};

module.exports = SezzleJS;

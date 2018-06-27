if(!Array.from){



   Array.from = (function () {
    var toStr = Object.prototype.toString;
    var isCallable = function (fn) {
      return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
    };
    var toInteger = function (value) {
      var number = Number(value);
      if (isNaN(number)) { return 0; }
      if (number === 0 || !isFinite(number)) { return number; }
      return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    var maxSafeInteger = Math.pow(2, 53) - 1;
    var toLength = function (value) {
      var len = toInteger(value);
      return Math.min(Math.max(len, 0), maxSafeInteger);
    };

    // The length property of the from method is 1.
    return function from(arrayLike/*, mapFn, thisArg */) {
      // 1. Let C be the this value.
      var C = this;

      // 2. Let items be ToObject(arrayLike).
      var items = Object(arrayLike);

      // 3. ReturnIfAbrupt(items).
      if (arrayLike == null) {
        throw new TypeError("Array.from requires an array-like object - not null or undefined");
      }

      // 4. If mapfn is undefined, then let mapping be false.
      var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
      var T;
      if (typeof mapFn !== 'undefined') {
        // 5. else
        // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
        if (!isCallable(mapFn)) {
          throw new TypeError('Array.from: when provided, the second argument must be a function');
        }

        // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 2) {
          T = arguments[2];
        }
      }

      // 10. Let lenValue be Get(items, "length").
      // 11. Let len be ToLength(lenValue).
      var len = toLength(items.length);

      // 13. If IsConstructor(C) is true, then
      // 13. a. Let A be the result of calling the [[Construct]] internal method of C with an argument list containing the single item len.
      // 14. a. Else, Let A be ArrayCreate(len).
      var A = isCallable(C) ? Object(new C(len)) : new Array(len);

      // 16. Let k be 0.
      var k = 0;
      // 17. Repeat, while k < len… (also steps a - h)
      var kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFn) {
          A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      // 18. Let putStatus be Put(A, "length", len, true).
      A.length = len;
      // 20. Return A.
      return A;
    };
  }());
}
/**
 *
 * @param options All widget options
 */
var SezzleJS = function(options) {
  // Configurable options
  this.xpath = [];
  if (options.targetXPath) {
    if (typeof(options.targetXPath) === 'string') {
      // Only one x-path is given
      this.xpath.push(options.targetXPath.split('/'));
    } else {
      // options.targetXPath is an array of x-paths
      //this.xpath = options.targetXPath.map(path => path.split('/'));

      this.xpath = options.targetXPath.map(function(path){
        return path.split('/');
      });
    }
  }

  this.ignoredPriceElements =[];
  if (options.ignoredPriceElements) {
    if (typeof(options.ignoredPriceElements) === 'string') {
      // Only one x-path is given
      this.ignoredPriceElements.push(options.ignoredPriceElements);
    } else {
      // options.targetXPath is an array of x-paths
      this.ignoredPriceElements = options.ignoredPriceElements;
    }
  }

  this.rendertopath = [];
  if (options.renderToPath) {
    if (typeof(options.renderToPath) === 'string') {
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
  this.xpath.forEach(function(value, index) {
    if (index in this.rendertopath) {
      this.rendertopath[index] =
        this.rendertopath[index].trim() != '' ?
          this.rendertopath[index].trim() : null;
    } else {
      this.rendertopath.push(null);
    }
  }.bind(this));

  this.altVersionTemplate = [];
  if (options.altVersionTemplate) {
    this.altVersionTemplate = options.altVersionTemplate.split('%%');
  }

  // START AB-TESTING:
  //var altVersionTemplate = '';
  //this.altVersionTemplate = altVersionTemplate.split('%%');
  //this.ABTestClass = ' ';
  // END AB-TESTING

  this.forcedShow = options.forcedShow || false;
  this.alignment = options.alignment || '';
  this.merchantID = options.merchantID || '';
  this.widthType = options.widthType || '';
  this.widgetType = options.widgetType || 'product';
  this.minPrice = options.minPrice || 0;
  this.maxPrice = options.maxPrice || 100000;
  this.hideClasses = options.hideClasses || [];
  this.bannerURL = options.bannerUrl || '';
  this.bannerClass = options.bannerClass || '';
  this.bannerLink = options.bannerLink || '';
  this.fontWeight = options.fontWeight || 300;
  this.alignmentSwitchMinWidth = options.alignmentSwitchMinWidth || 760; //pixels
  this.alignmentSwitchType = options.alignmentSwitchType || '';
  this.maxWidth = options.maxWidth || 0; //pixels
  this.marginTop = options.marginTop || 0; //pixels
  this.marginBottom = options.marginBottom || 0; //pixels
  this.marginSwitchMinWidth = options.marginSwitchMinWidth || 760; //pixels
  this.marginTopSwitchType = options.marginTopSwitchType; //pixels
  this.marginBottomSwitchType = options.marginBottomSwitchType; //pixels
  this.fontSize = options.fontSize || 0; //pixels
  this.fontFamily = options.fontFamily || "inherit";
  this.color = options.color || "inherit";
  // This is used to get price of element
  this.priceElementClass = options.priceElementClass || 'sezzle-price-element';
  // This is used to tell where to render sezzle element to
  this.sezzleWidgetContainerClass = options.sezzleWidgetContainerClass || 'sezzle-widget-container';
  // Don't show price in widget
  this.hidePrice =  options.hidePrice || false;
  this.splitPriceElementsOn = options.splitPriceElementsOn || '';
  this.altLightboxHTML = options.altLightboxHTML || '';

  if (this.hidePrice) {
    this.altVersionTemplate = 'or 4 automatic, interest free payments with %%logo%% %%link%%'.split('%%');
  }
  if (this.splitPriceElementsOn) {
    this.altVersionTemplate = 'or 4 automatic, interest free payments %%price-split%% with%%logo%%%%link%%'.split('%%')
  }

  // Search for price elements. If found, assume there is only one in this page
  this.hasPriceClassElement = false;
  this.priceElements = Array.from(document.getElementsByClassName(this.priceElementClass));
  this.renderElements = Array.from(document.getElementsByClassName(this.sezzleWidgetContainerClass));
  if (this.priceElements.length == 1) this.hasPriceClassElement = true;

  this.theme = options.theme || '';
  if(this.theme == 'dark') {
    this.imageUrl = options.imageUrl || 'https://d34uoa9py2cgca.cloudfront.net/branding/sezzle-logos/png/sezzle-logo-white-sm-100w.png';
    this.imageClassName = 'szl-dark-image';
  } else {
    this.imageUrl = options.imageUrl || 'https://d3svog4tlx445w.cloudfront.net/branding/sezzle-logos/png/sezzle-logo-sm-100w.png';
    this.imageClassName = 'szl-light-image';
  }

  // Non configurable options
  this._config = { attributes: true, childList: true, characterData: true };
  // URL to request to get ip of request
  this.countryFromIPRequestURL = 'https://freegeoip.net/json/';
  // URL to request to get css details
  this.cssForMerchantURL = 'https://widget.sezzle.com/v1/css/price-widget?uuid=' + this.merchantID;
  // Countries supported by sezzle pay. To test your country, add here.
  this.supportedCountryCodes = ['US', 'IN'];
  //private boolean variable set to true if widget is to be rendered as first child of the parent
  this.widgetIsFirstChild = false

  // Variables set by the js
  this.countryCode = null;
  this.ip = null;
  this.fingerprint = null;
}

/**
 * This function fetches all the elements that has price in it based on the given x-path
 * @param xindex - Current xpath index value to be resolved [initial value is always 0]
 * @param elements - Array of current elements to be resolved [initial value is always null]
 *
 * @return All the elements with price in it that matches the xpath
 */
 SezzleJS.prototype.getAllPriceElements = function(xpath , xindex, elements ) {

   var xpath = xpath || '';
   var xindex = xindex || 0;
   var elements = elements || null;

   // Break condition
   if (xindex === xpath.length) {
     return elements;
   }

   // Intialy when elements is null
   // We give document to it
   if (elements === null) {
     elements = [document];
   }

   var children = [];
   var ELEMENTS = Array.from(elements);

   var ELEMENTSARRAY =[];


   var elemnt_ID = 0;
   for(elemnt_ID in ELEMENTS) {
     var elemnt = ELEMENTS[elemnt_ID]

     // If this is an ID
     if (xpath[xindex][0] === '#') {
       children.push(elemnt.getElementById(xpath[xindex].substr(1)));
     } else
     // If this is a class
     if (xpath[xindex][0] === '.') {
       Array.from(
         elemnt.getElementsByClassName(xpath[xindex].substr(1))
       )
       .forEach(function(el) {
           children.push(el);
       })
 		}
     // If this is a tag
     {
       var indexToTake = 0;
       if (xpath[xindex].split('-').length > 1) {
         if (xpath[xindex].split('-')[1] >= 0) {
           indexToTake = parseInt(xpath[xindex].split('-')[1]);
         }
       }
       Array.from(
         elemnt.getElementsByTagName(xpath[xindex].split('-')[0])
       )
       .forEach(function(el, index) {
           if (index === indexToTake) children.push(el);
       });
     }
   }
   children = children.filter(function(c) {return c !== null});
   return this.getAllPriceElements(xpath, xindex + 1, children);
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
 * Add CSS alignment class as required based on the viewport width
 * @param element Element to add to
 */
SezzleJS.prototype.addCSSAlignment = function(element) {

  var newAlignment = ""
    if (matchMedia) {
        var queryString = "(min-width: " + this.alignmentSwitchMinWidth + "px)"
        const mq = window.matchMedia(queryString);
        if (mq.matches) {
            // window width is at least alignmentSwitchMinWidth
            newAlignment = ""
        } else {
            // window width is less than alignmentSwitchMinWidth
            newAlignment = this.alignmentSwitchType
        }
    }
    switch(newAlignment || this.alignment) {
        case 'left':
            element.className += " sezzle-left";
            break;
        case 'right':
            element.className += " sezzle-right";
            break;
        case 'center':
            element.className += " sezzle-center";
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
  if (this.maxWidth){
      element.style.maxWidth = this.maxWidth + "px"
  }
}

/**
 * Add CSS fonts styling as required
 * @param element Element to add to
 */
SezzleJS.prototype.addCSSFontStyle = function(element) {
    if (this.fontWeight){
      element.style.fontWeight = this.fontWeight
    }
    if (this.fontSize){
        element.style.fontSize = this.fontSize + "px"
    }
    if (this.fontFamily){
      element.style.fontFamily = this.fontFamily
    }
}

/**
 * Add CSS text color as required
 * @param element Element to add to
 */
SezzleJS.prototype.addCSSTextColor = function(element) {
  if (this.color){
    element.style.color = this.color
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
  this.addCSSFontStyle(element);
  this.addCSSTextColor(element);
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
 * Set the top and bottom margins of element
 * @param element to set margins to
 */
SezzleJS.prototype.setElementMargins = function(element) {

  if (matchMedia) {
    var queryString = "(min-width: " + this.marginSwitchMinWidth + "px)"
    const mq = window.matchMedia(queryString);
    if (mq.matches) {
      // window width is at least alignmentSwitchMinWidth
      element.style.marginTop = this.marginTop + "px";
      element.style.marginBottom = this.marginBottom + "px";
    }
    else {
      // window width is less than alignmentSwitchMinWidth

      // if marginTopSwitchType is not specified in the config (undefined) or if marginTopSwitchType is anything other than a number
      if ((typeof this.marginTopSwitchType) !== "number") {
        //use marginTop
        element.style.marginTop = this.marginTop + "px";
      }
      else {
        //use marginTopSwitchType
        element.style.marginTop = this.marginTopSwitchType + "px";
      }

      // if marginBottomSwitchType is not specified in the config (undefined) or if marginTopSwitchType is anything other than a number
      if ((typeof this.marginBottomSwitchType) !== "number") {
        //use marginBottom
        element.style.marginBottom = this.marginBottom + "px";
      }
      else {
        //use marginBottomSwitchType
        element.style.marginBottom = this.marginBottomSwitchType + "px";
      }
    }
  }
}

/**
 * This function will set Sezzle's elements with
 * the price element in parallel
 * @param element - This is the price element
 * @param index - Index of the element in the page
 * @return void
 */
SezzleJS.prototype.renderAwesomeSezzle = function(element, renderelement, index ) {

  var index = index || 0;

  // Do not render this product if it is not eligible
  if (!this.isProductEligible(element.innerText)) return false;
  // Set data index to each price element for tracking
  element.dataset.sezzleindex = index;
  // Get element to be rendered with sezzle's widget
  var parent = renderelement;

  // root node for sezzle
  var sezzle = document.createElement('div');
  sezzle.className = "sezzle-shopify-info-button"

  if(this.ABTestClass) {
    sezzle.className += this.ABTestClass;
  }

  this.insertWidgetTypeCSSClassInElement(sezzle);
  this.insertStoreCSSClassInElement(sezzle);
  this.setElementMargins(sezzle);

  // node level - 1
  var node = document.createElement("div");
  node.className = "sezzle-checkout-button-wrapper";
  this.insertStoreCSSClassInElement(node);
  this.addCSSAlignment(node);

  if (this.altVersionTemplate.length == 0) {
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
      ' of ' + this.getFormattedPrice(element)
    );

    // Adding price value to priceSpanNode - level - 1.1.2
    priceSpanNode.appendChild(priceValueText)

    // Adding priceSpanNode to priceNode level - 1.1
    priceNode.appendChild(priceSpanNode);

    // Adding priceNode to main node level - 1
    node.appendChild(priceNode);
    this.addCSSCustomisation(priceNode)

    // Logo node level - 1.1
    var logoNode = document.createElement("div");
    logoNode.className = "sezzle-checkout-button";
    this.insertStoreCSSClassInElement(logoNode);
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
    logoNode2.className = this.imageClassName;
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

  } else {
    var customNode = document.createElement("div");
    customNode.className = "sezzle-custom-widget-wrapper sezzle-button-text";
    this.addCSSCustomisation(customNode);
    this.addCSSAlignment(customNode);

    this.altVersionTemplate.forEach(function(customLine) {
      switch (customLine) {
        case 'price':
          var customPriceSpanNode = document.createElement("span");
          customPriceSpanNode.className = "payment-amount sezzle-button-text sezzleindex-" + index;

          var customPriceValueText = document.createTextNode(
            ' of ' + this.getFormattedPrice(element)
          );

          customPriceSpanNode.appendChild(customPriceValueText)

          customNode.appendChild(customPriceSpanNode);
          break;
        case 'logo':
          var customLogoNode = document.createElement("img");
          customLogoNode.className = this.imageClassName + " sezzle-custom-logo";
          customLogoNode.src = this.imageUrl;

          customNode.appendChild(customLogoNode);
          break;
        case 'link':
          var customLink = document.createElement("div");
          customLink.className = "sezzle-know-more custom-sezzle-know-more";
          var customLinkText = document.createTextNode(' Learn more');
          customLink.appendChild(customLinkText);
          customNode.appendChild(customLink);
          break;

        case 'info':
          var customInfoIcon = document.createElement("code");
          customInfoIcon.className = "sezzle-info-icon";
          customInfoIcon.innerHTML = "&#9432;"

          customNode.appendChild(customInfoIcon);
          break;
        case 'question-mark':
          var customQuestionMarkIcon = document.createElement("img")
          customQuestionMarkIcon.className = "sezzle-question-mark-icon";
          customQuestionMarkIcon.src = "https://d2uyik3j5wol98.cloudfront.net/images/question_mark_black.png"
          customQuestionMarkIcon.style.height = "13px";
          customQuestionMarkIcon.style.width = "13px";

          customNode.appendChild(customQuestionMarkIcon);
          break;

        case 'price-split':
          var priceSplitNode = document.createElement("span");
          priceSplitNode.className = "payment-amount price-split sezzle-button-text sezzleindex-" + index;

          var priceElemTexts = element.innerText.split(this.splitPriceElementsOn);
          var priceSplitText = ""

          if(priceElemTexts.length == 1) { //if the text is not being splitted (this check is needed in order to support sites with multiple types of product pricing)
            //give the original element in the case there might be some ignored elements present
            priceSplitText = ' of ' + this.getFormattedPrice(element)
          }
          else {
            var priceElems = []
            priceElemTexts.forEach(function(text) {
                var priceElemSpan = document.createElement("span");
                priceElemSpan.innerText = text;
                priceElems.push(priceElemSpan);
            })

            priceElems.forEach(function(elem, index) {
              if (index == 0) {
                priceSplitText = ' of ' + this.getFormattedPrice(elem);
              }
              else {
                priceSplitText = priceSplitText + ' ' + this.splitPriceElementsOn + ' ' + this.getFormattedPrice(elem);
              }
            }.bind(this))
          }

          var priceSplitTextNode = document.createTextNode(priceSplitText);
          priceSplitNode.appendChild(priceSplitTextNode);

          customNode.appendChild(priceSplitNode);
          break;

        default:
          var customText = document.createTextNode(customLine);

          customNode.appendChild(customText);
          break;
      }
    }.bind(this));

    node.appendChild(customNode);
  }

  // Adding main node to sezzel node
  sezzle.appendChild(node);

  // Adding sezzle to parent node
  if(this.widgetIsFirstChild) {
    this.insertAsFirstChild(sezzle, parent);
  } else {
    this.insertAfter(sezzle, parent);
  }

  this.logEvent('onload');
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
SezzleJS.prototype.getElementToRender = function(element, index) {
  var index = index || 0;
  var toRenderElement = null;
  if (this.rendertopath[index] !== null) {
    var path = this.rendertopath[index].split('/');
    //filter out empty strings
    path = path.filter(function(subpath) { return subpath !== "" });
    var toRenderElement = element;
    for(var i = 0; i < path.length; i++) {
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
            null ;
      } else if (p[0] === '#') {
        // The ID in the element
        toRenderElement =
          document.getElementById(p.substr(1));
      } else if (p === '::first-child') {
        //rendered as first child
        toRenderElement =
          toRenderElement.children.length > 0 ?
            toRenderElement.firstElementChild :
            null ;
        this.widgetIsFirstChild = true
      } else {
        // If this is a tag
        // e.g. span-2 means second span
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
  } else {
    return toRenderElement;
  }
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
 * Insert element as the first child of the parentElement of referenceElement
 * @param element Element to insert
 * @param referenceElement Element to grab parent element
 */
SezzleJS.prototype.insertAsFirstChild = function(element, referenceElement) {
  referenceElement.parentElement.insertBefore(element, referenceElement);
  //bump up element above nodes which are not element nodes (if any)
  while(element.previousSibling) {
    element.parentElement.insertBefore(element, element.previousSibling);
  }
}

/**
 * Is the product eligible for sezzle pay
 * @param price Price of product
 */
SezzleJS.prototype.isProductEligible = function(priceText) {
  var price = this.parsePrice(priceText);
  var priceInCents = price * 100;
  if (priceInCents >= this.minPrice && priceInCents <= this.maxPrice) {
    return true;
  } else {
    return false;
  }
}

/**
 * Gets price text
 * @param element Element that contains the price text
 */
SezzleJS.prototype.getPriceText = function(element) {
  if (this.ignoredPriceElements == []){
    return element.innerText;
  } else {
    this.ignoredPriceElements.forEach(function(ignoredEl) {
        var subpaths = ignoredEl.split('/');
        //filter out empty strings
        subpaths = subpaths.filter(function(subpath) { return subpath !== "" });
        var queryString = "";
        //build the query string
        for(var index in subpaths) {
          //if subpath is a tag name
          if(subpaths[index][0] !== '#' && subpaths[index][0] !== '.') {
            var splitTagAndIndex = subpaths[index].split('-');
            queryString = queryString + " " + splitTagAndIndex[0] + ":nth-of-type(" + String(Number(splitTagAndIndex[1]) + 1) + ")";
          }
          else {
            queryString = queryString + " " + subpaths[index];
          }
        }
        Array.from(
          document.querySelectorAll(queryString)
        ).forEach(function(element) {
            //mark the element to be ignored
            element.classList.add("sezzle-ignored-price-element")
        })
      })

      var clone = element.cloneNode(true);

      //remove all marked elements
      Array.from(
        clone.getElementsByTagName("*")
      ).forEach(function(element) {
        if(Array.from(element.classList).includes("sezzle-ignored-price-element")) {
          clone.removeChild(element);
        }
      })

      //remove all markers
      Array.from(
        document.getElementsByClassName("sezzle-ignored-price-element")
      ).forEach(function(element) {
        element.classList.remove("sezzle-ignored-price-element")
      })

    return clone.innerText;
  }
}

/**
 * Formats a price as Sezzle needs it
 * @param element Element that contains price text
 */
SezzleJS.prototype.getFormattedPrice = function(element) {
  priceText = this.getPriceText(element);

  // Get the price string - useful for formtting Eg: 120.00(string)
  var priceString = this.parsePriceString(priceText, true);

  // Get the price in float from the element - useful for calculation Eg : 120.00(float)
  var price = this.parsePrice(priceText);

  // Will be used later to replace {price} with price / 4.0 Eg: ${price} USD
  var formatter = priceText.replace(priceString, '{price}');

	// array of strings that come up inside of elements that we want to make sure to strip out
	var ignoredPriceStrings = [
    "Subtotal",
    "Total:",
    "Sold Out",
	]

	// replace other strings not wanted in text
	ignoredPriceStrings.forEach(function(ignoredString) {
		formatter = formatter.replace(ignoredString, '');
  }, this);

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
      var price = s.getFormattedPrice(mutation.target);
      delete s;
      if (!/\d/.test(price)) {
        document.getElementsByClassName('sezzleindex-' + priceIndex)[0]
          .parentElement.parentElement.parentElement.classList.add('sezzle-hidden');
      } else {
        document.getElementsByClassName('sezzleindex-' + priceIndex)[0]
          .parentElement.parentElement.parentElement.classList.remove('sezzle-hidden');
      }
      document.getElementsByClassName('sezzleindex-' + priceIndex)[0]
        .innerText = ' of ' + price;
    });
});

SezzleJS.prototype.deleteObserver = new MutationObserver(function(mutations) {
  // Get the mutations which have both added and removed nodes
  var removedAddedMutations = mutations
    .filter(function(mutation) {
      return mutation.removedNodes.length && mutation.addedNodes.length
    });

  // if there is at least on removed added mutation
  if (removedAddedMutations.length) {
    // Assuming this is the mutation we need
    var removedAddedMutation = removedAddedMutations[0];
    var removedNodes = Array.from(removedAddedMutation.removedNodes);
    var removedNodesMutated = Array.from([]);
    removedNodesMutated = removedNodesMutated.concat(removedNodes);

    // Get all the removed children of deleted nodes
    for (var i=0; i<removedNodes.length; i++) {
      var removedNode = removedNodes[i];
      if ('getElementsByTagName' in removedNode) {
        var removedChildren = Array.from(removedNode.getElementsByTagName('*'));
        removedNodesMutated = removedNodesMutated.concat(removedChildren);
      }
    }

    // Get the node which we need
    var removedSezzleNode;
    for (var i=0; i<removedNodesMutated.length; i++) {
      var removedNode = removedNodesMutated[i];
      if (removedNode.dataset && removedNode.dataset.hasOwnProperty('sezzleindex')) {
        removedSezzleNode = removedNode;
      }
    }

    // If the node is found, find the node corresponding node which got added
    if (removedSezzleNode) {
      var s = new SezzleJS(document.sezzleConfig);
      var addedNodes = Array.from(removedAddedMutation.addedNodes);

      // Store all the children of the added nodes
      var addedNodesMutated = Array.from([]);
      addedNodesMutated = addedNodesMutated.concat(addedNodes);
      for (var i=0; i<addedNodes.length; i++) {
        var addedNode = addedNodes[i];
        if ('getElementsByTagName' in addedNode) {
          var addedChildren = Array.from(addedNode.getElementsByTagName('*'));
          addedNodesMutated = addedNodesMutated.concat(addedChildren);
        }
      }

      // change the innertext
      var addedSezzleNode = s.findSameClassElement(removedSezzleNode, addedNodesMutated);
      addedSezzleNode.dataset.sezzleindex = removedSezzleNode.dataset.sezzleindex;
      var price = s.getFormattedPrice(addedSezzleNode);
      delete s;
      if (!/\d/.test(price)) {
        document.getElementsByClassName('sezzleindex-' + addedSezzleNode.dataset.sezzleindex)[0]
          .parentElement.parentElement.parentElement.classList.add('sezzle-hidden');
      } else {
        document.getElementsByClassName('sezzleindex-' + addedSezzleNode.dataset.sezzleindex)[0]
          .parentElement.parentElement.parentElement.classList.remove('sezzle-hidden');
      }
      document.getElementsByClassName('sezzleindex-' + addedSezzleNode.dataset.sezzleindex)[0]
      .innerText = ' of ' + price;
    }
  }
});

SezzleJS.prototype.findSameClassElement = function(element, similarElements) {
  for (var i=0; i<similarElements.length; i++) {
    var similarElement = similarElements[i];
    if (similarElement.className === element.className) return similarElement;
  }
  return null;
}

/**
 * This function starts observing for change
 * in given Price element
 * @param element to be observed
 * @return void
 */
SezzleJS.prototype.startObserve = function(element) {
  // TODO : Need a way to unsubscribe to prevent memory leak
  this.observer.observe(element, this._config);
  this.deleteObserver.observe(element.parentNode.parentNode, {
    childList: true,
    subtree: true
  });
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
    if (this.altLightboxHTML) {
      modalNode.innerHTML = this.altLightboxHTML;
    }
    else {
      modalNode.innerHTML = '<div class="sezzle-checkout-modal sezzle-checkout-modal-hidden"><div class="top-content"><div class="sezzle-no-thanks close-sezzle-modal">×</div><div class="sezzle-modal-title"><div class="sezzle-title-text-center">How Sezzle Works</div></div><div class="sezzle-header-text">We have partnered with Sezzle to give you the ability to Buy Now and Pay Later.</div><div class="row point"><div class="col-xs-12 col-sm-12 modal-icon"><img src="https://d34uoa9py2cgca.cloudfront.net/Checkout/0interest.svg"></div><div class="col-xs-12 col-sm-12 modal-description"><h2>No interest or fees</h2><p>You only pay the purchase price with Sezzle, as long as you have the installment amount in your bank account.</p></div></div><div class="row point"><div class="col-xs-12 col-sm-12 modal-icon"><img src="https://d34uoa9py2cgca.cloudfront.net/Checkout/shipped-green.svg"></div><div class="col-xs-12 col-sm-12 modal-description"><h2>Your order is shipped right away</h2><p>We ship your order immediately, like we would for any other payment method.</p></div></div><div class="row point"><div class="col-xs-12 col-sm-12 col-md-2 modal-icon"><img src="https://d34uoa9py2cgca.cloudfront.net/Checkout/payments-green.svg"></div><div class="col-xs-12 col-sm-12 modal-description"><h2>Easy, automatic payments</h2><p>Sezzle splits your purchase into 4 payments, automatically deducted from your bank account every two weeks.</p></div></div></div><div class="sezzle-simply-select"><div class="sezzle-inline-text-left">Just select</div><img src="https://sezzlemedia.s3.amazonaws.com/branding/sezzle-logos/sezzle-logo.svg"><div class="sezzle-inline-text-right">at checkout.</div></div><div class="sezzle-footer-text">Subject to approval. Estimated payment amount excludes taxes and shipping fees. Your actual installment payments will be presented for confirmation in your checkout with Sezzle.</div></div>';
    }
    document.getElementsByTagName('html')[0].appendChild(modalNode);
{/* <div class="sezzle-checkout-modal-lightbox"><div class="sezzle-checkout-modal"></div></div> */}
  } else {
    modalNode = document.getElementsByClassName('sezzle-checkout-modal-lightbox')[0];
  }

  // Event listenr for click in know more button
  Array.from(document.getElementsByClassName('sezzle-know-more'))
    .forEach(function(el) {
      el.addEventListener('click', function() {
        // Show modal node
        modalNode.style.display = 'block';
        // Remove hidden class to show the item
        modalNode.getElementsByClassName('sezzle-checkout-modal')[0].className = "sezzle-checkout-modal";
        // log on click event
        this.logEvent('onclick');
      }.bind(this))
    }.bind(this));

  Array.from(document.getElementsByClassName('sezzle-custom-widget-wrapper'))
    .forEach(function(el) {
      if(el.getElementsByClassName('sezzle-know-more').length == 0) {
        el.parentElement.parentElement.addEventListener('click', function() {
          // Show modal node
          modalNode.style.display = 'block';
          // Remove hidden class to show the item
          modalNode.getElementsByClassName('sezzle-checkout-modal')[0].className = "sezzle-checkout-modal";
          // log on click event
          this.logEvent('onclick');
        }.bind(this));
      }
    }.bind(this));

  // Event listenr for close in modal
  document.getElementsByClassName('close-sezzle-modal')[0]
    .addEventListener('click', function() {
      // Display the modal node
      modalNode.style.display = 'none';
      // Add hidden class hide the item
      modalNode.getElementsByClassName('sezzle-checkout-modal')[0].className = "sezzle-checkout-modal sezzle-checkout-modal-hidden";
    });
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
SezzleJS.prototype.getCSSVersionForMerchant = function(callback) {
  // make request
  if (document.sezzleCssVersionOverride !== undefined) {
    callback(document.sezzleCssVersionOverride);
  } else {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
      if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 200) {

          if(httpRequest.response.version === undefined){
              var ParsedObject = JSON.parse(httpRequest.response);
              callback(ParsedObject.version);
          }else{
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
}

/**
 *
 */
SezzleJS.prototype.hideSezzleHideDivs = function() {
  var toBeHiddenClasses = ['sezzle-hide'].concat(this.hideClasses);
  toBeHiddenClasses.forEach(function(classNameToHide){
    Array
    .from(document.getElementsByClassName(classNameToHide))
    .forEach(function(el) {
      el.className += " sezzle-hidden";
    });
  })
}

/**
 * Replaces the afterpay banner
 *
 */
SezzleJS.prototype.replaceBanner = function() {
  var imgurl = this.bannerURL;
  var linkpath = this.bannerLink;
  var bannerClass = this.bannerClass;

  if (bannerClass != '') {
    var element = document.getElementsByClassName(bannerClass)[0];

    if (linkpath != '') {
      var link = element.getElementsByTagName("a");
      if(link[0] != null) {
        link[0].setAttribute('href', linkpath);
      }
    }

    if (imgurl != '') {
      var img = element.getElementsByTagName("img");
      if(img[0] != null) {
        img[0].setAttribute('src', imgurl);
      }
    }
  }
}

/*
* Log Event
*/
SezzleJS.prototype.logEvent = function(eventName) {

  if(this.fingerprint == null){
    this.getFingerprint(function(fingerprint) {

      this.fingerprint = fingerprint

      this.postEvent(JSON.stringify({
          "event_name": eventName,
          "button_version": document.sezzleButtonVersion,
          "cart_id": this.getCookie('cart'),
          "fingerprint": fingerprint,
          "ip_address": this.ip,
          "merchant_site": window.location.hostname,
          "is_mobile_browser": this.isMobileBrowser(),
          "user_agent": navigator.userAgent,
          "merchant_uuid": this.merchantID,
      }));

    }.bind(this));
  }else{
      this.postEvent(JSON.stringify({
          "event_name": eventName,
          "button_version": document.sezzleButtonVersion,
          "cart_id": this.getCookie('cart'),
          "fingerprint": this.fingerprint,
          "ip_address": this.ip,
          "merchant_site": window.location.hostname,
          "is_mobile_browser": this.isMobileBrowser(),
          "user_agent": navigator.userAgent,
          "merchant_uuid": this.merchantID,
      }));
  }
}

/*
* Post Event
*/
SezzleJS.prototype.postEvent = function(payload) {
  var url = "https://widget.sezzle.com/v1/event/log";

  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) {
        console.log("Succesfully logged event");
      }else{
        console.log("Error: Status " + httpRequest.status );
      }
    }
  };

  httpRequest.open('POST', url, true);
  httpRequest.setRequestHeader('Content-Type', 'application/json');
  httpRequest.send(payload);
}

/*
* Get Fingerprint
*/
SezzleJS.prototype.getFingerprint = function(callback) {
  if(typeof window.Fingerprint2 === 'undefined' || window.Fingerprint2.VERSION != "1.4.1") {
    var script = document.createElement("script")
    script.type = "text/javascript";
    script.src = 'https://cdn.jsdelivr.net/fingerprintjs2/1.4.1/fingerprint2.min.js';
    script.onload = function() {
      if (window.Fingerprint2 !== undefined) {
        new Fingerprint2().get(function(result, components){
          callback(result);
        });
      }
      else {
        callback("");
      }
    };
    script.onerror = function() {
      callback("");
    }
    document.getElementsByTagName("head")[0].appendChild(script);
  } else {
    new Fingerprint2().get(function(result, components){
      callback(result);
    });
  }
}

/*
* Get Cookie
*/
SezzleJS.prototype.getCookie = function(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length === 2) {
        return parts.pop().split(";").shift();
    }
}

/*
* Is Mobile Browser
*/
SezzleJS.prototype.isMobileBrowser = function() {
  return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))
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
        this.hideSezzleHideDivs();
        this.replaceBanner();
      }
    }.bind(this));
  }
}

/**
 * All steps required to show the widget
 */
SezzleJS.prototype.initWidget = function() {
  this.logEvent("request");
  this.loadCSS(function() {
      var els = [];
      var toRenderEls = [];
      if (this.hasPriceClassElement) {
        els.push(this.priceElements[0])
        toRenderEls.push(this.renderElements[0])
      } else {
        this.xpath.forEach(function(path, index) {
          this.getAllPriceElements(path)
            .forEach(function(e) {
              els.push(e);
              toRenderEls.push(this.getElementToRender(
                e, index
              ))
            }.bind(this));
        }.bind(this));
      }
      els.forEach(function (el, index) {
        this.renderAwesomeSezzle(el, toRenderEls[index], index);
        this.startObserve(el);
      }.bind(this));
      this.renderModal();
    }.bind(this)
  );
}

// Assumes document.sezzleConfig is present
window.onload = new SezzleJS(document.sezzleConfig).init();

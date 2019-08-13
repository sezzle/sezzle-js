var cloneDeep = require('lodash.clonedeep')

// properties that do not belong to a config group (must have been factorized before)
const propsNotInConfigGroup = [
  "merchantID",
  "forcedShow",
  "minPrice",
  "maxPrice",
  "numberOfPayments",
  "altLightboxHTML",
  "apModalHTML",
  "qpModalHTML",
  "noGtm",
  "noTracking",
  "testID"
];

/**
 * This function returns widget string based on widgetLanguage if it's defined, else returns 'en' version
 * @param {*} widgetLanguage Set in sezzle.js
 * @param {*} numberOfPayments Set in sezzle.js
 * @returns {String} Widget String
 */
const widgetLanguageTranslation = function (widgetLanguage, numberOfPayments) {
  const translations = {
    'en': `or ${numberOfPayments} interest-free payments of %%price%% with %%logo%% %%info%%`,
    'fr-CA': `ou ${numberOfPayments} paiements sans intérêt de %%price%% with %%logo%% %%info%%`
  }
  return translations[widgetLanguage] || translations['en']
}

/**
 * This is a function to validate configs
 * @param options new config to validate
 * @return nothing. If config is invalid, error is thrown and program execution is stopped.
 */
exports.validateConfig = function (options) {
  if (!Array.isArray(options.configGroups)) {
    throw new Error("options.configGroups is not an array");
  } else {
    if (!options.configGroups.length) {
      throw new Error("options.configGroups must have at least one config object");
    }
  }

  // checking fields which MUST be specified in configGroups. (Only one as of now :D)
  const mustInclude = ["targetXPath"];
  options.configGroups.forEach(function (group) {
    mustInclude.forEach(function (field) {
      if (!group.hasOwnProperty(field)) {
        throw new Error(field + " must be specified in all configs in options.configGroups");
      }
    });
  });

  // type checks for crucial fields

  // expected types for crucial fields in the config
  // may do type checking for all fields in the future but it's just not necessary as of now
  const expectedTypes = {
    "targetXPath": "string",
    "renderToPath": "string",
    "urlMatch": "string"
  }
  options.configGroups.forEach(function (group) {
    Object.keys(expectedTypes).forEach(function (key) {
      if (group.hasOwnProperty(key) && typeof (group[key]) !== expectedTypes[key]) {
        throw new Error(key + " must be of type " + expectedTypes[key]);
      }
    });
  });

  // check correct factorization
  options.configGroups.forEach(function (group) {
    Object.keys(group).forEach(function (key) {
      if (propsNotInConfigGroup.indexOf(key) >= 0) {
        throw new Error(key + " is not a property of a configGroup. Specify this key at the outermost layer");
      }
    });
  });

  // if control reaches this point, the config is acceptable. It may not be perfect since the checks
  // are pretty loose, but at least the crucial parts of it are OK. May add more checks in the future.
  return;
}


/**
 * This is a helper function to convert an old
 * config passed into SezzleJS' constructor to a
 * new one which is compatible with the current
 * SezzleJS version. In other words, this
 * function is used for backwards compatability
 * with older versions.
 * @param options old config passed into SezzleJS' constructor
 * @return compatible object with current SezzleJS version
 */
exports.makeCompatible = function (options) {
  // place fields which do not belong in a group outside of configGroups
  var compatible = this.factorize(options);
  // split the configs up if necessary
  compatible.configGroups = this.splitConfig(options);
  // should we factorize common field values and place in defaultConfig? I don't think so
  return compatible;
}

/**
 * Function to split configs up according to the targetXPath
 * Every config should have at most one targetXPath.
 * @param options Old config
 * @return split array of configs
 */
exports.splitConfig = function (options) {
  var res = [];
  if (typeof (options.targetXPath) !== 'undefined') {
    // everything revolves around an xpath
    if (Array.isArray(options.targetXPath)) {
      // group up custom classes according to index
      var groupedCustomClasses = this.groupCustomClasses(options.customClasses);

      // need to ensure it's array and not string so that code doesnt mistakenly separate chars
      var renderToPathIsArray = Array.isArray(options.renderToPath);
      // a group should revolve around targetXPath
      // break up the array, starting from the first element
      options.targetXPath.forEach(function (xpath, inner) {
        // deep clone as config may have nested objects
        var config = cloneDeep(options);

        // overwrite targetXPath
        config.targetXPath = xpath;

        // sync up renderToPath array
        if (renderToPathIsArray && typeof (options.renderToPath[inner]) !== 'undefined') {
          config.renderToPath = options.renderToPath[inner] ? options.renderToPath[inner] : null;
        } else {
          // by default, below parent of target
          config.renderToPath = "..";
        }

        // sync up relatedElementActions array
        if (options.relatedElementActions &&
          typeof (options.relatedElementActions[inner]) !== 'undefined' &&
          Array.isArray(options.relatedElementActions[inner])) {
          config.relatedElementActions = options.relatedElementActions[inner];
        }

        // sync up customClasses
        if (typeof (groupedCustomClasses[inner]) !== 'undefined') {
          config.customClasses = groupedCustomClasses[inner];
        }

        // duplicate ignoredPriceElements string / array if exists
        if (options.ignoredPriceElements) {
          config.ignoredPriceElements = options.ignoredPriceElements;
        }

        // that's all, append
        res.push(config);
      });
    } else {
      // must be a single string
      res.push(options);
    }
  }
  return res;
}

/**
 * Group customClasses by targetXPathIndex
 * @param customClasses array of customClass objects
 * @return groupedCustomClasses, an array of array of customClass objects
 */
exports.groupCustomClasses = function (customClasses) {
  var result = [];
  if (customClasses && Array.isArray(customClasses)) {
    customClasses.forEach(function (customClass) {
      if (typeof (customClass.targetXPathIndex) === 'number') {
        if (typeof (result[customClass.targetXPathIndex]) === 'undefined') {
          result[customClass.targetXPathIndex] = [customClass];
        } else {
          result[customClass.targetXPathIndex].push(customClass);
        }
        delete customClass.targetXPathIndex;
      }
    });
  }
  return result;
}

/**
 * This is a helper function to move fields which do not belong to a
 * config group outside of the group and also place them outside
 * configGroups in order to be compatible with latest structure.
 * @param options old sezzle config
 * @return Factorized fields
 */
exports.factorize = function (options) {
  var factorized = {};

  // assumption is being made that all these fields are the same across all config groups
  // it is a reasonable assumption to make as :
  // - one config as a whole should only be assigned to one merchantID
  // - forcedShow is only useful if the country in which the widget is served is not in the supported list
  //   so it's reasonable to assume that forcedShow should be the same value for all configs
  // - as the widget only supports one modal currently, there is no capability of loading multiple modals
  
  propsNotInConfigGroup.forEach(function (field) {
    if (options[field] !== undefined) {
      factorized[field] = options[field];
      delete options[field];
    }
  });

  return factorized;
}

/**
 * Maps the props of configGroups passed by input into a default configGroup object
 * @param configGroup input by user
 * @param defaultConfig default config specified by the user (optional)
 * @param numberOfPayments number of split payments for the widget
 * @return default configGroup object, specifying all fields and taking into account overrides by input
 */
exports.mapGroupToDefault = function(configGroup, defaultConfig, numberOfPayments, widgetLanguage) {
  var result = {};

  // targetXPath SHOULD NOT be specified in defaultConfig since
  // it is like an ID for a configGroup (except if adding the price element class is used)
  result.xpath = this.breakXPath(configGroup.targetXPath);

  result.rendertopath = configGroup.renderToPath || (defaultConfig && defaultConfig.renderToPath) || '..';

  // This array in which its elements are objects with two keys
  // relatedPath - this is a xpath of an element related to the price element
  // action - this is a function triggered when the element has a mutation
  // initialAction - this is a function to act upon a pre existing element's condition
  result.relatedElementActions = configGroup.relatedElementActions || (defaultConfig && defaultConfig.relatedElementActions) || [];

  result.ignoredPriceElements = configGroup.ignoredPriceElements || (defaultConfig && defaultConfig.ignoredPriceElements) || [];
  if (typeof (result.ignoredPriceElements) === 'string') {
    // Only one x-path is given
    result.ignoredPriceElements = [this.breakXPath(result.ignoredPriceElements.trim())];
  } else {
    // result.ignoredPriceElements is an array of x-paths
    result.ignoredPriceElements = result.ignoredPriceElements.map(function (path) {
      return this.breakXPath(path.trim());
    }.bind(this));
  }

  result.alignment = configGroup.alignment || (defaultConfig && defaultConfig.alignment) || 'auto';
  result.widgetType = configGroup.widgetType || (defaultConfig && defaultConfig.widgetType) || 'product-page';
  result.bannerURL = configGroup.bannerURL || (defaultConfig && defaultConfig.bannerURL) || '';
  result.bannerClass = configGroup.bannerClass || (defaultConfig && defaultConfig.bannerClass) || '';
  result.bannerLink = configGroup.bannerLink || (defaultConfig && defaultConfig.bannerLink) || '';
  result.fontWeight = configGroup.fontWeight || (defaultConfig && defaultConfig.fontWeight) | 300;
  result.alignmentSwitchMinWidth = configGroup.alignmentSwitchMinWidth || (defaultConfig && defaultConfig.alignmentSwitchMinWidth); //pixels
  result.alignmentSwitchType = configGroup.alignmentSwitchType || (defaultConfig && defaultConfig.alignmentSwitchType);
  result.marginTop = configGroup.marginTop || (defaultConfig && defaultConfig.marginTop) || 0; //pixels
  result.marginBottom = configGroup.marginBottom || (defaultConfig && defaultConfig.marginBottom) || 0; //pixels
  result.marginLeft = configGroup.marginLeft || (defaultConfig && defaultConfig.marginLeft) || 0; //pixels
  result.marginRight = configGroup.marginRight || (defaultConfig && defaultConfig.marginRight) || 0; //pixels
  result.scaleFactor = configGroup.scaleFactor || (defaultConfig && defaultConfig.scaleFactor);
  result.logoSize = configGroup.logoSize || (defaultConfig && defaultConfig.logoSize) || 1.0;
  result.fontFamily = configGroup.fontFamily || (defaultConfig && defaultConfig.fontFamily) || 'inherit';
  result.textColor = configGroup.color || (defaultConfig && defaultConfig.color) || 'inherit';
  result.fontSize = configGroup.fontSize || (defaultConfig && defaultConfig.fontSize) || 12;
  result.maxWidth = configGroup.maxWidth || (defaultConfig && defaultConfig.maxWidth) || 400; //pixels
  result.fixedHeight = configGroup.fixedHeight || (defaultConfig && defaultConfig.fixedHeight) || 0; //pixels
  // This is used to get price of element
  result.priceElementClass = configGroup.priceElementClass || (defaultConfig && defaultConfig.priceElementClass) || 'sezzle-price-element';
  // This is used to tell where to render sezzle element to
  result.sezzleWidgetContainerClass = configGroup.sezzleWidgetContainerClass || (defaultConfig && defaultConfig.sezzleWidgetContainerClass) || 'sezzle-widget-container';
  // splitPriceElementsOn is used to deal with price ranges which are separated by arbitrary strings
  result.splitPriceElementsOn = configGroup.splitPriceElementsOn || (defaultConfig && defaultConfig.splitPriceElementsOn) || '';
  // after pay link
  result.apLink = configGroup.apLink || (defaultConfig && defaultConfig.apLink) || 'https://www.afterpay.com/terms-of-service';
  // This option is to render custom class in sezzle widget
  // This option contains an array of objects
  // each of the objects should have two properties
  // xpath -> the path from the root of sezzle element
  // className -> a string of classname that is to be added
  // index -> this is optional, if provided then only the widget with
  // configGroupIndex -> It's a map to the element that match the configGroup of that index
  // the same sezzle index value will be effected with the class name
  // Example : [
  // {xpath:'.', className: 'test-1', index: 0, configGroupIndex: 0},
  // {xpath: './.hello', className: 'test-2', index: 0, configGroupIndex: 0}
  //]
  result.customClasses = Array.isArray(configGroup.customClasses) ? configGroup.customClasses : [];

  result.widgetTemplate = configGroup.altVersionTemplate || (defaultConfig && defaultConfig.altVersionTemplate);
  if (result.widgetTemplate) {
    result.widgetTemplate = result.widgetTemplate.split('%%');
  } else {
    //var defaultWidgetTemplate = 'or ' + numberOfPayments + ' interest-free payments of %%price%% with %%logo%% %%info%%';
    var defaultWidgetTemplate = widgetLanguageTranslation(widgetLanguage, numberOfPayments);
    result.widgetTemplate = defaultWidgetTemplate.split('%%');
  }

  if (result.splitPriceElementsOn) {
    result.widgetTemplate = result.widgetTemplate.map(function (subtemplate) {
      return subtemplate === 'price' ? 'price-split' : subtemplate;
    });
  }

  // Search for price elements. If found, assume there is only one in this page
  result.hasPriceClassElement = false;
  result.priceElements = Array.prototype.slice.
    call(document.getElementsByClassName(result.priceElementClass));

  result.renderElements = Array.prototype.slice.
    call(document.getElementsByClassName(result.sezzleWidgetContainerClass));

  if (result.priceElements.length == 1) {
    result.hasPriceClassElement = true;
  }

  result.theme = configGroup.theme || (defaultConfig && defaultConfig.theme) || 'light';
  if (result.theme == 'dark') {
    result.imageURL = configGroup.imageUrl || (defaultConfig && defaultConfig.imageUrl) || 'https://d34uoa9py2cgca.cloudfront.net/branding/sezzle-logos/png/sezzle-logo-white-sm-100w.png';
    result.imageClassName = 'szl-dark-image';
  } else {
    result.imageURL = configGroup.imageUrl || (defaultConfig && defaultConfig.imageUrl) || 'https://d3svog4tlx445w.cloudfront.net/branding/sezzle-logos/png/sezzle-logo-sm-100w.png';
    result.imageClassName = 'szl-light-image';
  }

  result.hideClasses = configGroup.hideClasses || (defaultConfig && defaultConfig.hideClasses) || [];
  if (typeof (result.hideClasses) === 'string') {
    // Only one x-path is given
    result.hideClasses = [this.breakXPath(result.hideClasses.trim())];
  } else {
    // result.hideClasses is an array of x-paths
    result.hideClasses = result.hideClasses.map(function (path) {
      return this.breakXPath(path.trim());
    }.bind(this));
  }

  result.ignoredFormattedPriceText = configGroup.ignoredFormattedPriceText || (defaultConfig && defaultConfig.ignoredFormattedPriceText) || ['Subtotal', 'Total:', 'Sold Out'];
  if(!Array.isArray(result.ignoredFormattedPriceText)) {
    result.ignoredFormattedPriceText = [result.ignoredFormattedPriceText]
  }

  // variables set by the JS
  result.productPrice = null;
  result.widgetIsFirstChild = false; //private boolean variable set to true if widget is to be rendered as first child of the parent

  return result;
}

/**
 * This is helper function for formatPrice
 * @param n char value
 * @return boolean [if it's numeric or not]
 */
exports.isNumeric = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * This is a helper function to break xpath into array
 * @param xpath string Ex: './.class1/#id'
 * @returns string[] Ex: ['.', '.class', '#id']
 */
exports.breakXPath = function (xpath) {
  return xpath.split('/')
    .filter(function (subpath) {
      return subpath !== ''
    });
}

/**
 * This is helper function for formatPrice
 * @param n char value
 * @return boolean [if it's alphabet or not]
 */
exports.isAlphabet = function (n) {
  return /^[a-zA-Z()]+$/.test(n);
}

/**
 * This function will return the price string
 * @param price - string value
 * @param includeComma - comma should be added to the string or not
 * @return string
 */
exports.parsePriceString = function (price, includeComma) {
  var formattedPrice = '';
  for (var i = 0; i < price.length; i++) {
    if (this.isNumeric(price[i]) || price[i] == '.' || (includeComma && price[i] == ',')) {
      // If current is a . and previous is a character, it can be something like Rs.
      // so ignore it
      if (i > 0 && price[i] == '.' && this.isAlphabet(price[i - 1])) continue;

      formattedPrice += price[i];
    }
  }
  return formattedPrice;
}

/**
 * This function will format the price
 * @param price - string value
 * @return float
 */
exports.parsePrice = function (price) {
  return parseFloat(this.parsePriceString(price, false));
}

/**
 * Insert child after a given element
 * @param el Element to insert
 * @param referenceNode Element to insert after
 */
exports.insertAfter = function (el, referenceNode) {
  referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

/**
 * Insert element as the first child of the parentElement of referenceElement
 * @param element Element to insert
 * @param referenceElement Element to grab parent element
 */
exports.insertAsFirstChild = function (element, referenceElement) {
  referenceElement.parentElement.insertBefore(element, referenceElement);
  //bump up element above nodes which are not element nodes (if any)
  while (element.previousSibling) {
    element.parentElement.insertBefore(element, element.previousSibling);
  }
}

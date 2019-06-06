/**
 * This is a helper function to ensure that
 * the options passed into SezzleJS'
 * constructor is compatible with the current
 * SezzleJS version. In other words, this
 * function is used for backwards compatability 
 * with older versions
 * @param options options passed into SezzleJS' constructor
 * @return compatible object with current SezzleJS version
 */
exports.makeCompatible = function(options) {
  if(typeof options.configGroups !== 'undefined') {
    if(Array.isArray(options.configGroups)) {
      splitConfig(options.configGroups);
    }
  } else {
    // most likely old config, must wrap it in config group
    // deep clone to prevent circular structure
    options = {
      configGroups: [JSON.parse(JSON.stringify(options))]
    };
    // split the configs up if necessary
    splitConfig(options.configGroups);
  }
  // should we refactor the config group props? I don't think so
  return options;
}

/**
 * Function to split configs up according to the targetXPath
 * Every config should have at most one targetXPath.
 * @param configGroups Array of configs
 * @return no return. The function directly mutates the array.
 */
exports.splitConfig = function(configGroups) {
  // a group should revolve around targetXPath
  
  // cache the original array length as the array may potentially be mutated
  var len = configGroups.length;
  for(var i = 0; i < len; i++) {
    if(typeof configGroups[i].targetXPath !== 'undefined' && Array.isArray(configGroups[i].targetXPath)) {
      // break up, starting from the second xpath
      let renderToPathIsArray = Array.isArray(configGroups[i].renderToPath)
      for(var j = 1; j < configGroups[i].targetXPath.length; j++) {
        // deep clone as config may have nested objects
        var config = JSON.parse(JSON.stringify(configGroups[i]))
        // overwrite targetXPath and renderToPath (if exists)
        config.targetXPath = configGroups[i].targetXPath[j];
        // sync up renderToPath array
        if(renderToPathIsArray && typeof configGroups[i].renderToPath[j] !== 'undefined') {
          config.renderToPath = configGroups[i].renderToPath[j];
        } else {
          // nullify
          config.renderToPath = null;
        }
        configGroups.push(config);
      }
      // the original config's targetXPath and renderToPath gets assigned to the first element
      if(typeof configGroups[i].targetXPath[0] !== 'undefined') {
        configGroups[i].targetXPath = configGroups[i].targetXPath[0];
      }
      if(renderToPathIsArray && typeof configGroups[i].renderToPath[0] !== 'undefined') {
        configGroups[i].renderToPath = configGroups[i].renderToPath[0];
      }
    }
  }
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
exports.breakXPath = function(xpath) {
  return xpath.split('/')
    .filter(function(subpath) {
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

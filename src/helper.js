var cloneDeep = require('lodash.clonedeep')

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
  if(typeof (options.configGroups) === 'undefined') {
		// most likely old config, must wrap it in config group
		// deep clone to prevent circular structure
		options = {
			configGroups: [cloneDeep(options)]
		};
	}

	// split the configs up if necessary
	options.configGroups = exports.splitConfig(options.configGroups);
	// place fields which do not belong in a group outside of configGroups
	exports.factorize(options);

	// should we factorize common field values and place in defaultConfig? I don't think so
	return options;
}

/**
 * Function to split configs up according to the targetXPath
 * Every config should have at most one targetXPath.
 * @param configGroups Array of configs
 * @return split array of configs
 */
exports.splitConfig = function(configGroups) {
	var res = [];

	configGroups.forEach(function(group, outer) {
		if(typeof (group.targetXPath)!== 'undefined') {
			// everything revolves around an xpath
			if(Array.isArray(group.targetXPath)) {
				// need to ensure it's array and not string so that code doesnt mistakenly separate chars
				let renderToPathIsArray = Array.isArray(group.renderToPath);

				// group up custom classes according to index
				let groupedCustomClasses = [];
				group.customClasses.forEach(function(customClass) {
					if(typeof (customClass.targetXPathIndex) === 'number') {
						if(typeof (groupedCustomClasses[customClass.targetXPathIndex]) === 'undefined') {
							groupedCustomClasses[customClass.targetXPathIndex] = [customClass];
						} else {
							groupedCustomClasses[customClass.targetXPathIndex].push(customClass);
						}
						delete customClass.targetXPathIndex;
					}
				})

				// a group should revolve around targetXPath
				// break up the array, starting from the first element
				group.targetXPath.forEach(function(xpath, inner) {
					// deep clone as config may have nested objects
					var config = cloneDeep(group);

					// overwrite targetXPath
					config.targetXPath = xpath;

					// sync up renderToPath array
					if(renderToPathIsArray && typeof (group.renderToPath[inner]) !== 'undefined') {
						config.renderToPath = group.renderToPath[inner] ? group.renderToPath[inner] : null;
					} else {
						// nullify
						config.renderToPath = null;
					}

					// sync up relatedElementActions array
					if(group.relatedElementActions && 
						typeof (group.relatedElementActions[inner]) !== 'undefined' && 
						Array.isArray(group.relatedElementActions[inner])) {
						config.relatedElementActions = group.relatedElementActions[inner];
					}

					// sync up customClasses
					if(typeof (groupedCustomClasses[inner]) !== 'undefined') {
						config.customClasses = groupedCustomClasses[inner];
					}

					// duplicate ignoredPriceElements string / array if exists
					if(group.ignoredPriceElements) {
						config.ignoredPriceElements = group.ignoredPriceElements;
					}

					// that's all, append
					res.push(config);
				});
			} else {
				// must be a single string
				res.push(group)
			}
    	}
	});
	return res;
}

/**
 * This is a helper function to factorize common fields of groups
 * and also place them outside configGroups in order to be compatible
 * with latest structure. 
 * TODO (MAYBE) : Factorize all fields with common values in configGroups
 * and place it as a property of the defaultConfig
 * @param options the sezzle config
 * @return no return. The function mutates the object
 */
exports.factorize = function(options) {
	const fieldsToFactorize = ["merchantID", "forcedShow", "altModalHTML", "apModalHTML", "qpModalHTML"];
	var choose = {};

	// assumption is being made that all these fields are the same across all config groups
	// it is a reasonable assumption to make as :
	// - one config as a whole should only be assigned to one merchantID
	// - forcedShow is only useful if the country in which the widget is served is not in the supported list
	//   so it's reasonable to assume that forcedShow should be the same value for all configs
	// - as the widget only supports one modal currently, there is no capability of loading multiple modals

	options.configGroups.forEach(function(group) {
		fieldsToFactorize.forEach(function(field) {
			if(group[field] !== undefined) {
				choose[field] = group[field];
				delete group[field]; 
			}
		});
	});

	// insert to outermost layer
	for(var key in choose) {
		options[key] = choose[key];
	}

	return;
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

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

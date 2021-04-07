/* eslint-disable class-methods-use-this */
// import RenderAwesomeSezzle from './renderAwesomeSezzle';
import Utils from './utils';

class sezzleDOMFunctions {
  constructor(config) {
    this._config = config;
  }

  /**
   * ************* PUBLIC FUNCTIONS ***************
  */

  /**
   * This function fetches all the elements that is pointed to by the given xpath
   * @param xindex - Current xpath index value to be resolved [initial value is always 0]
   * @param elements - Array of current elements to be resolved [initial value is the element root(s)
   * of the search path]
   *
   * @return All the elements which are pointed to by the xpath
  */
  getElementsByXPath(xpath = [], xindex = 0, elements = null) {
    // Break condition
    if (xindex === xpath.length) return elements;
    // If elements are not provided, root the search at the document object
    if (elements === null) elements = [document];

    let children = [];
    const elementArray = Array.prototype.slice.call(elements);

    for (let index = 0; index < elementArray.length; index++) {
      const element = elementArray[index];
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
        // eslint-disable-next-line no-loop-func
        Array.prototype.forEach.call(element.getElementsByClassName(xpath[xindex].substr(1)), (el) => {
          children.push(el);
        });
      } else if (xpath[xindex].indexOf('child') === 0) { // If this is a child indicator
        const childNumber = xpath[xindex].split('-')[1];
        const childElement = element.childNodes[childNumber];
        if (typeof (childElement) !== 'undefined') {
          if (childElement.nodeName === '#text') { // if it's a text node we wrap it
            const newSpan = document.createElement('span');
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
        let indexToTake = 0;
        if (xpath[xindex].split('-').length > 1) {
          if (xpath[xindex].split('-')[1] >= 0) {
            indexToTake = parseInt(xpath[xindex].split('-')[1], 10);
          }
        }
        // eslint-disable-next-line no-loop-func
        Array.prototype.forEach.call(element.getElementsByTagName(xpath[xindex].split('-')[0]), (el, index) => {
          if (index === indexToTake) children.push(el);
        });
      }
    }

    children = children.filter((c) => c !== null);
    return this.getElementsByXPath(xpath, xindex + 1, children);
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
  getElementToRender(element, index = 0) {
    let toRenderElement = null;
    if (this._config.configGroups[index].rendertopath !== null) {
      const path = Utils.breakXPath(this._config.configGroups[index].rendertopath);
      toRenderElement = element;
      for (let i = 0; i < path.length; i++) {
        const p = path[i];
        if (toRenderElement === null) {
          break;
        } else if (p === '.') {
          // eslint-disable-next-line no-continue
          continue;
        } else if (p === '..') {
          // One level back
          toRenderElement = toRenderElement.parentElement;
        } else if (p[0] === '.') {
          // The class in the element
          toRenderElement = toRenderElement.getElementsByClassName(p.substr(1)).length
            ? toRenderElement.getElementsByClassName(p.substr(1))[0]
            : null;
        } else if (p[0] === '#') {
          // The ID in the element
          toRenderElement = document.getElementById(p.substr(1));
        } else if (p === '::first-child') {
          // rendered as first child
          toRenderElement = toRenderElement.children.length > 0
            ? toRenderElement.firstElementChild
            : null;
          this._config.configGroups[index].widgetIsFirstChild = true;
        } else {
          // If this is a tag
          // indexes are 0-indexed (e.g. span-2 means third span)
          let indexToTake = 0;
          if (p.split('-').length > 1) {
            if (p.split('-')[1] >= 0) {
              indexToTake = parseInt(p.split('-')[1], 10);
            }
          }
          toRenderElement = toRenderElement.getElementsByTagName(p.split('-')[0]).length > indexToTake
            ? toRenderElement.getElementsByTagName(p.split('-')[0])[indexToTake]
            : null;
        }
      }
    }
    // return the element's parent if toRenderElement is null
    return toRenderElement || element.parentElement;
  }

  /**
	 * Formats a price as Sezzle needs it
	 * @param element Element that contains price text
	 * @param configGroupIndex index of the config group which element belongs to
	 * @param priceText (optional) if defined, it contains the proper price text parsed from element
	*/
  getFormattedPrice(element, configGroupIndex, priceText) {
    if (!priceText) priceText = this.getPriceText(element, configGroupIndex);
    let includeComma = false;
    includeComma = this._config.parseMode === 'comma' || this._commaDelimited(priceText);
    // Get the price string - useful for formtting Eg: 120.00(string)
    const priceString = this._parsePriceString(priceText, includeComma);
    // Get the price in float from the element - useful for calculation Eg : 120.00(float)
    const price = this._parsePrice(priceText);
    // Will be used later to replace {price} with price / this.numberOfPayments Eg: ${price} USD
    let formatter = includeComma ? (priceText.replace('.', '')).replace(priceString, '{price}') : (priceText.replace(',', '')).replace(priceString, '{price}');
    // replace other strings not wanted in text
    this._config.configGroups[configGroupIndex].ignoredFormattedPriceText.forEach((ignoredString) => {
      formatter = formatter.replace(ignoredString, '');
    });
    // get the sezzle installment price
    const sezzleInstallmentPrice = (price / this._config.numberOfPayments).toFixed(2);
    // format the string
    let sezzleInstallmentFormattedPrice = formatter.replace('{price}', sezzleInstallmentPrice);
    if (includeComma) {
      sezzleInstallmentFormattedPrice = sezzleInstallmentFormattedPrice.replace('.', ',');
    }
    return sezzleInstallmentFormattedPrice;
  }

  /**
	 * Gets price text
	 * @param element Element that contains the price text
	*/
  getPriceText(element, configGroupIndex) {
    if (this._config.configGroups[configGroupIndex].ignoredPriceElements === []) {
      return element.textContent;
    }

    this._config.configGroups[configGroupIndex].ignoredPriceElements.forEach((subpaths) => {
      // get all elements pointed to by the xPath. Search is rooted at element
      this.getElementsByXPath(subpaths, 0, [element]).forEach((ignoredPriceElement) => {
        // mark the element to be ignored
        ignoredPriceElement.classList.add('sezzle-ignored-price-element');
      });
    });
    // if no ignored elements are found, return the whole inner text of the element
    if (!element.getElementsByClassName('sezzle-ignored-price-element').length) {
      return element.textContent;
    }
    // deep clone
    const clone = element.cloneNode(true);
    // remove all marked elements
    Array.prototype.forEach.call(clone.getElementsByTagName('*'), (element) => {
      if (Array.prototype.slice.call(element.classList).indexOf('sezzle-ignored-price-element') !== -1) {
        clone.removeChild(element);
      }
    });
    // remove all markers
    Array.prototype.forEach.call(element.getElementsByClassName('sezzle-ignored-price-element'), (element) => {
      element.classList.remove('sezzle-ignored-price-element');
    });
    return clone.textContent;
  }

  /**
	 * Is the product eligible for sezzle pay
	 * @param price Price of product
	*/
  isProductEligible(priceText, configGroupIndex) {
    const price = this._parsePrice(priceText);
    this._config.configGroups[configGroupIndex].productPrice = price;
    const priceInCents = price * 100;
    return priceInCents >= this._config.minPrice && priceInCents <= this._config.maxPrice;
  }

  /**
   * ************* PRIVATE FUNCTIONS ***************
  */

  /**
	 * This function starts observing for change
	 * in given Price element
	 * @param element to be observed
	 * @return void
	*/
  _startObserve(element, callback) {
    // TODO : Need a way to unsubscribe to prevent memory leak
    // Deleted elements should not be observed
    // That is handled
    const observer = new MutationObserver(callback);
    observer.observe(element, this._config.mutationObserverConfig);
    return observer;
  }

  /**
	 * Mutation observer callback function
	 * This observer observes for any change in a
	 * given DOM element (Price element in our case)
	 * and act on that
	*/
  _mutationCallBack(mutations, configGroupIndex) {
    mutations.filter((mutation) => mutation.type === 'childList')
      .forEach((mutation) => {
        try {
          const priceIndex = mutation.target.dataset.sezzleindex;
          const price = this.getFormattedPrice(mutation.target, configGroupIndex);
          const sezzlePriceElement = document.getElementsByClassName(`sezzleindex-${priceIndex}`)[0];
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
            const priceText = this.getPriceText(mutation.target, configGroupIndex);
            if (!this.isProductEligible(priceText, configGroupIndex)) {
              sezzlePriceElement.parentElement.parentElement.parentElement.classList.add('sezzle-hidden');
            }
          }
        } catch (e) {
          console.warn(e);
        }
      });
  }

  /**
   * This function start an observation on related elements to the price element
   * for any change and perform an action based on that
  */
  _observeRelatedElements(priceElement, sezzleElement, targets) {
    if (targets) {
      targets.forEach((target) => {
        if (typeof (target.relatedPath) === 'string'
          && (typeof (target.action) === 'function' || typeof (target.initialAction) === 'function')) {
          const elements = this.getElementsByXPath(
            Utils.breakXPath(target.relatedPath),
            0,
            [priceElement],
          );
          if (elements.length > 0) {
            if (typeof (target.action) === 'function') {
              this._startObserve(elements[0], (mutation) => {
                target.action(mutation, sezzleElement);
              });
            }
            if (typeof (target.initialAction) === 'function') {
              target.initialAction(elements[0], sezzleElement);
            }
          }
        }
      });
    }
  }

  /**
	 * Hide elements pointed to by this.hideClasses
	*/
  _hideSezzleHideElements(configGroupIndex) {
    this._config.configGroups[configGroupIndex].hideClasses.forEach((subpaths) => {
      this.getElementsByXPath(subpaths).forEach((element) => {
        if (!element.classList.contains('sezzle-hidden')) {
          element.classList.add('sezzle-hidden');
        }
      });
    });
  }

  /**
   * This is helper function for formatPrice
   * @param n char value
   * @return boolean [if it's numeric or not]
  */
  _isNumeric(n) {
    // eslint-disable-next-line no-restricted-globals
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  /**
   * This is helper function for formatPrice
   * @param n char value
   * @return boolean [if it's alphabet or not]
  */
  _isAlphabet(n) {
    return /^[a-zA-Z()]+$/.test(n);
  }

  _commaDelimited(priceText) {
    let priceOnly = '';
    for (let i = 0; i < priceText.length; i++) {
      if (this._isNumeric(priceText[i]) || priceText[i] === '.' || priceText[i] === ',') {
        priceOnly += priceText[i];
      }
    }
    let isComma = false;
    if (priceOnly.indexOf(',') > -1 && priceOnly.indexOf('.') > -1) {
      isComma = priceOnly.indexOf(',') > priceOnly.indexOf('.');
    } else if (priceOnly.indexOf(',') > -1) {
      isComma = priceOnly[priceOnly.length - 3] === ',';
    } else if (priceOnly.indexOf('.') > -1) {
      isComma = priceOnly[priceOnly.length - 3] !== '.';
    } else {
      isComma = false;
    }
    return isComma;
  }

  /**
   * This function will return the price string
   * @param price - string value
   * @param includeComma - comma should be added to the string or not
   * @return string
  */
  _parsePriceString(price, includeComma) {
    let formattedPrice = '';
    for (let i = 0; i < price.length; i++) {
      if (this._isNumeric(price[i]) || (!includeComma && price[i] === '.') || (includeComma && price[i] === ',')) {
        // If current is a . and previous is a character, it can be something like Rs.
        // so ignore it
        // eslint-disable-next-line no-continue
        if (i > 0 && price[i] === '.' && this._isAlphabet(price[i - 1])) continue;
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
  _parsePrice(price) {
    let includeComma = false;
    includeComma = this._commaDelimited(price);
    return parseFloat(this._parsePriceString(price, includeComma).replace(',', '.'));
  }
}

export default sezzleDOMFunctions;

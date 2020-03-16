import {state} from './sezzleWidgetState';
import {getElementsByXPath} from './coreFunctions';
import Helper from '../helper';
import httpRequestWrapper from './httpRequestWrapper';

const utils = {
    getCookie() {
        const value = '; ' + document.cookie;
        const parts = value.split('; ' + name + '=');
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
    },
    /*
    * Is Mobile Browser
    */
    isMobileBrowser() {
        return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4));
    },
    /**
     * This function will return the ISO 3166-1 alpha-2 country code
     * from the user's IP
    */
    async getCountryCodeFromIP ()  {
        let response = await httpRequestWrapper("GET", state.countryFromIPRequestURL);
        response = JSON.parse(response);
        return response["country_iso_code"] ? response["country_iso_code"] : console.log("Can't fetch the country code");
    },
    /**
     * Checks if document.sezzleCssVersionOverride is present
     * else calls widget server to find css version using merchant UUID and binds css to DOM
    */
    async loadCSS () {
        let cssVersion = document.sezzleCssVersionOverride;

        if (!cssVersion) {
            let response = await httpRequestWrapper("GET", state.cssForMerchantURL);
            response = JSON.parse(response);
            cssVersion = response.version;
        }
        
        const head = document.head;
        const link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = 'https://media.sezzle.com/shopify-app/assets/' + cssVersion;
        head.appendChild(link);
    },
    /**
     * Is the product eligible for sezzle pay
     * @param price Price of product
     */
    isProductEligible(priceText, configGroupIndex) {
        const price = Helper.parsePrice(priceText);
        state.configGroups[configGroupIndex].productPrice = price;
        const priceInCents = price * 100;
        return priceInCents >= state.minPrice && priceInCents <= state.maxPrice;
    },
    /**
     * This function starts observing for change
     * in given Price element
     * @param element to be observed
     * @return void
    */
    startObserve(element, callback) {
        // TODO : Need a way to unsubscribe to prevent memory leak
        // Deleted elements should not be observed
        // That is handled
        const observer = new MutationObserver(callback);
        observer.observe(element, state._config);
        return observer;
    },
    /**
     * Mutation observer callback function
     * This observer observes for any change in a
     * given DOM element (Price element in our case)
     * and act on that
    */
    mutationCallBack(mutations, configGroupIndex) {
        mutations.filter(mutation => mutation.type === 'childList')
        .forEach(mutation => {
            try {
                let priceIndex = mutation.target.dataset.sezzleindex;
                let price = this.getFormattedPrice(mutation.target, configGroupIndex);
                let sezzlePriceElement = document.getElementsByClassName('sezzleindex-' + priceIndex)[0];
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
                    let priceText = this.getPriceText(mutation.target, configGroupIndex);
                    if (!this.isProductEligible(priceText, configGroupIndex)){
                        sezzlePriceElement.parentElement.parentElement.parentElement.classList.add('sezzle-hidden');
                    }
                }
            } catch(e) {
                console.warn(e);
            }
        });
    },
    /**
     * Formats a price as Sezzle needs it
     * @param element Element that contains price text
     * @param configGroupIndex index of the config group which element belongs to
     * @param priceText (optional) if defined, it contains the proper price text parsed from element
    */
    getFormattedPrice(element, configGroupIndex, priceText) {
        if(!priceText) priceText = this.getPriceText(element, configGroupIndex);
        // Get the price string - useful for formtting Eg: 120.00(string)
        var priceString = Helper.parsePriceString(priceText, true);
        // Get the price in float from the element - useful for calculation Eg : 120.00(float)
        var price = Helper.parsePrice(priceText);
        // Will be used later to replace {price} with price / this.numberOfPayments Eg: ${price} USD
        var formatter = priceText.replace(priceString, '{price}');
        // replace other strings not wanted in text
        state.configGroups[configGroupIndex].ignoredFormattedPriceText.forEach(ignoredString => {
          formatter = formatter.replace(ignoredString, '');
        });
        // get the sezzle installment price
        var sezzleInstallmentPrice = (price / state.numberOfPayments).toFixed(2);
        // format the string
        var sezzleInstallmentFormattedPrice = formatter.replace('{price}', sezzleInstallmentPrice);
        return sezzleInstallmentFormattedPrice;
    },
    /**
     * Gets price text
     * @param element Element that contains the price text
    */
    getPriceText(element, configGroupIndex) {
        if (state.configGroups[configGroupIndex].ignoredPriceElements == []) {
            return element.textContent;
          } else {
            state.configGroups[configGroupIndex].ignoredPriceElements.forEach(subpaths => {
              // get all elements pointed to by the xPath. Search is rooted at element
              getElementsByXPath(subpaths, 0, [element]).forEach(ignoredPriceElement => {
                //mark the element to be ignored
                ignoredPriceElement.classList.add('sezzle-ignored-price-element');
              });
            });
          }
          // if no ignored elements are found, return the whole inner text of the element
          if (!element.getElementsByClassName('sezzle-ignored-price-element').length) {
            return element.textContent;
          }
          // deep clone
          var clone = element.cloneNode(true);
          //remove all marked elements
          Array.prototype.forEach.call(clone.getElementsByTagName('*'), element => {
            if (Array.prototype.slice.call(element.classList).indexOf('sezzle-ignored-price-element') !== -1) {
              clone.removeChild(element);
            }
          });
          //remove all markers
          Array.prototype.forEach.call(element.getElementsByClassName('sezzle-ignored-price-element'), element => {
            element.classList.remove('sezzle-ignored-price-element');
          });
          return clone.textContent;
    },
    /**
     * Guesses the widget alignment based on the
     * @param priceElement price element to add the widgets to, the target element
     * this method is based on the belief that the widget alignment should follow the text-align property of the price element
     */
    guessWidgetAlignment(priceElement) {
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
    },
    /**
     * Insert css class name in element
     * @param element to add class to
     * @param configGroupIndex index of the config group that element belongs to
     */
    insertWidgetTypeCSSClassInElement(element, configGroupIndex) {
        switch (state.configGroups[configGroupIndex].widgetType) {
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
    },
    /**
     * Hide elements pointed to by this.hideClasses
     */
    hideSezzleHideElements(configGroupIndex) {
        state.configGroups[configGroupIndex].hideClasses.forEach(subpaths => {
            getElementsByXPath(subpaths).forEach(element => {
                if (!element.classList.contains('sezzle-hidden')) {
                    element.classList.add('sezzle-hidden');
                }
            });
        });
    },
    /**
     * Insert css class name in element
     * @param element to add class to
     */
    insertStoreCSSClassInElement(element) {
        return element.className += ' sezzle-' + state.merchantID
    },
    /**
     * Set the top and bottom margins of element
     * @param element to set margins to
     * @param configGroupIndex index of the config group that element belongs to
     */
    setElementMargins(element, configGroupIndex) {
        element.style.marginTop = state.configGroups[configGroupIndex].marginTop + 'px';
        element.style.marginBottom = state.configGroups[configGroupIndex].marginBottom + 'px';
        element.style.marginLeft = state.configGroups[configGroupIndex].marginLeft + 'px';
        element.style.marginRight = state.configGroups[configGroupIndex].marginRight + 'px';
    },
    /**
     * Scale the element size using CSS transforms
     * The transform origin is set to 'top {this.alignment}'
     * scale() scales the element appropriately, maintaining the aspect ratio
     * @param element - element to set the size to
     * @param configGroupIndex - index of the config group that element belongs to
     * @return void
    */
    setWidgetSize(element, configGroupIndex) {
        element.style.transformOrigin = 'top ' + state.configGroups[configGroupIndex].alignment;
        element.style.transform = 'scale(' + state.configGroups[configGroupIndex].scaleFactor + ')';
        if (state.configGroups[configGroupIndex].fixedHeight) {
            element.style.height = state.configGroups[configGroupIndex].fixedHeight + 'px';
            element.style.overflow = 'hidden';
        }
    },
    /**
     * Add CSS alignment class as required based on the viewport width
     * @param element Element to add to
     * @param configGroupIndex index of the config group that element belongs to
     */
    addCSSAlignment(element, configGroupIndex) {
        var newAlignment = '';
        if (matchMedia && state.configGroups[configGroupIndex].alignmentSwitchMinWidth && state.configGroups[configGroupIndex].alignmentSwitchType) {
        var queryString = '(min-width: ' + state.configGroups[configGroupIndex].alignmentSwitchMinWidth + 'px)';
        var mq = window.matchMedia(queryString);
        if (!mq.matches) {
            newAlignment = state.configGroups[configGroupIndex].alignmentSwitchType;
        }
        }
        switch (newAlignment || state.configGroups[configGroupIndex].alignment) {
        case 'left':
            element.className += ' sezzle-left';
            break;
        case 'right':
            element.className += ' sezzle-right';
            break;
        case 'center':
            element.className += ' sezzle-center';
            break;
        default:
            // if there is no alignment specified, it will be auto
            break;
        }
    },
    /**
     * Add CSS customisation class as required
     * @param element Element to add to
     * @param configGroupIndex index of the config group that element belongs to
     */
    addCSSCustomisation(element, configGroupIndex) {
        this.addCSSAlignment(element, configGroupIndex);
        this.addCSSFontStyle(element, configGroupIndex);
        this.addCSSTextColor(element, configGroupIndex);
        this.addCSSTheme(element, configGroupIndex);
        this.addCSSWidth(element, configGroupIndex);
    },
    /**
     * Add CSS fonts styling as required
     * @param element Element to add to
     * @param configGroupIndex index of the config group that element belongs to
     */
    addCSSFontStyle(element, configGroupIndex) {
        if (state.configGroups[configGroupIndex].fontWeight) {
            element.style.fontWeight = state.configGroups[configGroupIndex].fontWeight;
        }
        if (state.configGroups[configGroupIndex].fontFamily) {
            element.style.fontFamily = state.configGroups[configGroupIndex].fontFamily;
        }
        if (state.configGroups[configGroupIndex].fontSize != 'inherit') {
            element.style.fontSize = state.configGroups[configGroupIndex].fontSize + 'px';
        }
        element.style.lineHeight = state.configGroups[configGroupIndex].lineHeight || '13px';   
    },
    /**
     * Add CSS width class as required
     * @param element Element to add to
     * @param configGroupIndex index of the config group that element belongs to
     */
    
    addCSSWidth(element, configGroupIndex) {
        if (state.configGroups[configGroupIndex].maxWidth) {
            element.style.maxWidth = state.configGroups[configGroupIndex].maxWidth + 'px';
        }
    },
    /**
     * Add CSS text color as required
     * @param element Element to add to
     * @param configGroupIndex index of the config group that element belongs to
     */
    addCSSTextColor(element, configGroupIndex) {
        if (state.configGroups[configGroupIndex].textColor) {
            element.style.color = state.configGroups[configGroupIndex].textColor;
        }
    },
    /**
     * Add CSS theme class as required
     * @param element Element to add to
     * @param configGroupIndex index of the config group that element belongs to
     */
    addCSSTheme(element, configGroupIndex) {
        switch (state.configGroups[configGroupIndex].theme) {
        case 'dark':
            element.className += ' szl-dark';
            break;
        default:
            element.className += ' szl-light';
            break;
        }
    },
    /**
     * Scale the widget size using CSS transforms
     * The transform origin is set to 'top {this.alignment}'
     * scale() scales the element appropriately, maintaining the aspect ratio
     * @param element - logo element
     * @param configGroupIndex - index of the config group that element belongs to
     * @return void
     */
    setLogoSize(element, configGroupIndex) {
        element.style.transformOrigin = 'top ' + state.configGroups[configGroupIndex].alignment;
        element.style.transform = 'scale(' + state.configGroups[configGroupIndex].logoSize + ')';
    },
    /**
     * Add styling to logo Element incase its provided by the config
     * @param element - logo element
     * @param element - element to set styles on
     * @param configGroupIndex - index of the config group that element belongs to
     * @return void
     */
    setLogoStyle(element, configGroupIndex) {
        Object.keys(state.configGroups[configGroupIndex].logoStyle).forEach(key=>{
            element.style[key] = state.configGroups[configGroupIndex].logoStyle[key];
        });
    }
}

export default utils;

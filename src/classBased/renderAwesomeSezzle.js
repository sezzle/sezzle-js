/* eslint-disable class-methods-use-this */
import Utils from './utils';
import SezzleDOMFunctions from './sezzleDOMFunctions';
import Modal from './modal';
/* eslint-disable max-len */
class renderAwesomeSezzle {
  constructor(config) {
    this._config = config;
    this._allConfigsUsePriceClassElement = true;
    this._els = [];
    this._intervalInMs = 2000;

    this._modalInst = new Modal(config);
    this._sezzleDOMInst = new SezzleDOMFunctions(config);
  }

  /**
   * ************* PUBLIC FUNCTIONS ***************
  */
  initializeRendering() {
    this._config.configGroups.forEach((configGroup, index) => {
      if (configGroup.hasPriceClassElement) {
        this.render(
          configGroup.priceElements[0], configGroup.renderElements[0],
          0, index,
        );
        this._sezzleDOMInst._startObserve(configGroup.priceElements[0], (mutations) => {
          this._sezzleDOMInst._mutationCallBack(mutations, index);
        });
      } else {
        this._allConfigsUsePriceClassElement = false;
      }
    });
    if (!this._allConfigsUsePriceClassElement) this._sezzleWidgetCheckInterval();
    this._modalInst.renderModals(this._config);
  }


  /**
   * Looks for newly added price elements
  */
  _sezzleWidgetCheckInterval() {
    this._config.configGroups.forEach((configGroup, index) => {
      if (configGroup.xpath === []) return;
      const elements = this._sezzleDOMInst.getElementsByXPath(configGroup.xpath);
      elements.forEach((e) => {
        if (!e.hasAttribute('data-sezzleindex')) {
          this._els.push({
            element: e,
            toRenderElement: this._sezzleDOMInst.getElementToRender(e, index),
            deleted: false,
            observer: null,
            configGroupIndex: index,
          });
        }
      });
    });
    // add the sezzle widget to the price elements
    this._els.forEach((el, index) => {
      if (!el.element.hasAttribute('data-sezzleindex')) {
        const sz = this.render(
          el.element, el.toRenderElement,
          index, el.configGroupIndex,
        );
        if (sz) {
          el.observer = this._sezzleDOMInst._startObserve(el.element, (mutations) => {
            this._sezzleDOMInst._mutationCallBack(mutations, el.configGroupIndex);
          });
          this._modalInst.addClickEventForModal(sz, el.configGroupIndex);
          this._sezzleDOMInst._observeRelatedElements(el.element, sz, this._config.configGroups[el.configGroupIndex].relatedElementActions);
        } else {
          // remove the element from the els array
          delete this._els[index];
        }
      }
    });
    // refresh the array
    this._els = this._els.filter((e) => e !== undefined);
    // Find the deleted price elements
    // remove corresponding Sezzle widgets if exists
    this._els.forEach((el, index) => {
      if (el.element.parentElement === null && !el.deleted) { // element is deleted
        // Stop observing for changes in the element
        if (el.observer !== null) el.observer.disconnect();
        // Mark that element as deleted
        el.deleted = true;
        // Delete the corresponding sezzle widget if exist
        const tmp = document.getElementsByClassName(`sezzlewidgetindex-${index}`);
        if (tmp.length) {
          const sw = tmp[0];
          sw.parentElement.removeChild(sw);
        }
      }
    });
    // Hide elements ex: afterpay
    for (let index = 0, len = this._config.configGroups.length; index < len; index++) {
      this._sezzleDOMInst._hideSezzleHideElements(index);
    }
    setTimeout(() => this._sezzleWidgetCheckInterval(), this._intervalInMs);
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
  render(element, renderelement, index = 0, configGroupIndex) {
    // Do not render this product if it is not eligible
    const priceText = this._sezzleDOMInst.getPriceText(element, configGroupIndex);
    if (!this._sezzleDOMInst.isProductEligible(priceText, configGroupIndex)) return false;
    // Do not render if sezzle ignored price element
    if (element.classList.contains('sezzle-ignored-price-element')) return false;
    // Set data index to each price element for tracking
    element.dataset.sezzleindex = index;
    // Get element to be rendered with sezzle's widget
    const parent = renderelement;
    // get the alignment of the widget (if widgetAlignment is auto)
    // the alignment, when set to auto follows the text-align property of the price element
    if (this._config.configGroups[configGroupIndex].alignment === 'auto') {
      this._config.configGroups[configGroupIndex].alignment = this._guessWidgetAlignment(element);
    }
    // root node for sezzle
    const sezzle = document.createElement('div');
    // TODO: why there is a shopify specific naming
    sezzle.className = `sezzle-shopify-info-button sezzlewidgetindex-${index}`;
    this._insertWidgetTypeCSSClassInElement(sezzle, configGroupIndex);
    this._insertStoreCSSClassInElement(sezzle);
    this._setElementMargins(sezzle, configGroupIndex);
    if (this._config.configGroups[configGroupIndex].scaleFactor) this._setWidgetSize(sezzle, configGroupIndex);
    const node = document.createElement('div');
    node.className = 'sezzle-checkout-button-wrapper sezzle-modal-link';
    node.tabindex = 0;
    node.style.cursor = 'pointer';
    this._insertStoreCSSClassInElement(node);
    this._addCSSAlignment(node, configGroupIndex);
    const sezzleButtonText = document.createElement('div');
    sezzleButtonText.className = 'sezzle-button-text';
    this._addCSSCustomisation(sezzleButtonText, configGroupIndex);
    this._config.configGroups[configGroupIndex].widgetTemplate.forEach((subtemplate) => {
      switch (subtemplate) {
      case 'price': {
        const priceSpanNode = document.createElement('span');
        priceSpanNode.className = `sezzle-payment-amount sezzle-button-text sezzleindex-${index}`;
        const priceValueText = document.createTextNode(this._sezzleDOMInst.getFormattedPrice(element, configGroupIndex, priceText));
        priceSpanNode.appendChild(priceValueText);
        sezzleButtonText.appendChild(priceSpanNode);
        break;
      }
      case 'logo': {
        const logoNode = document.createElement('img');
        logoNode.className = `sezzle-logo ${this._config.configGroups[configGroupIndex].imageClassName}`;
        logoNode.src = this._config.configGroups[configGroupIndex].imageURL;
        logoNode.alt = 'Sezzle';
        logoNode.style.height = '18px';
        logoNode.style.verticalAlign = 'baseline';
        sezzleButtonText.appendChild(logoNode);
        this._setLogoSize(logoNode, configGroupIndex);
        if (this._config.configGroups[configGroupIndex].logoStyle !== {}) this._setLogoStyle(logoNode, configGroupIndex);
        break;
      }
      // changed from learn-more to link as that is what current altVersionTemplates use
      case 'link': {
        const learnMoreNode = document.createElement('button');
        learnMoreNode.role = 'button';
        learnMoreNode.type = 'button';
        learnMoreNode.title = 'Learn More about Sezzle';
        learnMoreNode.className = 'sezzle-learn-more';
        const learnMoreText = document.createTextNode('Learn more');
        learnMoreNode.appendChild(learnMoreText);
        sezzleButtonText.appendChild(learnMoreNode);
        break;
      }
      case 'info': {
        const infoIconNode = document.createElement('button');
        infoIconNode.role = 'button';
        infoIconNode.type = 'button';
        infoIconNode.title = 'Learn More about Sezzle';
        infoIconNode.className = 'sezzle-info-icon';
        infoIconNode.innerHTML = '&#9432;';
        infoIconNode.style = `display: inline; width: auto; min-height: 9px; max-height: 20px; font-size: ${this._config.configGroups[configGroupIndex].fontSize}px;`;
        sezzleButtonText.appendChild(infoIconNode);
        break;
      }
      case 'question-mark': {
        const questionMarkButton = document.createElement('button');
        questionMarkButton.role = 'button';
        questionMarkButton.type = 'button';
        questionMarkButton.title = 'Learn More about Sezzle';
        const questionMarkIconNode = document.createElement('img');
        questionMarkIconNode.className = 'sezzle-question-mark-icon';
        questionMarkIconNode.src = 'https://d2uyik3j5wol98.cloudfront.net/images/question_mark_black.png';
        questionMarkIconNode.alt = 'More Info';
        questionMarkButton.appendChild(questionMarkIconNode);
        sezzleButtonText.appendChild(questionMarkButton);
        break;
      }
      case 'affirm-logo': {
        const affirmNode = document.createElement('img');
        affirmNode.className = 'sezzle-affirm-logo affirm-modal-info-link no-sezzle-info';
        affirmNode.style.maxHeight = '20px';
        affirmNode.style.verticalAlign = 'middle';
        affirmNode.src = 'https://cdn-assets.affirm.com/images/black_logo-transparent_bg.png';
        affirmNode.alt = 'Affirm';
        sezzleButtonText.appendChild(affirmNode);
        break;
      }
      case 'affirm-logo-greyscale': {
        const affirmNode = document.createElement('img');
        affirmNode.className = 'sezzle-affirm-logo affirm-modal-info-link no-sezzle-info';
        affirmNode.style.maxHeight = '20px';
        affirmNode.style.verticalAlign = 'middle';
        affirmNode.src = 'https://cdn-assets.affirm.com/images/all_black_logo-transparent_bg.png';
        affirmNode.alt = 'Affirm';
        sezzleButtonText.appendChild(affirmNode);
        break;
      }
      case 'affirm-logo-white': {
        const affirmNode = document.createElement('img');
        affirmNode.className = 'sezzle-affirm-logo affirm-modal-info-link no-sezzle-info';
        affirmNode.style.maxHeight = '20px';
        affirmNode.style.verticalAlign = 'middle';
        affirmNode.src = 'https://cdn-assets.affirm.com/images/white_logo-transparent_bg.png';
        affirmNode.alt = 'Affirm';
        sezzleButtonText.appendChild(affirmNode);
        break;
      }
      case 'affirm-info-icon': {
        const affirmInfoIconNode = document.createElement('button');
        affirmInfoIconNode.role = 'button';
        affirmInfoIconNode.type = 'button';
        affirmInfoIconNode.title = 'Learn More about Affirm';
        affirmInfoIconNode.className = 'affirm-modal-info-link no-sezzle-info';
        affirmInfoIconNode.innerHTML = '&#9432;';
        affirmInfoIconNode.style = `display: inline; width: auto; min-height: 9px; max-height: 20px; font-size: ${this._config.configGroups[configGroupIndex].fontSize}px;`;
        sezzleButtonText.appendChild(affirmInfoIconNode);
        break;
      }
      case 'affirm-link-icon': {
        const affirmAnchor = document.createElement('a');
        affirmAnchor.href = this._config.affirmLink;
        affirmAnchor.target = '_blank';
        const affirmLinkIconNode = document.createElement('code');
        affirmLinkIconNode.title = 'Open Affirm in a new tab';
        affirmLinkIconNode.className = 'affirm-info-link';
        affirmLinkIconNode.innerHTML = '&#9432;';
        affirmAnchor.appendChild(affirmLinkIconNode);
        sezzleButtonText.appendChild(affirmAnchor);
        break;
      }
      case 'afterpay-logo': {
        const apNode = document.createElement('img');
        apNode.className = 'sezzle-afterpay-logo ap-modal-info-link no-sezzle-info';
        apNode.style.maxHeight = '27px';
        apNode.style.maxWidth = '60px';
        apNode.style.verticalAlign = 'bottom';
        apNode.src = 'https://media.sezzle.com/sezzle-credit-website-assets/ap-badge-black-on-mint.svg';
        apNode.alt = 'Afterpay';
        sezzleButtonText.appendChild(apNode);
        break;
      }
      case 'afterpay-logo-white': {
        const apNode = document.createElement('img');
        apNode.className = 'sezzle-afterpay-logo ap-modal-info-link no-sezzle-info';
        apNode.style.maxHeight = '27px';
        apNode.style.maxWidth = '60px';
        apNode.style.verticalAlign = 'bottom';
        apNode.src = 'https://media.sezzle.com/sezzle-credit-website-assets/ap-badge-black-on-white.svg';
        apNode.alt = 'Afterpay';
        sezzleButtonText.appendChild(apNode);
        break;
      }
      case 'afterpay-logo-grey': {
        const apNode = document.createElement('img');
        apNode.className = 'sezzle-afterpay-logo ap-modal-info-link no-sezzle-info';
        apNode.style.maxHeight = '27px';
        apNode.style.maxWidth = '60px';
        apNode.style.verticalAlign = 'bottom';
        apNode.src = 'https://media.sezzle.com/sezzle-credit-website-assets/ap-badge-white-on-black.svg';
        apNode.alt = 'Afterpay';
        sezzleButtonText.appendChild(apNode);
        break;
      }
      case 'afterpay-info-icon': {
        const apInfoIconNode = document.createElement('button');
        apInfoIconNode.role = 'button';
        apInfoIconNode.type = 'button';
        apInfoIconNode.title = 'Learn More about Afterpay';
        apInfoIconNode.className = 'ap-modal-info-link no-sezzle-info';
        apInfoIconNode.innerHTML = '&#9432;';
        apInfoIconNode.style = `display: inline; width: auto; min-height: 9px; max-height: 20px; font-size: ${this._config.configGroups[configGroupIndex].fontSize}px;`;
        sezzleButtonText.appendChild(apInfoIconNode);
        break;
      }
      case 'afterpay-link-icon': {
        const apAnchor = document.createElement('a');
        apAnchor.href = this._config.configGroups[configGroupIndex].apLink;
        apAnchor.target = '_blank';
        const apLinkIconNode = document.createElement('code');
        apLinkIconNode.title = 'Open Afterpay in a new tab';
        apLinkIconNode.className = 'ap-info-link';
        apLinkIconNode.innerHTML = '&#9432;';
        apAnchor.appendChild(apLinkIconNode);
        sezzleButtonText.appendChild(apAnchor);
        break;
      }
      case 'klarna-logo': {
        const klarnaNode = document.createElement('img');
        klarnaNode.className = 'sezzle-klarna-logo klarna-modal-info-link no-sezzle-info';
        klarnaNode.style.height = '30px';
        klarnaNode.style.verticalAlign = 'middle';
        klarnaNode.src = 'https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg';
        klarnaNode.alt = 'Klarna';
        sezzleButtonText.appendChild(klarnaNode);
        break;
      }
      case 'klarna-logo-white': {
        const klarnaNode = document.createElement('img');
        klarnaNode.className = 'sezzle-klarna-logo klarna-modal-info-link no-sezzle-info';
        klarnaNode.style.height = '30px';
        klarnaNode.style.verticalAlign = 'middle';
        klarnaNode.src = 'https://x.klarnacdn.net/payment-method/assets/badges/generic/white/klarna.svg';
        klarnaNode.alt = 'Klarna';
        sezzleButtonText.appendChild(klarnaNode);
        break;
      }
      case 'klarna-logo-greyscale': {
        const klarnaNode = document.createElement('img');
        klarnaNode.className = 'sezzle-klarna-logo klarna-modal-info-link no-sezzle-info';
        klarnaNode.style.height = '30px';
        klarnaNode.style.verticalAlign = 'middle';
        klarnaNode.src = 'https://x.klarnacdn.net/payment-method/assets/badges/generic/black/klarna.svg';
        klarnaNode.alt = 'Klarna';
        sezzleButtonText.appendChild(klarnaNode);
        break;
      }
      case 'klarna-info-icon': {
        const klarnaInfoIconNode = document.createElement('button');
        klarnaInfoIconNode.role = 'button';
        klarnaInfoIconNode.type = 'button';
        klarnaInfoIconNode.title = 'Learn More about Klarna';
        klarnaInfoIconNode.className = 'klarna-modal-info-link no-sezzle-info';
        klarnaInfoIconNode.innerHTML = '&#9432;';
        klarnaInfoIconNode.style = `display: inline; width: auto; min-height: 9px; max-height: 20px; font-size: ${this._config.configGroups[configGroupIndex].fontSize}px;`;
        sezzleButtonText.appendChild(klarnaInfoIconNode);
        break;
      }
      case 'quadpay-logo': {
        const qpNode = document.createElement('img');
        qpNode.className = 'sezzle-quadpay-logo qp-modal-info-link no-sezzle-info';
        qpNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/qp-logo-widget.png';
        qpNode.alt = 'Quadpay';
        qpNode.style.maxHeight = '17px';
        qpNode.style.maxWidth = '65px';
        qpNode.style.verticalAlign = 'text-bottom';
        sezzleButtonText.appendChild(qpNode);
        break;
      }
      case 'quadpay-logo-grey': {
        const qpNode = document.createElement('img');
        qpNode.className = 'sezzle-quadpay-logo qp-modal-info-link no-sezzle-info';
        qpNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/qp-logo-widget-grayscale.png';
        qpNode.alt = 'Quadpay';
        qpNode.style.maxHeight = '17px';
        qpNode.style.maxWidth = '65px';
        qpNode.style.verticalAlign = 'text-bottom';
        sezzleButtonText.appendChild(qpNode);
        break;
      }
      case 'quadpay-logo-white': {
        const qpNode = document.createElement('img');
        qpNode.className = 'sezzle-quadpay-logo qp-modal-info-link no-sezzle-info';
        qpNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/qp-logo-widget-white.png';
        qpNode.alt = 'Quadpay';
        qpNode.style.maxHeight = '17px';
        qpNode.style.maxWidth = '65px';
        qpNode.style.verticalAlign = 'text-bottom';
        sezzleButtonText.appendChild(qpNode);
        break;
      }
      case 'quadpay-info-icon': {
        const quadpayInfoIconNode = document.createElement('button');
        quadpayInfoIconNode.role = 'button';
        quadpayInfoIconNode.type = 'button';
        quadpayInfoIconNode.title = 'Learn More about Quadpay';
        quadpayInfoIconNode.className = 'qp-modal-info-link no-sezzle-info';
        quadpayInfoIconNode.innerHTML = '&#9432;';
        quadpayInfoIconNode.style = `display: inline; width: auto; min-height: 9px; max-height: 20px; font-size: ${this._config.configGroups[configGroupIndex].fontSize}px;`;
        sezzleButtonText.appendChild(quadpayInfoIconNode);
        break;
      }
      case 'price-split': {
        const priceSplitNode = document.createElement('span');
        priceSplitNode.className = `sezzle-payment-amount sezzle-price-split sezzleindex-${index}`;
        const priceElemTexts = element.textContent.split(this._config.configGroups[configGroupIndex].splitPriceElementsOn);
        let priceSplitText = '';
        if (priceElemTexts.length === 1) { // if the text is not being splitted (this check is needed in order to support sites with multiple types of product pricing)
          // give the original element in the case there might be some ignored elements present
          priceSplitText = this._sezzleDOMInst.getFormattedPrice(element, configGroupIndex, priceText);
        } else {
          const priceElems = [];
          priceElemTexts.forEach((text) => {
            const priceElemSpan = document.createElement('span');
            priceElemSpan.textContent = text;
            priceElems.push(priceElemSpan);
          });
          priceElems.forEach((elem, index) => {
            if (index === 0) {
              priceSplitText = this._sezzleDOMInst.getFormattedPrice(elem, configGroupIndex);
            } else {
              priceSplitText = `${priceSplitText} ${this._config.configGroups[configGroupIndex].splitPriceElementsOn} ${this._sezzleDOMInst.getFormattedPrice(elem, configGroupIndex)}`;
            }
          });
        }
        const priceSplitTextNode = document.createTextNode(priceSplitText);
        priceSplitNode.appendChild(priceSplitTextNode);
        sezzleButtonText.appendChild(priceSplitNode);
        break;
      }
      case 'line-break': {
        const lineBreakNode = document.createElement('br');
        sezzleButtonText.appendChild(lineBreakNode);
        break;
      }
      default: {
        const widgetTextNode = document.createTextNode(subtemplate);
        sezzleButtonText.appendChild(widgetTextNode);
        break;
      }
      }
    });
    node.appendChild(sezzleButtonText);
    // Adding main node to sezzel node
    sezzle.appendChild(node);
    this._config.configGroups[configGroupIndex].customClasses.forEach((customClass) => {
      if (customClass.xpath && customClass.className) {
        if (typeof (customClass.index) !== 'number') {
          customClass.index = -1; // set the default value
        }
        if (customClass.index === index || customClass.index === -1) {
          const path = Utils.breakXPath(customClass.xpath);
          this._sezzleDOMInst.getElementsByXPath(path, 0, [sezzle])
            .forEach((el) => {
              el.className += ` ${customClass.className}`;
            });
        }
      }
    });
    // Adding sezzle to parent node
    if (this._config.configGroups[configGroupIndex].widgetIsFirstChild) {
      this._insertAsFirstChild(sezzle, parent);
    } else {
      this._insertAfter(sezzle, parent);
    }
    Utils.logEvent('sezzle-widget-onload', this._config);
    return sezzle;
  }

  /**
   * ************* PRIVATE FUNCTIONS ***************
  */

  /**
	 * Insert css class name in element
	 * @param element to add class to
	 * @param configGroupIndex index of the config group that element belongs to
	*/
  _insertWidgetTypeCSSClassInElement(element, configGroupIndex) {
    switch (this._config.configGroups[configGroupIndex].widgetType) {
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
	 * Guesses the widget alignment based on the
	 * @param priceElement price element to add the widgets to, the target element
	 * this method is based on the belief that the widget alignment should follow the text-align
	 * property of the price element
	*/
  _guessWidgetAlignment(priceElement) {
    if (!priceElement) return 'left'; // default
    const textAlignment = window.getComputedStyle(priceElement).textAlign;
    /* Start is a CSS3  value for textAlign to accommodate for other languages which may be
		 * RTL (right to left) for instance Arabic. Since the sites we are adding the widgets to are mostly,
		 * if not all in English, it will be LTR (left to right), which implies that 'start' and 'justify' would mean 'left'
		 */
    if (textAlignment === 'start' || textAlignment === 'justify') return 'left';
    /*
		 * end is a CSS3  value for textAlign to accommodate for other languages which may be RTL (right to left), for instance Arabic
		 * Since the sites we are adding to are mostly, if not all in English, it will be LTR (left to right), hence 'right' at the end
		 */
    return textAlignment === 'end' ? 'right' : textAlignment;
  }

  /**
	 * Insert css class name in element
	 * @param element to add class to
	*/
  _insertStoreCSSClassInElement(element) {
    element.className += ` sezzle-${this._config.merchantID}`;
    return element;
  }

  /**
	 * Set the top and bottom margins of element
	 * @param element to set margins to
	 * @param configGroupIndex index of the config group that element belongs to
	*/
  _setElementMargins(element, configGroupIndex) {
    element.style.marginTop = `${this._config.configGroups[configGroupIndex].marginTop}px`;
    element.style.marginBottom = `${this._config.configGroups[configGroupIndex].marginBottom}px`;
    element.style.marginLeft = `${this._config.configGroups[configGroupIndex].marginLeft}px`;
    element.style.marginRight = `${this._config.configGroups[configGroupIndex].marginRight}px`;
  }

  /**
	 * Scale the element size using CSS transforms
	 * The transform origin is set to 'top {this.alignment}'
	 * scale() scales the element appropriately, maintaining the aspect ratio
	 * @param element - element to set the size to
	 * @param configGroupIndex - index of the config group that element belongs to
	 * @return void
	*/
  _setWidgetSize(element, configGroupIndex) {
    element.style.transformOrigin = `top ${this._config.configGroups[configGroupIndex].alignment}`;
    element.style.transform = `scale(${this._config.configGroups[configGroupIndex].scaleFactor})`;
    if (this._config.configGroups[configGroupIndex].fixedHeight) {
      element.style.height = `${this._config.configGroups[configGroupIndex].fixedHeight}px`;
      element.style.overflow = 'hidden';
    }
  }

  /**
	 * Add CSS alignment class as required based on the viewport width
	 * @param element Element to add to
	 * @param configGroupIndex index of the config group that element belongs to
	*/
  _addCSSAlignment(element, configGroupIndex) {
    let newAlignment = '';
    if (matchMedia && this._config.configGroups[configGroupIndex].alignmentSwitchMinWidth && this._config.configGroups[configGroupIndex].alignmentSwitchType) {
      const queryString = `(min-width: ${this._config.configGroups[configGroupIndex].alignmentSwitchMinWidth}px)`;
      const mq = window.matchMedia(queryString);
      if (!mq.matches) {
        newAlignment = this._config.configGroups[configGroupIndex].alignmentSwitchType;
      }
    }

    const alignment = newAlignment || this._config.configGroups[configGroupIndex].alignment || 'auto';
    element.className += ` sezzle-${alignment}`;
  }

  /**
	 * Add CSS customisation class as required
	 * @param element Element to add to
	 * @param configGroupIndex index of the config group that element belongs to
	*/
  _addCSSCustomisation(element, configGroupIndex) {
    this._addCSSAlignment(element, configGroupIndex);
    this._addCSSFontStyle(element, configGroupIndex);
    this._addCSSTextColor(element, configGroupIndex);
    this._addCSSTheme(element, configGroupIndex);
    this._addCSSWidth(element, configGroupIndex);
  }

  /**
	 * Add CSS fonts styling as required
	 * @param element Element to add to
	 * @param configGroupIndex index of the config group that element belongs to
	*/
  _addCSSFontStyle(element, configGroupIndex) {
    if (this._config.configGroups[configGroupIndex].fontWeight) {
      element.style.fontWeight = this._config.configGroups[configGroupIndex].fontWeight;
    }
    if (this._config.configGroups[configGroupIndex].fontFamily) {
      element.style.fontFamily = this._config.configGroups[configGroupIndex].fontFamily;
    }
    if (this._config.configGroups[configGroupIndex].fontSize !== 'inherit') {
      element.style.fontSize = `${this._config.configGroups[configGroupIndex].fontSize}px`;
    }
    element.style.lineHeight = this._config.configGroups[configGroupIndex].lineHeight || '13px';
  }

  /**
	 * Add CSS width class as required
	 * @param element Element to add to
	 * @param configGroupIndex index of the config group that element belongs to
	*/
  _addCSSWidth(element, configGroupIndex) {
    if (this._config.configGroups[configGroupIndex].maxWidth) {
      element.style.maxWidth = `${this._config.configGroups[configGroupIndex].maxWidth}px`;
    }
  }

  /**
	 * Add CSS text color as required
	 * @param element Element to add to
	 * @param configGroupIndex index of the config group that element belongs to
	 */
  _addCSSTextColor(element, configGroupIndex) {
    if (this._config.configGroups[configGroupIndex].textColor) {
      element.style.color = this._config.configGroups[configGroupIndex].textColor;
    }
  }

  /**
	 * Add CSS theme class as required
	 * @param element Element to add to
	 * @param configGroupIndex index of the config group that element belongs to
	*/
  _addCSSTheme(element, configGroupIndex) {
    switch (this._config.configGroups[configGroupIndex].theme) {
    case 'dark':
    case 'white':
    case 'white-flat':
    case 'white-pill':
      element.className += ' szl-dark';
      break;
    default:
      element.className += ' szl-light';
      break;
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
  _setLogoSize(element, configGroupIndex) {
    element.style.transformOrigin = `top ${this._config.configGroups[configGroupIndex].alignment}`;
    element.style.transform = `scale(${this._config.configGroups[configGroupIndex].logoSize})`;
  }

  /**
	 * Add styling to logo Element incase its provided by the config
	 * @param element - logo element
	 * @param element - element to set styles on
	 * @param configGroupIndex - index of the config group that element belongs to
	 * @return void
	*/
  _setLogoStyle(element, configGroupIndex) {
    Object.keys(this._config.configGroups[configGroupIndex].logoStyle).forEach((key) => {
      element.style[key] = this._config.configGroups[configGroupIndex].logoStyle[key];
    });
  }

  /**
   * Insert child after a given element
   * @param el Element to insert
   * @param referenceNode Element to insert after
  */
  _insertAfter(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
  }

  /**
   * Insert element as the first child of the parentElement of referenceElement
   * @param element Element to insert
   * @param referenceElement Element to grab parent element
  */
  _insertAsFirstChild(element, referenceElement) {
    referenceElement.parentElement.insertBefore(element, referenceElement);
    // bump up element above nodes which are not element nodes (if any)
    while (element.previousSibling) {
      element.parentElement.insertBefore(element, element.previousSibling);
    }
  }
}

export default renderAwesomeSezzle;

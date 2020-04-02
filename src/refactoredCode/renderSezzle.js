/* eslint-disable import/no-cycle */
/* eslint-disable max-len */
import { state } from './sezzleWidgetState';
import utils from './utils';
import { breakXPath, insertAsFirstChild, insertAfter } from '../helper';
import logEvent from './eventLogger';
import { getElementsByXPath } from './coreFunctions';

/**
 * This function will set Sezzle's elements with
 * the price element in parallel
 * @param element - This is the price element
 * @param renderelement Element to render the widget to
 * @param index - Index of the element in the page
 * @param configGroupIndex Index of the config group
 * @return void
 */
const renderAwesomeSezzle = (element, renderelement, index = 0, configGroupIndex) => {
  // Do not render this product if it is not eligible
  const priceText = utils.getPriceText(element, configGroupIndex);
  if (!utils.isProductEligible(priceText, configGroupIndex)) return false;
  // Do not render if sezzle ignored price element
  if (element.classList.contains('sezzle-ignored-price-element')) return false;
  // Set data index to each price element for tracking
  element.dataset.sezzleindex = index;
  // Get element to be rendered with sezzle's widget
  const parent = renderelement;
  // get the alignment of the widget (if widgetAlignment is auto)
  // the alignment, when set to auto follows the text-align property of the price element
  if (state.configGroups[configGroupIndex].alignment === 'auto') {
    state.configGroups[configGroupIndex].alignment = utils.guessWidgetAlignment(element);
  }
  // root node for sezzle
  const sezzle = document.createElement('div');
  // TODO: why there is a shopify specific naming
  sezzle.className = `sezzle-shopify-info-button sezzlewidgetindex-${index}`;
  utils.insertWidgetTypeCSSClassInElement(sezzle, configGroupIndex);
  utils.insertStoreCSSClassInElement(sezzle);
  utils.setElementMargins(sezzle, configGroupIndex);
  if (state.configGroups[configGroupIndex].scaleFactor) utils.setWidgetSize(sezzle, configGroupIndex);
  const node = document.createElement('div');
  node.className = 'sezzle-checkout-button-wrapper sezzle-modal-link';
  node.style.cursor = 'pointer';
  utils.insertStoreCSSClassInElement(node);
  utils.addCSSAlignment(node, configGroupIndex);
  const sezzleButtonText = document.createElement('div');
  sezzleButtonText.className = 'sezzle-button-text';
  utils.addCSSCustomisation(sezzleButtonText, configGroupIndex);
  state.configGroups[configGroupIndex].widgetTemplate.forEach((subtemplate) => {
    switch (subtemplate) {
    case 'price': {
      const priceSpanNode = document.createElement('span');
      priceSpanNode.className = `sezzle-payment-amount sezzle-button-text sezzleindex-${index}`;
      const priceValueText = document.createTextNode(utils.getFormattedPrice(element, configGroupIndex, priceText));
      priceSpanNode.appendChild(priceValueText);
      sezzleButtonText.appendChild(priceSpanNode);
      break;
    }
    case 'logo': {
      const logoNode = document.createElement('img');
      logoNode.className = `sezzle-logo ${state.configGroups[configGroupIndex].imageClassName}`;
      logoNode.src = state.configGroups[configGroupIndex].imageURL;
      sezzleButtonText.appendChild(logoNode);
      utils.setLogoSize(logoNode, configGroupIndex);
      if (state.configGroups[configGroupIndex].logoStyle !== {}) utils.setLogoStyle(logoNode, configGroupIndex);
      break;
    }
    // changed from learn-more to link as that is what current altVersionTemplates use
    case 'link': {
      const learnMoreNode = document.createElement('span');
      learnMoreNode.className = 'sezzle-learn-more';
      const learnMoreText = document.createTextNode('Learn more');
      learnMoreNode.appendChild(learnMoreText);
      sezzleButtonText.appendChild(learnMoreNode);
      break;
    }
    case 'info': {
      const infoIconNode = document.createElement('code');
      infoIconNode.className = 'sezzle-info-icon';
      infoIconNode.innerHTML = '&#9432;';
      sezzleButtonText.appendChild(infoIconNode);
      break;
    }
    case 'question-mark': {
      const questionMarkIconNode = document.createElement('img');
      questionMarkIconNode.className = 'sezzle-question-mark-icon';
      questionMarkIconNode.src = 'https://d2uyik3j5wol98.cloudfront.net/images/question_mark_black.png';
      sezzleButtonText.appendChild(questionMarkIconNode);
      break;
    }
    case 'affirm-logo': {
      const affirmNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      affirmNode.setAttribute('width', '200.16');
      affirmNode.setAttribute('height', '199.56');
      affirmNode.setAttribute('viewBox', '0 0 400.16 199.56');
      affirmNode.setAttribute('class', 'sezzle-affirm-logo affirm-modal-info-link no-sezzle-info');
      affirmNode.setAttribute('style', 'width:39px;height:21px;margin-bottom:5px !important; vertical-align:middle;');
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
      sezzleButtonText.appendChild(affirmNode);
      break;
    }
    case 'affirm-info-icon': {
      const affirmInfoIconNode = document.createElement('code');
      affirmInfoIconNode.className = 'affirm-modal-info-link no-sezzle-info';
      affirmInfoIconNode.innerHTML = '&#9432;';
      sezzleButtonText.appendChild(affirmInfoIconNode);
      break;
    }
    case 'affirm-link-icon': {
      const affirmAnchor = document.createElement('a');
      affirmAnchor.href = state.configGroups[configGroupIndex].affirmLink;
      affirmAnchor.target = '_blank';
      const affirmLinkIconNode = document.createElement('code');
      affirmLinkIconNode.className = 'affirm-info-link';
      affirmLinkIconNode.innerHTML = '&#9432;';
      affirmAnchor.appendChild(affirmLinkIconNode);
      sezzleButtonText.appendChild(affirmAnchor);
      break;
    }
    case 'afterpay-logo': {
      const apNode = document.createElement('img');
      apNode.className = 'sezzle-afterpay-logo ap-modal-info-link no-sezzle-info';
      apNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/ap-logo-widget.png';
      sezzleButtonText.appendChild(apNode);
      break;
    }
    case 'afterpay-logo-grey': {
      const apNode = document.createElement('img');
      apNode.className = 'sezzle-afterpay-logo ap-modal-info-link no-sezzle-info';
      apNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/ap-logo-widget-grayscale.png';
      sezzleButtonText.appendChild(apNode);
      break;
    }
    case 'afterpay-info-icon': {
      const apInfoIconNode = document.createElement('code');
      apInfoIconNode.className = 'ap-modal-info-link no-sezzle-info';
      apInfoIconNode.innerHTML = '&#9432;';
      sezzleButtonText.appendChild(apInfoIconNode);
      break;
    }
    case 'afterpay-link-icon': {
      const apAnchor = document.createElement('a');
      apAnchor.href = state.configGroups[configGroupIndex].apLink;
      apAnchor.target = '_blank';
      const apLinkIconNode = document.createElement('code');
      apLinkIconNode.className = 'ap-info-link';
      apLinkIconNode.innerHTML = '&#9432;';
      apAnchor.appendChild(apLinkIconNode);
      sezzleButtonText.appendChild(apAnchor);
      break;
    }
    case 'quadpay-logo': {
      const qpNode = document.createElement('img');
      qpNode.className = 'sezzle-quadpay-logo quadpay-modal-info-link no-sezzle-info';
      qpNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/qp-logo-widget.png';
      sezzleButtonText.appendChild(qpNode);
      break;
    }
    case 'quadpay-logo-grey': {
      const qpNode = document.createElement('img');
      qpNode.className = 'sezzle-quadpay-logo quadpay-modal-info-link no-sezzle-info';
      qpNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/qp-logo-widget-grayscale.png';
      sezzleButtonText.appendChild(qpNode);
      break;
    }
    case 'quadpay-logo-white': {
      const qpNode = document.createElement('img');
      qpNode.className = 'sezzle-quadpay-logo quadpay-modal-info-link no-sezzle-info';
      qpNode.src = 'https://d34uoa9py2cgca.cloudfront.net/sezzle-credit-website-assets/qp-logo-widget-white.png';
      sezzleButtonText.appendChild(qpNode);
      break;
    }
    case 'quadpay-info-icon': {
      const quadpayInfoIconNode = document.createElement('code');
      quadpayInfoIconNode.className = 'quadpay-modal-info-link no-sezzle-info';
      quadpayInfoIconNode.innerHTML = '&#9432;';
      sezzleButtonText.appendChild(quadpayInfoIconNode);
      break;
    }
    case 'price-split': {
      const priceSplitNode = document.createElement('span');
      priceSplitNode.className = `sezzle-payment-amount sezzle-price-split sezzleindex-${index}`;
      const priceElemTexts = element.textContent.split(state.configGroups[configGroupIndex].splitPriceElementsOn);
      let priceSplitText = '';
      if (priceElemTexts.length === 1) { // if the text is not being splitted (this check is needed in order to support sites with multiple types of product pricing)
        // give the original element in the case there might be some ignored elements present
        priceSplitText = utils.getFormattedPrice(element, configGroupIndex, priceText);
      } else {
        const priceElems = [];
        priceElemTexts.forEach((text) => {
          const priceElemSpan = document.createElement('span');
          priceElemSpan.textContent = text;
          priceElems.push(priceElemSpan);
        });
        priceElems.forEach((elem, index) => {
          if (index === 0) {
            priceSplitText = utils.getFormattedPrice(elem, configGroupIndex);
          } else {
            priceSplitText = `${priceSplitText} ${state.configGroups[configGroupIndex].splitPriceElementsOn} ${state.getFormattedPrice(elem, configGroupIndex)}`;
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
  state.configGroups[configGroupIndex].customClasses.forEach((customClass) => {
    if (customClass.xpath && customClass.className) {
      if (typeof (customClass.index) !== 'number') {
        customClass.index = -1; // set the default value
      }
      if (customClass.index === index || customClass.index === -1) {
        const path = breakXPath(customClass.xpath);
        getElementsByXPath(path, 0, [sezzle])
          .forEach((el) => {
            el.className += ` ${customClass.className}`;
          });
      }
    }
  });
  // Adding sezzle to parent node
  if (state.configGroups[configGroupIndex].widgetIsFirstChild) {
    insertAsFirstChild(sezzle, parent);
  } else {
    insertAfter(sezzle, parent);
  }
  logEvent('onload', configGroupIndex);
  return sezzle;
};

export default renderAwesomeSezzle;

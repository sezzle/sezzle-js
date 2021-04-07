import Utils from './utils';
import Language from './language';

const cloneDeep = require('lodash.clonedeep');

class sezzleConfig {
  constructor(options) {
    if (!options) options = {};
    this.options = options;
    this.compatibleOptions = null;
    this.Language = null;
    this._propsNotInConfigGroup = [
      'merchantID',
      'forcedShow',
      'minPrice',
      'maxPrice',
      'numberOfPayments',
      'altLightboxHTML',
      'apModalHTML',
      'qpModalHTML',
      'affirmModalHTML',
      'klarnaModalHTML',
      // 'noGtm',
      // 'noTracking',
      'testID',
      'language',
      'parseMode',
    ];

    // Sezzle Config starts here
    this.sezzleConfig = {
      config: null,
      configGroups: null,
      merchantID: null,
      forcedShow: null,
      numberOfPayments: null,
      minPrice: null,
      maxPrice: null,
      altModalHTML: null,
      apModalHTML: null,
      qpModalHTML: null,
      affirmModalHTML: null,
      klarnaModalHTML: null,
      supportedCountryCodes: null,
      // noTracking: null,
      // noGtm: null,
      countryCode: null,
      ip: null,
      fingerprint: null,
      language: null,
      parseMode: null,
      // pre-defined config properties
      mutationObserverConfig: { attributes: true, childList: true, characterData: true },
      apiEndpoints: {
        sezzleAssetsCDN: 'https://media.sezzle.com/shopify-app/assets/',
        countryFromIPRequestURL: `${Utils.getGeoIpBaseUrl()}/v1/geoip/ipdetails`,
        cssForMerchantURL: `${Utils.getWidgetBaseUrl()}/v1/css/price-widget?uuid=${options.merchantID}`,
      },
    };

    this._modifySezzleConfig();
  }

  /**
   * ************* Public FUNCTIONS ***************
  */

  get getSezzleConfig() {
    const config = this.sezzleConfig;
    return config;
  }

  get getCompatibleOptions() {
    const compatible = this.compatibleOptions;
    return compatible;
  }

  /**
   * ************* PRIVATE FUNCTIONS ***************
  */

  /**
   * @description Initializes the sezzle config processing
   *  transforms old config into new,
   *  and validates it
  */
  _modifySezzleConfig() {
    this._makeCompatible();
    this._validateConfig();
    this._urlConfigFilter();
    this._configSetters();
    this._languageSetter();
    this._setConfigGroups();
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
  _makeCompatible() {
    if (typeof (this.options.configGroups) !== 'undefined') return;

    const compatible = this._factorize();
    compatible.configGroups = this._splitConfig();
    this.options = compatible;
    this.compatibleOptions = compatible;
  }

  /**
   * This is a helper function to move fields which do not belong to a
   * config group outside of the group and also place them outside
   * configGroups in order to be compatible with latest structure.
   * @return Factorized fields
   */
  _factorize() {
    const factorized = {};
    // assumption is being made that all these fields are the same across all config groups
    // it is a reasonable assumption to make as :
    // - one config as a whole should only be assigned to one merchantID
    // - forcedShow is only useful if the country in which the widget is served is not in the supported list
    //   so it's reasonable to assume that forcedShow should be the same value for all configs
    // - as the widget only supports one modal currently, there is no capability of loading multiple modals
    this._propsNotInConfigGroup.forEach((field) => {
      if (this.options[field] !== undefined) {
        factorized[field] = this.options[field];
        delete this.options[field];
      }
    });
    return factorized;
  }

  /**
   * Function to split configs up according to the targetXPath
   * Every config should have at most one targetXPath.
   * @return split array of configs
   */
  _splitConfig() {
    const res = [];
    if (typeof (this.options.targetXPath) !== 'undefined') {
      // everything revolves around an xpath
      if (Array.isArray(this.options.targetXPath)) {
        // group up custom classes according to index
        const groupedCustomClasses = this._groupCustomClasses();
        // need to ensure it's array and not string so that code doesnt mistakenly separate chars
        const renderToPathIsArray = Array.isArray(this.options.renderToPath);
        // a group should revolve around targetXPath
        // break up the array, starting from the first element
        this.options.targetXPath.forEach((xpath, inner) => {
          // deep clone as config may have nested objects
          const config = cloneDeep(this.options);
          // overwrite targetXPath
          config.targetXPath = xpath;
          // sync up renderToPath array
          if (renderToPathIsArray && typeof (this.options.renderToPath[inner]) !== 'undefined') {
            config.renderToPath = this.options.renderToPath[inner] ? this.options.renderToPath[inner] : null;
          } else {
            // by default, below parent of target
            config.renderToPath = '..';
          }
          // sync up relatedElementActions array
          if (this.options.relatedElementActions
            && typeof (this.options.relatedElementActions[inner]) !== 'undefined'
            && Array.isArray(this.options.relatedElementActions[inner])) {
            config.relatedElementActions = this.options.relatedElementActions[inner];
          }
          // sync up customClasses
          if (typeof (groupedCustomClasses[inner]) !== 'undefined') {
            config.customClasses = groupedCustomClasses[inner];
          }
          // duplicate ignoredPriceElements string / array if exists
          if (this.options.ignoredPriceElements) {
            config.ignoredPriceElements = this.options.ignoredPriceElements;
          }
          // that's all, append
          res.push(config);
        });
      } else {
        // must be a single string
        res.push(this.options);
      }
    }
    return res;
  }

  /**
   * Group customClasses by targetXPathIndex
   * @return groupedCustomClasses, an array of array of customClass objects
   */
  _groupCustomClasses() {
    const result = [];
    if (this.options.customClasses && Array.isArray(this.options.customClasses)) {
      this.options.customClasses.forEach((customClass) => {
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
   * This is a function to validate configs
   * @param options new config to validate
   * @return nothing. If config is invalid, error is thrown and program execution is stopped.
   */
  _validateConfig() {
    if (!Array.isArray(this.options.configGroups)) {
      throw new Error('options.configGroups is not an array');
    } else if (!this.options.configGroups.length) {
      throw new Error('options.configGroups must have at least one config object');
    }
    // checking fields which MUST be specified in configGroups. (Only one as of now :D)
    const mustInclude = ['targetXPath'];
    this.options.configGroups.forEach((group) => {
      mustInclude.forEach((field) => {
        // eslint-disable-next-line no-prototype-builtins
        if (!group.hasOwnProperty(field)) {
          throw new Error(`${field} must be specified in all configs in options.configGroups`);
        }
      });
    });
    // type checks for crucial fields
    // expected types for crucial fields in the config
    // may do type checking for all fields in the future but it's just not necessary as of now
    const expectedTypes = {
      targetXPath: 'string',
      renderToPath: 'string',
      urlMatch: 'string',
    };
    this.options.configGroups.forEach((group) => {
      Object.keys(expectedTypes).forEach((key) => {
        // eslint-disable-next-line no-prototype-builtins
        if (group.hasOwnProperty(key) && (typeof group[key] !== typeof expectedTypes[key])) {
          throw new Error(`${key} must be of type ${expectedTypes[key]}`);
        }
      });
    });
    // check correct factorization
    this.options.configGroups.forEach((group) => {
      Object.keys(group).forEach((key) => {
        if (this._propsNotInConfigGroup.indexOf(key) >= 0) {
          throw new Error(`${key} is not a property of a configGroup. Specify this key at the outermost layer`);
        }
      });
    });
    // if control reaches this point, the config is acceptable. It may not be perfect since the checks
    // are pretty loose, but at least the crucial parts of it are OK. May add more checks in the future.
  }

  /**
   * @description filter off config groups which do not match the current URL
   */
  _urlConfigFilter() {
    this.options.configGroups = this.options.configGroups
      .filter((configGroup) => !configGroup.urlMatch || RegExp(configGroup.urlMatch).test(window.location.href));
  }

  /**
   * @description sets config once the options are modified
   */
  _configSetters() {
    const modifiedSezzleConfig = {
      config: this.options,
      merchantID: this.options.merchantID || '',
      forcedShow: this.options.forcedShow || false,
      numberOfPayments: this.options.numberOfPayments || 4,
      minPrice: this.options.minPrice || 0,
      maxPrice: this.options.maxPrice || 250000,
      altModalHTML: this.options.altLightboxHTML || '',
      apModalHTML: this.options.apModalHTML || '',
      qpModalHTML: this.options.qpModalHTML || '',
      affirmModalHTML: this.options.affirmModalHTML || '',
      klarnaModalHTML: this.options.klarnaModalHTML || '',
      supportedCountryCodes: this.options.supportedCountryCodes || ['US', 'CA', 'IN', 'GU', 'PR', 'VI', 'AS', 'MP'],
      // noTracking: !!this.options.noTracking,
      // noGtm: !!this.options.noGtm,
      parseMode: this.options.parseMode || '',
    };

    this.sezzleConfig = { ...this.sezzleConfig, ...modifiedSezzleConfig };
  }

  _languageSetter() {
    this.Language = new Language(this.options.numberOfPayments || 4);
    this.Language.init();
    this.Language.setLanguage(this.options.language);
    this.sezzleConfig.language = this.Language.getLanguage();
  }


  /**
   * Maps the props of configGroups passed by input into a default configGroup object
   * @param configGroup input by user
   * @return default configGroup object, specifying all fields and taking into account overrides by input
   */
  _mapGroupToDefault(configGroup) {
    const result = {};
    // targetXPath SHOULD NOT be specified in defaultConfig since
    // it is like an ID for a configGroup (except if adding the price element class is used)
    result.xpath = Utils.breakXPath(configGroup.targetXPath);
    result.rendertopath = configGroup.renderToPath || (this.options.defaultConfig && this.options.defaultConfig.renderToPath) || '..';
    // This array in which its elements are objects with two keys
    // relatedPath - this is a xpath of an element related to the price element
    // action - this is a function triggered when the element has a mutation
    // initialAction - this is a function to act upon a pre existing element's condition
    result.relatedElementActions = configGroup.relatedElementActions || (this.options.defaultConfig && this.options.defaultConfig.relatedElementActions) || [];
    result.ignoredPriceElements = configGroup.ignoredPriceElements || (this.options.defaultConfig && this.options.defaultConfig.ignoredPriceElements) || [];

    // Below is for sezzle checkout button
    result.sezzleCheckoutButton = configGroup.sezzleCheckoutButton;
    if (result.sezzleCheckoutButton) {
      result.sezzleCheckoutButton.theme = result.sezzleCheckoutButton.theme || 'light';
      result.sezzleCheckoutButton.paddingX = result.sezzleCheckoutButton.paddingX || '13px';
      result.sezzleCheckoutButton.template = result.sezzleCheckoutButton.template || 'Checkout with %%logo%%';
      result.sezzleCheckoutButton.borderType = result.sezzleCheckoutButton.borderType || 'rounded';
    }

    if (typeof (result.ignoredPriceElements) === 'string') {
      // Only one x-path is given
      result.ignoredPriceElements = [Utils.breakXPath(result.ignoredPriceElements.trim())];
    } else {
      // result.ignoredPriceElements is an array of x-paths
      result.ignoredPriceElements = result.ignoredPriceElements.map((path) => Utils.breakXPath(path.trim()));
    }

    result.alignment = configGroup.alignment || (this.options.defaultConfig && this.options.defaultConfig.alignment) || 'auto';
    result.widgetType = configGroup.widgetType || (this.options.defaultConfig && this.options.defaultConfig.widgetType) || 'product-page';
    result.fontWeight = configGroup.fontWeight || (this.options.defaultConfig && this.options.defaultConfig.fontWeight) || 300;
    result.lineHeight = configGroup.lineHeight || (this.options.defaultConfig && this.options.defaultConfig.lineHeight) || '13px';
    result.alignmentSwitchMinWidth = configGroup.alignmentSwitchMinWidth || (this.options.defaultConfig && this.options.defaultConfig.alignmentSwitchMinWidth); // pixels
    result.alignmentSwitchType = configGroup.alignmentSwitchType || (this.options.defaultConfig && this.options.defaultConfig.alignmentSwitchType);
    result.marginTop = configGroup.marginTop || (this.options.defaultConfig && this.options.defaultConfig.marginTop) || 0; // pixels
    result.marginBottom = configGroup.marginBottom || (this.options.defaultConfig && this.options.defaultConfig.marginBottom) || 0; // pixels
    result.marginLeft = configGroup.marginLeft || (this.options.defaultConfig && this.options.defaultConfig.marginLeft) || 0; // pixels
    result.marginRight = configGroup.marginRight || (this.options.defaultConfig && this.options.defaultConfig.marginRight) || 0; // pixels
    result.scaleFactor = configGroup.scaleFactor || (this.options.defaultConfig && this.options.defaultConfig.scaleFactor);
    result.logoSize = configGroup.logoSize || (this.options.defaultConfig && this.options.defaultConfig.logoSize) || 1.0;
    result.logoStyle = configGroup.logoStyle || (this.options.defaultConfig && this.options.defaultConfig.logoStyle) || {};
    result.fontFamily = configGroup.fontFamily || (this.options.defaultConfig && this.options.defaultConfig.fontFamily) || 'inherit';
    result.textColor = configGroup.color || (this.options.defaultConfig && this.options.defaultConfig.color) || 'inherit';
    result.fontSize = configGroup.fontSize || (this.options.defaultConfig && this.options.defaultConfig.fontSize) || 14;
    result.maxWidth = configGroup.maxWidth || (this.options.defaultConfig && this.options.defaultConfig.maxWidth) || 400; // pixels
    result.fixedHeight = configGroup.fixedHeight || (this.options.defaultConfig && this.options.defaultConfig.fixedHeight) || 0; // pixels
    // This is used to get price of element
    result.priceElementClass = configGroup.priceElementClass || (this.options.defaultConfig && this.options.defaultConfig.priceElementClass) || 'sezzle-price-element';
    // This is used to tell where to render sezzle element to
    result.sezzleWidgetContainerClass = configGroup.sezzleWidgetContainerClass
      || (this.options.defaultConfig && this.options.defaultConfig.sezzleWidgetContainerClass)
      || 'sezzle-widget-container';
    // splitPriceElementsOn is used to deal with price ranges which are separated by arbitrary strings
    result.splitPriceElementsOn = configGroup.splitPriceElementsOn || (this.options.defaultConfig && this.options.defaultConfig.splitPriceElementsOn) || '';
    // after pay link
    result.apLink = configGroup.apLink || (this.options.defaultConfig && this.options.defaultConfig.apLink) || 'https://www.afterpay.com/purchase-payment-agreement';
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
    // ]
    result.customClasses = Array.isArray(configGroup.customClasses) ? configGroup.customClasses : [];
    result.widgetTemplate = configGroup.altVersionTemplate || (this.options.defaultConfig && this.options.defaultConfig.altVersionTemplate);
    if (result.widgetTemplate) {
      result.widgetTemplate = (this.Language.constructWidgetTemplate(result.widgetTemplate)).split('%%');
    } else {
      const defaultWidgetTemplate = this.Language.getTranslation();
      result.widgetTemplate = defaultWidgetTemplate.split('%%');
    }
    if (result.splitPriceElementsOn) {
      result.widgetTemplate = result.widgetTemplate.map((subtemplate) => (subtemplate === 'price' ? 'price-split' : subtemplate));
    }
    // Search for price elements. If found, assume there is only one in this page
    result.hasPriceClassElement = false;
    result.priceElements = Array.prototype.slice
      .call(document.getElementsByClassName(result.priceElementClass));
    result.renderElements = Array.prototype.slice
      .call(document.getElementsByClassName(result.sezzleWidgetContainerClass));
    if (result.priceElements.length === 1) {
      result.hasPriceClassElement = true;
    }
    result.theme = configGroup.theme || (this.options.defaultConfig && this.options.defaultConfig.theme) || 'light';
    /* Theme can now be
      a) dark (for dark backgrounds)
      b) greyscale
      c) white
      d) light (for light backgrounds)
    */
    switch (result.theme) {
    case 'dark':
      result.imageURL = configGroup.imageUrl || (this.options.defaultConfig && this.options.defaultConfig.imageUrl) || 'https://media.sezzle.com/branding/2.0/Sezzle_Logo_FullColor_WhiteWM.svg';
      result.imageClassName = 'szl-dark-image';
      break;
    case 'grayscale':
      result.imageURL = configGroup.imageUrl || (this.options.defaultConfig && this.options.defaultConfig.imageUrl) || 'https://media.sezzle.com/branding/2.0/Sezzle_Logo_Black.svg';
      result.imageClassName = 'szl-light-image';
      break;
    case 'white':
      result.imageURL = configGroup.imageUrl || (this.options.defaultConfig && this.options.defaultConfig.imageUrl) || 'https://media.sezzle.com/branding/2.0/Sezzle_Logo_White.svg';
      result.imageClassName = 'szl-dark-image';
      break;
    case 'white-flat':
      result.imageURL = configGroup.imageUrl || (this.options.defaultConfig && this.options.defaultConfig.imageUrl) || 'https://media.sezzle.com/branding/2.0/Sezzle_Logo_WhiteAlt.svg';
      result.imageClassName = 'szl-dark-image';
      break;
    case 'black-flat':
      result.imageURL = configGroup.imageUrl || (this.options.defaultConfig && this.options.defaultConfig.imageUrl) || 'https://media.sezzle.com/branding/2.0/Sezzle_Logo_BlackAlt.svg';
      result.imageClassName = 'szl-light-image';
      break;
    case 'white-pill':
      result.imageURL = configGroup.imageUrl || (this.options.defaultConfig && this.options.defaultConfig.imageUrl) || 'https://media.sezzle.com/branding/2.0/Sezzle_Logo_WhitePill.svg';
      result.imageClassName = 'szl-dark-image';
      break;
    case 'purple-pill':
      result.imageURL = configGroup.imageUrl || (this.options.defaultConfig && this.options.defaultConfig.imageUrl) || 'https://media.sezzle.com/branding/2.0/Sezzle_Logo_PurplePill.svg';
      result.imageClassName = 'szl-light-image';
      break;
    default:
      result.imageURL = configGroup.imageUrl || (this.options.defaultConfig && this.options.defaultConfig.imageUrl) || 'https://media.sezzle.com/branding/2.0/Sezzle_Logo_FullColor.svg';
      result.imageClassName = 'szl-light-image';
      break;
    }
    result.hideClasses = configGroup.hideClasses || (this.options.defaultConfig && this.options.defaultConfig.hideClasses) || [];
    if (typeof (result.hideClasses) === 'string') {
      // Only one x-path is given
      result.hideClasses = [Utils.breakXPath(result.hideClasses.trim())];
    } else {
      // result.hideClasses is an array of x-paths
      result.hideClasses = result.hideClasses.map((path) => Utils.breakXPath(path.trim()));
    }
    result.ignoredFormattedPriceText = configGroup.ignoredFormattedPriceText
      || (this.options.defaultConfig && this.options.defaultConfig.ignoredFormattedPriceText)
      || ['Subtotal', 'Total:', 'Sold Out'];

    if (!Array.isArray(result.ignoredFormattedPriceText)) {
      result.ignoredFormattedPriceText = [result.ignoredFormattedPriceText];
    }
    // variables set by the JS
    result.productPrice = null;
    result.widgetIsFirstChild = false; // private boolean variable set to true if widget is to be rendered as first child of the parent
    return result;
  }

  /**
   * @description map config group props
   */
  _setConfigGroups() {
    this.sezzleConfig.configGroups = [];
    this.options.configGroups.forEach((configGroup) => {
      this.sezzleConfig.configGroups
        .push(this._mapGroupToDefault(configGroup));
    });
  }
}

export default sezzleConfig;

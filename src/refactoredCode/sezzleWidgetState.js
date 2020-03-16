import Helper from '../helper';

export let state = {};

export const constructConfig = options => {
    !options ? options = {} : null;
    typeof (options.configGroups) === 'undefined' ? options = Helper.makeCompatible(options) : null;

    Helper.validateConfig(options);
    
    // filter off config groups which do not match the current URL
    options.configGroups = options.configGroups.filter(configGroup => !configGroup.urlMatch || RegExp(configGroup.urlMatch).test(window.location.href));

    let variables = {};

    // properties that do not belong to a config group
    variables.config = options;
    variables.merchantID = options.merchantID || '';
    variables.forcedShow = options.forcedShow || false;
    variables.numberOfPayments = options.numberOfPayments || 4;
    variables.minPrice = options.minPrice || 0; // in cents
    variables.maxPrice = options.maxPrice || 250000; // in cents
    variables.altModalHTML = options.altLightboxHTML || '';
    // if doing widget with both Sezzle or afterpay - the modal to display:
    variables.apModalHTML = options.apModalHTML || '';
    // if doing widget with both Sezzle or quadpay - the modal to display:
    variables.qpModalHTML = options.qpModalHTML || '';
      // if doing widget with both Sezzle or affirm - the modal to display:
    variables.affirmModalHTML = options.affirmModalHTML || '';
    // countries widget should show in
    variables.supportedCountryCodes = options.supportedCountryCodes || ['US', 'IN', 'CA'];
    // Non configurable options
    variables._config = { attributes: true, childList: true, characterData: true };
    // URL to request to get ip of request
    variables.countryFromIPRequestURL = 'https://geoip.sezzle.com/v1/geoip/ipdetails';
    // URL to request to get css details
    variables.cssForMerchantURL = 'https://widget.sezzle.com/v1/css/price-widget?uuid=' + variables.merchantID;
    // no tracking
    variables.noTracking = !!options.noTracking;
    // no gtm
    variables.noGtm = !!options.noGtm;
    // Variables set by the js
    variables.countryCode = null;
    variables.ip = null;
    variables.fingerprint = null;
    // Widget Language
    variables.browserLanguage = navigator.language || navigator.browserLanguage || 'en';
    variables.browserLanguage = variables.browserLanguage.substring(0, 2).toLowerCase();

    variables.language;

    switch(typeof(options.language)){
        case 'string':
            variables.language = options.language;
            break;
        case 'function':
            variables.language = options.language();
            break;
        default:
            variables.language = variables.browserLanguage;
    };

    (variables.language  !== 'en' && variables.language !== 'fr') ? variables.language = variables.browserLanguage : null;
    // map config group props
    variables.configGroups = [];

    options.configGroups.forEach(configGroup => {
        variables.configGroups.push(Helper.mapGroupToDefault(configGroup, options.defaultConfig, variables.numberOfPayments, variables.language))
    });

    // Save config into state
    state = variables;
};

import { makeCompatible, validateConfig, mapGroupToDefault } from '../helper';

export let state = {};

export const constructConfig = (options) => {
	if (!options) options = {};
	if (typeof (options.configGroups) === 'undefined') options = makeCompatible(options);

	validateConfig(options);

	// filter off config groups which do not match the current URL
	// eslint-disable-next-line max-len
	options.configGroups = options.configGroups.filter((configGroup) => !configGroup.urlMatch || RegExp(configGroup.urlMatch).test(window.location.href));

	const variables = {
		config: options,
		configGroups: [],
		merchantID: options.merchantID || '',
		forcedShow: options.forcedShow || false,
		numberOfPayments: options.numberOfPayments || 4,
		minPrice: options.minPrice || 0,
		maxPrice: options.maxPrice || 250000,
		altModalHTML: options.altLightboxHTML || '',
		apModalHTML: options.apModalHTML || '',
		qpModalHTML: options.qpModalHTML || '',
		affirmModalHTML: options.affirmModalHTML || '',
		supportedCountryCodes: options.supportedCountryCodes || ['US', 'IN', 'CA'],
		mutationObserverConfig: { attributes: true, childList: true, characterData: true },
		noTracking: !!options.noTracking,
		noGtm: !!options.noGtm,
		countryCode: null,
		ip: null,
		fingerprint: null,
		browserLanguage: (navigator.language || navigator.browserLanguage || 'en').substring(0, 2).toLowerCase(),
		language: null,
		apiEndpoints: {
			sezzleAssetsCDN: 'https://media.sezzle.com/shopify-app/assets/',
			countryFromIPRequestURL: 'https://geoip.sezzle.com/v1/geoip/ipdetails',
			cssForMerchantURL: `https://widget.sezzle.com/v1/css/price-widget?uuid= + ${options.merchantID}`,
		},
	};

	switch (typeof (options.language)) {
		case 'string':
			variables.language = options.language;
			break;
		case 'function':
			variables.language = options.language();
			break;
		default:
			variables.language = variables.browserLanguage;
	}

	if (variables.language !== 'en' && variables.language !== 'fr') variables.language = variables.browserLanguage;

	options.configGroups.forEach((configGroup) => {
		variables.configGroups
		.push(mapGroupToDefault(configGroup, options.defaultConfig, variables.numberOfPayments, variables.language));
	});

	// Save config into state
	state = variables;
};

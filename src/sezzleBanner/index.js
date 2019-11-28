import sezzleBannerDark from './sezzleBannerDark.html';
import sezzleBannerLight from './sezzleBannerLight.html';

export const awesomeSezzleBanner = (function () {
    let bannerStatus = 'mini', toShowBanner = true, ajaxCall = new XMLHttpRequest(),
        sezzleBannerActionNode, sezzleExtendedBanner, bannerConfig, sezzleBannerClose,
        sezzleBannerContainer, sezzleBannerHeader;

    const init = (config) => {
        initializeConfig(config);
        if (!bannerConfig) return; // Return if there banner config couldn't be set
        initializeTracker();
        checkIfURLSchemeMatches()
        toShowBanner ? checkIfCountryIsSupported(countryCode => callbackCountrySupport(countryCode)) : null;
    };

    const initializeConfig = (config) => {
        if (!config.merchantId) {
            console.warn('Sezzle Banner Config requires merchant id');
            return;
        };

        bannerConfig = {
            theme: config.theme || 'light',
            supportedCountryCodes: config.supportedCountryCodes || ['US', 'IN', 'CA'],
            urlMatch: config.urlMatch || ['homepage'],
            noTracking: config.noTracking || false,
            altBannerHTML: config.altBannerHTML,
            width: config.width,
            headerHeight: config.headerHeight,
            merchantId: config.merchantId
        };
    };
    
    // Loads the sezzle tracker to log events on banner learn more and close action
    const initializeTracker = () => {
		if (!window.frames.szl) {
			var sz_iframe = document.createElement('iframe');
			sz_iframe.width = 0;
			sz_iframe.height = 0;
			sz_iframe.style.display = 'none';
			sz_iframe.style.visibility = 'hidden';
			sz_iframe.name='szl';
			sz_iframe.src = 'https://tracking.sezzle.com';
			var count = 0;
			function renderSezzleIframe() {
				setTimeout(function() {
					if (count >= 20) {
						return;
					};
					if (document.body) {
						document.body.appendChild(sz_iframe);
					} else {
						count++;
						renderSezzleIframe();
					}
				}, 100);
			}
			renderSezzleIframe();
		}
	
    };

    /**
     * Expects bannerConfig.urlMatch to be an array
     * @returns true if the current browser url matches to config else sets toShowBanner to false and 
     *          banner doesn't renders
     */
    const checkIfURLSchemeMatches = () => {
        if (bannerConfig.urlMatch.constructor !== Array) {
            console.warn('urlMatch in sezzle banner config has to be an array!');
            toShowBanner = false;
            return;
        }

        let shouldRender = true;

        bannerConfig.urlMatch.find(url => {
            if (url === 'homepage' && window.location.pathname === '/') shouldRender = true;
            else if (window.location.href.indexOf(url) > -1) shouldRender = true;
            else shouldRender = false;
        });

        if (shouldRender) return;
        else toShowBanner = false;
    };

    const checkIfCountryIsSupported = (callback) => {
        const countryFromIPRequestURL = 'https://geoip.sezzle.com/v1/geoip/ipdetails';
        ajaxCall.onreadystatechange = () => {
            if (ajaxCall.readyState === ajaxCall.DONE) {
                if (ajaxCall.status === 200) {
                    var body = ajaxCall.response;
                    if (typeof (body) === 'string') body = JSON.parse(body);
                    callback(body.country_iso_code);
                }
            }
        };

        ajaxCall.open('GET', countryFromIPRequestURL, true);
        ajaxCall.responseType = 'json';
        ajaxCall.send();
    };

    const callbackCountrySupport = (countryCode) => {
        bannerConfig.supportedCountryCodes.indexOf(countryCode) !== -1
            ? renderBanner()
            : console.log("Hiding sezzle banner because country not supported");
    };

    const renderBanner = () => {
        let banner = document.createElement('div');
        // If altBannerHTML is provided use that else use default themes
        bannerConfig.altBannerHTML 
            ? banner.innerHTML = bannerConfig.altBannerHTML
            : bannerConfig.theme === 'dark'
            ? banner.innerHTML = sezzleBannerDark
            : banner.innerHTML = sezzleBannerLight;
        document.body.appendChild(banner);

        cacheBannerElements();
        addEventListeners();
        applyCSSStyles();
    };

    const cacheBannerElements = () => {
        sezzleBannerActionNode = document.querySelectorAll('#sezzle-action');
        sezzleExtendedBanner = document.querySelector('.sezzle-extended-banner');
        sezzleBannerClose = document.querySelector('.sezzle-banner-header').querySelector('.close');
        sezzleBannerContainer = document.querySelector('.sezzle-banner-container');
        sezzleBannerHeader = document.querySelector('.sezzle-banner-header')
    };

    const addEventListeners = () => {
        // Minimize Maximize Banner
        sezzleBannerActionNode.forEach((actionElement) => {
            actionElement.addEventListener('click', function(event) {
                // Banner is in mini mode
                if (bannerStatus === 'mini') {
                    // sezzleBannerNode.classList.add('sezzle-open');
                    sezzleExtendedBanner.classList.add('sezzle-open');
                    bannerStatus = 'extended';
                    actionElement.innerHTML = 'Close';
                    logEvent('sezzle-banner-maximised');
                }
                // Banner is in extended mode
                else {
                    // sezzleBannerNode.classList.remove('sezzle-open');
                    sezzleExtendedBanner.classList.remove('sezzle-open');
                    bannerStatus = 'mini';
                    actionElement.innerHTML = 'Learn more';
                }
            });
        });
        // Close sezzle banner entirely
        sezzleBannerClose.addEventListener('click', () => {
            document.querySelector('.sezzle-banner-container').style.display ='none'
            logEvent('sezzle-banner-closed');
        });
    };

    const applyCSSStyles = () => {
        if (bannerConfig.width) {
            sezzleBannerContainer.style.width = bannerConfig.width;
        }
        
        if (bannerConfig.headerHeight) {
            sezzleBannerHeader.style.height = bannerConfig.headerHeight;
        }
    };

    const logEvent = (eventName) => {
        if (!bannerConfig.noTracking) {
            if (window.frames.szl) {
                setTimeout(function () {
                    window.frames.szl.postMessage({
                      'event_name': eventName,
                      'merchant_site': window.location.hostname,
                      'user_agent': navigator.userAgent,
                      'merchant_uuid': bannerConfig.merchantID,
                      'page_url': window.location.href,
                      'sezzle_banner_config': bannerConfig,
                    }, 'https://tracking.sezzle.com');
                  }, 100);
            }
        }
    }

    return { init }

 })();

/**
 * Send config through init() after running gulp task 'bundle-banner'. This file is exposed as var sezzleBanner
 * by webpack so as to be used as a library!
 * @example sezzleBanner.awesomeSezzleBanner.init({config object});
 */

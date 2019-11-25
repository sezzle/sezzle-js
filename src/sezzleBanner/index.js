import sezzleBannerDark from './sezzleBannerDark';
import sezzleBannerLight from './sezzleBannerLight';

export const awesomeSezzleBanner = (function () {
    let bannerStatus = 'mini', toShowBanner = true, ajaxCall = new XMLHttpRequest(),
        sezzleBannerActionNode, sezzleExtendedBanner, bannerConfig, sezzleBannerClose, sezzleBannerContainer, sezzleBannerHeader;

    const init = (config) => {
        console.log('Got the config', config)
        initializeConfig(config);
        checkIfURLSchemeMatches();
        toShowBanner ? checkIfCountryIsSupported(countryCode => callbackCountrySupport(countryCode)) : null;
    };

    const initializeConfig = (config) => {
        // Default Config
        bannerConfig = {
            theme: config.theme || 'light',
            supportedCountryCodes: config.supportedCountryCodes || ['US', 'IN', 'CA'],
            urlMatch: config.urlMatch,
            noTrack: false,
            noGTM: false,
            altBannerHTML: config.altBannerHTML,
            width: config.width,
            headerHeight: config.headerHeight
        };
    };

    const checkIfURLSchemeMatches = () => {
        if (!bannerConfig.urlMatch && window.location.pathname === '/') return
        else if (window.location.href.indexOf(bannerConfig.urlMatch) > -1)  return
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
        bannerConfig.supportedCountryCodes.indexOf(countryCode) !== -1 ? renderBanner() : console.log("Hiding sezzle banner because country not supported");
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
        sezzleBannerClose.addEventListener('click', () => document.querySelector('.sezzle-banner-container').style.display ='none');
    };

    const applyCSSStyles = () => {
        if (bannerConfig.width) {
            sezzleBannerContainer.style.width = bannerConfig.width;
        }
        
        if (bannerConfig.headerHeight) {
            sezzleBannerHeader.style.height = bannerConfig.headerHeight;
        }
    };

    return { init }

 })();
 
// Send config through init()
// awesomeSezzleBanner.init();

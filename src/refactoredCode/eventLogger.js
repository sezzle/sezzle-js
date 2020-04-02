import { state } from './sezzleWidgetState';
import utils from './utils';

const logEvent = (eventName, configGroupIndex) => {
  if (!state.noTracking) {
    const sezzleFrame = window.frames.szl;
    if (sezzleFrame) {
      const viewport = { width: null, height: null };
      viewport.width = window.screen && window.screen.width ? window.screen.width : console.log('Cant fetch viewpoer width');
      viewport.height = window.screen && window.screen.height ? window.screen.height : console.log('Cant fetch viewpoer height');

      setTimeout(() => {
        sezzleFrame.postMessage({
          event_name: eventName,
          button_version: document.sezzleButtonVersion,
          cart_id: utils.getCookie('cart'),
          ip_address: state.ip,
          merchant_site: window.location.hostname,
          is_mobile_browser: utils.isMobileBrowser(),
          user_agent: navigator.userAgent,
          merchant_uuid: state.merchantID,
          page_url: window.location.href,
          viewport,
          product_price: configGroupIndex !== undefined ? state.configGroups[configGroupIndex].productPrice : null,
          sezzle_config: JSON.stringify(state.config),
        }, 'https://localhost:9091');
      }, 100);
    }
  }
};

export default logEvent;

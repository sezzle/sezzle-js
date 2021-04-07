import 'regenerator-runtime/runtime';

import SezzleConfig from './sezzleConfig';
import Utils from './utils';
import Modal from './modal';
import RenderAwesomeSezzle from './renderAwesomeSezzle';

class SezzleJS {
  constructor(options) {
    this._configInst = new SezzleConfig(options).getSezzleConfig;
    this._renderAwesomeSezzle = new RenderAwesomeSezzle(this._configInst);
    this._countryCode = '';
  }

  /**
   * @description Initialize widget only if the following conditions match
   * configGroups property of config is not empty,
   * website is openend in supported country or
   * forcedShow is enabled irrespective of country
   */
  async init() {
    this._countryCode = await this._getCountryCodeFromIP();
    if (
      this._configInst.configGroups.length
      && (this._configInst.forcedShow || this._configInst.supportedCountryCodes.includes(this._countryCode))
    ) this.initializeWidget();
  }

  /**
   * @description Logs request event, loadsCSS for merchant & initialized DOM functions to render widget
   * Also logs initGTMScript event if condition matches
   */
  async initializeWidget() {
    Utils.logEvent('sezzle-widget-request', this._configInst);
    await this._loadCSS();
    this._renderAwesomeSezzle.initializeRendering();
    if(document.sezzleDefaultModalVersion === "sezzle-modal-3.0.0-{%%s%%}.html"){
      var modal = new Modal
      modal.changeInnerHTML()
    }
    if(Utils.checkForWidgetDuplicacy()){
      Utils.logEvent('duplicate-widget', this._configInst);
    }
    if(Utils.checkForCompetitorWidget()) {
      Utils.logEvent('competitor-widget', this._configInst);
    }
  }

  /**
   * This function will return the ISO 3166-1 alpha-2 country code
   * from the user's IP
   */
  async _getCountryCodeFromIP() {
    let response = await Utils.httpRequestWrapper('GET', this._configInst.apiEndpoints.countryFromIPRequestURL);
    response = JSON.parse(response);
    return response.country_iso_code ? response.country_iso_code : console.log('Cant fetch the country code');
  }

  /**
	 * Checks if document.sezzleCssVersionOverride is present
	 * else calls widget server to find css version using merchant UUID and binds css to DOM
	*/
  async _loadCSS() {
    let cssVersion = document.sezzleCssVersionOverride;

    if (!cssVersion) {
      let response = await Utils.httpRequestWrapper('GET', this._configInst.apiEndpoints.cssForMerchantURL);
      response = JSON.parse(response);
      cssVersion = response.version;
    }

    const { head } = document;
    const link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = `https://media.sezzle.com/shopify-app/assets/${cssVersion}`;
    head.appendChild(link);
  }
}

export default SezzleJS;

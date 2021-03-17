const trackingURL = document.widgetServerBaseUrl ? `${document.widgetServerBaseUrl}/v1/event/log` : "https://widget.sezzle.com/v1/event/log";
const sezzleWidgetWrapperClass = "sezzle-shopify-info-button";

/* eslint-disable class-methods-use-this */
class Utils {
  /**
   * Wrapper to make AJAX calls
   * @param {string} method
   * @param {string} url
  */
  static httpRequestWrapper(method, url, body = null) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      if(body !== null){
        xhr.setRequestHeader("Content-Type", "application/json");
      }
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error('Something went wrong, contact the Sezzle team!'));
        }
      };
      xhr.onerror = function () {
        reject(new Error('Something went wrong, contact the Sezzle team!'));
      };
      body === null?xhr.send():xhr.send(JSON.stringify(body));
    });
  }

  /**
   * @description
   * @param {string} name
   */
  static _getCookie(name) {
    const value = `;${document.cookie}`;
    const parts = value.split(`;${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
  }


  /**
   * @description - Checks for more than one widget on merchant websites for logging
   */
  static _checkForWidgetDuplicacy() {
    return document.getElementsByClassName(sezzleWidgetWrapperClass).length > 1 
  }

  /**
   * @description sends payload to widget-server which further logs event
   * @param {string} eventName
   * @param {object} _configInstance
   * @param {number} configGroupIndex
   */
  static logEvent(eventName, _configInstance, configGroupIndex) {
    if (!_configInstance.noTracking) {
      const widget_duplicate =  this._checkForWidgetDuplicacy();
      this.httpRequestWrapper('post',trackingURL,{
        event_name: eventName,
        merchant_site: window.location.hostname,
        page_url: window.location.href,
        widget_duplicate: widget_duplicate
      });
    }
  }

  /**
   * This is a helper function to break xpath into array
   * @param xpath string Ex: './.class1/#id'
   * @returns string[] Ex: ['.', '.class', '#id']
   */
  // eslint-disable-next-line class-methods-use-this
  static breakXPath(xpath) {
    return xpath.split('/').filter((subpath) => subpath !== '');
  }

  static getWidgetBaseUrl() {
    return document.widgetServerBaseUrl || 'https://widget.sezzle.com';
  }

  static getGeoIpBaseUrl() {
    return document.geoIpBaseUrl || 'https://geoip.sezzle.com';
  }
}

// eslint-disable-next-line import/prefer-default-export
// export const { httpRequestWrapper } = new Utils();
export default Utils;

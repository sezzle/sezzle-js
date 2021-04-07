/* eslint-disable prefer-destructuring */
import Utils from './utils';

import Translations from './modalTranslations';

class Modal {
  constructor(config) {
    this._config = config;
    this._scrollDistance = 0;
    this._modalNode = null;
    this._sezzleElement = null;
    this._configGroupIndex = null;
    this._vendorsSupportedForDualInstall = ['ap', 'qp', 'affirm', 'klarna'];
  }

  /**
   * ************* PUBLIC FUNCTIONS ***************
  */

  addClickEventForModal(sezzleElement, configGroupIndex) {
    this._sezzleElement = sezzleElement;
    this._configGroupIndex = configGroupIndex;
    this._sezzleAddClickEvent();
    this._addClickEventForOtherVendors();
  }

  renderModals() {
    // This should always happen before rendering the widget
    this._renderModal();
    this._renderOtherVendorModals();
  }

  /**
   * ************* PRIVATE FUNCTIONS ***************
  */
  _sezzleAddClickEvent() {
    const sezzleModalLinks = this._sezzleElement.getElementsByClassName('sezzle-modal-link');
    Array.prototype.forEach.call(sezzleModalLinks, (modalLink) => {
      modalLink.addEventListener('click', (event) => {
        if (!event.target.classList.contains('no-sezzle-info')) {
          let modalNode;
          // Makes sure to get rid of AP, QP, Affirm, and Klarna modals in our Sezzle modal event listener
          const modals = document.getElementsByClassName('sezzle-checkout-modal-lightbox');
          Array.prototype.forEach.call(modals, (element) => {
            if (!element.classList.contains('sezzle-ap-modal' || 'sezzle-qp-modal' || 'sezzle-affirm-modal' || 'sezzle-klarna-modal')) {
              modalNode = element;
            }
          });
          if (modalNode) {
            this._disableBodyScroll(true);
            modalNode.style.display = 'block'; // Remove hidden class to show the item
            document.body.ariaHidden = true;
            const modals = modalNode.getElementsByClassName('sezzle-modal');
            if (modals.length) {
              modals[0].className = 'sezzle-modal';
            }
            // log on click event
            Utils.logEvent('onclick', this._configGroupIndex);
          }
        }
      });
    });
  }

  changeInnerHTML() {
    if(document.sezzleLanguage !== "en"){
      window.setTimeout(()=>{
       let toBeEditedNodes  = document.getElementsByClassName('sezzle-fill');
       Array.prototype.forEach.call(toBeEditedNodes, (el, i) => {
        let translatedArray = Translations[document.sezzleLanguage]
        el.innerText =  translatedArray[i].text
       })
      },100)
     }
   }

  _addClickEventForOtherVendors() {
    this._vendorsSupportedForDualInstall.forEach((vendor) => {
      const modalLinks = this._sezzleElement.getElementsByClassName(`${vendor}-modal-info-link`);
      Array.prototype.forEach.call(modalLinks, (modalLink) => {
        modalLink.addEventListener('click', (event) => {
          this._disableBodyScroll(true);
          // Show modal node
          document.getElementsByClassName(`sezzle-${vendor}-modal`)[0].style.display = 'block';
          document.body.ariaHidden = true;
        });
      });
    });
  }

  /**
   * @description Adds/removes styles to stop body scroll when modal is open. Also
   * records/restores the scroll position to avoid side effects of position: fixed
   * @param {boolean} -> disable/enable scroll
  */
  _disableBodyScroll(disable) {
    const bodyElement = document.body;
    // Add styles if modal is open
    if (disable) {
      // Cross-browser
      this._scrollDistance = window.pageYOffset || (document.documentElement.clientHeight
        ? document.documentElement.scrollTop
        : document.body.scrollTop) || 0;
      bodyElement.classList.add('sezzle-modal-open');
      // reset scroll in background because of previous step
      bodyElement.style.top = `${this._scrollDistance * -1}px`;
    } else {
      // Remove styles if modal closes and resets body scroll position as well modal scroll to 0,0
      bodyElement.classList.remove('sezzle-modal-open');
      window.scrollTo(0, this._scrollDistance);
      bodyElement.style.top = 0;
      // reset modal scroll
      document.getElementsByClassName('sezzle-modal')[0].scrollTop = 0;
      // clear scroll distance
      this._scrollDistance = 0;
    }
  }

  async _renderModal() {
    this._modalNode = document.createElement('div');
    if (!document.getElementsByClassName('sezzle-checkout-modal-lightbox').length) {
      this._modalNode.className = 'sezzle-checkout-modal-lightbox close-sezzle-modal';
      this._modalNode.style.display = 'none';
      document.body.ariaHidden = false;
      this._modalNode.tabindex = '-1';
      this._modalNode.role = 'dialog';
      this._modalNode.style.maxHeight = '100%';
    } else {
      this._modalNode = document.getElementsByClassName('sezzle-checkout-modal-lightbox')[0];
    }
    if (this._config.altModalHTML) {
      this._modalNode.innerHTML = this._config.altModalHTML;
    } else if (document.sezzleDefaultModalVersion && document.sezzleModalAvailableLanguages) {
      // Convert document.sezzleModalAvailableLanguages into Array
      const availableLanguages = document.sezzleModalAvailableLanguages.split(',').map((singleLanguage) => singleLanguage.trim());
      let modalLanguage;
      if (availableLanguages.indexOf(this._config.language) > -1) {
        modalLanguage = this._config.language;
      } else {
        modalLanguage = 'en';
      }
      let sezzleModalToGet;
      if(document.sezzleDefaultModalVersion === "sezzle-modal-3.0.0-{%%s%%}.html"){
        sezzleModalToGet = `${this._config.apiEndpoints.sezzleAssetsCDN}${document.sezzleDefaultModalVersion.replace('{%%s%%}', "en")}`;
      } else {
        sezzleModalToGet = `${this._config.apiEndpoints.sezzleAssetsCDN}${document.sezzleDefaultModalVersion.replace('{%%s%%}', modalLanguage)}`;
      }
      const response = await Utils.httpRequestWrapper('GET', sezzleModalToGet);
      this._modalNode.innerHTML = response;
    }
    document.getElementsByTagName('html')[0].appendChild(this._modalNode);
    this._closeSezzleModalHandler();
  }

  /**
   * @description This is only for sezzle modal
   */
  _closeSezzleModalHandler() {
    Array.prototype.forEach.call(document.getElementsByClassName('close-sezzle-modal'), (el) => {
      el.addEventListener('click', (event) => {
        this._disableBodyScroll(false);
        // Display the modal node
        this._modalNode.style.display = 'none';
        document.body.ariaHidden = false;
        // Add hidden class hide the item
        this._modalNode.getElementsByClassName('sezzle-modal')[0].className = 'sezzle-modal sezzle-checkout-modal-hidden';
        document.querySelector('.sezzle-checkout-button-wrapper').getElementsByTagName('button')[0].focus();
      });
    });
    // Event listener to prevent close in modal if click happens within sezzle-checkout-modal
    let sezzleModal = document.getElementsByClassName('sezzle-modal')[0];
    // backwards compatability check
    if (!sezzleModal) sezzleModal = document.getElementsByClassName('sezzle-checkout-modal')[0];
    sezzleModal.addEventListener('click', (event) => event.stopPropagation());
  }

  /**
   * @description dynamic rendering based on this._vendorsSupportedForDualInstall
   */
  _renderOtherVendorModals() {
    this._vendorsSupportedForDualInstall.forEach((vendor) => {
      if (document.getElementsByClassName(`${vendor}-modal-info-link`).length > 0) {
        const modalNode = document.createElement('div');
        modalNode.className = `sezzle-checkout-modal-lightbox sezzle-${vendor}-modal`;
        modalNode.style = 'position: center';
        modalNode.style.display = 'none';
        document.body.ariaHidden = false;
        modalNode.tabindex = '-1';
        modalNode.role = 'dialog';
        modalNode.innerHTML = this._config[`${vendor}ModalHTML`] || '';
        document.getElementsByTagName('html')[0].appendChild(modalNode);
        // Event listener for close in modal
        modalNode.addEventListener('click', (event) => {
          this._disableBodyScroll(false);
          modalNode.style.display = 'none';
          document.body.ariaHidden = false;
          document.querySelector('.sezzle-checkout-button-wrapper').getElementsByClassName('no-sezzle-info')[0].focus();
          event.stopPropagation();
        });
      }
    });
  }
}

export default Modal;

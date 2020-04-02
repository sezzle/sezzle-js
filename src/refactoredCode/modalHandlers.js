/* eslint-disable prefer-destructuring */
import httpRequestWrapper from './httpRequestWrapper';
import { state } from './sezzleWidgetState';
// eslint-disable-next-line import/no-cycle
import logEvent from './eventLogger';

let scrollDistance; let
  modalNode;

export const renderModals = () => {
  // This should always happen before rendering the widget
  renderSezzleModal();
  // only render APModal if ap-modal-link exists
  if (document.getElementsByClassName('ap-modal-info-link').length > 0) {
    renderAPModal();
  }
  // only render QPModal if ap-modal-link exists
  if (document.getElementsByClassName('quadpay-modal-info-link').length > 0) {
    renderQPModal();
  }
  // render affirm modal if affirm-modal-info-link exists
  if (document.getElementsByClassName('affirm-modal-info-link').length > 0) {
    renderAffirmModal();
  }
};

/**
 **********************SEZZLE MODAL HANDLERS************************
*/

/**
 * @description Adds/removes styles to stop body scroll when modal is open. Also
 * records/restores the scroll position to avoid side effects of position: fixed
 * @param {boolean} -> disable/enable scroll
*/
const disableBodyScroll = (disable) => {
  const bodyElement = document.body;
  // Add styles if modal is open
  if (disable) {
    // Cross-browser
    scrollDistance = window.pageYOffset || (document.documentElement.clientHeight
      ? document.documentElement.scrollTop
      : document.body.scrollTop) || 0;
    bodyElement.classList.add('sezzle-modal-open');
    // reset scroll in background because of previous step
    bodyElement.style.top = `${scrollDistance * -1}px`;
  } else {
    // Remove styles if modal closes and resets body scroll position as well modal scroll to 0,0
    bodyElement.classList.remove('sezzle-modal-open');
    window.scrollTo(0, scrollDistance);
    bodyElement.style.top = 0;
    // reset modal scroll
    document.querySelector('.sezzle-modal').scrollTo(0, 0);
  }
};

const closeSezzleModalHandler = () => {
  // Event listener for close in modal
  Array.prototype.forEach.call(document.getElementsByClassName('close-sezzle-modal'), (el) => {
    el.addEventListener('click', () => {
      disableBodyScroll(false);
      // Display the modal node
      modalNode.style.display = 'none';
      // Add hidden class hide the item
      modalNode.getElementsByClassName('sezzle-modal')[0].className = 'sezzle-modal sezzle-checkout-modal-hidden';
    });
  });
  // Event listener to prevent close in modal if click happens within sezzle-checkout-modal
  let sezzleModal = document.getElementsByClassName('sezzle-modal')[0];
  // backwards compatability check
  if (!sezzleModal) sezzleModal = document.getElementsByClassName('sezzle-checkout-modal')[0];
  sezzleModal.addEventListener('click', (event) => event.stopPropagation());
};

const renderSezzleModal = async () => {
  modalNode = document.createElement('div');
  if (!document.getElementsByClassName('sezzle-checkout-modal-lightbox').length) {
    modalNode.className = 'sezzle-checkout-modal-lightbox close-sezzle-modal';
    modalNode.style.display = 'none';
    modalNode.style.maxHeight = '100%';
  } else {
    modalNode = document.getElementsByClassName('sezzle-checkout-modal-lightbox')[0];
  }

  if (document.sezzleDefaultModalVersion && document.sezzleModalAvailableLanguages) {
    // Convert document.sezzleModalAvailableLanguages into Array
    const availableLanguages = document.sezzleModalAvailableLanguages.split(',').map((singleLanguage) => singleLanguage.trim());
    let modalLanguage;
    if (availableLanguages.indexOf(state.language) > -1) {
      modalLanguage = state.language;
    } else {
      modalLanguage = 'en';
    }
    const sezzleModalToGet = `${state.apiEndpoints.sezzleAssetsCDN}${document.sezzleDefaultModalVersion.replace('{%%s%%}', modalLanguage)}`;

    const response = await httpRequestWrapper('GET', sezzleModalToGet);
    modalNode.innerHTML = response;
    document.getElementsByTagName('html')[0].appendChild(modalNode);

    closeSezzleModalHandler();
  }
};

/**
 **********************AP MODAL HANDLERS************************
*/
const renderAPModal = () => {
  const modalNodeAP = document.createElement('div');
  modalNodeAP.className = 'sezzle-checkout-modal-lightbox close-sezzle-modal sezzle-ap-modal';
  modalNodeAP.style = 'position: center';
  modalNodeAP.style.display = 'none';
  modalNodeAP.innerHTML = state.apModalHTML;
  document.getElementsByTagName('html')[0].appendChild(modalNodeAP);
  // Event listener for close in modal
  Array.prototype.forEach.call(document.getElementsByClassName('close-sezzle-modal'), (el) => {
    el.addEventListener('click', () => { modalNodeAP.style.display = 'none'; });
  });
  // Event listener to prevent close in modal if click happens within sezzle-checkout-modal
  let sezzleModal = document.getElementsByClassName('sezzle-modal')[0];
  // backwards compatability check
  if (!sezzleModal) sezzleModal = document.getElementsByClassName('sezzle-checkout-modal-lightbox')[0];
  sezzleModal.addEventListener('click', (event) => event.stopPropagation());
};

/**
 **********************QP MODAL HANDLERS************************
*/
const renderQPModal = () => {
  const modalNodeQP = document.createElement('div');
  modalNodeQP.className = 'sezzle-checkout-modal-lightbox close-sezzle-modal sezzle-qp-modal';
  modalNodeQP.style = 'position: center';
  modalNodeQP.style.display = 'none';
  modalNodeQP.innerHTML = state.apModalHTML;
  document.getElementsByTagName('html')[0].appendChild(modalNodeQP);
  // Event listener for close in modal
  Array.prototype.forEach.call(document.getElementsByClassName('close-sezzle-modal'), (el) => {
    el.addEventListener('click', () => { modalNodeQP.style.display = 'none'; });
  });
  // Event listener to prevent close in modal if click happens within sezzle-checkout-modal
  let sezzleModal = document.getElementsByClassName('sezzle-modal')[0];
  // backwards compatability check
  if (!sezzleModal) sezzleModal = document.getElementsByClassName('sezzle-checkout-modal-lightbox')[0];
  sezzleModal.addEventListener('click', (event) => event.stopPropagation());
};

/**
 **********************AFFIRM MODAL HANDLERS************************
*/
const renderAffirmModal = () => {
  const modalNodeAffirm = document.createElement('div');
  modalNodeAffirm.className = 'sezzle-checkout-modal-lightbox close-sezzle-modal sezzle-affirm-modal';
  modalNodeAffirm.style = 'position: center';
  modalNodeAffirm.style.display = 'none';
  modalNodeAffirm.innerHTML = state.affirmModalHTML;
  document.getElementsByTagName('html')[0].appendChild(modalNodeAffirm);
  // Event listener for close in modal
  Array.prototype.forEach.call(document.getElementsByClassName('close-sezzle-modal'), (el) => {
    el.addEventListener('click', () => { modalNodeAffirm.style.display = 'none'; });
  });
  // Event listener to prevent close in modal if click happens within sezzle-checkout-modal
  let sezzleModal = document.getElementsByClassName('sezzle-modal')[0];
  // backwards compatability check
  if (!sezzleModal) sezzleModal = document.getElementsByClassName('sezzle-checkout-modal-lightbox')[0];
  sezzleModal.addEventListener('click', (event) => event.stopPropagation());
};

/**
 **********************Click event for modal handler************************
*/
export const addClickEventForModal = (sezzleElement, configGroupIndex) => {
  const modalLinks = sezzleElement.getElementsByClassName('sezzle-modal-link');
  Array.prototype.forEach.call(modalLinks, (modalLink) => {
    modalLink.addEventListener('click', (event) => {
      if (!event.target.classList.contains('no-sezzle-info')) {
        let modalNode;
        // Makes sure to get rid of AP, QP & Affirm modals in our Sezzle modal event listener
        document.querySelectorAll('.sezzle-checkout-modal-lightbox').forEach((element) => {
          if (!element.classList.contains('sezzle-ap-modal' || 'sezzle-qp-modal' || 'sezzle-affirm-modal')) {
            modalNode = element;
          }
        });
        if (modalNode) {
          disableBodyScroll(true);
          modalNode.style.display = 'block'; // Remove hidden class to show the item
          const modals = modalNode.getElementsByClassName('sezzle-modal');
          if (modals.length) {
            modals[0].className = 'sezzle-modal';
          }
          // log on click event
          logEvent('onclick', configGroupIndex);
        }
      }
    });
  });
  // for AfterPay
  const apModalLinks = sezzleElement.getElementsByClassName('ap-modal-info-link');
  Array.prototype.forEach.call(apModalLinks, (modalLink) => {
    modalLink.addEventListener('click', () => {
      // Show modal node
      document.getElementsByClassName('sezzle-ap-modal')[0].style.display = 'block';
      // log on click event
      logEvent('onclick-afterpay', configGroupIndex);
    });
  });
  // for QuadPay
  const qpModalLinks = sezzleElement.getElementsByClassName('quadpay-modal-info-link');
  Array.prototype.forEach.call(qpModalLinks, (modalLink) => {
    modalLink.addEventListener('click', () => {
      // Show modal node
      document.getElementsByClassName('sezzle-qp-modal')[0].style.display = 'block';
      // log on click event
      logEvent('onclick-quadpay', configGroupIndex);
    });
  });
  // for Affirm
  const affirmModalLinks = sezzleElement.getElementsByClassName('affirm-modal-info-link');
  Array.prototype.forEach.call(affirmModalLinks, (modalLink) => {
    modalLink.addEventListener('click', () => {
      // Show modal node
      document.getElementsByClassName('sezzle-affirm-modal')[0].style.display = 'block';
      // log on click event
      logEvent('onclick-affirm', configGroupIndex);
    });
  });
};

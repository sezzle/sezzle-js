/**
 * Wrapper to make AJAX calls
 * @param {string} method
 * @param {string} url
*/
const httpRequestWrapper = (method, url) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url);
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
  xhr.send();
});

export default httpRequestWrapper;

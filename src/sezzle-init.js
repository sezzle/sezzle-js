var SezzleJS = require('./sezzle');

// Assumes document.sezzleConfig is present
var pageLoaded = new SezzleJS(document.sezzleConfig).init();

window.addEventListener('load', pageLoaded, false);

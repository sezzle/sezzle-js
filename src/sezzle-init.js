var SezzleJS = require('./sezzle');

// Assumes document.sezzleConfig is present
window.addEventListener("load", function() {
	new SezzleJS(document.sezzleConfig).init();
}, false );

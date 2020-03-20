// regenerator required for async/await
import "regenerator-runtime/runtime.js";
import SezzleJS from './refactoredCode/sezzle-es6';

// Assumes document.sezzleConfig is present
new SezzleJS(document.sezzleConfig).init();

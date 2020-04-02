import 'regenerator-runtime/runtime';
import SezzleJS from './refactoredCode/sezzle-es6';

// Assumes document.sezzleConfig is present
new SezzleJS(document.sezzleConfig).init();

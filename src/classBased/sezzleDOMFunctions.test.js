/* eslint-disable */
import SezzleDOMFunctions from './sezzleDOMFunctions';

const cloneDeep = require('lodash.clonedeep');
const sezzleConfig = require('../sezzle.config.js');

const sezzleDOMFunctions = new SezzleDOMFunctions();

describe('Testing isNumeric helper function', () => {
  const testCases = [{
    value: 2,
    result: true,
  }, {
    value: '10',
    result: true,
  }, {
    value: 'hello',
    result: false,
  }, {
    value: 'hello100',
    result: false,
  }, {
    value: Infinity,
    result: false,
  }, {
    value: NaN,
    result: false,
  }];

  for (let i = 0; i < testCases.length; i++) {
    test(`${testCases[i].value} is` +
      `${testCases[i].result ? '' : 'not '}numeric`, () => {
        expect(sezzleDOMFunctions._isNumeric(testCases[i].value)).toBe(testCases[i].result);
      });
  }
});

describe('Testing isAlphabet helper function', () => {
  const testCases = [{
    value: '.',
    result: false
  }, {
    value: 'a',
    result: true
  }, {
    value: '',
    result: false
  }, {
    value: 'Z',
    result: true
  }, {
    value: 9,
    result: false
  }];

  for (let i = 0; i < testCases.length; i++) {
    test(`${testCases[i].value} is` +
         `${testCases[i].result ? '' : ' not'} an alphabet`, () => {
      expect(sezzleDOMFunctions._isAlphabet(testCases[i].value)).toBe(testCases[i].result);
    });
  }
});

describe('Testing parsePriceString function', () => {
  const testCases = [{
    value: '1234.56',
    includeComma: false,
    result: '1234.56'
  }, {
    value: '1234,56',
    includeComma: true,
    result: '1234,56'
  }, {
    value: '$ 1234.56',
    includeComma: false,
    result: '1234.56'
  }, {
    value: '1234,56 $',
    includeComma: true,
    result: '1234,56'
  }, {
    value: '$ 1,234.56',
    includeComma: false,
    result: '1234.56'
  }, {
    value: '1.234,56 $',
    includeComma: true,
    result: '1234,56'
  }, {
    value: '$ 1234',
    includeComma: false,
    result: '1234'
  }, {
    value: '1234',
    includeComma: true,
    result: '1234'
  }, {
    value: 'Rs. 1,234.56',
    includeComma: false,
    result: '1234.56'
  }, {
    value: 'Rs. 1234.56',
    includeComma: false,
    result: '1234.56'
  }, {
    value: 'Rs. 1234,56',
    includeComma: true,
    result: '1234,56'
  }];

  for (let i = 0; i < testCases.length; i++) {
    test(`Formatted value of ${testCases[i].value} is ${testCases[i].result}`, () => {
      expect(
        sezzleDOMFunctions._parsePriceString(testCases[i].value, testCases[i].includeComma)
      ).toBe(testCases[i].result);
    });
  }
});

describe('Testing parsePrice function', () => {
  const testCases = [{
    value: '10000',
    result: 10000
  }, {
    value: '100.80',
    result: 100.80
  }];

  for (let i = 0; i < testCases.length; i++) {
    test(`Parsed value of ${testCases[i].value} is ${testCases[i].result}`, () => {
      expect(
        sezzleDOMFunctions._parsePrice(testCases[i].value)
      ).toBe(testCases[i].result);
    });
  }
});

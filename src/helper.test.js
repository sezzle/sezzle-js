const Helper = require('./helper');

describe('Testing isNumeric helper function', () => {
  const testCases = [{
    value: 2,
    result: true
  }, {
    value: '10',
    result: true
  }, {
    value: 'hello',
    result: false
  }, {
    value: 'hello100',
    result: false
  }, {
    value: Infinity,
    result: false
  }, {
    value: NaN,
    result: false
  }];

  for (let i = 0; i < testCases.length; i++) {
    test(`${testCases[i].value} is` +
         `${testCases[i].result ? '' : 'not '}numeric`, () => {
      expect(Helper.isNumeric(testCases[i].value)).toBe(testCases[i].result);
    });
  }
});

describe('Testing breakXPath helper function', () => {
  const testCases = [{
    value: './.class/#id',
    result: ['.', '.class', '#id']
  }, {
    value: './.class//#id',
    result: ['.', '.class', '#id']
  }, {
    value: '',
    result: []
  }];

  for (let i = 0; i < testCases.length; i++) {
    test(`${testCases[i].value} should be` +
         `${JSON.stringify(testCases[i].result)}`, () => {
      expect(Helper.breakXPath(testCases[i].value)).toEqual(testCases[i].result);
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
      expect(Helper.isAlphabet(testCases[i].value)).toBe(testCases[i].result);
    });
  }
});

describe('Testing parsePriceString function', () => {
  const testCases = [{
    value: '10000',
    includeComma: false,
    result: '10000'
  }, {
    value: 'Rs. 10000',
    includeComma: false,
    result: '10000'
  }, {
    value: 'Rs. 10, 000',
    includeComma: false,
    result: '10000'
  }, {
    value: 'Rs. 10, 000',
    includeComma: true,
    result: '10,000'
  }, {
    value: '$10,000',
    includeComma: true,
    result: '10,000'
  }, {
    value: '$80.30',
    includeComma: true,
    result: '80.30'
  }];

  for (let i = 0; i < testCases.length; i++) {
    test(`Formatted value of ${testCases[i].value} is ${testCases[i].result}`, () => {
      expect(
        Helper.parsePriceString(testCases[i].value, testCases[i].includeComma)
      ).toBe(testCases[i].result);
    });
  }
})

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
        Helper.parsePrice(testCases[i].value)
      ).toBe(testCases[i].result);
    });
  }
})
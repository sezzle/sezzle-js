const Helper = require('./helper');
var sezzleConfig = require('./sezzle.config.js');
var cloneDeep = require('lodash.clonedeep');

describe('Backwards compatability function works as expected', () => {
  test('Properly converts old config structure to new config structure', () => {
    // deep object comparison
    expect(sezzleConfig.newConfig).toEqual(Helper.makeCompatible(sezzleConfig.oldConfig));
  });
});

describe('Config validator function works as expected', () => {
  test('Throws an error when configGroups is not an array', () => {
    const newConfig = cloneDeep(sezzleConfig.newConfig);
    newConfig.configGroups = 'somethingWhichIsNotAnArray';

    expect(() => {
      Helper.validateConfig(newConfig);
    }).toThrow('options.configGroups is not an array');
  });

  test('Throws an error when configGroups is an empty array', () => {
    const newConfig = cloneDeep(sezzleConfig.newConfig);
    newConfig.configGroups = [];

    expect(() => {
      Helper.validateConfig(newConfig);
    }).toThrow('options.configGroups must have at least one config object');
  });

  test('Throws an error when targetXPath is not specified in any one of the config groups', () => {
    const newConfig = cloneDeep(sezzleConfig.newConfig);
    delete newConfig.configGroups[0].targetXPath;

    expect(() => {
      Helper.validateConfig(newConfig);
    }).toThrow('targetXPath must be specified in all configs in options.configGroups');
  });

  test('Throws an error when targetXPath is not a string in any one of the config groups', () => {
    const newConfig = cloneDeep(sezzleConfig.newConfig);
    newConfig.configGroups[0].targetXPath = [newConfig.configGroups[0].targetXPath];

    expect(() => {
      Helper.validateConfig(newConfig);
    }).toThrow('targetXPath must be of type string');
  });

  test('Throws an error when renderToPath is not a string in any one of the config groups', () => {
    const newConfig = cloneDeep(sezzleConfig.newConfig);
    newConfig.configGroups[0].renderToPath = [newConfig.configGroups[0].renderToPath];

    expect(() => {
      Helper.validateConfig(newConfig);
    }).toThrow('renderToPath must be of type string');
  });

  test('Throws an error when a property which does not belong to a config group is being defined in a config group', () => {
    const newConfig = cloneDeep(sezzleConfig.newConfig);
    newConfig.configGroups[0].merchantID = 'someMerchantID';

    expect(() => {
      Helper.validateConfig(newConfig);
    }).toThrow('merchantID is not a property of a configGroup. Specify this key at the outermost layer');
  });
});

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
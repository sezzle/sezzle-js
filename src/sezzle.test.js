const SezzleJS = require('./sezzle');
const Helper = require('./helper');
var sezzleConfig = require('./sezzle.config.js');

describe('Config validator function works as expected', () => {
  test('Throws an error when configGroups is not an array', () => {
    const newConfig = cloneDeep(sezzleConfig.new);
    newConfig.configGroups = 'somethingWhichIsNotAnArray';

    expect(() => {
      Helper.validateConfig(newConfig);
    }).toThrow(new Error('options.configGroups must be an array'));
  });

  test('Throws an error when configGroups is an empty array', () => {
    const newConfig = cloneDeep(sezzleConfig.new);
    newConfig.configGroups = [];

    expect(() => {
      Helper.validateConfig(newConfig);
    }).toThrow(new Error('options.configGroups must have at least one config object'));
  });

  test('Throws an error when targetXPath is not specified in any one of the config groups', () => {
    const newConfig = cloneDeep(sezzleConfig.new);
    delete newConfig.configGroups[0].targetXPath;

    expect(() => {
      Helper.validateConfig(newConfig);
    }).toThrow(new Error('targetXPath must be specified in all configs in options.configGroups'));
  });

  test('Throws an error when targetXPath is not a string in any one of the config groups', () => {
    const newConfig = cloneDeep(sezzleConfig.new);
    newConfig.configGroups[0].targetXPath = [newConfig.configGroups[0].targetXPath];

    expect(() => {
      Helper.validateConfig(newConfig);
    }).toThrow(new Error('targetXPath must be of type string'));
  });

  test('Throws an error when renderToPath is not a string in any one of the config groups', () => {
    const newConfig = cloneDeep(sezzleConfig.new);
    newConfig.configGroups[0].renderToPath = [newConfig.configGroups[0].renderToPath];

    expect(() => {
      Helper.validateConfig(newConfig);
    }).toThrow(new Error('renderToPath must be of type string'));
  });

  test('Throws an error when a property which does not belong to a config group is being defined in a config group', () => {
    const newConfig = cloneDeep(sezzleConfig.new);
    newConfig.configGroups[0].merchantID = 'someMerchantID';

    expect(() => {
      Helper.validateConfig(newConfig);
    }).toThrow(new Error('merchantID is not a property of a configGroup. Specify this key at the outermost layer'));
  });
});

describe('Constructor correctly sets the parameters', () => {
  test('Properly sets xpath value when there are multiple configs in the configGroups array', () => {
    const sz = new SezzleJS(sezzleConfig.newConfig);
    for (var i = 0, len = sz.configGroups.length; i < len; i++) {
      expect(sz.configGroups[i].xpath).toEqual(
        Helper.breakXPath(sezzleConfig.newConfig.configGroups[i].targetXPath)
      );
    }
  });

  test('Properly sets rendertopath value when there are multiple configs in the configGroups array', () => {
    const sz = new SezzleJS(sezzleConfig.newConfig);
    for (var i = 0, len = sz.configGroups.length; i < len; i++) {
      expect(sz.configGroups[i].rendertopath).toEqual(sezzleConfig.newConfig.configGroups[i].renderToPath);
    }
  });

  test(`Properly sets ignoredPriceElements ` +
    `value when options.configGroups[i].ignoredPriceElements is` +
    `a string`, () => {
      const newConfig = {
        ...sezzleConfig.newConfig,
        ...{
          ignoredPriceElements: '#id/.class'
        }
      };
      const sz = new SezzleJS(newConfig);
      for (var i = 0, len = sz.configGroups[i].length; i < len; i++) {
        expect(sz.configGroups[i].ignoredPriceElements)
          .toEqual([['#id', '.class']]);
      }
    });

  test(`Properly sets ignoredPriceElements ` +
    `value when options.configGroups[i].ignoredPriceElements is` +
    `an array`, () => {
      const sz = new SezzleJS(sezzleConfig.newConfig);
      for (var i = 0, len = sz.configGroups.length; i < len; i++) {
        expect(sz.configGroups[i].ignoredPriceElements)
          .toEqual([['#id-4', '.class-4'], ['#id-5', '.class-5']]);
      }
    });

  test(`Properly duplicates ignoredPriceElements ` +
    `value when old config is passed and options.ignoredPriceElements is` +
    `a string`, () => {
      const oldConfig = {
        ...sezzleConfig.oldConfig,
        ignoredPriceElements: '#id/.class'
      };
      const sz = new SezzleJS(oldConfig);
      for (var i = 0, len = sz.configGroups[i].length; i < len; i++) {
        expect(sz.configGroups[i].ignoredPriceElements)
          .toEqual([['#id', '.class']]);
      }
    });

  test(`Properly duplicates ignoredPriceElements ` +
    `value when old config is passed and options.ignoredPriceElements is` +
    `an array`, () => {
      const sz = new SezzleJS(sezzleConfig.oldConfig);
      for (var i = 0, len = sz.configGroups.length; i < len; i++) {
        expect(sz.configGroups[i].ignoredPriceElements)
          .toEqual([['#id-4', '.class-4'], ['#id-5', '.class-5']]);
      }
    });
});
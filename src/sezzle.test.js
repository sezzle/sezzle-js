const SezzleJS = require('./sezzle');
const Helper = require('./helper');
var sezzleConfig = require('./sezzle.config.json');

describe('Backwards compatability function works as expected', () => {
  test('Properly converts old config structure to new config structure', () => {
    // deep object comparison
    expect(sezzleConfig.new).toEqual(Helper.makeCompatible(sezzleConfig.old));
  })
})

describe('Constructor correctly sets the parameters', () => {
  test('Properly sets xpath value when there are multiple configs in the configGroups array', () => {
    const sz = new SezzleJS(sezzleConfig.new);
    for(var i = 0, len = sz.configGroups.length; i < len; i++) {
      expect(sz.configGroups[i].xpath).toEqual(
        sz.configGroups[i].xpath.map((j) => Helper.breakXPath(j))
      );
    }
  })

  test('Properly sets rendertopath value when there are multiple configs in the configGroups array', () => {
    const sz = new SezzleJS(sezzleConfig.new);
    for(var i = 0, len = sz.configGroups.length; i < len; i++) {
      expect(sz.configGroups[i].rendertopath).toEqual(sezzleConfig.new.configGroups[i].renderToPath);
    }
  })

  test(`Properly sets ignoredPriceElements ` +
      `value when options.configGroups[i].ignoredPriceElements is` +
      `a string`, () => {
        const newConfig = {
          ...sezzleConfig.new,
          ...{
            ignoredPriceElements: '#id/.class'
          }
        };
        const sz = new SezzleJS(newConfig);
        for(var i = 0, len = sz.configGroups[i].length; i < len; i++) {
          expect(sz.configGroups[i].ignoredPriceElements)
          .toEqual([['#id', '.class']]);
        }
  })

  test(`Properly sets ignoredPriceElements ` +
      `value when options.configGroups[i].ignoredPriceElements is` +
      `an array`, () => {
        const sz = new SezzleJS(sezzleConfig.new);
        for(var i = 0, len = sz.configGroups.length; i < len; i++) {
          expect(sz.configGroups[i].ignoredPriceElements)
          .toEqual([['#id-4', '.class-4'],['#id-5', '.class-5']]);
        }
  })

  test(`Properly duplicates ignoredPriceElements ` +
      `value when old config is passed and options.ignoredPriceElements is` +
      `a string`, () => {
        const oldConfig = {
          ...sezzleConfig.old,
          ignoredPriceElements: '#id/.class'
        };
        const sz = new SezzleJS(oldConfig);
        for(var i = 0, len = sz.configGroups[i].length; i < len; i++) {
          expect(sz.configGroups[i].ignoredPriceElements)
          .toEqual([['#id', '.class']]);
        }
  })

  test(`Properly duplicates ignoredPriceElements ` +
      `value when old config is passed and options.ignoredPriceElements is` +
      `an array`, () => {
        const sz = new SezzleJS(sezzleConfig.old);
        for(var i = 0, len = sz.configGroups.length; i < len; i++) {
          expect(sz.configGroups[i].ignoredPriceElements)
          .toEqual([['#id-4', '.class-4'],['#id-5', '.class-5']]);
        }
  })
})
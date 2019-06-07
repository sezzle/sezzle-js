const SezzleJS = require('./sezzle');
const Helper = require('./helper');
var sezzleConfig = require('./sezzle.config.json');

describe('Backwards compatability function works as expected', () => {
  test('Properly converts old config structure to new config structure', () => {
    // deep object comparison
    expect(JSON.stringify(sezzleConfig.new).toEqual(JSON.stringify(Helper.makeCompatible(sezzleConfig.old))));
  })
})

describe('Constructor correctly sets the parameters', () => {
  test('Properly sets xpath value when there are multiple configs in the configGroups array', () => {
    const sz = new SezzleJS(sezzleConfig.new);
    for(var i = 0, len = sezzleConfig.configGroups.length; i < len; i++) {
      expect(sz.configGroups[i].xpath).toEqual(
        sezzleConfig.configGroups[i].targetXPath.map((j) => Helper.breakXPath(j))
      );
    }
  })

  test('Properly sets rendertopath value when there are multiple configs in the configGroups array', () => {
    const sz = new SezzleJS(sezzleConfig.new);
    for(var i = 0, len = sezzleConfig.configGroups.length; i < len; i++) {
      expect(sz.configGroups[i].rendertopath).toEqual(sezzleConfig.new.configGroups[i].renderToPath);
    }
  })

  /*test('Properly sets xpath value when targetXPath is a string', () => { ==> targetXPath is always a string now. 
    const newConfig = {...sezzleConfig, ...{targetXPath: '#id/.class'}}        This is redundant. Refer to test 1 
    const sz = new SezzleJS(newConfig);
    expect(sz.xpath).toEqual([Helper.breakXPath(newConfig.targetXPath)]);
  })

  test('Properly sets rendertopath value when renderToPath is a string', () => { ==> renderTopath is always a string now.
    const newConfig = {                                                              This is redundant. Refer to test 2
      ...sezzleConfig,
      ...{
        renderToPath: '../..',
        targetXPath: '#id/.class'
      }
    };
    const sz = new SezzleJS(newConfig);
    expect(sz.rendertopath).toEqual([newConfig.renderToPath]);
  })

  test('Properly sets rendertopath value syncup with xpath', () => {  ==> Redundant, not applicable anymore
    const newConfig = {
      ...sezzleConfig,
      ...{
        renderToPath: '../..'
      }
    };
    const sz = new SezzleJS(newConfig);
    expect(sz.rendertopath).toEqual([newConfig.renderToPath, null]);
  }) */

  test(`Properly sets ignoredPriceElements ` +
      `value when options.ignoredPriceElements is` +
      `a string`, () => {
        const newConfig = {
          ...sezzleConfig,
          ...{
            ignoredPriceElements: '#id/.class'
          }
        };
        const sz = new SezzleJS(newConfig);
        expect(sz.ignoredPriceElements)
          .toEqual([['#id', '.class']]);
  })

  test(`Properly sets ignoredPriceElements ` +
      `value when options.ignoredPriceElements is` +
      `an array`, () => {
        const sz = new SezzleJS(sezzleConfig);
        expect(sz.ignoredPriceElements)
          .toEqual([['#id-3', '.class-3']]);
  })

  test(`Properly sets hideElements ` +
      `value when options.hideClasses is` +
      `a string`, () => {
        const newConfig = {
          ...sezzleConfig,
          ...{
            hideClasses: '#id/.class'
          }
        };
        const sz = new SezzleJS(newConfig);
        expect(sz.hideElements)
          .toEqual([['#id', '.class']]);
  })

  test(`Properly sets hideElements ` +
      `value when options.hideClasses is` +
      `an array`, () => {
        const newConfig = {
          ...sezzleConfig,
          ...{
            hideClasses: ['#id/.class']
          }
        };
        const sz = new SezzleJS(newConfig);
        expect(sz.hideElements)
          .toEqual([['#id', '.class']]);
  })
})
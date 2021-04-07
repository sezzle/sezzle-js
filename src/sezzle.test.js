const SezzleJS = require('./sezzle');
const Helper = require('./helper');
const sezzleConfig = require('./sezzle.config.js');

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

  test('Get endpoint to get user country when it is not defined in the `geoIpBaseUrl` variable', () => {
    const sz = new SezzleJS(sezzleConfig.newConfig);
    expect(sz.countryFromIPRequestURL).toEqual('https://geoip.sezzle.com/v1/geoip/ipdetails');
  });

  test('Get endpoint to get user country when it exists in the `geoIpBaseUrl` variable', () => {
    const expectedGeoIpUrl = "https://my-geo-ip-url";
    document.geoIpBaseUrl = expectedGeoIpUrl;
    const sz = new SezzleJS(sezzleConfig.newConfig);
    expect(sz.countryFromIPRequestURL).toEqual(`${expectedGeoIpUrl}/v1/geoip/ipdetails`);
    document.geoIpBaseUrl = undefined;
  });

  test('Get css for merchant URL when it is not defined in the `widgetServerBaseUrl` variable', () => {
    const sz = new SezzleJS(sezzleConfig.newConfig);
    expect(sz.cssForMerchantURL).toEqual('https://widget.sezzle.com/v1/css/price-widget?uuid=49261e2d-72af-4358-bf97-3035ce9f11a1');
  });

  test('Get css for merchant URL when it exists in the `widgetServerBaseUrl` variable', () => {
    const expectedWidgetUrl = "https://my-widget-url";
    document.widgetServerBaseUrl = expectedWidgetUrl;
    const sz = new SezzleJS(sezzleConfig.newConfig);
    expect(sz.cssForMerchantURL).toEqual(`${expectedWidgetUrl}/v1/css/price-widget?uuid=49261e2d-72af-4358-bf97-3035ce9f11a1`);
    document.geoIpBaseUrl = undefined;
  });
});

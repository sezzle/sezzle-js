/* eslint-disable */
import Utils from './utils';

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
      expect(Utils.breakXPath(testCases[i].value)).toEqual(testCases[i].result);
    });
  }
});

describe('Testing getWidgetBaseUrl() function', () => {

  afterEach(() => {
    document.widgetServerBaseUrl = undefined;
  });

  it("should return widget url which is defined in the script", () => {
    const expectedWidgetUrl = "https://my-widget-url";
    document.widgetServerBaseUrl = expectedWidgetUrl
    expect(Utils.getWidgetBaseUrl()).toEqual(expectedWidgetUrl);
  });

  it("should return default widget url when it's not defined", () => {
    expect(Utils.getWidgetBaseUrl()).toEqual("https://widget.sezzle.com");
  });

});

describe('Testing getGeoIpBaseUrl() function', () => {

  afterEach(() => {
    document.geoIpBaseUrl = undefined;
  });

  it("should return widget url which is defined in the script", () => {
    const expectedGeoIpUrl = "https://my-geo-ip-url";
    document.geoIpBaseUrl = expectedGeoIpUrl
    expect(Utils.getGeoIpBaseUrl()).toEqual(expectedGeoIpUrl);
  });

  it("should return default widget url when it's not defined", () => {
    expect(Utils.getGeoIpBaseUrl()).toEqual("https://geoip.sezzle.com");
  });

});

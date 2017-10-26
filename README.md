
### How to use

**Add this to the header of any website you want**
```<script src="https://widget.sezzle.com/v1/javascript/price-widget?uuid=<your-sezzle-merchant-id-here>"></script>```

**Set the document config like so**
```
document.sezzleConfig = {
    targetXPath: '<path-to-price-element>',
    renderToPath: '<relative-path-to-element-to-which-to-render-this-widget>',
    forcedShow: false,
    alignment: 'left',
    merchantID: '<your-sezzle-merchant-id-here>',
    theme: 'light',
    widthType: 'thin',
    widgetType: 'product-page',
    minPrice: 0,
    maxPrice: 100000,
    imageUrl: '',
    hideClasses: ['class-to-hide']
  }
```

Note that if you want to use a grayscale Sezzle logo put
```
https://d3svog4tlx445w.cloudfront.net/branding/sezzle-logos/png/sezzle-logo-all-black-sm-100w.png
```
into the `imageUrl` to override the default.

**When you need to update the CSS or the widget js records**
We have a system running on redis off of our DB that keeps track of site specific js and css.

The table is widget_server_production.merchant_button_versions - update the records there using the merchant UUID as the key identifier.

Once set, you need to refresh redis for the widget server as such:
```
https://widget.sezzle.com/v1/redis/refresh
```

Done!

## Deploying a new version

1) Update version of js or css (based on new version updating) in the gulpfile.js

1) For js updates:

```bash

npm run deploy-widget

```

For CSS Updates:

```bash

npm run deploy-css

```

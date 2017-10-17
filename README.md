
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
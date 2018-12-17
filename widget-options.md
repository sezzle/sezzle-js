### Explanation of each option
  `targetXPath` (optional)
  * Simple
    * Detail - Path to the element in your webpage from where price would be picked up from.
    * Type - `string`
  * Advanced
    * Detail - You may have multiple price elements in one page. So, this option also accepts a list of paths to multiple price elements.
    * Type - `array of strings`
  * Default - `empty`

  `renderToPath` (optional)
  * Simple
    * Detail - Path to the element in your webpage where the sezzle widget will be rendered to. This is relative to the `targetXPath`.
    * Type - `string`
  * Advanced
    * Detail - You may want to place widgets in multiple places. So you can pass multiple paths in an array. The price path in `ith` index of `targetXPath` array will rendered at the path given in `ith` index of this array(`renderToPath`). If you do not pass any thing to `ith` index of this array but there is a path in `ith` index of `targetXPath`, then the widget will be rendered just below the price element.
    * Type - `array of strings`
  * Default - `empty`

  `forcedShow` (optional)
  Shows the widget in every country if `true`. Else it shows up only in the `United States`.
  * Default - `false`
  * Type - `boolean`

  `alignment` (optional)
  Aligns the widget in the parent div.
  * Options - `left`, `center`, `right`, `auto`.
  * Default - `auto`
  * Type - `string`

  `merchantID`
  ID given by Sezzle to the merchant. This can be found in the upper right corner of the sezzle merchant dashboard. Only approved merchants get an ID.
  * Default - `empty`
  * Type - `string`

  `theme` (optional)
  Dark and light theme for the widget to work with different background colors of websites.
  * Options - `dark`, `light`
  * Default - `light`
  * Type - `string`

  `widgetType` (optional)
  The page type on which this widget is to be rendered.
  * Options - `cart`, `product-page`, `product-preview`
  * Default - `product-page`
  * Type - `string`

  `minPrice` (optional)
  Only shows products with price more than this amount in cents.
  * Type - `number`
  * Default - `0`

  `maxPrice` (optional)
  Only shows products with price less than this amount in cents.
  * Type - `number`
  * Default - `250000`

  `imageUrl` (optional)
  The sezzle logo can be replaced in the widget with an external image of choice.
  * Type - `string`
  * Default - `empty`

  `hideClasses` (optional)
  The classes of elements that should be hidden when sezzle's logo is showing. This is useful when you want to hide a similar product as Sezzle and is not available in a country where Sezzle is.
  * Type - `array of strings`
  * Default - `[]`

  `priceElementClass` (optional)
  Class to the price element. This option is used instead of `targetXPath` to make the integration simple. You can pass this as a class of your choice else it defaults to `sezzle-price-element`. If you have `just one` element in your page with this class added to it(which should be the price element), the system would pick up price using this.
  * Type - `string`
  * Default - `sezzle-price-element`

  `sezzleWidgetContainerClass` (optional)
  Class to the element in which you want to render the sezzle widget. This option is used instead of `renderToPath` to render the sezzle widget simply. This is supposed to be used with `priceElementClass`. You can pass this as a class of your choice else it defaults to `sezzle-widget-container`. You should have one element in your page which has this as a class and then the system would render the widget in that element.
  * Type - `string`
  * Default - `sezzle-widget-container`

  `altVersionTemplate`(optional)
  This is used to change the text of the widget and also change the arrangement of text, logo and the know more url within the widget. Example, `or 4 interest-free payments with %%price%% %%logo%% %%link%%` will render the default widget. `price`, `logo` and `link` within `%% %%` can be put in different places in the string to change arrangement of each of them.
  * Type - `string`
  * Default - `empty`

`fontSize` (optional)
This sets the font size in pixels.
  * Type - `number`
  * Default - inherited from the website's stylesheet

`fontWeight`(optional)
This is used to set the boldness of the text. 100 is the lightest, 900 is the boldest.
  * Type - `number`
  * Default - `300`

`fontFamily` (optional)
This is used to set the font family of the widget's text.
  * Type - `string`
  * Default - `inherit`

`color` (optional)
This is used to set the widget's text color. Accepts all kinds of values (hexadecimal, rgb(), hsl(), etc...)
  * Type - `string`
  * Default - `inherit`

`alignmentSwitchMinWidth` (optional)
Minimum screen width in pixels below which the alignment changes to `alignmentSwitchType`.
  * Type - `number`
  * Default - `760`

`alignmentSwitchType` (optional)
When `alignmentSwitchMinWidth` is hit, the widget alignment changes to this. Options are `left`,`right`,`center`.
  * Type - `string`
  * Default - `empty`

`maxWidth` (optional)
Maximum width of the widget element in pixels.
  * Type - `number`
  * Default - `400`

  `marginTop` (optional)
Amount of space above the widget in pixels.
  * Type - `number`
  * Default - `0`

  `marginBottom` (optional)
Amount of space below the widget in pixels.
  * Type - `number`
  * Default - `0`

	`marginRight` (optional)
Amount of space to the right of the widget in pixels.
  * Type - `number`
  * Default - `0`

  `marginLeft` (optional)
Amount of space to the left of the widget in pixels.
  * Type - `number`
  * Default - `0`

  `scaleFactor` (optional)
Scales the size of the entire widget down, keeping the same layout.
  * Type - `number`
  * Default - `1.0`

  `alignment` (optional)
Aligns the widget based on the rendertopath element. Options are `auto`, `left`, `right`, `center`.
  * Type - `string`
  * Default - `auto`

  `bannerClass` (optional)
The class name of the banner to replace.
  * Type - `string`
  * Default - `empty`

  `bannerURL` (optional)
The URL of the banner image.
  * Type - `string`
  * Default - `empty`

  `bannerLink` (optional)
The url that opens upon click of the banner.
  * Type - `string`
  * Default - `empty`

  `splitPriceElementsOn` (optional)
For use on variant prices, and/or when prices are separated by strings.
  * Type - `string`
  * Default - `empty`

  `afterpayModalClickURL` (optional)
The URL that opens in a new tab for dual installs with afterpay upon click of modal - when merchant wants just one widget showing both.
  * Type - `string`
  * Default - `https://www.afterpay.com/terms-of-service?soft_redirect=true`

	`numberOfPayments` (optional)
The number of payments displayed which the price is split by. Should NOT be changed unless an agreement is in place.
  * Type - `number`
  * Default - 4

	`ignoredPriceElements` (optional)
Price elements to ignore when displaying widgets.
  * Type - `array of strings`
  * Default - `[]`

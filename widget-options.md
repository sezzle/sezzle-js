### Explanation of each option
  `targetXPath`
  * Simple
    * Detail - Path to the element in your webpage from where price would be picked up from.
    * Type - `string`
  * Advanced
    * Detail - You may have multiple price elements in one page. So, this option also accepts a list of paths to multiple price elements.
    * Type - `array of strings`
  * Xpath formats
    * `..` path to the parent element
    * `#some_id` Use the `#` in the front to identify an element with ID
    * `.some_class` Use the `.` in the front to identify elements with class name
    * `.` just a dot would mean the same element at that point
    * `child-<number>` This is used to point a child element with an index number.
        * **Note:** Sometimes the price element may look like `<span id="money">$ 120.00 <del>$ 200.00</del></span>`. In this case we can point to the first child like this `#money/child-1`. If the child is a text type element, which is true in this case, it'll wrap the text with a span and use that as a price element. There are other ways to handle it too, like using `ignoredPriceElements` which is discussed later in this document.

  `renderToPath` (optional)
  * Simple
    * Detail - Path to the element in your webpage where the sezzle widget will be rendered to. This is relative to the `targetXPath`.
    * Type - `string`
  * Advanced
    * Detail - You may want to place widgets in multiple places. So you can pass multiple paths in an array. The price path in `ith` index of `targetXPath` array will rendered at the path given in `ith` index of this array(`renderToPath`). If you do not pass any thing to `ith` index of this array but there is a path in `ith` index of `targetXPath`, then the widget will be rendered just below the price element.
    * Type - `array of strings`
  * Xpath formats
    * Same as `targetXPath`

  `forcedShow` (optional)
  Shows the widget in every country if `true`. Else it shows up only in the `United States and Canada`.
  * Default - `false`
  * Type - `boolean`

  `alignment` (optional)
  Aligns the widget in the parent div.
  * Options - `left`, `center`, `right`, `auto`.
  * Default - `auto`
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
  The xpaths of elements that should be hidden. The path is always relative to the document. This is useful when you want to hide a similar product as Sezzle.
  * Type - `array of strings`
  * Default - `[]`
  * Xpath formats
    * Same as `targetXPath`

  `altVersionTemplate`(optional)
  This is used to change the text of the widget and also change the arrangement of text, logo and the know more url within the widget. Example, `or 4 interest-free payments with %%price%% %%logo%% %%link%%` will render the default widget. `price`, `logo` and `link` within `%% %%` can be put in different places in the string to change arrangement of each of them.
  * Type - `string`
  * Default - `empty`
  * Supported Keys -
    * `price` - This is used to render sezzle price in the widget
    * `logo` - This is used to render Sezzle logo (The url provided in `imageUrl`) in the widget
    * `link` - This is to render an anchor that renders a rext `Learn more` which opens Sezzle info modal on click
    * `info` - This is an info icon that opens Sezzle info modal on click.
    * `question-mark` - This is also a way to show the Sezzle modal.

`fontSize` (optional)
This sets the font size in pixels.
  * Type - `number`
  * Default - `12`

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
Scales the size of the widget logo.
  * Type - `number`
  * Default - `1.0`

  `alignment` (optional)
Aligns the widget based on the rendertopath element. Options are `auto`, `left`, `right`, `center`.
  * Type - `string`
  * Default - `auto`

  `splitPriceElementsOn` (optional)
For use on variant prices, and/or when prices are separated by strings.
  * Type - `string`
  * Default - `empty`

	`ignoredPriceElements` (optional)
Price elements to ignore when displaying widgets. The ignored element must be within the price element.
  * Type - `array of strings`
  * Default - `[]`

	`countryCodes` (optional)
Countries that the widget will show in. To show in all countries it is better to use `forcedShow: true`.
  * Type - `array of strings`
  * Default - `['US', 'CA']`

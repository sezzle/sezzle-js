## What is a path?


A path is used to reach an element in the document. A path has the following rules:

Each element can be accessed by classname, id, tag, or pseudo-element.
An ID is prepended with '#'.
A class is prepended with '.'.
A tag is appended with the applicable zero-based index (Ex: SPAN-1 is the second span within the parent element)
A pseudo-element indicates a relative property of an element (Ex: ::first-child is the first child element of the parent, regardless of the tag)
Parent and child elements are separated by '/'.
Current path is accessed by '.'.
Going up a parent is by '..'.

Example:
If targetXPath is #foo/.bar - This will look for an element with id foo and then an element with class bar inside that element's children.
If renderToPath is . - This will render the widget in the same element as the price element.
If renderToPath is .. - This will render the widget one parent above the price element.
If renderToPath is ../.. - This will render the widget two parents above the price element.
If renderToPath is ../../.my-render-element - This will render the widget two parents above the price element wuthin an element with the class my-render-element.

* **Note:** Sometimes the price element may look like `<span id="money">$ 120.00 <del>$ 200.00</del></span>`. In this case we can point to the first child like this `#money/child-1`. If the child is a text type element, which is true in this case, it'll wrap the text with a span and use that as a price element. There are other ways to handle it too, like using `ignoredPriceElements` which is discussed later in this document.


## Explanation of each option


`targetXPath` (required)

**Purpose**: Path to the element in the webpage where the product price text value will be detected.<br/>
**Type**: string, or array of strings<br/>
**Default**: ''<br/>
**Additional Details**: Specify one path if only one price element is targeted. Specify multiple paths in an array if multiple price elements are targeted. The path may contain multiple subpaths. All subpaths need to be separated by the '/' character. IDs need to be preceded by a '#' character. Classes needed to be preceded by a '.' character. Tag names need to be followed by the applicable index. The format of a tagname is as follows: *tagName-Index* (e.g. *'SPAN-2'*). The indexes are zero-based, such that the first element of the specified type within the parent element is at index 0.

Example: *'#ProductSection/.product-price/SPAN-1'* would target the 2nd *'SPAN'* element contained within elements that contain the *'product-price'* class which are contained within the element with an ID of *'ProductSection'*.

`renderToPath` (optional)

**Purpose**: Path to the element in the webpage relative to `targetXPath` where the Sezzle widget should be rendered.<br/>
**Type**: string, or array of strings<br/>
**Default**: '..'<br/>
**Additional Details**: Path to the element below which the widget should render (widget's previous element sibling). If you wish to place widgets in multiple places, you can pass multiple paths in an array. The price path at the *nth* index of the `targetXPath` array will be rendered at the path given at the *nth* index of the `renderToPath` array. If you do not pass anything to the *nth* index of the `renderToPath` array but there is a path at the *nth* index of `targetXPath`, then the widget will default to be rendered directly below the parent of the corresponding target element. <br/>
**'./'** will place the widget as the next element sibling of the target element.<br/>
**'../'**  means go up one parent element.<br/>
As with targetXPath, prepend IDs with '#', classes with '.', and append tag names with the index (tagName-Index). It is recommended to keep the `renderToPath` as simple as possible to maximize compatibility.
<!--
`priceElementClass` (optional) **deprecation in process**

**Purpose**: Class of the element in the webpage where the product price text value will be detected. This option is used instead of `targetXPath` to make the integration simpler.<br/>
**Type**: string<br/>
**Default**: 'sezzle-price-element'<br/>
**Additional Details**: You can pass this as a class of your choice or else it defaults to *'sezzle-price-element'*. If there is just one element in the page reflecting this class (which should be the price element), the system will detect the price using this class. Unlike `targetXPath`, do not prepend the class name with '.'. `priceElementClass` can only accept a single class name, not an XPath. -->
<!--
`sezzleWidgetContainerClass` (optional) **deprecation in process**

**Purpose**: Class of the element below which the Sezzle widget should be rendered. This option is used instead of `renderToPath` to render the Sezzle widget in a simpler way.<br/>
**Type**: string<br/>
**Default**: 'sezzle-widget-container'<br/>
**Additional Details**: This is supposed to be used with `priceElementClass`. You can pass this as a class of your choice or else it defaults to *'sezzle-widget-container'*. There should be only one element in the page which has this as a class and then the system will render the widget below that element. Unlike `targetXPath`, do not prepend the class name with '.'. `sezzleWidgetContainerClass` can only accept a single class name, not an XPath. -->

`widgetType` (optional) **obsolete**

**Purpose**: Page type on which this widget is to be rendered. Adds a special class to the widget.<br/>
**Type**: string<br/>
**Options**: cart, product-page, product-preview<br/>
**Default**: 'product-page'

`urlMatch` (optional)

**Purpose**: Specific word appearing in the url of pages where the widget config should be applied.<br/>
**Type**: string<br/>
**Default**: ''
**Additional Details**: Typical values are *'product'* or *'cart'*, as applicable

`imageUrl` (optional) **obsolete**

**Purpose**: URL of external image to display as the Sezzle logo in the widget. This option is used instead of theme when a custom logo is needed.<br/>
**Type**: string<br/>
**Default**: 'https://media.sezzle.com/branding/2.0/Sezzle_Logo_FullColor.svg'

`theme` (optional)

**Purpose**: Updates the logo color to coordinate and contrast with different background colors of websites.<br/>
**Type**: string<br/>
**Options**: dark, light, grayscale, black-flat, white, white-flat, white-pill, purple-pill<br/>
**Default**: 'light'

`scaleFactor` (optional) **obsolete**

**Purpose**: Ratio at which to scale the Sezzle widget.<br/>
**Type**: number<br/>
**Default**: 1.0

`logoSize` (optional)

**Purpose**: Ratio at which to scale the Sezzle logo.<br/>
**Type**: number<br/>
**Default**: 1.00<br/>
**Additional Details**: The space the logo occupies between the widget text and the More Info link/icon is determined by the font size. When dramatically scaling the widget, it may be necessary to override the styling to adjust the left and right margins of the logo using `logoStyle`.

`logoStyle` (optional)

**Purpose**: Custom styling to apply to the Sezzle logo within the widget, particularly when using `logoSize`.<br/>
**Type**: object<br/>
**Default**: {}<br/>
**Additional Details**: The object will accept any CSS styling in JSON format. Keys must be surrounded by '', given in camelCase instead of kebob-case, and separated from the following key by a comma instead of a semi-colon.

`altVersionTemplate` (optional)

**Purpose**: Text content of the widget. Also changes the arrangement of price, logo, and the info/learn-more icon within the widget.<br/>
**Type**: string, or object<br/>
**Default**: {en: 'or 4 interest-free payments of %%price%% with %%logo%% %%info%%', fr: 'ou 4 paiements de %%price%% sans intérêts avec %%logo%% %%info%%'}<br/>
**Additional Details**: Currently available templates:
  <!-- * %%numberOfPayments%% - number of payments by which the price will be split, if different from 4 -->
  * %%price%% - Sezzle price per installment (productPrice/numberOfPayments)
  * %%logo%% - Sezzle logo image, per selected theme or imageURL
  * %%link%% - Learn More hyperlink that, when clicked, opens the Sezzle modal
  * %%info%% - Inherited color info icon that, when clicked, opens the Sezzle modal
  * %%question-mark%% - Black info icon that, when clicked, opens the Sezzle modal
  * %%line-break%% - Breaks the widget content into a new line
  <!-- * %%price-split%% - Renders the two prices on either side of the splitPriceElementsOn value -->
  * %%afterpay-logo%% - Afterpay logo image
  * %%afterpay-logo-grey%% - Afterpay logo image in greyscale
  * %%afterpay-logo-white%% - Afterpay logo image for dark mode
  * %%afterpay-info-icon%% - Info icon that, when clicked, opens the Afterpay modal HTML provided in apModalHTML
  * %%afterpay-link-icon%% - Info icon that, when clicked, opens the Afterpay link provided in apLink
  * %%quadpay-logo%% - Quadpay logo image
  * %%quadpay-logo-grey%% - Quadpay logo image in greyscale
  * %%quadpay-logo-white%% - Quadpay logo image for dark mode
  * %%quadpay-info-icon%% - Info icon that, when clicked, opens the Quadpay modal HTML provided in qpModalHTML
  * %%affirm-logo%% - Affirm logo image
  * %%affirm-logo-greyscale%% - Affirm logo image in greyscale
  * %%affirm-logo-white%% - Affirm logo image for dark mode
  * %%affirm-info-icon%% - Info icon that, when clicked, opens the Affirm modal HTML provided in affirmModalHTML
  * %%affirm-link-icon%% - Info icon that, when clicked, opens the Affirm link provided in affirmLink
  * %%klarna-logo%% - Klarna logo image
  * %%klarna-logo-grey%% - Klarna logo image in greyscale
  * %%klarna-logo-white%% - Klarna logo image for dark mode
  * %%klarna-info-icon%% - Info icon that, when clicked, opens the Klarna modal HTML provided in klarnaModalHTML

`splitPriceElementsOn` (optional)

**Purpose**: Character or string at which to split the price elements (for elements with price ranges).<br/>
**Type**: string<br/>
**Default**: ''<br/>
**Additional Details**: Certain websites, especially wooCommerce websites, have price ranges as their price element (e.g. $650 - $1000). Setting this field to the character or string which separates the prices (e.g. in the case above, it is ’-’) enables the widgets to parse the price elements separately. For instance, setting this field to ’-’ would cause the widget to render the widget price above as *$162.50 - $250.00*.

`customClasses` (optional)

**Purpose**: Custom classes to be applied to targeted elements on the webpage.<br/>
**Type**: array of objects<br/>
**Default**: []<br/>
**Additional Details**: Each object in the array has four available keys: `xpath`, `className`, `index`, and `targetXPathIndex`

`relatedElementActions` (optional)

**Purpose**: Functions related to Sezzle widget. Listen for changes on the webpage after the Sezzle widget loads.<br/>
**Type**: array of objects<br/>
**Default**: []<br/>
**Additional Details**: Each object in the array has three available keys: `relatedPath`, which targets an element in relation to the `targetXPath` (in the same manner as `renderToPath`); `action`; and `initialAction`, with preset params corresponding to the relatedPath element and the current widget which performs the provided function as the widget is rendering

`ignoredPriceElements` (optional)

**Purpose**: Child elements of `targetXPath` to be disregarded when detecting the price and rendering the widget.<br/>
**Type**: array of strings<br/>
**Default**: []<br/>
**Additional Details**: `ignoredPriceElements` can be used to solve `targetXPath` variations between sale and regular-priced items. In this case, `targetXPath` should point to the parent element surrounding the old and the new prices, then `ignoredPriceElements` will specify the old/compare-at price element. As with `targetXPath`, prepend IDs with '#', classes with '.', and append tag names with the index (*tagName-Index*).

`ignoredFormattedPriceText` (optional)

**Purpose**: Text strings within the `targetXPath` to be disregarded when detecting the price and rendering the widget.<br/>
**Type**: array of strings<br/>
**Default**: ['Subtotal', 'Total:', 'Sold Out']

`hideClasses` (optional)

**Purpose**: XPath of elements that should be hidden when Sezzle's logo is showing. This is useful for hiding a product similar to Sezzle that is not available in a country where Sezzle is.<br/>
**Type**: array of strings<br/>
**Default**: []
<!--
`hidePrice` (optional) **deprecated**

**Purpose**: Hides the Sezzle installment price rendered in the widget so only the text and logo will be shown. Some sites have trouble updating the widget price on variance change. This option is used instead of `altVersionTemplate` on older versions of SezzleJS where the default version template could drop the price and remain grammatically correct.<br/>
**Type**: boolean<br/>
**Options**: false, true<br/>
**Default**: false -->

`fontFamily` (optional)

**Purpose**: Font family of the widget text.<br/>
**Type**: string<br/>
**Default**: 'inherit'

`fontSize` (optional)

**Purpose**: Font size of the widget text in pixels.<br/>
**Type**: number<br/>
**Default**: 14<br/>
**Additional Details**: Enter numbers only. Do not enter the unit (e.g. *px*)!

`fontWeight` (optional)

**Purpose**: Boldness of the widget text.<br/>
**Type**: number<br/>
**Default**: 300<br/>
**Additional Details**: 100 is the lightest, 900 is the boldest.
<!--
- **{textColor}** (Optional) - String -->

`color` (optional)

**Purpose**: Color of the widget text.<br/>
**Type**: string<br/>
**Default**:  'inherit'<br/>
**Additional Details**: Accepts all kinds of values (hexadecimal, rgb(), hsl(), etc...)

`alignment` (optional)

**Purpose**: Alignment of the widget relative to the parent element.<br/>
**Type**: string<br/>
**Options**: left, center, right, auto<br/>
**Default**: 'auto'

`alignmentSwitchMinWidth` (optional)

**Purpose**: Screen width in pixels below which the alignment switches to `alignmentSwitchType` instead of `alignment`.<br/>
**Type**: number<br/>
**Default**: 0<br/>
**Additional Details**: The most common breakpoint is *768* (handheld vs desktop). `alignmentSwitchMinWidth` is typically only necessary when alignment is not auto.

`alignmentSwitchType` (optional)

**Purpose**: Alignment of the widget relative to the parent element to be applied when the viewport width is narrower than `alignmentSwitchMinWidth`.<br/>
**Type**: string<br/>
**Options**: left, center, right, auto<br/>
**Default**: 'auto'
<!--
`fixedHeight` (optional) **deprecation in process**

**Purpose**: Fixed height of the widget in pixels.<br/>
**Type**: number<br/>
**Default**: 0 -->

`lineHeight` (optional)

**Purpose**: Content height of the widget.<br/>
**Type**: string<br/>
**Default**: '13px'<br/>
**Additional Details**: Include unit (e.g.: *px*)
<!--
`widthType` (optional) **deprecated**

**Purpose**: Number of lines on which the widget should be rendered.<br/>
**Type**: string<br/>
**Options**: thin, thick<br/>
**Default**: 'thick'<br/>
**Additional Details**: 'thin' renders to 3 lines and 'thick' renders to 2 lines. -->

`maxWidth` (optional)

**Purpose**: Maximum width of the widget element in pixels.<br/>
**Type**: number<br/>
**Default**: 400<br/>
**Additional Details**: 200 to render the widget nicely on 2 lines, 120 for 3 lines.

`marginTop` (optional)

**Purpose**: Amount of space above the widget in pixels.<br/>
**Type**: number<br/>
**Default**: 0

`marginBottom` (optional)

**Purpose**: Amount of space below the widget in pixels.<br/>
**Type**: number<br/>
**Default**: 0

`marginLeft` (optional)

**Purpose**: Amount of space left of the widget in pixels.<br/>
**Type**: number<br/>
**Default**: 0

`marginRight` (optional)

**Purpose**: Amount of space right of the widget in pixels.<br/>
**Type**: number<br/>
**Default**: 0
<!--
- **{merchantId} (Required)** - String -->
<!--
`merchantID` (optional) **deprecation in process**

**Purpose**: 36-digit (32 alpha-numeric, 4 hyphens) ID given by Sezzle to the merchant. This can be found in the Business Settings page of the Sezzle Merchant Dashboard. Only approved merchants get an ID.<br/>
**Type**: string<br/>
**Default**: '' -->
<!--
`merchantUUID2` (optional) **deprecated**

**Purpose**: 36-digit (32 alpha-numeric, 4 hyphens) ID given by Sezzle to the merchant. This can be found in the Business Settings page of the Sezzle Merchant Dashboard. Only approved merchants get an ID.<br/>
**Type**: string<br/>
**Default**: '' -->
<!--
`testID` (optional) **deprecated**

**Purpose**: Sandbox ID given by Sezzle to the merchant for implementing the widget configuration in staging. This can be found in the Business Settings page of the Sandbox Merchant Dashboard.<br/>
**Type**: string<br/>
**Default**: '' -->

`numberOfPayments` (optional) **obsolete**

**Purpose**: Number of payments by which to divide the price and number of installments mentioned in the widget text.<br/>
**Type**: number<br/>
**Default**: 4
**Additional Details**: This number should never be overridden except under explicit agreement with Sezzle.

`minPrice` (optional)

**Purpose**: Minimum price in cents for which the widget should be rendered. If the price at `targetXPath` is lower than this number, the widget will not render on the page.<br/>
**Type**: number<br/>
**Default**: 0<br/>
**Additional Details**: While Sezzle is not advertised on these items, this configuration does not prevent a customer from checking out with Sezzle below this price. For more information on setting a gateway minimum, contact the merchant success representative assigned to this webpage or use the Contact Us section of the Sezzle merchant dashboard.

`maxPrice` (optional)

**Purpose**: Maximum price in cents for which the widget should be rendered. If the price at `targetXPath` is higher than this number, the widget will not render on the page.<br/>
**Type**: number<br/>
**Default**: 250000

<!-- `noTracking` (optional) **deprecated**

**Purpose**: Enables or disables Sezzle tracking used to monitor widget health and conversion analytics.<br/>
**Type**: boolean<br/>
**Options**: false, true<br/>
**Default**: false -->

<!-- `noGtm` (optional) **deprecated**

**Purpose**: Enables or disables Google Analytics tracking click events for Sezzle reporting.<br/>
**Type**: boolean<br/>
**Options**: false, true<br/>
**Default**: false -->
<!--
`bannerURL` (optional) **deprecation in process**

**Purpose**: <br/>
**Type**: string<br/>
**Default**: ''<br/>
**Additional Details**:  -->
<!--
`bannerClass` (optional) **deprecation in process**

**Purpose**: <br/>
**Type**: string<br/>
**Default**: ''<br/>
**Additional Details**:  -->
<!--
`bannerLink` (optional) **deprecation in process**

**Purpose**: <br/>
**Type**: string<br/>
**Default**: ''<br/>
**Additional Details**:  -->

`altLightboxHTML` (optional)

**Purpose**: Custom Sezzle modal window to be rendered when widget is clicked.<br/>
**Type**: string<br/>
**Default**: ''<br/>
<!--
- **{includeAPModal} {includeQPModal}** (Optional) - Boolean (To enable modals in dual widgets) -->

`apLink` (optional)

**Purpose**: Link to competitor's terms of service when widget is clicked at competitor's link.<br/>
**Type**: string<br/>
**Default**: 'https://www.afterpay.com/terms-of-service'

`apModalHTML` (optional)

**Purpose**: Competitor's modal window to be rendered when widget is clicked at competitor's logo.<br/>
**Type**: string<br/>
**Default**: ''

`qpModalHTML` (optional)

**Purpose**: Competitor's modal window to be rendered when widget is clicked at competitor's logo.<br/>
**Type**: string<br/>
**Default**: ''

`affirmLink` (optional)

**Purpose**: Link to competitor's terms of service when widget is clicked at competitor's link.<br/>
**Type**: string<br/>
**Default**: 'https://www.affirm.com/how-it-works'

`affirmModalHTML` (optional)

**Purpose**: Competitor's modal window to be rendered when widget is clicked at competitor's logo.<br/>
**Type**: string<br/>
**Default**: ''

`klarnaModalHTML` (optional)

**Purpose**: Competitor's modal window to be rendered when widget is clicked at competitor's logo.<br/>
**Type**: string<br/>
**Default**: ''

<!--
`countryCodes` (optional) **deprecated**

**Purpose**: List of countries in which to show the widget. This option is used instead of `forcedShow` when the widget should be visible in only a specific set of countries.<br/>
**Type**: array of strings<br/>
**Default**: ['US,'CA']<br/>
**Additional Details**: Not compatible with simple configuration. Must be used with configGroups. -->

`supportedCountryCodes` (optional)

**Purpose**: List of countries in which to show the widget. This option is used instead of `forcedShow` when the widget should be visible in only a specific set of countries.<br/>
**Type**: array of strings<br/>
**Default**: ['US','CA','IN','GU','PR','VI','AS','MP']<br/>
**Additional Details**: Not compatible with simple configuration. Must be used with configGroups.

`language` (optional)

**Purpose**: Language in which the widget text should be rendered.<br/>
**Type**: string<br/>
**Options**: 'en', 'fr', 'de', 'es'<br/>
**Default**: navigator.language<br/>
**Additional Details**: To match the selected language in the window instead of the user's default browser language, use document.querySelector('html').lang. Currently, SezzleJS only supports 'en', 'fr', 'de', and 'es', but additional languages can be added through `altVersionTemplate` and `altLightboxHTML`

`parseMode` (optional)

**Purpose**: Indicates whether price separates dollars and cents with a comma or period.<br/>
**Type**: string<br/>
**Options**: 'comma','period'<br/>
**Default**: ''<br/>
**Additional Details**: When parseMode is unset, it will auto-detect. If both comma and period are present, it will take the one that appears last. If only one is present, it will take it if it is the third character from the end. In all other circumstances, it will default to period. `parseMode` will allow for overriding when neither character is present.

`forcedShow` (optional)

**Purpose**: Shows the widget in every country if true. Shows the widget in only the United States and Canada if false.<br/>
**Type**: boolean<br/>
**Options**: false, true<br/>
**Default**: false

<!--
## Status Definitions:


* **deprecated** - removed from SezzleJS
* **deprecation in process** - in SezzleJS, but not operational
* **obsolete** - in SezzleJS and operational, but not used -->

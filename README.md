
### Description
This javascript can be used for putting Sezzle's widget in websites.

#### Getting Started

1. You will need edit access to your website's code.
2. Open up your preferred code editor (or through your admin platform).
3. Open your site in another tab.
4. Open up and sign in to your Sezzle Merchant Dashboard.
5. Have your Sezzle merchant ID handy. Your Sezzle merchant ID can be found in your Sezzle Merchant Dashboard under Settings > Business.

#### Integration
To integrate Sezzle's widget - follow the below steps. You can also request Sezzle integrates the widget for you at no charge through the Merchant Dashboard Setup Checklist. Setup Checklist > Add Widgets to Product Pages. Current turnaround time is 7 business days.

1. Add this to the header (`<head>`) of your website OR at the bottom of your cart and product files - replacing the <your-sezzle-merchant-id-here> with your Sezzle merchant ID.
```<script src="https://widget.sezzle.com/v1/javascript/price-widget?uuid=<your-sezzle-merchant-id-here>"></script>```

2. Identify your `targetXPath` and `renderToPath` using the guide below.

`targetXPath` is the path to the element in your webpage from where the product price would be picked up from.

`renderToPath` is the path to the element in your webpage where the Sezzle widget will be rendered to. This is relative to targetXPath.

`What is a path?`
A path is used to reach an element in the document. A path has the following rules:
1. Each element can be accessed by `classname`, `id` or `tag`.
2. Parent and child elements are separated by `/`.
3. Current path is accessed by `.`.
4. Going up a parent is by `..`.

Example:
If `targetXPath` is `#foo/.bar` - This will look for an element with id `foo` and then an element with class `bar` inside that element's children.
If `renderToPath` is `.` - This will render the widget in the same element as the price element.
If `renderToPath` is `..` - This will render the widget one parent above the price element.
If `renderToPath` is `../..` - This will render the widget two parents above the price element.
If `renderToPath` is `../../.my-render-element` - This will render the widget two parents above the price element in an element with the class `my-render-element`.

3. Add the following code at the end of your product and cart files, replacing the `<path-to-price-element>` and `<relative-path-to-element-to-which-to-render-this-widget>` with your chosen path.
```
<script>
  document.sezzleConfig = {
		targetXPath: '<path-to-price-element>',
    renderToPath: '<relative-path-to-element-to-which-to-render-this-widget>',
  }
</script>
<script src="https://widget.sezzle.com/v1/javascript/price-widget?uuid=<your-sezzle-merchant-id-here>"></script>
```

4. Usinig the language feature is pretty simple. You can pass either a string or a function (which returns a string).
    Right now we support only english ('en') or french ('fr').
    An example would help you understand this better.

    Using as String:
  ```
    <script>
      document.sezzleConfig = {
        targetXPath: '<path-to-price-element>',
        renderToPath: '<relative-path-to-element-to-which-to-render-this-widget>',
        language:'fr'
      }
    </script>
    <script src="https://widget.sezzle.com/v1/javascript/price-widget?uuid=<your-sezzle-merchant-id-here>"></script>
  ```

     Using as function:
  ```
    <script>
      document.sezzleConfig = {
        targetXPath: '<path-to-price-element>',
        renderToPath: '<relative-path-to-element-to-which-to-render-this-widget>',
        language:()=>{
          if (<your-logic>){
            return 'en'
          }
          return 'fr'
          
        }
      }
    </script>
    <script src="https://widget.sezzle.com/v1/javascript/price-widget?uuid=<your-sezzle-merchant-id-here>"></script>
  ```
For further customization and more details, please check the options at [click here](/widget-options.md)

Note that if you want to use a grayscale Sezzle logo put
```
https://d3svog4tlx445w.cloudfront.net/branding/Sezzle-logos/png/Sezzle-logo-all-black-sm-100w.png
```
into the `imageUrl` to override the default color logo.

If you run into any issues please contact merchantsupport@sezzle.com, or request Sezzle to add the widgets for you through your Merchant Dashboard > Setup Checklist > Add Widgets to Product Pages.

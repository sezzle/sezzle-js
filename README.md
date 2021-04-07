
## Description
This javascript can be used for adding Sezzle's widget into websites.

### Getting Started

1. You will need Admin access to edit your website's code.
2. Open up the code in your Admin platform (or your preferred code editor).
3. In another tab, open your website.
4. In another tab, sign in to your Sezzle Merchant Dashboard.
5. Keep your Sezzle merchant ID handy. Your Sezzle merchant ID can be found in your Sezzle Merchant Dashboard under Settings > Business.

### Integration
To integrate Sezzle's widget, follow the below steps. 

Alternatively, you can request Sezzle integrates the widget for you at no charge.
  * Login to your Sezzle Merchant Dashboard
  * Go to Setup Checklist > Add Widgets to Product Pages. 
  * Click the Request Addition of Widgets button

Current turnaround time is 7 business days.

1. Add the below script to the very bottom of your cart and product files, replacing [INSERT merchantID HERE], including the brackets, with your own merchantID.

```
<script src="https://widget.sezzle.com/v1/javascript/price-widget?uuid=[INSERT merchantID HERE]"></script>
```

2. Identify your `targetXPath` and `renderToPath` using the guide below.

`targetXPath` is the path to the element in your webpage where the product price will be detected.

`renderToPath` is the path to the element in your webpage relative to targetXPath where the Sezzle widget will be rendered.

#### What is a path?
A path is used to reach an element in the document. A path has the following rules:

Each element can be accessed by classname, id, tag, or pseudo-element.
1. An ID is prepended with '#'.
2. A class is prepended with '.'.
3. A tag is appended with the applicable zero-based index (Ex: SPAN-1 is the second span within the parent element)
4. A pseudo-element indicates a relative property of an element (Ex: ::first-child is the first child element of the parent, regardless of the tag)
5. Parent and child elements are separated by '/'.
6. Current path is accessed by '.'.
7. Going up a parent is by '..'.

Example:
If targetXPath is #foo/.bar - This will look for an element with id 'foo' and then an element with class 'bar' inside that element's children.
If renderToPath is '.' - This will render the widget in the same element as the price element.
If renderToPath is '..' - This will render the widget one parent above the price element.
If renderToPath is '../..' - This will render the widget two parents above the price element.
If renderToPath is '../../.my-render-element' - This will render the widget two parents above the price element within an element with the class 'my-render-element'. 

To determine your targetXPath, open a product page on the website. Right-click on the price, then select Inspect. Start by targeting the element that contains the price using the ID or class. If there are multiple occurrences of this identifier, the widget will appear at every occurrence. To be more specific, prepend the parent element's ID or class to the targetXPath.

Example: For the below code snippet, the following would all be valid as a targetXPath: ".amount", ".price/.amount", "#price-container/.price/.amount, or "#price-container/SPAN-0/::first-child"

```
<span id="price-container">
  <span class="price">
    <span class="amount">$12</span>
    <del class="was-price">$15</del>
  </span>
</span>
```

* **Note:** Sometimes the price element may look like `<span id="money">$ 120.00 <del>$ 200.00</del></span>`. In this case we can point to the first child like this: `#money/child-1`. If the child is a text type element, which is true in this case, the text will be wrapped within a span that will then be considered the targeted price element. 

3. Add the following script at the end of your product and cart files, directly above the widget.sezzle script added earlier, replacing the `targetXPath` and `renderToPath` values with the applicable paths, as determined in the previous step.

```
<script type="text/javascript">
  document.sezzleConfig = {
	targetXPath: '.money',
    renderToPath: '..'
  }
</script>
```

For further customization, please check out the available options [here](/widget-options.md)

If you run into any issues please contact merchantsupport@sezzle.com, or request Sezzle to add the widgets for you through your Merchant Dashboard > Setup Checklist > Add Widgets to Product Pages.

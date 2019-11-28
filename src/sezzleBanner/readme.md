### Sezzle Banner Config and Usage Example

## Config
`theme` -> String

* Dark

* Light

  

`width` -> String (% or px)

* Has inbuilt min and max values to not disrupt the design

  

`headerHeight` -> String (px)

* The Banner can be give a certain height from 28px to 70px

  

`supportedCountryCodes` -> Array of strings

* To show the banner in only certain countries eg: ['us','in','en']

  

`altBannerHTML` -> String

* Custom HTML to be rendered inside banner! Using this will override theme

  

`urlMatch` -> Array

* Default is `homepage`

* Pass in page names to make it work on other pages eg: `['homepage', 'cart', 'collections']`


`track` -> Boolean

* Track when user clicks on learn more and closes the banner


## For Devs
 * Send config through init() after running gulp task 'bundle-banner'. This file is exposed as var sezzleBanner by webpack so as to be used    as a library!
 * Example -> `sezzleBanner.awesomeSezzleBanner.init({config})`
  
## Usage 
```<script  type="text/javascript"  src="<script_url>"></script>

<script  type="text/javascript">

sezzleBanner.awesomeSezzleBanner.init({

// Here goes the config

theme:  'dark',

})

</script>

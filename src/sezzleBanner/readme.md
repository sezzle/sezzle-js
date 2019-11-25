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

  

`urlMatch` -> String

* Default is homepage path -> '/'

* Pass in page names to make it work on other pages eg: 'collection', 'product' etc.

  
## Usage 
```
<script  type="text/javascript"  src="<script_url>"></script>

<script  type="text/javascript">

sezzleBanner.awesomeSezzleBanner.init({

// Here goes the config

theme:  'dark',

})

</script>```
if (!window.frames.szlEndtoEnd) {
  var sz_iframe = document.createElement('iframe');
  sz_iframe.width = 0;
  sz_iframe.height = 0;
  sz_iframe.style.display = 'none';
  sz_iframe.style.visibility = 'hidden';
  sz_iframe.name = 'szlEndtoEnd';
  sz_iframe.src = 'https://tracking.sezzle.com?mode=shopify-end-to-end';
  document.body.appendChild(sz_iframe);
}

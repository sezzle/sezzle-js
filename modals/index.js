function includeHTML() {
  file = `modals-${process.env.VERSION}/modal-${process.env.LANGUAGE}.html`;
  var z, i, elmnt, xhttp;
  /* Loop through a collection of all HTML elements: */
  z = document.getElementById("modal");
  elmnt = z;
  if (file) {
    /* Make an HTTP request using the attribute value as the file name: */
    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4) {
        if (this.status == 200) { elmnt.innerHTML = this.responseText; }
        if (this.status == 404) { elmnt.innerHTML = "Page not found."; }
      }
    }
    xhttp.open("GET", file, true);
    xhttp.send();
    /* Exit the function: */
    return;
  }
}
includeHTML();

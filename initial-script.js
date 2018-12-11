  (function(callback) {
      // set track id
      let track_id = null;
      function generateUUID() {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
          });
      }
      function getCookie(name) {
          var value = "; " + document.cookie;
          var parts = value.split("; " + name + "=");
          if (parts.length === 2) {
              return parts.pop().split(";").shift();
          }
      }

      track_id = getCookie("szl_uuid")
      if (!track_id) {
          track_id = generateUUID();
          document.cookie = "szl_uuid=" + track_id + ";path=/";
      }
      let iframe = document.createElement('iframe');
      iframe.width=0
      iframe.height=0
      let html = '<body>Foor</body>';
      // iframe.src = 'https://www.facebook.com';
      // iframe.src = 'https://www.facebook.com/v2.7/plugins/page.php?adapt_container_width=true&app_id=1080223682052036&channel=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter%2Fr%2F7LloFuHvA7I.js%3Fversion%3D43%23cb%3Df12819e3b182974%26domain%3Dwww.stichio.co.in%26origin%3Dhttp%253A%252F%252Fwww.stichio.co.in%252Ff8c7f62e6d9ec%26relation%3Dparent.parent&container_width=266&hide_cover=true&href=https%3A%2F%2Fwww.facebook.com%2Fstichio&locale=en_US&sdk=joey&show_facepile=true&small_header=true&width=300';
      iframe.src="http://localhost:8080/1.html?trk_id="+track_id
      document.body.appendChild(iframe);
      console.log('iframe.contentWindow =', iframe.contentWindow);

      callback(track_id);

  })(function(track_id) {
      console.log("track id", track_id);
    var el = document.createElement('script');
    el.src = 'http://localhost:12121/v1/javascript/price-widget?uuid='+document.sezzleConfig["merchantID"]+'&track_id='+track_id
    document.getElementsByTagName('head')[0].appendChild(el);
  });
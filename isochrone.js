//// Documentation 
// https://docs.mapbox.com/mapbox-gl-js/api/

// Ajout de la carte
mapboxgl.accessToken = 'pk.eyJ1IjoidmljZW50ZTIzIiwiYSI6ImNqZTN6M2xueTY0engyeXAyazZsc2I4YXoifQ.bsCjmMr5GNd5A7POOaS_pw'; // Ajout d'un token
const map = new mapboxgl.Map({
  container: 'map', // container id (déclaré dans le fichier html)
  style: 'mapbox://styles/mapbox/outdoors-v11', // stylesheet location
  center: [-0.5667, 44.8333], // starting position [lng, lat]
  zoom: 9, // starting zoom
  minZoom: 2, // zoom minimum
  maxZoom: 24, // zoom maximum
  pitch: 0, // Inclinaison
  bearing: 0, // Rotation
  attributionControl: 'Test',
  locale: {
    'NavigationControl.ZoomIn': 'Zoomer',
    'NavigationControl.ZoomOut': 'Dézoomer',
    'NavigationControl.ResetBearing': 'Orienter vers le nord',
    'GeolocateControl.FindMyLocation': 'Trouver ma localisation',
    'GeolocateControl.LocationNotAvailable': 'Localisation non disponible'
  }
});


// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());


// Add Geolocate control to the map : déplacement de la carte vers sa position
map.addControl(new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true
  },
  trackUserLocation: true
}));


// Change the background map
var layerList = document.getElementById('dropdown-menu'); // Récupération des éléments par id dans la div dropdown-menu
var inputs = layerList.getElementsByTagName('input'); // Récupération des éléments par nom 

function switchLayer(layer) {
  var layerId = layer.target.id;
  map.setStyle('mapbox://styles/mapbox/' + layerId);
};

for (var i = 0; i < inputs.length; i++) {
  inputs[i].onclick = switchLayer;
};


// Change the direction of the arrows and the tooltip on the button
function changeArrow() {
  var elem = document.getElementById('button-panel');
  var elem_transform = getComputedStyle(elem).getPropertyValue("transform");
  // console.log(elem_transform)

  if (elem_transform === 'matrix(1, 0, 0, 1, 0, 0)') {
    elem_transform = 'matrix(-1, 1.22465e-16, -1.22465e-16, -1, 0, 0)';
    elem.style.transform = elem_transform;
    // elem.title = 'Déplier';
    // content title = '' puis je change la valeur du title de bootstrap
    elem.title = '';
    $('[data-toggle="tooltip"][id="button-panel"]').attr("data-original-title", "Déplier");
  } else if (elem_transform === 'matrix(-1, 1.22465e-16, -1.22465e-16, -1, 0, 0)') {
    elem_transform = 'matrix(1, 0, 0, 1, 0, 0)';
    elem.style.transform = elem_transform;
    // elem.title = 'Replier';
    elem.title = '';
    $('[data-toggle="tooltip"][id="button-panel"]').attr("data-original-title", "Replier");
  };
};


// Display or hide the panel and move the button panel
function changePanel() {
  var elem_tooltip_button = $('[data-toggle="tooltip"][id="button-panel"]').attr("data-original-title");
  var elem_panel = document.getElementById('collapse-sidepanel');
  var elem_button_panel = document.getElementById('button-panel');
  var elem_main_title_panel = document.getElementById('collapse-sidepanel-main-title');
  var elem_geocoder_panel = document.getElementById('geocoder');
  // var elem_height = getComputedStyle(elem_panel).getPropertyValue("left");
  // console.log(elem.clientWidth);
  // console.log(document.documentElement.clientWidth);

  if (elem_tooltip_button === 'Déplier') {
    // console.log("Panel caché");
    elem_panel.style.width = '0%';
    // elem_button_panel.setAttribute('style', 'left: 2%');
    elem_button_panel.style.left = '0.4%';
    elem_main_title_panel.style.display = 'none';
    elem_geocoder_panel.style.display = 'none';
  } else if (elem_tooltip_button === 'Replier') {
    // console.log("Panel ouvert");
    elem_button_panel.style.left = '26%';
    elem_panel.style.width = '25%';
    elem_main_title_panel.style.display = 'block';
    elem_geocoder_panel.style.display = 'block';
  };
};


// Géocodeur addition
var geocoder = new MapboxGeocoder({ // Initialize the geocoder
  accessToken: mapboxgl.accessToken, // Set the access token
  placeholder: 'Rechercher une adresse',
  mapboxgl: mapboxgl, // Set the mapbox-gl instance
  marker: false, // Do not use the default marker style
});

document.getElementById('geocoder').appendChild(geocoder.onAdd(map));


// Geocoding and isochrone
map.on('load', function () {

  try {
    map.removeLayer('point');
    map.removeSource('point');
  } catch (e) {};
  
  map.addSource('single-point', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  });

  map.addLayer({
    id: 'point',
    source: 'single-point',
    type: 'circle',
    paint: {
      'circle-radius': 4,
      'circle-color': '#FF0000'
    }
  });

  geocoder.on('result', function (e) {
    map.getSource('single-point').setData(e.result.geometry);
    // console.log(map.getSource('single-point'));
    // console.log(e.result);
    // console.log(e.result.geometry);
    // console.log(e.result.geometry.coordinates[0]);

    // // Create variables to use in getIso()
    var urlBase = 'https://api.mapbox.com/isochrone/v1/mapbox/';
    // var lon = -0.602;
    // var lat = 44.817;
    var lon = e.result.geometry.coordinates[0];
    var lat = e.result.geometry.coordinates[1];
    var profile = 'walking';
    var minutes = 12;

    // Create a function that sets up the Isochrone API query then makes an Ajax call
    function getIso() {
      var query = urlBase + profile + '/' + lon + ',' + lat + '?contours_minutes=' + minutes + '&polygons=true&access_token=' + mapboxgl.accessToken;

      $.ajax({
        method: 'GET',
        url: query
      }).done(function (data) {
        // Set the 'iso' source's data to what's returned by the API query
        map.getSource('iso').setData(data);
      })
    };

    var marker = new mapboxgl.Marker({
      'color': '#314ccd'
    });

    // Create a LngLat object to use in the marker initialization
    // https://docs.mapbox.com/mapbox-gl-js/api/#lnglat
    var lngLat = {
      lon: lon,
      lat: lat
    };

    try {
      map.removeLayer('isoLayer');
      map.removeSource('iso');
    } catch (e) {
  
    };

    map.addSource('iso', {
      type: 'geojson',
      data: {
        "type": 'FeatureCollection',
        "features": []
      }
    });

    map.addLayer({
      'id': 'isoLayer',
      'type': 'fill',
      // Use "iso" as the data source for this layer
      'source': 'iso',
      'layout': {},
      'paint': {
        // The fill color for the layer is set to a light purple
        'fill-color': '#5a3fc0',
        'fill-opacity': 0.3
      }
    }, "poi-label");

    // Initialize the marker at the query coordinates
    // marker.setLngLat(lngLat).addTo(map);

    // Make the API call
    getIso();

  });

});



// if (elem.style.background === "url('img/arrow-left.svg') no-repeat top left") {
//     elem.style.background = "url('img/arrow-right.svg') no-repeat top left";
//     } else { 
//         elem.style.background = "url('img/arrow-left.svg') no-repeat top left";
//     };

    // document.getElementById("button-panel").addEventListener("click", (event) => {
    //     event.currentTarget.classList.toggle("button-panel2")
    // });
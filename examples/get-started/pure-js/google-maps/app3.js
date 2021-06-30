/* global document, google, window */
// import {GoogleMapsOverlay as DeckOverlay} from '@deck.gl/google-maps';
import {GoogleMapsWebglOverlay as DeckOverlay} from '@deck.gl/google-maps';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import {registerLoaders} from '@loaders.gl/core';
import {PLYLoader} from '@loaders.gl/ply';

import * as dataSamples from '../../../layer-browser/src/data-samples';

registerLoaders([PLYLoader]);

const LOOP_LENGTH = 1800;

const GOOGLE_MAP_ID = 'f865292e93a85c6c';

// Set your Google Maps API key here or via environment variable
const GOOGLE_MAPS_API_KEY = process.env.GoogleMapsAPIKey; // eslint-disable-line
const GOOGLE_MAPS_API_URL = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=beta&map_ids=${GOOGLE_MAP_ID}`;

function loadScript(url) {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;
  const head = document.querySelector('head');
  head.appendChild(script);
  return new Promise(resolve => {
    script.onload = resolve;
  });
}

function getTransformMatrix(d) {
  return [
    Math.random() * 4 - 2,
    Math.random() * 4 - 2,
    Math.random() * 4 - 2,
    0,
    Math.random() * 4 - 2,
    Math.random() * 4 - 2,
    Math.random() * 4 - 2,
    0,
    Math.random() * 4 - 2,
    Math.random() * 4 - 2,
    Math.random() * 4 - 2,
    0,
    0,
    0,
    Math.random() * 10,
    1
  ];
}

loadScript(GOOGLE_MAPS_API_URL).then(() => {
  const map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 37.752, lng: -122.427},
    tilt: 45,
    bearing: 0,
    zoom: 12,
    mapId: GOOGLE_MAP_ID
  });
  window.map = map;

  let currentTime = 0;
  const props = {
    id: 'mesh-layer',
    data: dataSamples.points,
    mesh:
      'https://raw.githubusercontent.com/uber-web/loaders.gl/e8e7f724cc1fc1d5882125b13e672e44e5ada14e/modules/ply/test/data/cube_att.ply',
    sizeScale: 4,
    getPosition: d => d.COORDINATES,
    getColor: d => [Math.random() * 255, Math.random() * 255, Math.random() * 255],
    getTransformMatrix
  };

  const overlay = new DeckOverlay({});
  const animate = () => {
    currentTime = (currentTime + 1) % LOOP_LENGTH;
    const simpleMeshLayer = new SimpleMeshLayer({
      ...props,
      currentTime
    });
    overlay.setProps({
      layers: [simpleMeshLayer]
    });

    //window.requestAnimationFrame(animate);
  };
  window.requestAnimationFrame(animate);

  overlay.setMap(map);
});

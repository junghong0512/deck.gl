/* global document, google */
// import {GoogleMapsOverlay as DeckOverlay} from '@deck.gl/google-maps';
import {GoogleMapsWebglOverlay as DeckOverlay} from '@deck.gl/google-maps';
import {TripsLayer} from '@deck.gl/geo-layers';

const DATA_URL = {
  TRIPS: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/trips-v7.json' // eslint-disable-line
};

const THEME = {
  trailColor0: [253, 128, 93],
  trailColor1: [23, 184, 190]
};

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

loadScript(GOOGLE_MAPS_API_URL).then(() => {
  const map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.72, lng: -74},
    pitch: 45,
    bearing: 0,
    zoom: 13,
    mapId: GOOGLE_MAP_ID
  });
  window.map = map;

  const time = 0;
  const overlay = new DeckOverlay({
    layers: [
      new TripsLayer({
        id: 'trips',
        data: DATA_URL.TRIPS,
        getPath: d => d.path,
        getTimestamps: d => d.timestamps,
        getColor: d => (d.vendor === 0 ? THEME.trailColor0 : THEME.trailColor1),
        opacity: 0.3,
        widthMinPixels: 2,
        rounded: true,
        trailLength: 180,
        currentTime: time,

        shadowEnabled: false
      })
    ]
  });

  overlay.setMap(map);
});

///////////

// /* global window */
// import React, {useState, useEffect} from 'react';
// import {render} from 'react-dom';
// import {StaticMap} from 'react-map-gl';
// import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
// import DeckGL from '@deck.gl/react';
// import {PolygonLayer} from '@deck.gl/layers';
// import {TripsLayer} from '@deck.gl/geo-layers';
//
// const ambientLight = new AmbientLight({
//   color: [255, 255, 255],
//   intensity: 1.0
// });
//
// const pointLight = new PointLight({
//   color: [255, 255, 255],
//   intensity: 2.0,
//   position: [-74.05, 40.7, 8000]
// });
//
// const lightingEffect = new LightingEffect({ambientLight, pointLight});
//
// const material = {
//   ambient: 0.1,
//   diffuse: 0.6,
//   shininess: 32,
//   specularColor: [60, 64, 70]
// };
//
// const DEFAULT_THEME = {
//   buildingColor: [74, 80, 87],
//   trailColor0: [253, 128, 93],
//   trailColor1: [23, 184, 190],
//   material,
//   effects: [lightingEffect]
// };
//
// const INITIAL_VIEW_STATE = {
//   longitude: -74,
//   latitude: 40.72,
//   zoom: 13,
//   pitch: 45,
//   bearing: 0
// };
//
// const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';
//
// const landCover = [[[-74.0, 40.7], [-74.02, 40.7], [-74.02, 40.72], [-74.0, 40.72]]];
//
// export default function App({
//   buildings = DATA_URL.BUILDINGS,
//   trips = DATA_URL.TRIPS,
//   trailLength = 180,
//   initialViewState = INITIAL_VIEW_STATE,
//   mapStyle = MAP_STYLE,
//   theme = DEFAULT_THEME,
//   loopLength = 1800, // unit corresponds to the timestamp in source data
//   animationSpeed = 1
// }) {
//   const [time, setTime] = useState(0);
//   const [animation] = useState({});
//
//   const animate = () => {
//     setTime(t => (t + animationSpeed) % loopLength);
//     animation.id = window.requestAnimationFrame(animate);
//   };
//
//   useEffect(
//     () => {
//       animation.id = window.requestAnimationFrame(animate);
//       return () => window.cancelAnimationFrame(animation.id);
//     },
//     [animation]
//   );
//
//   const layers = [
//     // This is only needed when using shadow effects
//     new PolygonLayer({
//       id: 'ground',
//       data: landCover,
//       getPolygon: f => f,
//       stroked: false,
//       getFillColor: [0, 0, 0, 0]
//     }),
//     new TripsLayer({
//       id: 'trips',
//       data: trips,
//       getPath: d => d.path,
//       getTimestamps: d => d.timestamps,
//       getColor: d => (d.vendor === 0 ? theme.trailColor0 : theme.trailColor1),
//       opacity: 0.3,
//       widthMinPixels: 2,
//       rounded: true,
//       trailLength,
//       currentTime: time,
//
//       shadowEnabled: false
//     }),
//     new PolygonLayer({
//       id: 'buildings',
//       data: buildings,
//       extruded: true,
//       wireframe: false,
//       opacity: 0.5,
//       getPolygon: f => f.polygon,
//       getElevation: f => f.height,
//       getFillColor: theme.buildingColor,
//       material: theme.material
//     })
//   ];
//
//   return (
//     <DeckGL
//       layers={layers}
//       effects={theme.effects}
//       initialViewState={initialViewState}
//       controller={true}
//     >
//       <StaticMap reuseMaps mapStyle={mapStyle} preventStyleDiffing={true} />
//     </DeckGL>
//   );
// }
//
// export function renderToDOM(container) {
//   render(<App />, container);
// }

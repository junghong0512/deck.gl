import React, { useState, useRef, useCallback} from 'react';
import {render} from 'react-dom';
import { StaticMap, Popup } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import {GeoJsonLayer, PolygonLayer} from '@deck.gl/layers';
import { MapboxLayer } from '@deck.gl/mapbox';
import {LightingEffect, AmbientLight, _SunLight as SunLight} from '@deck.gl/core';
import {scaleThreshold} from 'd3-scale';

import { DATA_URL } from './data';

// Source data GeoJSON
// const DATA_URL =
//   'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/geojson/vancouver-blocks.json'; // eslint-disable-line

export const COLOR_SCALE = scaleThreshold()
  .domain([-0.6, -0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.05, 1.2])
  .range([
    [65, 182, 196],
    [127, 205, 187],
    [199, 233, 180],
    [237, 248, 177],
    // zero
    [255, 255, 204],
    [255, 237, 160],
    [254, 217, 118],
    [254, 178, 76],
    [253, 141, 60],
    [252, 78, 42],
    [227, 26, 28],
    [189, 0, 38],
    [128, 0, 38]
  ]);

const INITIAL_VIEW_STATE = {
  latitude: 37.498042,
  longitude: 127.027548,
  zoom: 11,
  maxZoom: 20,
  pitch: 45,
  bearing: 0
};

// const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
// const MAP_STYLE = 'https://api.mapbox.com/styles/v1/junghong/ckquispiyd7jf17nxwqux3bkz.html?fresh=true&title=copy&access_token=pk.eyJ1IjoianVuZ2hvbmciLCJhIjoiY2twbnBiZTA3MXQ3NjJ2bHJodHJmN2oyYSJ9.QW798Vk3hHy6I158OoHDzg';

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const dirLight = new SunLight({
  timestamp: Date.UTC(2019, 7, 1, 22),
  color: [255, 255, 255],
  intensity: 1.0,
  _shadow: true
});

const landCover = [[[127.11, 37.470], [127.11, 37.535], [126.99, 37.535], [126.99, 37.470]]];


function getTooltip({object}) {
  return (
    object && {
      html: `\
        <div><b>건물정보</b></div>
        <div>UFID: ${object.properties.UFID}</div>
        <div>BJCD(법정동코드): ${object.properties.BJCD}</div>
        <div>NAME(명칭): ${object.properties.NAME}</div>
        <div>DIVI(구분): ${object.properties.DIVI}</div>
        <div>KIND(종류): ${object.properties.KIND}</div>
        <div>SERV(용도): ${object.properties.SERV}</div>
        <div>ANNO(주기): ${object.properties.ANNO}</div>
        <div>NMLY(층수): ${object.properties.NMLY}</div>
        <div>RDNM(도로명): ${object.properties.RDNM}</div>
        <div>BONU(건물번호본번): ${object.properties.BONU}</div>
        <div>BUNU(건물번호부번): ${object.properties.BUNU}</div>
        <div>POST(우편번호): ${object.properties.POST}</div>
        <div>SCLS(통합코드): ${object.properties.SCLS}</div>
        <div>FMTA(제작정보): ${object.properties.FMTA}</div>
        <div>SHAPE_Area: ${object.properties.SHAPE_Area}</div>
        <div>SHAPE_Leng: ${object.properties.SHAPE_Leng}</div>
        <div>geom_Area: ${object.properties.geom_Area}</div>
        <div>geom_Lengt: ${object.properties.geom_Lengt}</div>
      `
    }
  );
}

export default function App({data = DATA_URL}) {

  const [glContext, setGLContext] = useState();
  const deckRef = useRef(null);
  const mapRef = useRef(null);

  const [effects] = useState(() => {
    const lightingEffect = new LightingEffect({ambientLight, dirLight});
    lightingEffect.shadowColor = [0, 0, 0, 0];
    return [lightingEffect];
  });

  const [hoverInfo, setHoverInfo] = useState();

  const onMapLoad = useCallback(() => {
    const map = mapRef.current.getMap();
    const deck = deckRef.current.deck;

    console.log(deck)

    // You must initialize an empty deck.gl layer to prevent flashing
    map.addLayer(
      // This id has to match the id of the deck.gl layer
      new MapboxLayer({ id: "my-scatterplot", deck }),
      // Optionally define id from Mapbox layer stack under which to add deck layer
      // 'beforeId'
    );
  }, []);

  const layers = [
    // only needed when using shadows - a plane for shadows to drop on
    // new PolygonLayer({
    //   id: 'ground',
    //   data: landCover,
    //   stroked: false,
    //   getPolygon: f => f,
    //   getFillColor: [0, 0, 0, 0]
    // }),
    new GeoJsonLayer({
      id: 'geojson',
      data,
      opacity: 0.5,
      autoHighlight: true,
      stroked: false,
      filled: true,
      extruded: true,
      wireframe: true,
      getElevation: f => Math.sqrt(f.properties.NMLY) * 5,
      getFillColor: [200, 200, 200],
      getLineColor: [10, 10, 10],
      pickable: true,
    })
  ];

  return (
    <DeckGL
      ref={deckRef}
      layers={layers}
      // effects={effects}
      initialViewState={INITIAL_VIEW_STATE}
      onWebGLInitialized={setGLContext}
      controller={true}
      getTooltip={getTooltip}
      glOptions={{
        /* To render vector tile polygons correctly */
        stencil: true
      }}
    >
      {hoverInfo && (
        <div style={{position: 'absolute', zIndex: 1, pointerEvents: 'none', left: hoverInfo.x, top: hoverInfo.y}}>
          {hoverInfo? console.log(hoverInfo) :"null"}
        </div>
      )}
      {glContext && (
        /* This is important: Mapbox must be instantiated after the WebGLContext is available */
        <StaticMap
          ref={mapRef}
          gl={glContext}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxApiAccessToken="pk.eyJ1IjoianVuZ2hvbmciLCJhIjoiY2twbnBiZTA3MXQ3NjJ2bHJodHJmN2oyYSJ9.QW798Vk3hHy6I158OoHDzg"
          onLoad={onMapLoad}
        />
      )}
    </DeckGL>
  );
}

export function renderToDOM(container) {
  render(<App />, container);
}

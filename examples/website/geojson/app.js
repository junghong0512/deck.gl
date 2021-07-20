import React, { useState, useRef, useCallback} from 'react';
import {render} from 'react-dom';
import { StaticMap, Popup } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import axios from 'axios';
import { GeoJsonLayer, TextLayer } from '@deck.gl/layers';
import { MapboxLayer } from '@deck.gl/mapbox';
import {scaleThreshold} from 'd3-scale';

import { DATA_URL } from './data';
import { SEOUL_GU_LATLNG } from './seoulGu';
import { SEOUL } from "./seoul";
import { SELECTED_BUILDINGS } from "./seoul_buildings";

const INITIAL_VIEW_STATE = {
  latitude: 37.498042,
  longitude: 127.027548,
  zoom: 11,
  maxZoom: 20,
  pitch: 45,
  bearing: 0
};

const OPENWEATHERMAP_API_KEY = "ab8dee082c400b1dbffa53fe7014099b";
const AIRVISUAL_API_KEY = "d9767932-4315-43c6-88d0-1ee90aa3ae30";

const getTooltip = ({object}) => {
  
  console.log(object)

  return (
    object && object.type && {
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
        <div>SHAPE_Area: ${object.properties.SHAPE_Area}</div>
        <div>SHAPE_Leng: ${object.properties.SHAPE_Leng}</div>
      `
    }
  );
}

export default function App({data = DATA_URL}) {

  const [glContext, setGLContext] = useState();
  
  const deckRef = useRef(null);
  const mapRef = useRef(null);

  const onMapLoad = useCallback(() => {
    const map = mapRef.current.getMap();
    const deck = deckRef.current.deck;

    map.addLayer(
      new MapboxLayer({ id: "my-scatterplot", deck }),
    );
  }, []);


  /* Adding weather information into the GU element */
  let seoulGu = SEOUL_GU_LATLNG.DATA;
  
  const weatherAdded = async (seoulGu, layers) => {
    seoulGu.map(gu => {
      let { lat, lng } = gu;
      let config = {
        method: 'GET',
        // url: `http://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lng}&key=${AIRVISUAL_API_KEY}`,
        url: `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`,
        header: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Max-Age": 3600,
          "Access-Control-Allow-Headers": "Origin,Accept, X-Requested-With,Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization"
        },
      }

      let coordArr = [parseFloat(gu.lng), parseFloat(gu.lat)];
      gu.coordinates = coordArr;

      axios(config)
      .then(async function(response) {
        gu.name = await (response.data.main.temp).toString();
        gu.weather = response.data;
      })
      .catch(function(error) {
        gu.weather = "Error Occured!" + error;
      })
    })

    return layers.push(
      new TextLayer({
        id: 'text-layer',
        data: seoulGu,
        pickable: true,
        getPosition: d => d.coordinates,
        getText: d => d.name,
        getSize: 80,
        getAngle: 0,
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center'
      })
    );
  }

  const layers = [
    new GeoJsonLayer({
      id: 'geojson',
      data,
      opacity: 0.5,
      autoHighlight: true,
      stroked: false,
      filled: true,
      extruded: true,
      wireframe: true,
      getElevation: f => f.properties.NMLY * 5,
      getFillColor: d => d.properties.selected ? [100, 105, 155] : [55, 205, 155],
      // getFillColor: [200, 200, 200],
      getLineColor: [10, 10, 10],
      pickable: true,
    }),

    new GeoJsonLayer({
      id: 'geojson',
      data: SELECTED_BUILDINGS,
      opacity: 0.5,
      autoHighlight: true,
      stroked: false,
      filled: true,
      extruded: true,
      wireframe: true,
      getElevation: f => f.properties.A32 * 5,
      getFillColor: d => d.properties.selected ? [200, 200, 200] : [200, 200, 200],
      // getFillColor: [200, 200, 200],
      getLineColor: [10, 10, 10],
      pickable: true,
    }),

    new GeoJsonLayer({
      id: 'geojson2',
      data: SEOUL,
      opacity: 0.4,
      autoHighlight: true,
      stroked: false,
      filled: false,
      extruded: true,
      wireframe: true,
      getElevation: 0,
      lineWidthScale: 40,
      lineWidthMinPixels: 5,
      getFillColor: [160, 160, 180, 190],
      getLineColor: [50, 10, 10],
      pickable: true,
    })
  ];


  weatherAdded(seoulGu, layers);

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

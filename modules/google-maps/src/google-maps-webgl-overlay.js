/* global google */
import {getParameters, setParameters, resetParameters} from '@luma.gl/core';
import {createDeckInstance, destroyDeckInstance, getViewState} from './webgl-utils';

const HIDE_ALL_LAYERS = () => false;

function matEqual(a, b) {
  if (a === undefined || b === undefined) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

export default class GoogleMapsOverlay {
  constructor(props) {
    this.props = {};

    this._map = null;

    const overlay = new google.maps.WebglOverlayView();
    overlay.onAdd = this._onAdd.bind(this);
    overlay.onContextRestored = this._onContextRestored.bind(this);
    overlay.onRemove = this._onRemove.bind(this);
    overlay.onDraw = this._onDraw.bind(this);
    this._overlay = overlay;

    this.setProps(props);
  }

  /* Public API */

  setMap(map) {
    if (map === this._map) {
      return;
    }
    if (this._map) {
      this._overlay.setMap(null);
      this._map = null;
    }
    if (map) {
      this._map = map;
      this._overlay.setMap(map);
    }
  }

  setProps(props) {
    Object.assign(this.props, props);
    if (this._deck) {
      if (props.style) {
        Object.assign(this._deck.canvas.parentElement.style, props.style);
        props.style = null;
      }
      this._deck.setProps(props);
    }
  }

  pickObject(params) {
    return this._deck && this._deck.pickObject(params);
  }

  pickMultipleObjects(params) {
    return this._deck && this._deck.pickMultipleObjects(params);
  }

  pickObjects(params) {
    return this._deck && this._deck.pickObjects(params);
  }

  finalize() {
    this.setMap(null);
    if (this._deck) {
      destroyDeckInstance(this._deck);
      this._deck = null;
    }
  }

  /* Private API */
  _onAdd() {}

  _onContextRestored(gl) {
    this._deck = createDeckInstance(this._map, gl, this._deck, this.props);
  }

  _onRemove() {
    // Clear deck canvas
    this._deck.setProps({layerFilter: HIDE_ALL_LAYERS});
  }

  // Suppling this leads to the code load some other file
  // and _onDraw not being called
  // _draw(gl, matrix, coordinateTransformer, layerState) {

  _onDraw(gl, coordinateTransformer) {
    // Extract projection matrix
    const projectionMatrix = [...coordinateTransformer.fromLatLngAltitude(this._map.center, 0)];
    const viewMatrix = [
      ...coordinateTransformer.fromLatLngAltitude({lat: -90, lng: -180}, 0, [0, 0, 0], [1, 1, 1])
    ];

    if (!matEqual(projectionMatrix, window._projectionMatrix)) {
      window._projectionMatrix = [...projectionMatrix];
      //console.log('projectionMatrix changed', window._projectionMatrix);
    }
    if (!matEqual(viewMatrix, window._viewMatrix)) {
      window._viewMatrix = [...viewMatrix];
      //console.log('viewMatrix changed', window._viewMatrix);
    }

    //this._overlay.requestRedraw(); // not a good idea, hangs
    const deck = this._deck;
    //const oldParams = getParameters(gl);

    const {width, height, zoom, bearing, pitch, latitude, longitude} = getViewState(
      this._map,
      coordinateTransformer
    );

    // Google appears to use 1m as their altitude when constructing
    // the Mercator projection matrix (deck.gl default is 1.5m)
    const altitude = 1;
    const nearZMultiplier = 0.3333333432674408;
    const farZMultiplier = 10000;

    deck.setProps({
      width,
      height,
      viewState: {
        altitude,
        bearing,
        farZMultiplier,
        latitude,
        longitude,
        nearZMultiplier,
        pitch,
        zoom,
        repeat: true
      }
      // deck.gl cannot sync with the base map with zoom < 0 and/or tilt
    });
    // Deck is initialized
    deck.redraw('google-vector');

    // Reset GL params (unclear if necessary)
    //setParameters(gl, oldParams);
    //resetParameters(gl);
  }
}

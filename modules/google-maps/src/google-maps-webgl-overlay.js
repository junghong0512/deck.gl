/* global google */
import {getParameters, setParameters, resetParameters, withParameters} from '@luma.gl/core';
import GL from '@luma.gl/constants';
import {createDeckInstance, destroyDeckInstance, getViewState} from './webgl-utils';

const HIDE_ALL_LAYERS = () => false;

const PARAM_LOOKUP = {};
Object.entries(GL).forEach(([k, v]) => {
  PARAM_LOOKUP[v] = k;
});

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
    const H = 0;
    const projectionMatrix = [...coordinateTransformer.fromLatLngAltitude(this._map.center, H)];
    const viewMatrix = [
      ...coordinateTransformer.fromLatLngAltitude({lat: -90, lng: -180}, H, [0, 0, 0], [1, 1, 1])
    ];

    if (!matEqual(projectionMatrix, window._projectionMatrix)) {
      window._projectionMatrix = [...projectionMatrix];
      //console.log('projectionMatrix changed', window._projectionMatrix);
    }
    if (!matEqual(viewMatrix, window._viewMatrix)) {
      window._viewMatrix = [...viewMatrix];
      //console.log('viewMatrix changed', window._viewMatrix);
    }

    const deck = this._deck;

    const {width, height, zoom, bearing, pitch, latitude, longitude} = getViewState(
      this._map,
      coordinateTransformer
    );

    // Google appears to use 1m as their altitude when constructing
    // the Mercator projection matrix (deck.gl default is 1.5m)
    const altitude = 2.2553542518310286; // [0.5 / Math.tan(0.5 * (25 * Math.PI / 180))]
    const nearZMultiplier = 0.3333333432674408;
    const farZMultiplier = 300000000000000; // Max before percision errors

    const parameters = {
      depthMask: true,
      depthTest: true,
      blendFunc: [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA],
      blendEquation: gl.FUNC_ADD,
      [GL.DRAW_FRAMEBUFFER_BINDING]: null,
      [GL.READ_FRAMEBUFFER_BINDING]: null
    };

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
    });

    // Doesn't help...
    // setParameters(gl, parameters);

    const oldParams = getParameters(gl);

    if (oldParams[GL.DRAW_FRAMEBUFFER_BINDING]) {
      // Hack to stop strange renders which don't
      // work
      // throw new Error();
    }

    // Not great, constantly redraws the map, but otherwise we
    // lose the overlay?
    // Google sample also does this
    // https://github.com/googlemaps/js-samples/blob/464487f160bd8a07797885864243d24643c9c2bc/samples/webgl-deckgl/src/index.ts#L164
    this._overlay.requestRedraw();

    let preParams, postParams;
    withParameters(gl, parameters, () => {
      preParams = getParameters(gl);
      // Using redraw means the canvas is cleared, want to avoid this
      //deck.redraw('google-vector');
      deck._drawLayers('google-vector', {
        clearCanvas: false
      });
      postParams = getParameters(gl);
    });
    let resetParams = getParameters(gl);
    const format = v => {
      if (Number.isInteger(v)) {
        return PARAM_LOOKUP[v];
      } else if (Array.isArray(v)) {
        return `[${v.join(', ')}]`;
      }

      return v;
    };

    for (let key of Object.keys(postParams)) {
      const old = oldParams[key];
      const pre = preParams[key];
      const post = postParams[key];
      const reset = resetParams[key];
      if (old !== pre || old !== post || old !== reset) {
        oldParams[PARAM_LOOKUP[key]] = format(old);
        preParams[PARAM_LOOKUP[key]] = format(pre);
        postParams[PARAM_LOOKUP[key]] = format(post);
        resetParams[PARAM_LOOKUP[key]] = format(reset);
      }
      delete oldParams[key];
      delete preParams[key];
      delete postParams[key];
      delete resetParams[key];
    }

    //console.table({old: oldParams, pre: preParams, post: postParams, reset: resetParams});
  }
}

/* global google */
import {withParameters} from '@luma.gl/core';
import GL from '@luma.gl/constants';
import {createDeckInstance, destroyDeckInstance, getViewState} from './webgl-utils';

const HIDE_ALL_LAYERS = () => false;

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

  _onDraw(gl, coordinateTransformer) {
    const deck = this._deck;

    const {width, height, zoom, bearing, pitch, latitude, longitude} = getViewState(
      this._map,
      coordinateTransformer
    );

    // Match Google projection matrix
    // The view matrix altitude is 1m, however the FOV is
    // not calculated from this, but rather is set to 25 degrees.
    const altitude = 1;
    const fov = 25;

    // Adjust zoom to obtain correct scaling matrix
    const scaleMultiplier = 2 * Math.tan(0.5 * ((fov * Math.PI) / 180));

    // Match depth range (crucial for correct z-sorting)
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
        fov,
        latitude,
        longitude,
        nearZMultiplier,
        pitch,
        repeat: true,
        zoom: zoom + Math.log2(scaleMultiplier)
      }
    });

    this._overlay.requestRedraw();
    withParameters(gl, parameters, () => {
      deck._drawLayers('google-vector', {
        clearCanvas: false
      });
    });
  }
}

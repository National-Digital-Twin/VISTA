import * as MapboxDrawGeodesic from "mapbox-gl-draw-geodesic";

export default class Polygon {
  #radius = 0;
  constructor({ geojson }) {
    this.geojson = geojson;
    Object.preventExtensions(this);
  }

  generateCircleInfo() {
    return {
      center: MapboxDrawGeodesic.getCircleCenter(this.geojson),
      radius: MapboxDrawGeodesic.getCircleRadius(this.geojson),
      enteredRadius: this.#radius
    };
  }

  setCircleRadius(radius) {
    this.#radius = radius;
  }
}

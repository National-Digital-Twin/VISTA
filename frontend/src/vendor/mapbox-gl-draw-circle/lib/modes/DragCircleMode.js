import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { circle, distance } from '@turf/turf';
import { point } from '@turf/helpers';
import dragPan from '@/vendor/mapbox-gl-draw-circle/lib/utils/drag_pan';

const DragCircleMode = { ...MapboxDraw.modes.draw_polygon };

DragCircleMode.onSetup = function (_opts) {
    const polygon = this.newFeature({
        type: MapboxDraw.constants.geojsonTypes.FEATURE,
        properties: {
            isCircle: true,
            center: [],
        },
        geometry: {
            type: MapboxDraw.constants.geojsonTypes.POLYGON,
            coordinates: [[]],
        },
    });

    this.addFeature(polygon);

    this.clearSelectedFeatures();
    MapboxDraw.lib.doubleClickZoom.disable(this);
    dragPan.disable(this);
    this.updateUIClasses({ mouse: MapboxDraw.constants.cursors.ADD });
    this.activateUIButton(MapboxDraw.constants.types.POLYGON);
    this.setActionableState({
        trash: true,
    });

    return {
        polygon,
        currentVertexPosition: 0,
    };
};

DragCircleMode.onMouseDown = DragCircleMode.onTouchStart = function (state, e) {
    const currentCenter = state.polygon.properties.center;
    if (currentCenter.length === 0) {
        state.polygon.properties.center = [e.lngLat.lng, e.lngLat.lat];
    }
};

DragCircleMode.onDrag = DragCircleMode.onMouseMove = function (state, e) {
    const center = state.polygon.properties.center;
    if (center.length > 0) {
        const distanceInKm = distance(point(center), point([e.lngLat.lng, e.lngLat.lat]), { units: 'kilometers' });
        const circleFeature = circle(center, distanceInKm);
        state.polygon.incomingCoords(circleFeature.geometry.coordinates);
        state.polygon.properties.radiusInKm = distanceInKm;
    }
};

DragCircleMode.onMouseUp = DragCircleMode.onTouchEnd = function (state, _e) {
    dragPan.enable(this);
    return this.changeMode(MapboxDraw.constants.modes.SIMPLE_SELECT, {
        featureIds: [state.polygon.id],
    });
};

DragCircleMode.onClick = DragCircleMode.onTap = function (state, _e) {
    // don't draw the circle if its a tap or click event
    state.polygon.properties.center = [];
};

DragCircleMode.toDisplayFeatures = function (state, geojson, display) {
    const isActivePolygon = geojson.properties.id === state.polygon.id;
    geojson.properties.active = isActivePolygon ? MapboxDraw.constants.activeStates.ACTIVE : MapboxDraw.constants.activeStates.INACTIVE;
    return display(geojson);
};

DragCircleMode.onStop = function (state) {
    dragPan.enable(this);
    this.updateUIClasses({ mouse: MapboxDraw.constants.cursors.NONE });
    MapboxDraw.lib.doubleClickZoom.enable(this);

    // Check to see if we've deleted this feature
    if (this.getFeature(state.polygon.id) === undefined) {
        return;
    }

    if (state.polygon.properties.center.length > 0 && state.polygon.coordinates[0].length > 0) {
        this.map.fire(MapboxDraw.constants.events.CREATE, {
            features: [state.polygon.toGeoJSON()],
        });
    } else {
        this.deleteFeature([state.polygon.id], { silent: true });
    }
};

export default DragCircleMode;

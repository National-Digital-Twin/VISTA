import { LngLat } from 'maplibre-gl';
import createStore from '@/hooks/createStore';

export type VehicleType = 'HGV' | 'EmergencyVehicle' | 'Car';

export interface RoadRouteState {
    startPosition?: LngLat | null;
    endPosition?: LngLat | null;
    setStartPosition: (startPosition: LngLat | null) => void;
    setEndPosition: (endPosition: LngLat | null) => void;

    vehicleType: VehicleType;
    setVehicleType: (newType: VehicleType) => void;
}

export const useRoadRouteSharedStore = createStore<RoadRouteState>('road-route', (set) => ({
    startPosition: null,
    endPosition: null,
    setStartPosition: (startPosition) => set({ startPosition }),
    setEndPosition: (endPosition) => set({ endPosition }),
    vehicleType: 'HGV',
    setVehicleType: (newType) => set({ vehicleType: newType }),
}));

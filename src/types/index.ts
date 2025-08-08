export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ParkingSlot {
  id: string;
  name: string;
  coordinates: Coordinates;
  capacity: number;
  occupiedSpots: number;
  hourlyPrice: number;
  amenities: string[];
  isOpen24Hours: boolean;
  openHours?: {
    open: string;
    close: string;
  };
}

export interface UserLocation {
  coordinates: Coordinates;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: number;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates: Coordinates[];
  maneuver?: {
    type: string;
    modifier?: string;
  };
}

export interface NavigationRoute {
  distance: number;
  duration: number;
  steps: RouteStep[];
  coordinates: Coordinates[];
}

export interface NavigationState {
  isNavigating: boolean;
  currentRoute?: NavigationRoute;
  targetParkingSlot?: ParkingSlot;
  currentStepIndex: number;
  remainingDistance: number;
  estimatedTimeArrival: Date;
  nextTurnInstruction?: string;
  nextTurnDistance?: number;
}

export interface CameraState {
  center: Coordinates;
  zoom: number;
  bearing: number;
  pitch: number;
  isUserControlled: boolean;
  lastUserInteraction: number;
}

export interface MapInteraction {
  type: 'pan' | 'zoom' | 'rotate' | 'tilt';
  timestamp: number;
}

export type LocationPermissionStatus = 'granted' | 'denied' | 'restricted' | 'undetermined';

export interface LocationServiceConfig {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  distanceFilter: number;
}
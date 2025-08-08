import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { 
  UserLocation, 
  Coordinates, 
  LocationPermissionStatus, 
  LocationServiceConfig 
} from '../types';

class LocationService {
  private watchId: number | null = null;
  private lastKnownLocation: UserLocation | null = null;
  private locationCallbacks: Set<(location: UserLocation) => void> = new Set();
  private permissionCallbacks: Set<(status: LocationPermissionStatus) => void> = new Set();

  private config: LocationServiceConfig = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 10000,
    distanceFilter: 5, // meters
  };

  constructor(customConfig?: Partial<LocationServiceConfig>) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
  }

  /**
   * Request location permissions based on platform
   */
  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, just try to get location - permission will be requested automatically
        try {
          await this.getCurrentPosition();
          this.notifyPermissionCallbacks('granted');
          return 'granted';
        } catch (error) {
          this.notifyPermissionCallbacks('denied');
          return 'denied';
        }
      } else {
        // For Android, use PermissionsAndroid
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs location access to show your position and provide navigation.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        let status: LocationPermissionStatus;
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          status = 'granted';
        } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
          status = 'denied';
        } else {
          status = 'restricted';
        }

        this.notifyPermissionCallbacks(status);
        return status;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return 'denied';
    }
  }

  /**
   * Check current location permission status
   */
  async checkLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, we'll assume undetermined and let the request handle it
        return 'undetermined';
      } else {
        // For Android, check the permission status
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted ? 'granted' : 'denied';
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      return 'denied';
    }
  }

  /**
   * Get current position once
   */
  async getCurrentPosition(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const userLocation: UserLocation = {
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          
          this.lastKnownLocation = userLocation;
          resolve(userLocation);
        },
        (error) => {
          console.error('Error getting current position:', error);
          reject(error);
        },
        {
          enableHighAccuracy: this.config.enableHighAccuracy,
          timeout: this.config.timeout,
          maximumAge: this.config.maximumAge,
        }
      );
    });
  }

  /**
   * Start watching location changes
   */
  startWatchingLocation(): void {
    if (this.watchId !== null) {
      this.stopWatchingLocation();
    }

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const userLocation: UserLocation = {
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        
        this.lastKnownLocation = userLocation;
        this.notifyLocationCallbacks(userLocation);
      },
      (error) => {
        console.error('Error watching location:', error);
      },
              {
          enableHighAccuracy: this.config.enableHighAccuracy,
          distanceFilter: this.config.distanceFilter,
        }
    );
  }

  /**
   * Stop watching location changes
   */
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Subscribe to location updates
   */
  addLocationListener(callback: (location: UserLocation) => void): () => void {
    this.locationCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.locationCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to permission status changes
   */
  addPermissionListener(callback: (status: LocationPermissionStatus) => void): () => void {
    this.permissionCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.permissionCallbacks.delete(callback);
    };
  }

  /**
   * Get last known location
   */
  getLastKnownLocation(): UserLocation | null {
    return this.lastKnownLocation;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Calculate bearing between two coordinates
   */
  calculateBearing(coord1: Coordinates, coord2: Coordinates): number {
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360 degrees
  }

  /**
   * Check if location service is available
   */
  async isLocationServiceEnabled(): Promise<boolean> {
    try {
      // This would need platform-specific implementation
      // For now, we'll assume it's available if we can get permission
      const permission = await this.checkLocationPermission();
      return permission === 'granted';
    } catch (error) {
      return false;
    }
  }

  private notifyLocationCallbacks(location: UserLocation): void {
    this.locationCallbacks.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('Error in location callback:', error);
      }
    });
  }

  private notifyPermissionCallbacks(status: LocationPermissionStatus): void {
    this.permissionCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in permission callback:', error);
      }
    });
  }

  /**
   * Cleanup all listeners and stop watching
   */
  cleanup(): void {
    this.stopWatchingLocation();
    this.locationCallbacks.clear();
    this.permissionCallbacks.clear();
  }
}

// Export a singleton instance
export const locationService = new LocationService();
export default LocationService;
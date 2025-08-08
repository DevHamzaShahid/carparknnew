import { UserLocation } from '../types';

/**
 * Performance optimization utilities for the car parking navigation app
 */

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private lastLocationUpdate: number = 0;
  private lastOrientationUpdate: number = 0;
  private isStationary: boolean = false;
  private stationaryStartTime: number = 0;
  
  // Throttling intervals (milliseconds)
  private readonly LOCATION_UPDATE_INTERVAL = 1000; // 1 second
  private readonly ORIENTATION_UPDATE_INTERVAL = 100; // 100ms
  private readonly STATIONARY_THRESHOLD = 30000; // 30 seconds
  private readonly STATIONARY_SPEED_THRESHOLD = 1; // 1 m/s (3.6 km/h)
  
  // Map update optimization
  private readonly MAP_UPDATE_DISTANCE_THRESHOLD = 10; // 10 meters
  private lastMapUpdateLocation: { latitude: number; longitude: number } | null = null;

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Throttle location updates to save battery
   */
  shouldUpdateLocation(location: UserLocation): boolean {
    const now = Date.now();
    
    // Always update if this is the first location
    if (this.lastLocationUpdate === 0) {
      this.lastLocationUpdate = now;
      return true;
    }

    // Check if enough time has passed since last update
    if (now - this.lastLocationUpdate < this.LOCATION_UPDATE_INTERVAL) {
      return false;
    }

    // Update stationary state
    this.updateStationaryState(location);

    // If stationary for a while, reduce update frequency
    if (this.isStationary && now - this.stationaryStartTime > this.STATIONARY_THRESHOLD) {
      // Reduce frequency to every 5 seconds when stationary
      if (now - this.lastLocationUpdate < 5000) {
        return false;
      }
    }

    this.lastLocationUpdate = now;
    return true;
  }

  /**
   * Throttle orientation updates to prevent jitter and save battery
   */
  shouldUpdateOrientation(): boolean {
    const now = Date.now();
    
    if (now - this.lastOrientationUpdate < this.ORIENTATION_UPDATE_INTERVAL) {
      return false;
    }

    this.lastOrientationUpdate = now;
    return true;
  }

  /**
   * Check if map should be updated based on location change
   */
  shouldUpdateMap(location: UserLocation): boolean {
    if (!this.lastMapUpdateLocation) {
      this.lastMapUpdateLocation = location.coordinates;
      return true;
    }

    const distance = this.calculateDistance(
      this.lastMapUpdateLocation,
      location.coordinates
    );

    if (distance >= this.MAP_UPDATE_DISTANCE_THRESHOLD) {
      this.lastMapUpdateLocation = location.coordinates;
      return true;
    }

    return false;
  }

  /**
   * Update stationary state based on speed and movement
   */
  private updateStationaryState(location: UserLocation): void {
    const speed = location.speed || 0;
    const now = Date.now();

    if (speed < this.STATIONARY_SPEED_THRESHOLD) {
      if (!this.isStationary) {
        this.isStationary = true;
        this.stationaryStartTime = now;
      }
    } else {
      this.isStationary = false;
      this.stationaryStartTime = 0;
    }
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get optimized location service configuration based on current state
   */
  getOptimizedLocationConfig(): {
    distanceFilter: number;
    interval: number;
    fastestInterval: number;
  } {
    if (this.isStationary) {
      return {
        distanceFilter: 50, // 50 meters when stationary
        interval: 10000, // 10 seconds
        fastestInterval: 5000, // 5 seconds minimum
      };
    } else {
      return {
        distanceFilter: 5, // 5 meters when moving
        interval: 2000, // 2 seconds
        fastestInterval: 1000, // 1 second minimum
      };
    }
  }

  /**
   * Check if device is in power saving mode and adjust accordingly
   */
  isPowerSavingMode(): boolean {
    // This would need native module implementation to check actual power saving mode
    // For now, we'll simulate based on battery level or other factors
    // In a real implementation, you'd use react-native-device-info
    return false;
  }

  /**
   * Get adaptive update intervals based on various factors
   */
  getAdaptiveIntervals(): {
    locationInterval: number;
    orientationInterval: number;
    mapUpdateInterval: number;
  } {
    const isPowerSaving = this.isPowerSavingMode();
    const multiplier = isPowerSaving ? 2 : 1;

    return {
      locationInterval: this.LOCATION_UPDATE_INTERVAL * multiplier,
      orientationInterval: this.ORIENTATION_UPDATE_INTERVAL * multiplier,
      mapUpdateInterval: 500 * multiplier,
    };
  }

  /**
   * Reset optimizer state
   */
  reset(): void {
    this.lastLocationUpdate = 0;
    this.lastOrientationUpdate = 0;
    this.isStationary = false;
    this.stationaryStartTime = 0;
    this.lastMapUpdateLocation = null;
  }

  /**
   * Get current stationary state
   */
  isCurrentlyStationary(): boolean {
    return this.isStationary;
  }

  /**
   * Get time since becoming stationary
   */
  getStationaryDuration(): number {
    if (!this.isStationary) return 0;
    return Date.now() - this.stationaryStartTime;
  }
}

/**
 * Debounce function for expensive operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function for frequent operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCallTime >= delay) {
      lastCallTime = now;
      func(...args);
    }
  };
}

/**
 * Memory management for large data sets
 */
export class MemoryManager {
  private static readonly MAX_ROUTE_POINTS = 1000;
  private static readonly MAX_LOCATION_HISTORY = 100;

  /**
   * Simplify route coordinates to reduce memory usage
   */
  static simplifyRoute(coordinates: { latitude: number; longitude: number }[]): { latitude: number; longitude: number }[] {
    if (coordinates.length <= this.MAX_ROUTE_POINTS) {
      return coordinates;
    }

    // Use Douglas-Peucker algorithm for line simplification
    return this.douglasPeucker(coordinates, 0.0001); // ~10 meter tolerance
  }

  /**
   * Douglas-Peucker line simplification algorithm
   */
  private static douglasPeucker(
    points: { latitude: number; longitude: number }[],
    tolerance: number
  ): { latitude: number; longitude: number }[] {
    if (points.length <= 2) return points;

    const [first, ...middle] = points;
    const last = points[points.length - 1];

    let maxDistance = 0;
    let maxIndex = 0;

    for (let i = 0; i < middle.length; i++) {
      const distance = this.pointToLineDistance(middle[i], first, last);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i + 1; // +1 because we excluded first
      }
    }

    if (maxDistance > tolerance) {
      const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const right = this.douglasPeucker(points.slice(maxIndex), tolerance);
      return [...left.slice(0, -1), ...right];
    } else {
      return [first, last];
    }
  }

  /**
   * Calculate distance from point to line
   */
  private static pointToLineDistance(
    point: { latitude: number; longitude: number },
    lineStart: { latitude: number; longitude: number },
    lineEnd: { latitude: number; longitude: number }
  ): number {
    const A = point.latitude - lineStart.latitude;
    const B = point.longitude - lineStart.longitude;
    const C = lineEnd.latitude - lineStart.latitude;
    const D = lineEnd.longitude - lineStart.longitude;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);

    const param = dot / lenSq;
    let xx, yy;

    if (param < 0) {
      xx = lineStart.latitude;
      yy = lineStart.longitude;
    } else if (param > 1) {
      xx = lineEnd.latitude;
      yy = lineEnd.longitude;
    } else {
      xx = lineStart.latitude + param * C;
      yy = lineStart.longitude + param * D;
    }

    const dx = point.latitude - xx;
    const dy = point.longitude - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Manage location history to prevent memory leaks
   */
  static manageLocationHistory(history: UserLocation[]): UserLocation[] {
    if (history.length <= this.MAX_LOCATION_HISTORY) {
      return history;
    }

    // Keep only the most recent locations
    return history.slice(-this.MAX_LOCATION_HISTORY);
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();
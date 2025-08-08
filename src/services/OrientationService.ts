import Orientation from 'react-native-orientation-locker';
import { DeviceEventEmitter, Platform } from 'react-native';

export interface OrientationData {
  heading: number;
  accuracy: number;
  timestamp: number;
}

class OrientationService {
  private orientationCallbacks: Set<(orientation: OrientationData) => void> = new Set();
  private lastOrientation: OrientationData | null = null;
  private smoothingFactor = 0.8; // Smoothing factor for easing (0 = no smoothing, 1 = maximum smoothing)
  private isListening = false;
  private orientationListener: any = null;

  constructor() {
    this.setupOrientationListener();
  }

  /**
   * Setup orientation change listener
   */
  private setupOrientationListener(): void {
    // For iOS, we'll use DeviceMotion events if available
    if (Platform.OS === 'ios') {
      this.setupiOSOrientationListener();
    } else {
      this.setupAndroidOrientationListener();
    }
  }

  /**
   * Setup iOS orientation listener using DeviceMotion
   */
  private setupiOSOrientationListener(): void {
    // Note: For iOS, you might need to use react-native-sensors or similar
    // For now, we'll use a simplified approach
    this.orientationListener = DeviceEventEmitter.addListener(
      'orientationDidChange',
      this.handleOrientationChange.bind(this)
    );
  }

  /**
   * Setup Android orientation listener
   */
  private setupAndroidOrientationListener(): void {
    // For Android, we can use the orientation locker or native sensors
    this.orientationListener = DeviceEventEmitter.addListener(
      'orientationDidChange',
      this.handleOrientationChange.bind(this)
    );
  }

  /**
   * Handle orientation change with smoothing
   */
  private handleOrientationChange(orientation: any): void {
    const timestamp = Date.now();
    let heading = 0;

    // Extract heading from different orientation data formats
    if (typeof orientation === 'number') {
      heading = orientation;
    } else if (orientation.heading !== undefined) {
      heading = orientation.heading;
    } else if (orientation.magnetometer) {
      // Calculate heading from magnetometer data
      heading = this.calculateHeadingFromMagnetometer(orientation.magnetometer);
    }

    // Normalize heading to 0-360 degrees
    heading = this.normalizeHeading(heading);

    // Apply smoothing to prevent jitter
    if (this.lastOrientation) {
      heading = this.applySmoothingToHeading(
        this.lastOrientation.heading,
        heading
      );
    }

    const orientationData: OrientationData = {
      heading,
      accuracy: orientation.accuracy || 0,
      timestamp,
    };

    this.lastOrientation = orientationData;
    this.notifyOrientationCallbacks(orientationData);
  }

  /**
   * Calculate heading from magnetometer data
   */
  private calculateHeadingFromMagnetometer(magnetometer: {
    x: number;
    y: number;
    z: number;
  }): number {
    // Calculate heading from magnetometer readings
    const heading = Math.atan2(magnetometer.y, magnetometer.x) * (180 / Math.PI);
    return heading < 0 ? heading + 360 : heading;
  }

  /**
   * Normalize heading to 0-360 degrees
   */
  private normalizeHeading(heading: number): number {
    while (heading < 0) heading += 360;
    while (heading >= 360) heading -= 360;
    return heading;
  }

  /**
   * Apply smoothing to heading to prevent jitter
   */
  private applySmoothingToHeading(
    currentHeading: number,
    newHeading: number
  ): number {
    // Handle the circular nature of headings (0-360 degrees)
    let diff = newHeading - currentHeading;
    
    // Find the shortest angular distance
    if (diff > 180) {
      diff -= 360;
    } else if (diff < -180) {
      diff += 360;
    }

    // Apply exponential smoothing
    const smoothedDiff = diff * (1 - this.smoothingFactor);
    const smoothedHeading = currentHeading + smoothedDiff;

    return this.normalizeHeading(smoothedHeading);
  }

  /**
   * Start listening to orientation changes
   */
  startListening(): void {
    if (this.isListening) {
      return;
    }

    this.isListening = true;

    // Enable orientation updates if using orientation locker
    try {
      Orientation.addOrientationListener(this.handleDeviceOrientationChange.bind(this));
    } catch (error) {
      console.warn('Orientation locker not available:', error);
    }

    // Additional setup for more precise compass heading
    this.setupCompassHeading();
  }

  /**
   * Handle device orientation change from orientation locker
   */
  private handleDeviceOrientationChange(orientation: string): void {
    // Convert orientation string to degrees
    let heading = 0;
    switch (orientation) {
      case 'PORTRAIT':
        heading = 0;
        break;
      case 'LANDSCAPE-LEFT':
        heading = 90;
        break;
      case 'PORTRAIT-UPSIDEDOWN':
        heading = 180;
        break;
      case 'LANDSCAPE-RIGHT':
        heading = 270;
        break;
    }

    this.handleOrientationChange({ heading, accuracy: 1 });
  }

  /**
   * Setup compass heading for more accurate direction
   * Note: This is a placeholder - you might need additional libraries
   */
  private setupCompassHeading(): void {
    // For actual implementation, you might use:
    // - react-native-sensors for magnetometer
    // - react-native-compass-heading
    // - Custom native modules
    
    // Simulated compass updates
    if (__DEV__) {
      console.log('Compass heading setup - implement with appropriate sensor library');
    }
  }

  /**
   * Stop listening to orientation changes
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }

    this.isListening = false;

    try {
      Orientation.removeOrientationListener(this.handleDeviceOrientationChange);
    } catch (error) {
      console.warn('Error removing orientation listener:', error);
    }

    if (this.orientationListener) {
      this.orientationListener.remove();
      this.orientationListener = null;
    }
  }

  /**
   * Subscribe to orientation updates
   */
  addOrientationListener(
    callback: (orientation: OrientationData) => void
  ): () => void {
    this.orientationCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.orientationCallbacks.delete(callback);
    };
  }

  /**
   * Get last known orientation
   */
  getLastKnownOrientation(): OrientationData | null {
    return this.lastOrientation;
  }

  /**
   * Set smoothing factor for orientation changes
   */
  setSmoothingFactor(factor: number): void {
    this.smoothingFactor = Math.max(0, Math.min(1, factor));
  }

  /**
   * Get current smoothing factor
   */
  getSmoothingFactor(): number {
    return this.smoothingFactor;
  }

  /**
   * Calculate bearing from GPS coordinates (fallback method)
   */
  calculateGPSBearing(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): number {
    const φ1 = (from.latitude * Math.PI) / 180;
    const φ2 = (to.latitude * Math.PI) / 180;
    const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
      Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return this.normalizeHeading(bearing);
  }

  /**
   * Update orientation with GPS bearing as fallback
   */
  updateWithGPSBearing(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): void {
    const heading = this.calculateGPSBearing(from, to);
    const orientationData: OrientationData = {
      heading,
      accuracy: 0.5, // Lower accuracy for GPS-based bearing
      timestamp: Date.now(),
    };

    // Apply smoothing if we have previous orientation data
    if (this.lastOrientation) {
      orientationData.heading = this.applySmoothingToHeading(
        this.lastOrientation.heading,
        heading
      );
    }

    this.lastOrientation = orientationData;
    this.notifyOrientationCallbacks(orientationData);
  }

  /**
   * Notify all orientation callbacks
   */
  private notifyOrientationCallbacks(orientation: OrientationData): void {
    this.orientationCallbacks.forEach((callback) => {
      try {
        callback(orientation);
      } catch (error) {
        console.error('Error in orientation callback:', error);
      }
    });
  }

  /**
   * Check if orientation sensor is available
   */
  async isOrientationAvailable(): Promise<boolean> {
    try {
      // Platform-specific checks would go here
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup all listeners
   */
  cleanup(): void {
    this.stopListening();
    this.orientationCallbacks.clear();
    this.lastOrientation = null;
  }
}

// Export a singleton instance
export const orientationService = new OrientationService();
export default OrientationService;
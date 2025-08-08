import { 
  Coordinates, 
  NavigationRoute, 
  RouteStep, 
  NavigationState 
} from '../types';

export interface RoutingServiceConfig {
  apiKey?: string;
  provider: 'google' | 'openroute' | 'mock';
  language?: string;
  units?: 'metric' | 'imperial';
}

class RoutingService {
  private config: RoutingServiceConfig;
  private currentRoute: NavigationRoute | null = null;

  constructor(config: RoutingServiceConfig) {
    this.config = {
      language: 'en',
      units: 'metric',
      ...config,
      provider: config.provider || 'mock',
    };
  }

  /**
   * Fetch driving route between two coordinates
   */
  async getRoute(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[]
  ): Promise<NavigationRoute> {
    try {
      switch (this.config.provider) {
        case 'google':
          return await this.getGoogleRoute(origin, destination, waypoints);
        case 'openroute':
          return await this.getOpenRouteRoute(origin, destination, waypoints);
        case 'mock':
        default:
          return this.getMockRoute(origin, destination, waypoints);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      throw new Error('Failed to fetch route');
    }
  }

  /**
   * Get route using Google Directions API
   */
  private async getGoogleRoute(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[]
  ): Promise<NavigationRoute> {
    if (!this.config.apiKey) {
      throw new Error('Google API key required');
    }

    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;
    let waypointsStr = '';
    
    if (waypoints && waypoints.length > 0) {
      waypointsStr = waypoints
        .map(wp => `${wp.latitude},${wp.longitude}`)
        .join('|');
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&waypoints=${waypointsStr}&key=${this.config.apiKey}&mode=driving&units=${this.config.units}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Directions API error: ${data.status}`);
    }

    return this.parseGoogleResponse(data);
  }

  /**
   * Get route using OpenRouteService API
   */
  private async getOpenRouteRoute(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[]
  ): Promise<NavigationRoute> {
    if (!this.config.apiKey) {
      throw new Error('OpenRouteService API key required');
    }

    const coordinates = [
      [origin.longitude, origin.latitude],
      ...(waypoints || []).map(wp => [wp.longitude, wp.latitude]),
      [destination.longitude, destination.latitude],
    ];

    const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates,
        format: 'json',
        instructions: true,
        units: this.config.units === 'metric' ? 'm' : 'mi',
      }),
    });

    const data = await response.json();
    return this.parseOpenRouteResponse(data);
  }

  /**
   * Generate a mock route for development
   */
  private getMockRoute(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[]
  ): NavigationRoute {
    // Generate a simple route with realistic turns and instructions
    const coordinates: Coordinates[] = [];
    const steps: RouteStep[] = [];

    // Calculate total distance
    const totalDistance = this.calculateDistance(origin, destination);
    const totalDuration = Math.round(totalDistance / 13.89); // Assume 50 km/h average speed

    // Generate intermediate points along the route
    const numberOfSteps = Math.min(Math.max(3, Math.round(totalDistance / 1000)), 8);
    
    for (let i = 0; i <= numberOfSteps; i++) {
      const ratio = i / numberOfSteps;
      const lat = origin.latitude + (destination.latitude - origin.latitude) * ratio;
      const lng = origin.longitude + (destination.longitude - origin.longitude) * ratio;
      
      coordinates.push({ latitude: lat, longitude: lng });

      if (i < numberOfSteps) {
        const stepDistance = totalDistance / numberOfSteps;
        const stepDuration = totalDuration / numberOfSteps;
        
        steps.push({
          instruction: this.generateMockInstruction(i, numberOfSteps),
          distance: stepDistance,
          duration: stepDuration,
          coordinates: [{ latitude: lat, longitude: lng }],
          maneuver: {
            type: i === 0 ? 'depart' : (i === numberOfSteps - 1 ? 'arrive' : 'turn'),
            modifier: i % 3 === 0 ? 'left' : (i % 3 === 1 ? 'right' : 'straight'),
          },
        });
      }
    }

    return {
      distance: totalDistance,
      duration: totalDuration,
      steps,
      coordinates,
    };
  }

  /**
   * Generate mock instruction text
   */
  private generateMockInstruction(stepIndex: number, totalSteps: number): string {
    if (stepIndex === 0) {
      return 'Head north on current road';
    }
    
    if (stepIndex === totalSteps - 1) {
      return 'Arrive at destination';
    }

    const directions = ['left', 'right', 'straight'];
    const roads = ['Main Road', 'Boulevard', 'Street', 'Avenue', 'Lane'];
    const direction = directions[stepIndex % directions.length];
    const road = roads[stepIndex % roads.length];

    if (direction === 'straight') {
      return `Continue straight on ${road}`;
    } else {
      return `Turn ${direction} onto ${road}`;
    }
  }

  /**
   * Parse Google Directions API response
   */
  private parseGoogleResponse(data: any): NavigationRoute {
    const route = data.routes[0];
    const leg = route.legs[0];

    const coordinates: Coordinates[] = [];
    const steps: RouteStep[] = [];

    // Decode polyline points
    const points = this.decodePolyline(route.overview_polyline.points);
    coordinates.push(...points);

    // Parse steps
    leg.steps.forEach((step: any) => {
      steps.push({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
        distance: step.distance.value,
        duration: step.duration.value,
        coordinates: this.decodePolyline(step.polyline.points),
        maneuver: {
          type: step.maneuver || 'straight',
        },
      });
    });

    return {
      distance: leg.distance.value,
      duration: leg.duration.value,
      steps,
      coordinates,
    };
  }

  /**
   * Parse OpenRouteService response
   */
  private parseOpenRouteResponse(data: any): NavigationRoute {
    const route = data.routes[0];
    const summary = route.summary;

    const coordinates: Coordinates[] = route.geometry.coordinates.map(
      (coord: [number, number]) => ({
        latitude: coord[1],
        longitude: coord[0],
      })
    );

    const steps: RouteStep[] = route.segments[0].steps.map((step: any) => ({
      instruction: step.instruction,
      distance: step.distance,
      duration: step.duration,
      coordinates: coordinates.slice(step.way_points[0], step.way_points[1] + 1),
      maneuver: {
        type: step.type?.toString() || 'straight',
      },
    }));

    return {
      distance: summary.distance,
      duration: summary.duration,
      steps,
      coordinates,
    };
  }

  /**
   * Decode Google polyline
   */
  private decodePolyline(encoded: string): Coordinates[] {
    const coordinates: Coordinates[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      coordinates.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return coordinates;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
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
   * Calculate remaining distance and time based on current position
   */
  calculateProgress(
    currentPosition: Coordinates,
    route: NavigationRoute,
    currentStepIndex: number
  ): {
    remainingDistance: number;
    remainingTime: number;
    nextTurnInstruction?: string;
    nextTurnDistance?: number;
  } {
    let remainingDistance = 0;
    let remainingTime = 0;

    // Calculate remaining distance from current step
    if (currentStepIndex < route.steps.length) {
      const currentStep = route.steps[currentStepIndex];
      const distanceToStepEnd = this.calculateDistance(
        currentPosition,
        currentStep.coordinates[currentStep.coordinates.length - 1]
      );

      remainingDistance += distanceToStepEnd;
      remainingTime += (distanceToStepEnd / currentStep.distance) * currentStep.duration;

      // Add remaining steps
      for (let i = currentStepIndex + 1; i < route.steps.length; i++) {
        remainingDistance += route.steps[i].distance;
        remainingTime += route.steps[i].duration;
      }
    }

    // Get next turn instruction
    let nextTurnInstruction: string | undefined;
    let nextTurnDistance: number | undefined;

    if (currentStepIndex + 1 < route.steps.length) {
      const nextStep = route.steps[currentStepIndex + 1];
      nextTurnInstruction = nextStep.instruction;
      nextTurnDistance = this.calculateDistance(
        currentPosition,
        nextStep.coordinates[0]
      );
    }

    return {
      remainingDistance,
      remainingTime,
      nextTurnInstruction,
      nextTurnDistance,
    };
  }

  /**
   * Find current step index based on user position
   */
  findCurrentStepIndex(
    currentPosition: Coordinates,
    route: NavigationRoute
  ): number {
    let minDistance = Infinity;
    let currentStepIndex = 0;

    route.steps.forEach((step, index) => {
      step.coordinates.forEach((coord) => {
        const distance = this.calculateDistance(currentPosition, coord);
        if (distance < minDistance) {
          minDistance = distance;
          currentStepIndex = index;
        }
      });
    });

    return currentStepIndex;
  }

  /**
   * Get current route
   */
  getCurrentRoute(): NavigationRoute | null {
    return this.currentRoute;
  }

  /**
   * Set current route
   */
  setCurrentRoute(route: NavigationRoute | null): void {
    this.currentRoute = route;
  }

  /**
   * Clear current route
   */
  clearRoute(): void {
    this.currentRoute = null;
  }
}

// Export singleton with default mock configuration
export const routingService = new RoutingService({ provider: 'mock' });
export default RoutingService;
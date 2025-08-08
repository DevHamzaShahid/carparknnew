import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { 
  Marker, 
  Polyline, 
  PROVIDER_GOOGLE,
  Region,
  MapPressEvent,
  Camera,
} from 'react-native-maps';
import { 
  ParkingSlot, 
  UserLocation, 
  NavigationState, 
  CameraState, 
  MapInteraction,
  Coordinates 
} from '../types';
import { mockParkingSlots } from '../data/mockParkingSlots';
import { locationService } from '../services/LocationService';
import { orientationService, OrientationData } from '../services/OrientationService';
import { routingService } from '../services/RoutingService';
import { POVMarker, ParkingMarker } from '../utils/SvgIcons';
import NavigationBar from './NavigationBar';
import ParkingDetailsSheet from './ParkingDetailsSheet';
import { performanceOptimizer, throttle, MemoryManager } from '../utils/PerformanceOptimizer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Johar Town, Lahore center coordinates
const INITIAL_REGION = {
  latitude: 31.4659,
  longitude: 74.2734,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const CAMERA_ANIMATION_DURATION = 1000;
const USER_IDLE_TIMEOUT = 10000; // 10 seconds
const TURN_HIGHLIGHT_DISTANCE = 50; // 50 meters

interface CarParkingMapProps {
  onLocationPermissionRequested?: () => void;
}

export const CarParkingMap: React.FC<CarParkingMapProps> = ({
  onLocationPermissionRequested,
}) => {
  const mapRef = useRef<MapView>(null);
  
  // State management
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [orientation, setOrientation] = useState<OrientationData | null>(null);
  const [selectedParkingSlot, setSelectedParkingSlot] = useState<ParkingSlot | null>(null);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    currentStepIndex: 0,
    remainingDistance: 0,
    estimatedTimeArrival: new Date(),
  });
  
  // Camera state management
  const [cameraState, setCameraState] = useState<CameraState>({
    center: INITIAL_REGION,
    zoom: 15,
    bearing: 0,
    pitch: 0,
    isUserControlled: false,
    lastUserInteraction: 0,
  });
  
  const userIdleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const locationUnsubscribeRef = useRef<(() => void) | null>(null);
  const orientationUnsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize services
  useEffect(() => {
    initializeLocation();
    initializeOrientation();
    
    return () => {
      cleanup();
    };
  }, []);

  // Initialize location services
  const initializeLocation = async () => {
    try {
      const permission = await locationService.checkLocationPermission();
      
      if (permission !== 'granted') {
        const requestResult = await locationService.requestLocationPermission();
        if (requestResult !== 'granted') {
          Alert.alert(
            'Location Permission Required',
            'Please enable location services to use navigation features.',
            [{ text: 'OK' }]
          );
          onLocationPermissionRequested?.();
          return;
        }
      }

      // Get initial location
      const currentLocation = await locationService.getCurrentPosition();
      setUserLocation(currentLocation);
      
      // Center map on user location
      animateToLocation(currentLocation.coordinates);

      // Start watching location changes with performance optimization
      const unsubscribe = locationService.addLocationListener((location) => {
        if (performanceOptimizer.shouldUpdateLocation(location)) {
          setUserLocation(location);
          updateNavigationProgress(location);
        }
      });
      locationUnsubscribeRef.current = unsubscribe;

      locationService.startWatchingLocation();
    } catch (error) {
      console.error('Failed to initialize location:', error);
      Alert.alert('Location Error', 'Failed to get your location. Please try again.');
    }
  };

  // Initialize orientation services with performance optimization
  const initializeOrientation = () => {
    const unsubscribe = orientationService.addOrientationListener((orientationData) => {
      if (performanceOptimizer.shouldUpdateOrientation()) {
        setOrientation(orientationData);
      }
    });
    orientationUnsubscribeRef.current = unsubscribe;
    
    orientationService.startListening();
  };

  // Animate camera to location
  const animateToLocation = useCallback((coordinates: Coordinates, zoom?: number) => {
    if (!mapRef.current) return;

    const camera: Camera = {
      center: coordinates,
      zoom: zoom || cameraState.zoom,
      heading: cameraState.isUserControlled ? cameraState.bearing : 0,
      pitch: cameraState.pitch,
    };

    mapRef.current.animateCamera(camera, { duration: CAMERA_ANIMATION_DURATION });
  }, [cameraState]);

  // Handle map interactions
  const handleMapPress = useCallback((event: MapPressEvent) => {
    // Close bottom sheet when map is pressed
    if (isBottomSheetVisible) {
      setIsBottomSheetVisible(false);
      setSelectedParkingSlot(null);
    }
  }, [isBottomSheetVisible]);

  // Handle user map interactions with throttling
  const handleUserMapInteraction = useCallback(
    throttle((interaction: MapInteraction) => {
      setCameraState(prev => ({
        ...prev,
        isUserControlled: true,
        lastUserInteraction: Date.now(),
      }));

      // Clear existing timeout
      if (userIdleTimeoutRef.current) {
        clearTimeout(userIdleTimeoutRef.current);
      }

      // Set new timeout to reset to north-up
      if (navigationState.isNavigating) {
        userIdleTimeoutRef.current = setTimeout(() => {
          setCameraState(prev => ({
            ...prev,
            isUserControlled: false,
            bearing: 0,
          }));
          
          // Return to north-up orientation
          if (userLocation && mapRef.current) {
            animateToLocation(userLocation.coordinates);
          }
        }, USER_IDLE_TIMEOUT);
      }
    }, 100), // Throttle to 100ms
    [navigationState.isNavigating, userLocation, animateToLocation]
  );

  // Handle parking marker press
  const handleParkingMarkerPress = useCallback((parkingSlot: ParkingSlot) => {
    setSelectedParkingSlot(parkingSlot);
    setIsBottomSheetVisible(true);
  }, []);

  // Start navigation to selected parking slot
  const handleStartNavigation = useCallback(async (parkingSlot: ParkingSlot) => {
    if (!userLocation) {
      Alert.alert('Location Required', 'Current location is required for navigation.');
      return;
    }

    try {
      // Fetch route
      const route = await routingService.getRoute(
        userLocation.coordinates,
        parkingSlot.coordinates
      );

      // Calculate ETA
      const eta = new Date();
      eta.setSeconds(eta.getSeconds() + route.duration);

      // Update navigation state
      setNavigationState({
        isNavigating: true,
        currentRoute: route,
        targetParkingSlot: parkingSlot,
        currentStepIndex: 0,
        remainingDistance: route.distance,
        estimatedTimeArrival: eta,
        nextTurnInstruction: route.steps[0]?.instruction,
        nextTurnDistance: route.steps[0]?.distance,
      });

      // Close bottom sheet
      setIsBottomSheetVisible(false);
      setSelectedParkingSlot(null);

      // Animate to show route
      if (mapRef.current) {
        mapRef.current.fitToCoordinates(
          [userLocation.coordinates, parkingSlot.coordinates],
          {
            edgePadding: { top: 200, right: 50, bottom: 300, left: 50 },
            animated: true,
          }
        );
      }
    } catch (error) {
      console.error('Failed to start navigation:', error);
      Alert.alert('Navigation Error', 'Failed to calculate route. Please try again.');
    }
  }, [userLocation]);

  // Update navigation progress
  const updateNavigationProgress = useCallback((location: UserLocation) => {
    if (!navigationState.isNavigating || !navigationState.currentRoute) return;

    const route = navigationState.currentRoute;
    const currentStepIndex = routingService.findCurrentStepIndex(
      location.coordinates,
      route
    );

    const progress = routingService.calculateProgress(
      location.coordinates,
      route,
      currentStepIndex
    );

    // Update navigation state
    setNavigationState(prev => ({
      ...prev,
      currentStepIndex,
      remainingDistance: progress.remainingDistance,
      nextTurnInstruction: progress.nextTurnInstruction,
      nextTurnDistance: progress.nextTurnDistance,
    }));

    // Check if user is approaching a turn
    if (progress.nextTurnDistance && progress.nextTurnDistance < TURN_HIGHLIGHT_DISTANCE) {
      if (!cameraState.isUserControlled && mapRef.current) {
        // Tilt camera to highlight turn
        const camera: Camera = {
          center: location.coordinates,
          zoom: 18,
          heading: orientation?.heading || 0,
          pitch: 45,
        };
        mapRef.current.animateCamera(camera, { duration: 500 });
      }
    }

    // Auto-center on user location during navigation (if not user controlled)
    if (!cameraState.isUserControlled && mapRef.current) {
      animateToLocation(location.coordinates, 16);
    }
  }, [navigationState, cameraState, orientation, animateToLocation]);

  // End navigation
  const handleEndNavigation = useCallback(() => {
    setNavigationState({
      isNavigating: false,
      currentStepIndex: 0,
      remainingDistance: 0,
      estimatedTimeArrival: new Date(),
    });
    
    routingService.clearRoute();
    
    // Reset camera state
    setCameraState(prev => ({
      ...prev,
      isUserControlled: false,
      bearing: 0,
      pitch: 0,
    }));

    if (userIdleTimeoutRef.current) {
      clearTimeout(userIdleTimeoutRef.current);
    }
  }, []);

  // Calculate distance from user to parking slot
  const calculateDistanceToSlot = useCallback((slot: ParkingSlot): number => {
    if (!userLocation) return 0;
    return locationService.calculateDistance(userLocation.coordinates, slot.coordinates);
  }, [userLocation]);

  // Cleanup function
  const cleanup = () => {
    if (locationUnsubscribeRef.current) {
      locationUnsubscribeRef.current();
    }
    if (orientationUnsubscribeRef.current) {
      orientationUnsubscribeRef.current();
    }
    if (userIdleTimeoutRef.current) {
      clearTimeout(userIdleTimeoutRef.current);
    }
    locationService.cleanup();
    orientationService.cleanup();
  };

  return (
    <View style={styles.container}>
      {/* Navigation Bar */}
      <NavigationBar
        isNavigating={navigationState.isNavigating}
        currentSpeed={userLocation?.speed ? userLocation.speed * 3.6 : 0} // m/s to km/h
        remainingDistance={navigationState.remainingDistance}
        estimatedTimeArrival={navigationState.estimatedTimeArrival}
        nextTurnInstruction={navigationState.nextTurnInstruction}
        nextTurnDistance={navigationState.nextTurnDistance}
        nextTurnDirection="straight" // This would be derived from route step maneuver
        onEndNavigation={handleEndNavigation}
      />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={INITIAL_REGION}
        showsUserLocation={false} // We'll use custom marker
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={true}
        pitchEnabled={true}
        onPress={handleMapPress}
        onPanDrag={() => handleUserMapInteraction({ type: 'pan', timestamp: Date.now() })}
        onRegionChangeComplete={() => handleUserMapInteraction({ type: 'zoom', timestamp: Date.now() })}
      >
        {/* Parking Markers */}
        {mockParkingSlots.map((slot) => {
          const distance = calculateDistanceToSlot(slot);
          return (
            <Marker
              key={slot.id}
              coordinate={slot.coordinates}
              onPress={() => handleParkingMarkerPress(slot)}
              tracksViewChanges={false}
            >
              <ParkingMarker
                isSelected={selectedParkingSlot?.id === slot.id}
                capacity={slot.capacity}
                available={slot.capacity - slot.occupiedSpots}
              />
            </Marker>
          );
        })}

        {/* User Location Marker with POV */}
        {userLocation && (
          <Marker
            coordinate={userLocation.coordinates}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <POVMarker
              heading={orientation?.heading || userLocation.heading || 0}
              showCone={navigationState.isNavigating}
            />
          </Marker>
        )}

        {/* Navigation Route */}
        {navigationState.isNavigating && navigationState.currentRoute && (
          <Polyline
            coordinates={navigationState.currentRoute.coordinates}
            strokeColor="#007AFF"
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}
      </MapView>

      {/* Parking Details Bottom Sheet */}
      <ParkingDetailsSheet
        parkingSlot={selectedParkingSlot}
        isVisible={isBottomSheetVisible}
        onClose={() => {
          setIsBottomSheetVisible(false);
          setSelectedParkingSlot(null);
        }}
        onNavigate={handleStartNavigation}
        distanceFromUser={selectedParkingSlot ? calculateDistanceToSlot(selectedParkingSlot) : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default CarParkingMap;
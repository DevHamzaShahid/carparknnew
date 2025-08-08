# Car Parking Navigation App

A React Native CLI application with New Architecture support that provides comprehensive car parking navigation functionality for Johar Town, Lahore, Pakistan.

## 🚗 Features

### Core Functionality
- **Live Location Tracking**: Real-time user location with GPS accuracy
- **POV Marker**: Gradient cone SVG icon indicating forward direction with smooth rotation
- **Parking Discovery**: 10 mock parking slots in Johar Town with realistic data
- **Turn-by-Turn Navigation**: Complete routing with ETA, distance, and instructions
- **Smart Camera**: North-up default with user override detection and auto-reset
- **Interactive UI**: Bottom sheet for parking details with swipe gestures

### Parking Data
- **Mock Dataset**: 10 realistic parking slots including:
  - Emporium Mall Parking (500 capacity)
  - MM Alam Road Plaza (150 capacity)
  - Liberty Market Parking (80 capacity)
  - Gulberg Main Boulevard (200 capacity)
  - Pace Shopping Mall (300 capacity)
  - Fortress Stadium (600 capacity)
  - Main Market Gulberg (120 capacity)
  - DHA Y Block Commercial (180 capacity)
  - Gaddafi Stadium (800 capacity)
  - Packages Mall Underground (400 capacity)

### Smart Features
- **Availability Status**: Real-time capacity and availability display
- **Pricing**: Hourly rates in Pakistani Rupees (PKR 20-60/hour)
- **Operating Hours**: 24-hour and scheduled parking options
- **Amenities**: CCTV, security, covered parking, valet service, etc.
- **Distance Calculation**: Real-time distance from user location

### Navigation & Camera
- **Route Rendering**: Visual route display on map
- **Progress Tracking**: Live ETA and remaining distance updates
- **Turn Highlighting**: Camera tilt/zoom when approaching turns (<50m)
- **User Override**: Manual map control with 10-second idle reset
- **Performance Optimized**: Battery-friendly location updates

## 🛠 Setup Instructions

### Prerequisites
- Node.js >= 18
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS)
- Physical device or emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd carparknnew
   git checkout feature/car-parking-navigation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Android Configuration**
   - Add Google Maps API key in `android/app/src/main/AndroidManifest.xml`
   - Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with actual API key

5. **iOS Configuration**
   - Location permissions are pre-configured in `Info.plist`
   - Add Apple Maps API key if using real routing services

### Dependencies
- `react-native-maps`: Map display and markers
- `react-native-geolocation-service`: Location services
- `react-native-orientation-locker`: Device orientation
- `react-native-permissions`: Platform permissions
- `react-native-svg`: SVG icons and markers
- `react-native-gesture-handler`: Bottom sheet gestures
- `@react-native-async-storage/async-storage`: Data persistence

## 🚀 Running the App

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

### Development Mode
```bash
npm start
```

## 📱 Usage Guide

### Basic Navigation
1. **App Launch**: View Johar Town area with 10 parking markers
2. **Location Permission**: Grant location access for navigation features
3. **Parking Selection**: Tap any parking marker to view details
4. **Start Navigation**: Press "Navigate" button in bottom sheet
5. **Follow Route**: Use turn-by-turn instructions in top navigation bar

### Features Testing
- **POV Marker**: Rotate device to see smooth heading updates
- **Camera Control**: Pan/zoom map during navigation, observe auto-reset
- **Route Following**: Move around to see live progress updates
- **Parking Details**: Swipe up/down on bottom sheet

## 🏗 Architecture

### Project Structure
```
src/
├── components/          # React components
│   ├── CarParkingMap.tsx       # Main map component
│   ├── NavigationBar.tsx       # Top navigation UI
│   └── ParkingDetailsSheet.tsx # Bottom sheet
├── services/           # Business logic
│   ├── LocationService.ts      # GPS and permissions
│   ├── OrientationService.ts   # Device orientation
│   └── RoutingService.ts       # Route calculation
├── types/              # TypeScript interfaces
├── data/               # Mock data
├── utils/              # Utilities and icons
│   ├── SvgIcons.tsx           # Custom SVG components
│   └── PerformanceOptimizer.ts # Battery optimization
```

### Key Components

#### CarParkingMap
- Main map container with all functionality
- Integrates location, orientation, and routing services
- Manages camera behavior and user interactions
- Handles navigation state and progress tracking

#### NavigationBar
- Top overlay during navigation
- Shows speed, ETA, distance, turn instructions
- Progress indicator for upcoming turns

#### ParkingDetailsSheet
- Swipeable bottom sheet with parking information
- Displays capacity, pricing, amenities, hours
- Distance calculation from user location

### Services Architecture

#### LocationService
- Singleton pattern for GPS management
- Permission handling for Android/iOS
- Battery-optimized location updates
- Distance and bearing calculations

#### OrientationService
- Device heading detection with smooth easing
- Fallback to GPS-based bearing
- Jitter prevention with smoothing algorithms

#### RoutingService
- Mock route generation for development
- Google Directions API integration ready
- OpenRouteService support
- Route progress calculation

## ⚡ Performance Optimizations

### Battery Efficiency
- **Adaptive Updates**: Reduced frequency when stationary
- **Distance Filtering**: Only update when movement exceeds threshold
- **Smart Throttling**: Orientation and map update limits
- **Memory Management**: Route simplification and history cleanup

### Rendering Optimizations
- **Marker Caching**: `tracksViewChanges={false}` for static markers
- **Throttled Interactions**: Debounced map gesture handling
- **Conditional Rendering**: POV cone only during navigation

## 🧪 Testing

### Complete Flow Testing
1. **App Launch**: Verify parking markers load in Johar Town
2. **Location Permission**: Test permission request flow
3. **User Location**: Confirm blue POV marker appears
4. **Orientation**: Rotate device, verify marker rotation
5. **Parking Selection**: Tap marker, verify bottom sheet
6. **Navigation Start**: Test route drawing and navigation bar
7. **Progress Updates**: Move location, verify live updates
8. **Camera Behavior**: Test manual control and auto-reset
9. **Navigation End**: Complete route, verify cleanup

### Platform Testing
- **Android Emulator**: Test with mock locations
- **iOS Simulator**: Verify in Simulator with simulated location
- **Physical Devices**: Real GPS testing for accuracy

### Edge Cases
- **Permission Denied**: Graceful fallback behavior
- **No GPS Signal**: Indoor/tunnel scenario handling
- **Background Navigation**: App backgrounding during navigation
- **Memory Management**: Long navigation sessions

## 🎨 Customization

### Styling
- Material Design 3 color scheme
- Smooth animations with spring physics
- Dark mode navigation bar
- Accessibility-compliant contrast ratios

### Data Extension
- Add more parking slots in `mockParkingSlots.ts`
- Extend `ParkingSlot` interface for additional amenities
- Configure real routing APIs in `RoutingService`

### API Integration
- Replace mock routing with Google Directions
- Add real-time parking availability APIs
- Integrate payment systems for parking fees

## 📄 License

This project is part of a React Native CLI New Architecture implementation demonstrating advanced navigation features.

## 🤝 Contributing

1. Follow conventional commit messages
2. Test on both Android and iOS
3. Maintain TypeScript strict mode
4. Update documentation for new features

## 📞 Support

For issues with:
- **Maps not loading**: Check API keys and permissions
- **Location not working**: Verify device GPS and app permissions
- **Navigation issues**: Check routing service configuration
- **Performance problems**: Review optimization settings

---

**Note**: This app uses mock data for development. For production use, integrate with real parking APIs and routing services.

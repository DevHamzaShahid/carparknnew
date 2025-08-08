import React from 'react';
import Svg, { 
  Circle, 
  Path, 
  Defs, 
  LinearGradient, 
  Stop, 
  RadialGradient,
  Polygon,
  Text,
  TSpan
} from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

interface POVMarkerProps extends IconProps {
  heading?: number;
  showCone?: boolean;
}

export const POVMarker: React.FC<POVMarkerProps> = ({ 
  size = 40, 
  color = '#007AFF', 
  heading = 0,
  showCone = true 
}) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      style={{
        transform: [{ rotate: `${heading}deg` }],
      }}
    >
      <Defs>
        <RadialGradient id="povGradient" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity="1" />
          <Stop offset="70%" stopColor={color} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </RadialGradient>
        <LinearGradient id="coneGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <Stop offset="50%" stopColor={color} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </LinearGradient>
      </Defs>
      
      {/* POV Cone */}
      {showCone && (
        <Path
          d="M20 8 L10 30 L30 30 Z"
          fill="url(#coneGradient)"
          stroke={color}
          strokeWidth="0.5"
          strokeOpacity="0.7"
        />
      )}
      
      {/* Main dot */}
      <Circle
        cx="20"
        cy="20"
        r="8"
        fill="url(#povGradient)"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
      
      {/* Inner dot */}
      <Circle
        cx="20"
        cy="20"
        r="4"
        fill={color}
      />
      
      {/* Direction arrow */}
      <Path
        d="M20 12 L18 16 L22 16 Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
};

export const ParkingMarker: React.FC<IconProps & { 
  isSelected?: boolean; 
  capacity?: number;
  available?: number;
  price?: number;
}> = ({ 
  size = 32, 
  color = '#4A90E2', 
  isSelected = false,
  capacity = 0,
  available = 0,
  price
}) => {
  const markerColor = isSelected ? '#FF6B35' : color;
  const availabilityRatio = capacity > 0 ? available / capacity : 0;
  
  // Color based on availability
  let statusColor = '#4CAF50'; // Green - Available
  if (availabilityRatio < 0.1) {
    statusColor = '#F44336'; // Red - Full
  } else if (availabilityRatio < 0.3) {
    statusColor = '#FF9800'; // Orange - Almost Full
  }

  return (
    <Svg width={size + 8} height={size + 16} viewBox="0 0 40 48">
      <Defs>
        <RadialGradient id="markerGradient" cx="50%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <Stop offset="70%" stopColor={markerColor} stopOpacity="0.9" />
          <Stop offset="100%" stopColor={markerColor} stopOpacity="1" />
        </RadialGradient>
        <LinearGradient id="shadowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </LinearGradient>
      </Defs>
      
      {/* Shadow */}
      <Circle
        cx="20"
        cy="42"
        rx="12"
        ry="4"
        fill="url(#shadowGradient)"
      />
      
      {/* Main marker pin */}
      <Path
        d="M20 4 C13.373 4 8 9.373 8 16 C8 24 20 36 20 36 S32 24 32 16 C32 9.373 26.627 4 20 4 Z"
        fill="url(#markerGradient)"
        stroke={markerColor}
        strokeWidth="2"
      />
      
      {/* Inner circle for content */}
      <Circle
        cx="20"
        cy="16"
        r="9"
        fill="#FFFFFF"
        stroke={statusColor}
        strokeWidth="2"
      />
      
      {/* Parking icon */}
      <Text
        x="20"
        y="20"
        textAnchor="middle"
        fontSize="12"
        fontWeight="bold"
        fill={markerColor}
      >
        P
      </Text>
      
      {/* Available spots indicator */}
      {available !== undefined && (
        <Circle
          cx="26"
          cy="10"
          r="5"
          fill={statusColor}
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
      )}
      {available !== undefined && (
        <Text
          x="26"
          y="13"
          textAnchor="middle"
          fontSize="7"
          fontWeight="bold"
          fill="#FFFFFF"
        >
          {available > 99 ? '99+' : available}
        </Text>
      )}
    </Svg>
  );
};

export const NavigationArrow: React.FC<IconProps & { direction?: 'left' | 'right' | 'straight' }> = ({
  size = 24,
  color = '#007AFF',
  direction = 'straight'
}) => {
  let path = '';
  
  switch (direction) {
    case 'left':
      path = 'M8 12 L2 6 L8 0 L9.4 1.4 L5.8 5 L22 5 L22 7 L5.8 7 L9.4 10.6 Z';
      break;
    case 'right':
      path = 'M16 12 L22 6 L16 0 L14.6 1.4 L18.2 5 L2 5 L2 7 L18.2 7 L14.6 10.6 Z';
      break;
    default: // straight
      path = 'M12 2 L12 18 M5 11 L12 18 L19 11';
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const SpeedIcon: React.FC<IconProps> = ({ size = 20, color = '#666' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 2 C6.48 2 2 6.48 2 12 S6.48 22 12 22 S22 17.52 22 12 S17.52 2 12 2 Z M12 20 C7.59 20 4 16.41 4 12 S7.59 4 12 4 S20 7.59 20 12 S16.41 20 12 20 Z M15.5 8 L12 12 L8.5 8 Z"
      fill={color}
    />
  </Svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 20, color = '#666' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke={color}
      strokeWidth="2"
    />
    <Path
      d="M12 6 L12 12 L16 14"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export const DistanceIcon: React.FC<IconProps> = ({ size = 20, color = '#666' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M3 12 L21 12 M18 9 L21 12 L18 15"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const LocationIcon: React.FC<IconProps> = ({ size = 20, color = '#666' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M21 10 C21 17 12 23 12 23 S3 17 3 10 A9 9 0 0 1 21 10 Z"
      fill="none"
      stroke={color}
      strokeWidth="2"
    />
    <Circle cx="12" cy="10" r="3" fill={color} />
  </Svg>
);
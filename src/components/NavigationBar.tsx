import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { NavigationArrow, SpeedIcon, ClockIcon, DistanceIcon } from '../utils/SvgIcons';

interface NavigationBarProps {
  isNavigating: boolean;
  currentSpeed?: number; // km/h
  remainingDistance?: number; // meters
  estimatedTimeArrival?: Date;
  nextTurnInstruction?: string;
  nextTurnDistance?: number; // meters
  nextTurnDirection?: 'left' | 'right' | 'straight';
  onEndNavigation?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const NavigationBar: React.FC<NavigationBarProps> = ({
  isNavigating,
  currentSpeed = 0,
  remainingDistance = 0,
  estimatedTimeArrival,
  nextTurnInstruction,
  nextTurnDistance,
  nextTurnDirection = 'straight',
  onEndNavigation,
}) => {
  if (!isNavigating) {
    return null;
  }

  const formatDistance = (distanceInMeters: number): string => {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatSpeed = (speedKmh: number): string => {
    return `${Math.round(speedKmh)} km/h`;
  };

  const getRemainingTime = (): string => {
    if (!estimatedTimeArrival) return '--';
    
    const now = new Date();
    const diffMs = estimatedTimeArrival.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}min`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1a1a1a" barStyle="light-content" />
      
      {/* Main Navigation Info */}
      <View style={styles.mainBar}>
        {/* Next Turn Section */}
        <View style={styles.turnSection}>
          <View style={styles.turnIconContainer}>
            <NavigationArrow 
              direction={nextTurnDirection} 
              color="#FFFFFF" 
              size={28} 
            />
          </View>
          <View style={styles.turnTextContainer}>
            <Text style={styles.turnInstruction} numberOfLines={2}>
              {nextTurnInstruction || 'Continue straight'}
            </Text>
            {nextTurnDistance !== undefined && (
              <Text style={styles.turnDistance}>
                in {formatDistance(nextTurnDistance)}
              </Text>
            )}
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.statusSection}>
          {/* Speed */}
          <View style={styles.statusItem}>
            <SpeedIcon size={16} color="#A0A0A0" />
            <Text style={styles.statusValue}>{formatSpeed(currentSpeed)}</Text>
          </View>

          {/* Distance */}
          <View style={styles.statusItem}>
            <DistanceIcon size={16} color="#A0A0A0" />
            <Text style={styles.statusValue}>{formatDistance(remainingDistance)}</Text>
          </View>

          {/* ETA */}
          <View style={styles.statusItem}>
            <ClockIcon size={16} color="#A0A0A0" />
            <Text style={styles.statusValue}>
              {estimatedTimeArrival ? formatTime(estimatedTimeArrival) : '--:--'}
            </Text>
          </View>

          {/* Remaining Time */}
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>ETA</Text>
            <Text style={styles.statusValue}>{getRemainingTime()}</Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: nextTurnDistance 
                  ? `${Math.min(100, Math.max(10, ((1000 - Math.min(1000, nextTurnDistance)) / 1000) * 100))}%`
                  : '0%'
              }
            ]} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mainBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 80,
  },
  turnSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  turnIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  turnTextContainer: {
    flex: 1,
  },
  turnInstruction: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  turnDistance: {
    color: '#A0A0A0',
    fontSize: 14,
    marginTop: 2,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItem: {
    alignItems: 'center',
    marginLeft: 16,
    minWidth: 45,
  },
  statusLabel: {
    color: '#A0A0A0',
    fontSize: 10,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  statusValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#333333',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 1.5,
  },
});

export default NavigationBar;
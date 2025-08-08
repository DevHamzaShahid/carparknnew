import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  PanResponder,
} from 'react-native';
import { ParkingSlot } from '../types';
import { getAvailableSpots, getParkingStatus } from '../data/mockParkingSlots';
import { LocationIcon, ClockIcon } from '../utils/SvgIcons';

interface ParkingDetailsSheetProps {
  parkingSlot: ParkingSlot | null;
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (slot: ParkingSlot) => void;
  distanceFromUser?: number; // in meters
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.4;
const COLLAPSE_THRESHOLD = SHEET_HEIGHT * 0.3;

export const ParkingDetailsSheet: React.FC<ParkingDetailsSheetProps> = ({
  parkingSlot,
  isVisible,
  onClose,
  onNavigate,
  distanceFromUser,
}) => {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (isVisible && parkingSlot) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: SHEET_HEIGHT,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    }
  }, [isVisible, parkingSlot]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        const newY = Math.max(0, gestureState.dy);
        translateY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > COLLAPSE_THRESHOLD || gestureState.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  if (!parkingSlot) {
    return null;
  }

  const availableSpots = getAvailableSpots(parkingSlot);
  const status = getParkingStatus(parkingSlot);

  const formatDistance = (distanceInMeters: number): string => {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m away`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km away`;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Available':
        return '#4CAF50';
      case 'Busy':
        return '#FF9800';
      case 'Almost Full':
        return '#FF5722';
      case 'Full':
        return '#F44336';
      case 'Closed':
        return '#9E9E9E';
      default:
        return '#4CAF50';
    }
  };

  const getHoursText = (slot: ParkingSlot): string => {
    if (slot.isOpen24Hours) {
      return 'Open 24 hours';
    }
    if (slot.openHours) {
      return `${slot.openHours.open} - ${slot.openHours.close}`;
    }
    return 'Hours not available';
  };

  return (
    <>
      {/* Backdrop */}
      {isVisible && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
      )}

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandle} {...panResponder.panHandlers} />

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{parkingSlot.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                <Text style={styles.statusText}>{status}</Text>
              </View>
            </View>

            {/* Distance */}
            {distanceFromUser && (
              <View style={styles.distanceRow}>
                <LocationIcon size={16} color="#666" />
                <Text style={styles.distanceText}>
                  {formatDistance(distanceFromUser)}
                </Text>
              </View>
            )}

            {/* Capacity Info */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Available</Text>
                <Text style={[styles.infoValue, { color: getStatusColor(status) }]}>
                  {availableSpots} / {parkingSlot.capacity}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Price</Text>
                <Text style={styles.infoValue}>PKR {parkingSlot.hourlyPrice}/hr</Text>
              </View>
            </View>

            {/* Hours */}
            <View style={styles.hoursRow}>
              <ClockIcon size={16} color="#666" />
              <Text style={styles.hoursText}>{getHoursText(parkingSlot)}</Text>
            </View>

            {/* Amenities */}
            {parkingSlot.amenities && parkingSlot.amenities.length > 0 && (
              <View style={styles.amenitiesSection}>
                <Text style={styles.amenitiesTitle}>Amenities</Text>
                <View style={styles.amenitiesContainer}>
                  {parkingSlot.amenities.map((amenity, index) => (
                    <View key={index} style={styles.amenityTag}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.navigateButton}
                onPress={() => onNavigate(parkingSlot)}
                activeOpacity={0.8}
              >
                <Text style={styles.navigateButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
                     </ScrollView>
         </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  sheet: {
    position: 'absolute',
    bottom: -SHEET_HEIGHT,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  distanceText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  hoursText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  amenitiesSection: {
    marginBottom: 24,
  },
  amenitiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  actionButtons: {
    paddingBottom: 20,
  },
  navigateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ParkingDetailsSheet;
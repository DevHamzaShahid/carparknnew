import { ParkingSlot } from '../types';

// Mock parking slots in Johar Town, Lahore, Pakistan
// Coordinates are realistic locations within Johar Town area
export const mockParkingSlots: ParkingSlot[] = [
  {
    id: 'jt001',
    name: 'Emporium Mall Parking',
    coordinates: {
      latitude: 31.4696,
      longitude: 74.2728,
    },
    capacity: 500,
    occupiedSpots: 245,
    hourlyPrice: 50, // PKR per hour
    amenities: ['CCTV', 'Security Guard', 'Covered', 'Wheelchair Access'],
    isOpen24Hours: false,
    openHours: {
      open: '10:00',
      close: '22:00',
    },
  },
  {
    id: 'jt002',
    name: 'MM Alam Road Plaza',
    coordinates: {
      latitude: 31.4659,
      longitude: 74.2734,
    },
    capacity: 150,
    occupiedSpots: 67,
    hourlyPrice: 40,
    amenities: ['CCTV', 'Valet Service'],
    isOpen24Hours: false,
    openHours: {
      open: '09:00',
      close: '23:00',
    },
  },
  {
    id: 'jt003',
    name: 'Liberty Market Parking',
    coordinates: {
      latitude: 31.4672,
      longitude: 74.2701,
    },
    capacity: 80,
    occupiedSpots: 12,
    hourlyPrice: 30,
    amenities: ['Open Air', 'Security Guard'],
    isOpen24Hours: false,
    openHours: {
      open: '08:00',
      close: '21:00',
    },
  },
  {
    id: 'jt004',
    name: 'Gulberg Main Boulevard Parking',
    coordinates: {
      latitude: 31.4681,
      longitude: 74.2745,
    },
    capacity: 200,
    occupiedSpots: 156,
    hourlyPrice: 35,
    amenities: ['CCTV', 'Covered', 'Electric Vehicle Charging'],
    isOpen24Hours: true,
  },
  {
    id: 'jt005',
    name: 'Pace Shopping Mall',
    coordinates: {
      latitude: 31.4643,
      longitude: 74.2798,
    },
    capacity: 300,
    occupiedSpots: 189,
    hourlyPrice: 45,
    amenities: ['CCTV', 'Valet Service', 'Covered', 'Food Court Nearby'],
    isOpen24Hours: false,
    openHours: {
      open: '11:00',
      close: '23:00',
    },
  },
  {
    id: 'jt006',
    name: 'Fortress Stadium Parking',
    coordinates: {
      latitude: 31.4612,
      longitude: 74.2689,
    },
    capacity: 600,
    occupiedSpots: 89,
    hourlyPrice: 25,
    amenities: ['Open Air', 'Large Capacity', 'Event Parking'],
    isOpen24Hours: false,
    openHours: {
      open: '06:00',
      close: '22:00',
    },
  },
  {
    id: 'jt007',
    name: 'Main Market Gulberg Parking',
    coordinates: {
      latitude: 31.4689,
      longitude: 74.2712,
    },
    capacity: 120,
    occupiedSpots: 78,
    hourlyPrice: 35,
    amenities: ['CCTV', 'Security Guard', 'Near Restaurants'],
    isOpen24Hours: false,
    openHours: {
      open: '10:00',
      close: '22:00',
    },
  },
  {
    id: 'jt008',
    name: 'DHA Y Block Commercial',
    coordinates: {
      latitude: 31.4598,
      longitude: 74.2756,
    },
    capacity: 180,
    occupiedSpots: 134,
    hourlyPrice: 60,
    amenities: ['CCTV', 'Covered', 'Premium Location', 'Wheelchair Access'],
    isOpen24Hours: true,
  },
  {
    id: 'jt009',
    name: 'Gaddafi Stadium Parking',
    coordinates: {
      latitude: 31.4565,
      longitude: 74.2668,
    },
    capacity: 800,
    occupiedSpots: 45,
    hourlyPrice: 20,
    amenities: ['Large Capacity', 'Event Parking', 'Open Air'],
    isOpen24Hours: false,
    openHours: {
      open: '05:00',
      close: '23:00',
    },
  },
  {
    id: 'jt010',
    name: 'Packages Mall Underground',
    coordinates: {
      latitude: 31.4624,
      longitude: 74.2812,
    },
    capacity: 400,
    occupiedSpots: 267,
    hourlyPrice: 55,
    amenities: ['Underground', 'Climate Controlled', 'CCTV', 'Valet Service'],
    isOpen24Hours: false,
    openHours: {
      open: '10:00',
      close: '24:00',
    },
  },
];

// Helper function to get available spots
export const getAvailableSpots = (slot: ParkingSlot): number => {
  return slot.capacity - slot.occupiedSpots;
};

// Helper function to check if parking is currently open
export const isParkingOpen = (slot: ParkingSlot): boolean => {
  if (slot.isOpen24Hours) return true;
  
  if (!slot.openHours) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [openHour, openMin] = slot.openHours.open.split(':').map(Number);
  const [closeHour, closeMin] = slot.openHours.close.split(':').map(Number);
  
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  if (closeTime > openTime) {
    return currentTime >= openTime && currentTime <= closeTime;
  } else {
    // Crosses midnight
    return currentTime >= openTime || currentTime <= closeTime;
  }
};

// Helper function to get parking status text
export const getParkingStatus = (slot: ParkingSlot): string => {
  const available = getAvailableSpots(slot);
  const isOpen = isParkingOpen(slot);
  
  if (!isOpen) return 'Closed';
  if (available === 0) return 'Full';
  if (available < 10) return 'Almost Full';
  if (available < slot.capacity * 0.3) return 'Busy';
  return 'Available';
};
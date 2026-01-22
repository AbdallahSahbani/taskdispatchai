import { ZoneCategory, ZoneConfig } from './types';

// Zone to category mapping
export const ZONE_CATEGORY_MAP: Record<string, ZoneCategory> = {
  // Guest Floors
  'floor_1': 'guestFloors',
  'floor_2': 'guestFloors',
  'floor_3_west': 'guestFloors',
  'floor_3_east': 'guestFloors',
  'floor_4_west': 'guestFloors',
  'floor_4_east': 'guestFloors',
  'floor_5': 'guestFloors',
  'floor_6': 'guestFloors',
  'floor_7': 'guestFloors',
  'floor_8': 'guestFloors',
  'floor_9': 'guestFloors',
  'floor_10': 'guestFloors',
  
  // Public Areas
  'lobby': 'publicAreas',
  
  // Outdoor
  'pool_deck': 'outdoor',
  'resort_beach': 'outdoor',
  'outdoor_patio': 'outdoor',
  
  // Food & Beverage
  'restaurant': 'foodBeverage',
  'bar': 'foodBeverage',
  'fine_dining': 'foodBeverage',
  
  // Back of House / Service
  'back_of_house': 'backOfHouse',
  'service_core': 'backOfHouse',
  
  // Utility
  'linen_storage': 'utility',
};

// Zone layout positions with categories
export const ZONE_LAYOUTS: Record<string, ZoneConfig> = {
  // Ground level - outdoor
  'resort_beach': { x: 2, y: 75, width: 18, height: 22, category: 'outdoor', neighbors: ['outdoor_patio', 'lobby'] },
  'outdoor_patio': { x: 22, y: 75, width: 16, height: 22, category: 'outdoor', neighbors: ['resort_beach', 'pool_deck', 'lobby', 'linen_storage'] },
  'pool_deck': { x: 40, y: 75, width: 16, height: 22, category: 'outdoor', neighbors: ['outdoor_patio', 'service_core'] },
  
  // Ground level - indoor
  'lobby': { x: 58, y: 75, width: 20, height: 22, category: 'publicAreas', neighbors: ['resort_beach', 'outdoor_patio', 'bar', 'fine_dining', 'restaurant', 'floor_1'] },
  'bar': { x: 80, y: 75, width: 18, height: 10, category: 'foodBeverage', neighbors: ['lobby', 'fine_dining', 'back_of_house'] },
  'fine_dining': { x: 80, y: 87, width: 18, height: 10, category: 'foodBeverage', neighbors: ['lobby', 'bar', 'restaurant'] },
  'restaurant': { x: 58, y: 62, width: 20, height: 11, category: 'foodBeverage', neighbors: ['lobby', 'fine_dining', 'service_core', 'back_of_house'] },
  
  // Service areas
  'back_of_house': { x: 80, y: 62, width: 18, height: 11, category: 'backOfHouse', neighbors: ['bar', 'restaurant', 'service_core'] },
  'service_core': { x: 40, y: 62, width: 16, height: 11, category: 'backOfHouse', neighbors: ['pool_deck', 'restaurant', 'back_of_house', 'linen_storage', 'floor_1'] },
  'linen_storage': { x: 22, y: 62, width: 16, height: 11, category: 'utility', neighbors: ['outdoor_patio', 'service_core', 'floor_1'] },
  
  // Floors
  'floor_1': { x: 2, y: 50, width: 47, height: 10, category: 'guestFloors', neighbors: ['lobby', 'service_core', 'linen_storage', 'floor_2'] },
  'floor_2': { x: 51, y: 50, width: 47, height: 10, category: 'guestFloors', neighbors: ['floor_1', 'floor_3_west', 'floor_3_east'] },
  'floor_3_west': { x: 2, y: 38, width: 23, height: 10, category: 'guestFloors', neighbors: ['floor_2', 'floor_3_east', 'floor_4_west'] },
  'floor_3_east': { x: 27, y: 38, width: 22, height: 10, category: 'guestFloors', neighbors: ['floor_2', 'floor_3_west', 'floor_4_east'] },
  'floor_4_west': { x: 51, y: 38, width: 23, height: 10, category: 'guestFloors', neighbors: ['floor_3_west', 'floor_4_east', 'floor_5'] },
  'floor_4_east': { x: 76, y: 38, width: 22, height: 10, category: 'guestFloors', neighbors: ['floor_3_east', 'floor_4_west', 'floor_5'] },
  'floor_5': { x: 2, y: 26, width: 47, height: 10, category: 'guestFloors', neighbors: ['floor_4_west', 'floor_4_east', 'floor_6'] },
  'floor_6': { x: 51, y: 26, width: 47, height: 10, category: 'guestFloors', neighbors: ['floor_5', 'floor_7'] },
  'floor_7': { x: 2, y: 14, width: 47, height: 10, category: 'guestFloors', neighbors: ['floor_6', 'floor_8'] },
  'floor_8': { x: 51, y: 14, width: 47, height: 10, category: 'guestFloors', neighbors: ['floor_7', 'floor_9'] },
  'floor_9': { x: 2, y: 2, width: 47, height: 10, category: 'guestFloors', neighbors: ['floor_8', 'floor_10'] },
  'floor_10': { x: 51, y: 2, width: 47, height: 10, category: 'guestFloors', neighbors: ['floor_9'] },
};

// CSS classes for zone categories
export const ZONE_CATEGORY_CLASSES: Record<ZoneCategory, { bg: string; border: string; gradient: string }> = {
  guestFloors: {
    bg: 'bg-zone-floor',
    border: 'border-zone-floor-border',
    gradient: 'bg-gradient-to-br from-zone-floor to-zone-floor-light',
  },
  publicAreas: {
    bg: 'bg-zone-public',
    border: 'border-zone-public-border',
    gradient: 'bg-gradient-to-br from-zone-public to-zone-public-light',
  },
  foodBeverage: {
    bg: 'bg-zone-food',
    border: 'border-zone-food-border',
    gradient: 'bg-gradient-to-br from-zone-food to-zone-food-light',
  },
  backOfHouse: {
    bg: 'bg-zone-service',
    border: 'border-zone-service-border',
    gradient: 'bg-gradient-to-br from-zone-service to-zone-service-light',
  },
  outdoor: {
    bg: 'bg-zone-outdoor',
    border: 'border-zone-outdoor-border',
    gradient: 'bg-gradient-to-br from-zone-outdoor to-zone-outdoor-light',
  },
  utility: {
    bg: 'bg-zone-utility',
    border: 'border-zone-utility-border',
    gradient: 'bg-gradient-to-br from-zone-utility to-zone-utility-light',
  },
};

// Generate consistent color from ID for worker avatars
export function generateColorFromId(id: string): string {
  const colors = [
    'hsl(217, 91%, 60%)',  // Blue
    'hsl(271, 81%, 56%)',  // Purple
    'hsl(330, 81%, 60%)',  // Pink
    'hsl(160, 84%, 39%)',  // Emerald
    'hsl(38, 92%, 50%)',   // Amber
    'hsl(188, 94%, 43%)',  // Cyan
    'hsl(0, 84%, 60%)',    // Red
    'hsl(84, 81%, 44%)',   // Lime
  ];
  
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

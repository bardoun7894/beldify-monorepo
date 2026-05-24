import { useState, useCallback } from 'react';

/**
 * Color Namer Utility
 * Converts hex color codes to human-readable color names
 */

// Basic color name mapping - this can be expanded with more colors
interface ColorMap {
  [key: string]: string;
}

// RGB color for nearest neighbor calculation
interface RGB {
  r: number;
  g: number;
  b: number;
}

// Base color mapping (common colors)
const BASE_COLORS: ColorMap = {
  '#000000': 'Black',
  '#FFFFFF': 'White',
  '#FF0000': 'Red',
  '#00FF00': 'Green',
  '#0000FF': 'Blue',
  '#FFFF00': 'Yellow',
  '#00FFFF': 'Cyan',
  '#FF00FF': 'Magenta',
  '#C0C0C0': 'Silver',
  '#808080': 'Gray',
  '#800000': 'Maroon',
  '#808000': 'Olive',
  '#008000': 'Green',
  '#800080': 'Purple',
  '#008080': 'Teal',
  '#000080': 'Navy',
  '#FFA500': 'Orange',
  '#A52A2A': 'Brown',
  '#FFC0CB': 'Pink',
  '#F5F5DC': 'Beige',
  '#E6E6FA': 'Lavender',
  '#D3D3D3': 'Light Gray',
  '#FFFAF0': 'Floral White',
  '#F0E68C': 'Khaki',
  '#ADD8E6': 'Light Blue',
  '#98FB98': 'Pale Green',
  '#DDA0DD': 'Plum',
  '#FAFAD2': 'Light Goldenrod',
  '#CD853F': 'Peru',
  '#FFF8DC': 'Cornsilk',
  '#FAEBD7': 'Antique White',
  '#FAF0E6': 'Linen',
  '#F5DEB3': 'Wheat',
  '#FFE4C4': 'Bisque',
  '#FFE4B5': 'Moccasin',
  '#F5F5F5': 'White Smoke',
  '#E0FFFF': 'Light Cyan',
  '#F0FFFF': 'Azure',
  '#F0F8FF': 'Alice Blue',
};

// Extended color mapping with more specific names
const EXTENDED_COLORS: ColorMap = {
  // Reds
  '#8B0000': 'Dark Red',
  '#FF6347': 'Tomato',
  '#FF4500': 'Orange Red',
  '#DC143C': 'Crimson',
  '#B22222': 'Fire Brick',
  '#CD5C5C': 'Indian Red',
  '#F08080': 'Light Coral',
  '#E9967A': 'Dark Salmon',
  '#FA8072': 'Salmon',
  '#FFA07A': 'Light Salmon',
  
  // Pinks
  '#FF69B4': 'Hot Pink',
  '#FF1493': 'Deep Pink',
  '#DB7093': 'Pale Violet Red',
  '#C71585': 'Medium Violet Red',
  
  // Oranges/Browns
  '#FF8C00': 'Dark Orange',
  '#FF7F50': 'Coral',
  '#F4A460': 'Sandy Brown',
  '#D2691E': 'Chocolate',
  '#8B4513': 'Saddle Brown',
  '#A0522D': 'Sienna',
  
  // Yellows
  '#FFD700': 'Gold',
  '#FFFFE0': 'Light Yellow',
  '#FFFACD': 'Lemon Chiffon',
  '#EEE8AA': 'Pale Goldenrod',
  '#BDB76B': 'Dark Khaki',
  
  // Greens
  '#006400': 'Dark Green',
  '#228B22': 'Forest Green',
  '#32CD32': 'Lime Green',
  '#90EE90': 'Light Green',
  '#7FFF00': 'Chartreuse',
  '#7CFC00': 'Lawn Green',
  '#ADFF2F': 'Green Yellow',
  '#9ACD32': 'Yellow Green',
  '#00FA9A': 'Medium Spring Green',
  '#00FF7F': 'Spring Green',
  '#3CB371': 'Medium Sea Green',
  '#2E8B57': 'Sea Green',
  '#8FBC8F': 'Dark Sea Green',
  '#66CDAA': 'Medium Aquamarine',
  '#7FFFD4': 'Aquamarine',
  
  // Cyans
  '#5F9EA0': 'Cadet Blue',
  '#E0FFFF': 'Light Cyan',
  '#AFEEEE': 'Pale Turquoise',
  '#40E0D0': 'Turquoise',
  '#48D1CC': 'Medium Turquoise',
  '#00CED1': 'Dark Turquoise',
  '#20B2AA': 'Light Sea Green',
  
  // Blues
  '#191970': 'Midnight Blue',
  '#00008B': 'Dark Blue',
  '#0000CD': 'Medium Blue',
  '#4169E1': 'Royal Blue',
  '#4682B4': 'Steel Blue',
  '#1E90FF': 'Dodger Blue',
  '#00BFFF': 'Deep Sky Blue',
  '#87CEEB': 'Sky Blue',
  '#87CEFA': 'Light Sky Blue',
  '#B0C4DE': 'Light Steel Blue',
  '#6495ED': 'Cornflower Blue',
  
  // Purples/Violets
  '#4B0082': 'Indigo',
  '#8A2BE2': 'Blue Violet',
  '#9370DB': 'Medium Purple',
  '#7B68EE': 'Medium Slate Blue',
  '#6A5ACD': 'Slate Blue',
  '#483D8B': 'Dark Slate Blue',
  '#9932CC': 'Dark Orchid',
  '#9400D3': 'Dark Violet',
  '#8B008B': 'Dark Magenta',
  '#BA55D3': 'Medium Orchid',
  '#DA70D6': 'Orchid',
  '#EE82EE': 'Violet',
  '#D8BFD8': 'Thistle',
  '#DDA0DD': 'Plum',
  
  // Whites
  '#FFF5EE': 'Seashell',
  '#F5FFFA': 'Mint Cream',
  '#F8F8FF': 'Ghost White',
  '#FFFFF0': 'Ivory',
  '#FFFAFA': 'Snow',
  '#F0FFF0': 'Honeydew',
  
  // Grays
  '#696969': 'Dim Gray',
  '#A9A9A9': 'Dark Gray',
  '#DCDCDC': 'Gainsboro',
  '#2F4F4F': 'Dark Slate Gray',
  '#708090': 'Slate Gray',
  '#778899': 'Light Slate Gray',
};

// Combine color maps
const COLOR_MAP: ColorMap = {
  ...BASE_COLORS,
  ...EXTENDED_COLORS,
};

/**
 * Convert hex to RGB
 */
const hexToRgb = (hex: string): RGB | null => {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex
  if (hex.length === 3) {
    // Convert 3-character hex to 6-character
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Validate hex format
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  
  // Convert to RGB values
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
};

/**
 * Calculate color distance using Euclidean distance in RGB space
 */
const colorDistance = (color1: RGB, color2: RGB): number => {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) +
    Math.pow(color1.b - color2.b, 2)
  );
};

/**
 * Find the nearest named color for a given hex
 */
const findNearestColor = (hex: string): { name: string, hex: string } => {
  // Normalize hex format
  hex = hex.toUpperCase();
  if (!hex.startsWith('#')) {
    hex = `#${hex}`;
  }
  
  // Check if exact match exists
  if (COLOR_MAP[hex]) {
    return { name: COLOR_MAP[hex], hex };
  }
  
  // Convert target color to RGB
  const targetRgb = hexToRgb(hex);
  if (!targetRgb) {
    return { name: 'Unknown', hex };
  }
  
  // Find the closest color match
  let closestDistance = Number.MAX_VALUE;
  let closestColor = '';
  let closestHex = '';
  
  Object.entries(COLOR_MAP).forEach(([colorHex, colorName]) => {
    const rgb = hexToRgb(colorHex);
    if (rgb) {
      const distance = colorDistance(targetRgb, rgb);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestColor = colorName;
        closestHex = colorHex;
      }
    }
  });
  
  return { name: closestColor || 'Unknown', hex: closestHex || hex };
};

/**
 * Main function to get color name from hex
 */
export const getColorName = (hex: string): string => {
  try {
    const { name } = findNearestColor(hex);
    return name;
  } catch (error) {
    console.error('Error finding color name:', error);
    return 'Unknown';
  }
};

/**
 * Get color name and the hex code
 */
export const getColorInfo = (hex: string): { name: string, hex: string } => {
  try {
    return findNearestColor(hex);
  } catch (error) {
    console.error('Error finding color info:', error);
    return { name: 'Unknown', hex };
  }
};

/**
 * Check if a color is light or dark to determine appropriate text color
 * Returns true if the color is light, false if it's dark
 */
export const isLightColor = (hex: string): boolean => {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;
  
  // Calculate relative luminance
  // Formula: 0.299*R + 0.587*G + 0.114*B
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  // Return true if color is light (luminance > 0.5), false otherwise
  return luminance > 0.5;
};

// Cache for color names to avoid repeated API calls
const colorNameCache: Record<string, string> = {};

// Function to get color name from The Color API with caching
export const getColorNameFromAPI = async (hexCode: string): Promise<string> => {
  // Remove # if present and normalize to lowercase
  const hex = hexCode.replace('#', '').toLowerCase();
  
  // Return from cache if available
  if (colorNameCache[hex]) {
    return colorNameCache[hex];
  }
  
  try {
    const response = await fetch(`https://www.thecolorapi.com/id?hex=${hex}`);
    const data = await response.json();
    
    // Save result to cache
    colorNameCache[hex] = data.name.value;
    
    // Return the color name
    return data.name.value;
  } catch (error) {
    console.error('Error fetching color name:', error);
    // Fallback to local function if API fails
    const fallbackName = getColorName(hexCode);
    colorNameCache[hex] = fallbackName;
    return fallbackName;
  }
};

// React hook for lazy loading color names
export const useLazyColorName = (hexCode: string | null | undefined) => {
  const [colorName, setColorName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Function to load color name on demand
  const loadColorName = useCallback(async () => {
    if (!hexCode) {
      setColorName('');
      return;
    }
    
    // Set loading state
    setIsLoading(true);
    
    try {
      const name = await getColorNameFromAPI(hexCode);
      setColorName(name);
    } catch (error) {
      console.error('Failed to load color name:', error);
      // Fallback to simple name
      setColorName(getColorName(hexCode));
    } finally {
      setIsLoading(false);
    }
  }, [hexCode]);
  
  return { colorName, isLoading, loadColorName };
};

// Create a named constant for the exports
const colorUtils = {
  getColorName,
  getColorNameFromAPI,
  useLazyColorName,
  getColorInfo,
  isLightColor
};

export default colorUtils;

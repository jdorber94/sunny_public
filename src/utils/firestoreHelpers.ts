/**
 * Utility functions for working with Firestore
 */

/**
 * Removes undefined, null, and empty string values from an object
 * to make it safe for Firestore storage
 */
export function cleanForFirestore<T extends Record<string, any>>(obj: T): Partial<T> {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  
  return Object.entries(obj).reduce((cleaned, [key, value]) => {
    // Skip undefined and null values
    if (value === undefined || value === null) {
      return cleaned;
    }
    
    // Skip empty strings
    if (typeof value === 'string' && value.trim() === '') {
      return cleaned;
    }
    
    // Handle arrays - filter out undefined/null values
    if (Array.isArray(value)) {
      const cleanedArray = value.filter(item => item !== undefined && item !== null);
      if (cleanedArray.length > 0) {
        cleaned[key as keyof T] = cleanedArray as any;
      }
      return cleaned;
    }
    
    // Handle nested objects
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      const cleanedNested = cleanForFirestore(value);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key as keyof T] = cleanedNested as any;
      }
      return cleaned;
    }
    
    // Include all other values
    cleaned[key as keyof T] = value;
    return cleaned;
  }, {} as Partial<T>);
}

/**
 * Ensures an object has required fields for Firestore
 * by providing default values for missing fields
 */
export function ensureRequiredFields<T extends Record<string, any>>(
  obj: T, 
  requiredFields: Record<string, any>
): T {
  return {
    ...requiredFields,
    ...obj
  };
} 
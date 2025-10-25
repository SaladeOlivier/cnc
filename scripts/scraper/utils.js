import { parse, format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Generate a slug from a string for use in IDs
 * Handles case, accents, special characters, and extra whitespace
 */
export function slugify(text) {
  return text
    .trim()                           // Remove leading/trailing whitespace
    .toLowerCase()                    // Convert to lowercase
    .normalize('NFD')                 // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '')  // Remove accents
    .replace(/['\u2019]/g, '')        // Remove apostrophes and smart quotes
    .replace(/[^a-z0-9]+/g, '-')      // Replace non-alphanumeric with single -
    .replace(/^-+|-+$/g, '');         // Remove leading/trailing -
}

/**
 * Normalize a name for consistent storage
 * Preserves the original casing but normalizes accents and whitespace
 */
export function normalizeName(name) {
  return name
    .trim()
    .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
    .normalize('NFC');      // Use composed form for accents (é instead of e + combining accent)
}

/**
 * Convert French date format to ISO date
 */
export function parseFrenchDate(frenchDate) {
  if (!frenchDate) return null;

  try {
    // Try to parse French date format like "15 décembre 2022" or "3 juillet 2025"
    // date-fns format: d = day (1-31), MMMM = full month name, yyyy = 4-digit year
    const parsedDate = parse(frenchDate.trim(), 'd MMMM yyyy', new Date(), { locale: fr });

    // Check if the date is valid
    if (!isValid(parsedDate)) {
      console.warn(`⚠️  Could not parse date: "${frenchDate}"`);
      return frenchDate; // Return as-is if parsing fails
    }

    // Return in ISO format (YYYY-MM-DD)
    return format(parsedDate, 'yyyy-MM-dd');
  } catch (error) {
    console.warn(`⚠️  Error parsing date "${frenchDate}":`, error.message);
    return frenchDate; // Return as-is if parsing fails
  }
}

/**
 * Split talent names by comma or "et" (and)
 * Examples:
 *   "Leslie Menahem et Julie Joseph" → ["Leslie Menahem", "Julie Joseph"]
 *   "Thomas Métivier, Camille Fievez, Ambroise Carminati" → ["Thomas Métivier", "Camille Fievez", "Ambroise Carminati"]
 */
export function splitTalentNames(talentString) {
  if (!talentString || talentString.trim() === '') return [];

  // Split by comma first, then split each part by " et "
  const parts = talentString.split(',').flatMap(part => {
    // Split by " et " (French "and")
    return part.split(/\s+et\s+/i);
  });

  // Clean up and filter empty strings
  return parts
    .map(name => name.trim())
    .filter(name => name.length > 0);
}

/**
 * Helper to delay between requests
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

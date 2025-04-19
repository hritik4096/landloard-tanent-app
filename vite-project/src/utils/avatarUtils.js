/**
 * Utility functions for generating consistent user avatars across the application
 */

/**
 * Available avatar styles
 */
export const AVATAR_STYLES = [
  { id: 'avataaars', name: 'Professional', colors: ['b6e3f4,c0aede,d1d4f9', 'ffd5dc,ffdfbf,ffffbf', 'ffdfbf,ffd5dc,d1d4f9'] },
  { id: 'micah', name: 'Minimalist', colors: ['b6e3f4,c0aede,d1d4f9', 'ffd5dc,ffdfbf,ffffbf', 'a0d2db,bee5bf,eef0d5'] },
  { id: 'bottts', name: 'Robot', colors: ['ffdfbf,ffd5dc,d1d4f9', 'a0d2db,bee5bf,eef0d5', 'c0aede,d1d4f9,ffd5dc'] },
  { id: 'pixel-art', name: 'Pixel', colors: ['b6e3f4,c0aede,d1d4f9', 'ffdfbf,ffd5dc,d1d4f9', 'a0d2db,bee5bf,eef0d5'] },
  { id: 'lorelei', name: 'Cartoon', colors: ['b6e3f4,c0aede,d1d4f9', 'ffd5dc,ffdfbf,ffffbf', 'a0d2db,bee5bf,eef0d5'] }
];

/**
 * Gets user avatar preferences or default values
 * @param {Object} user - User object
 * @returns {Object} Avatar preferences
 */
export const getUserAvatarPreferences = (user) => {
  const defaultPrefs = {
    style: 'avataaars',
    colorSet: 0,
    radius: 50
  };

  if (!user) return defaultPrefs;

  try {
    // Try to get saved preferences from user object
    if (user.avatarPrefs) {
      return {
        ...defaultPrefs,
        ...user.avatarPrefs
      };
    }
    
    // Check if preferences are stored in localStorage
    const savedPrefs = localStorage.getItem(`avatar_prefs_${user.email || user._id}`);
    if (savedPrefs) {
      return {
        ...defaultPrefs,
        ...JSON.parse(savedPrefs)
      };
    }
  } catch (err) {
    console.error('Error parsing avatar preferences:', err);
  }

  return defaultPrefs;
};

/**
 * Saves user avatar preferences
 * @param {Object} user - User object
 * @param {Object} prefs - Avatar preferences to save
 */
export const saveUserAvatarPreferences = (user, prefs) => {
  if (!user || !user.email) return;
  
  try {
    localStorage.setItem(
      `avatar_prefs_${user.email || user._id}`,
      JSON.stringify(prefs)
    );
  } catch (err) {
    console.error('Error saving avatar preferences:', err);
  }
};

/**
 * Generates a consistent avatar URL for a user based on their ID or email and preferences
 * @param {Object|string} user - User object or user identifier 
 * @param {Object} overridePrefs - Optional override preferences
 * @returns {string} URL for the user's avatar
 */
export const generateAvatarUrl = (user, overridePrefs = null) => {
  // If user is null/undefined, return a default random avatar
  if (!user) {
    return `https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff`;
  }

  // Get the seed based on user data
  let seed;
  let name = '';
  if (typeof user === 'object') {
    // Get a stable seed from user data (prefer _id, then email, then name)
    seed = user._id || user.email || user.name || 'default';
    name = user.name || user.email || 'User';
    
    // Make sure seed is clean and URL-friendly
    seed = encodeURIComponent(String(seed).trim());
  } else {
    // If user is a string (ID, email or name), use it directly
    seed = encodeURIComponent(String(user).trim());
    name = user;
  }

  // Get user preferences (or use overrides if provided)
  const prefs = overridePrefs || getUserAvatarPreferences(user);
  
  // Instead of using DiceBear which might be causing issues,
  // let's use UI Avatars which is more reliable for initials-based avatars
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=256`;
};

/**
 * Get initials from user name (for fallback)
 * @param {Object} user - User object
 * @returns {string} User's initials
 */
export const getUserInitials = (user) => {
  if (!user || (!user.name && !user.email)) return '?';
  
  if (user.name) {
    const nameParts = user.name.split(' ').filter(Boolean);
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return user.name[0].toUpperCase();
  }
  
  // Fallback to email
  if (user.email) {
    return user.email[0].toUpperCase();
  }
  
  return '?';
};
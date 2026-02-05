/**
 * Font configuration for Sign-Lingo app
 * 
 * Nunito Bold (700): For headings and emphasized text
 * Nunito Regular (400): For body text and normal content
 */

export const Fonts = {
  // For headings and emphasized text
  bold: {
    fontFamily: 'Nunito-Bold',
  },
  
  // For regular body text
  regular: {
    fontFamily: 'Nunito-Regular',
  },
  
  // Legacy aliases for compatibility
  appName: {
    fontFamily: 'Nunito-Bold',
  },
  
  light: {
    fontFamily: 'Nunito-Regular',
  },
};

// Helper function to get font style
export const getFontStyle = (type: 'bold' | 'regular' | 'appName' | 'light' = 'regular') => {
  return Fonts[type];
};

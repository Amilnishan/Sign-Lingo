/**
 * Font configuration for Sign-Lingo app
 * 
 * App Name: Nunito SemiBold 700 (Bold)
 * Other Texts: Nunito SemiBold 600 (Medium)
 */

export const Fonts = {
  // For app name and main headings
  appName: {
    fontFamily: 'Nunito-Bold',
    fontWeight: '700' as const,
  },
  
  // For other texts (regular content)
  regular: {
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600' as const,
  },
  
  // For smaller text or descriptions
  light: {
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600' as const,
  },
};

// Helper function to get font style
export const getFontStyle = (type: 'appName' | 'regular' | 'light' = 'regular') => {
  return Fonts[type];
};

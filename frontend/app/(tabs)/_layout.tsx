import { Tabs } from 'expo-router';
import React from 'react';
import { View, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { AppColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Import icons
const icons = {
  home: require('../../assets/images/home.png'),
  leaderboard: require('../../assets/images/medal.png'),
  quest: require('../../assets/images/target.png'),
  profile: require('../../assets/images/user.png'),
};

// Custom Tab Icon Component
function TabIcon({ icon, focused }: { icon: any; focused: boolean }) {
  return (
    <View style={{ 
      alignItems: 'center', 
      justifyContent: 'center', 
      paddingTop: 5,
      backgroundColor: focused ? AppColors.primaryLight : 'transparent',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 8,
    }}>
      <Image 
        source={icon} 
        style={{ 
          width: 26, 
          height: 26, 
          opacity: focused ? 1 : 0.5,
        }} 
        resizeMode="contain"
      />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: AppColors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: AppColors.cardBackground,
          borderTopWidth: 0,
          height: 70 + insets.bottom,
          paddingTop: 10,
          paddingBottom: 10 + insets.bottom,
          shadowColor: AppColors.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon={icons.home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ focused }) => <TabIcon icon={icons.leaderboard} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="daily-quest"
        options={{
          title: 'Daily Quest',
          tabBarIcon: ({ focused }) => <TabIcon icon={icons.quest} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon icon={icons.profile} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

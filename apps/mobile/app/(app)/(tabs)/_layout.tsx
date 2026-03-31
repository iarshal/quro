/**
 * App Tabs Layout — Main navigation
 * Tabs: Chats | Scanner | Contacts | Profile
 */

import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '@quro/ui';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.brand,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.bg,
          borderTopColor: 'rgba(0,0,0,0.06)',
          borderTopWidth: 0.5,
          paddingBottom: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Inter-Medium',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <ChatIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ focused }) => (
            <ScannerTabIcon focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, focused }) => (
            <ContactsIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, focused }) => (
            <ProfileIcon color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

// ── Tab Icons ─────────────────────────────────────────────────────────────────

function ChatIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      {/* Speech bubble */}
      <View style={[styles.iconBase, { borderColor: color, borderWidth: focused ? 2 : 1.5 }]} />
    </View>
  );
}

/**
 * Scanner tab — the Soft Apricot circle CTA.
 * Slightly larger than other tabs to draw the eye — like WeChat's QR scanner.
 */
function ScannerTabIcon({ focused }: { focused: boolean }) {
  return (
    <View
      style={[
        styles.scannerTabIcon,
        { backgroundColor: focused ? COLORS.brandDark : COLORS.brand },
      ]}
    >
      <View style={styles.scannerQRInner} />
    </View>
  );
}

function ContactsIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.personHead, { borderColor: color, borderWidth: focused ? 2 : 1.5 }]} />
    </View>
  );
}

function ProfileIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.meCircle, { borderColor: color, borderWidth: focused ? 2 : 1.5 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconBase: {
    width: 22,
    height: 18,
    borderRadius: 5,
  },

  scannerTabIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  scannerQRInner: {
    width: 18,
    height: 18,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    borderRadius: 3,
  },

  personHead: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  meCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

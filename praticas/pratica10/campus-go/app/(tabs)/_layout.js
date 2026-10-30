import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { themes } from '../../constants/theme';

export default function TabsLayout() {
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return <Tabs screenOptions={{
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.text,
    tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.secondary,
  }}>
    <Tabs.Screen name="index" options={{ title: 'Início',
      tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="tasks" options={{ title: 'Tarefas',
      tabBarIcon: ({ color, size }) => <Ionicons name="checkbox-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="wallet" options={{ title: 'Bolso',
      tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'Perfil',
      tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
  </Tabs>;
}

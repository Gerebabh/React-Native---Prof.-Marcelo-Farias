import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themes } from '../constants/theme';

export default function IconButton({ icon, label, onPress }) {
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
    style={({ pressed }) => [styles.button, pressed && { opacity: 0.6 }]}>
    <Ionicons name={icon} size={24} color={colors.primary} />
  </Pressable>;
}
const styles = StyleSheet.create({ button: { padding: 12 } });

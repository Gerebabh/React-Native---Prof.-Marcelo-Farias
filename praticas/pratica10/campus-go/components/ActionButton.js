import { Pressable, StyleSheet, Text, useColorScheme } from 'react-native';
import { themes } from '../constants/theme';

export default function ActionButton({ title, onPress, disabled = false }) {
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
    accessibilityState={{ disabled }} android_ripple={{ color: colors.primary }}
    style={({ pressed }) => [styles.button, { backgroundColor: colors.selected },
      (pressed || disabled) && styles.pressed]}>
    <Text style={[styles.text, { color: colors.selectedText }]}>{title}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { padding: 14, borderRadius: 8, alignItems: 'center', overflow: 'hidden' },
  text: { fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});

import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { CATEGORIES, themes } from '../constants/theme';

export default function CategoriaFiltro({ category, onSelect }) {
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return <View style={styles.container}>
    {['Todas', ...CATEGORIES].map(item => <Pressable key={item} onPress={() => onSelect(item)}
      accessibilityRole="button" accessibilityState={{ selected: category === item }}
      style={[styles.button, { backgroundColor: category === item ? colors.selected : colors.surface }]}>
      <Text style={{ color: category === item ? colors.selectedText : colors.text }}>{item}</Text>
    </Pressable>)}
  </View>;
}
const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
  button: { padding: 10, borderRadius: 8 },
});

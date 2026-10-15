import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

export default function IconButton({ icon, onPress }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Adicionar despesa"
    style={({ pressed }) => [styles.botao, pressed && { opacity: 0.6 }]}>
    <Ionicons name={icon} size={24} color={colors.black} />
  </Pressable>;
}
const styles = StyleSheet.create({ botao: { padding: 12 } });

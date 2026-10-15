import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function IconButton({ icon, size, color, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={icon === 'add' ? 'Adicionar despesa' : icon}
      style={({ pressed }) => pressed && styles.pressionado}
    >
      <View style={styles.botao}>
        <Ionicons name={icon} size={size} color={color} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    padding: 10,
  },
  pressionado: {
    opacity: 0.5,
  },
});

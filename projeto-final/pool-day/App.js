import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Pool Day</Text>
      <Text style={styles.subtitulo}>Tratamento de piscinas</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitulo: {
    color: '#666',
    fontSize: 16,
    marginTop: 8,
  },
});

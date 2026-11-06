import { FlatList, StyleSheet, Text, View } from 'react-native';

export default function VisitasLista({ visitas }) {
  if (visitas.length === 0) {
    return <Text style={styles.vazio}>Nenhuma visita programada.</Text>;
  }

  return (
    <FlatList
      data={visitas}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <View style={styles.cartao}>
          <Text style={styles.data}>{item.data}</Text>
          <Text style={styles.orientacao}>{item.local}</Text>
          <Text style={styles.servico}>{item.servico}</Text>
          {item.orientacao ? <Text style={styles.orientacao}>{item.orientacao}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  vazio: { color: '#526168', fontSize: 15, marginTop: 8 },
  cartao: { backgroundColor: '#fff', borderRadius: 10, marginTop: 10, padding: 16 },
  data: { color: '#526168', fontSize: 14 },
  servico: { color: '#123b4a', fontSize: 17, fontWeight: '600', marginTop: 4 },
  orientacao: { color: '#526168', fontSize: 15, marginTop: 6 },
});

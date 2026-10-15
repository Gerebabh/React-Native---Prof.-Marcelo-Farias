import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CategoriaSeletor from '../components/CategoriaSeletor';
import DespesaSaida from '../components/despesa/DespesaSaida';
import { colors } from '../styles/colors';
import { filtrarRecentes } from '../utils/data';

export default function DespesasRecentes({ despesas }) {
  const [categoria, setCategoria] = useState('Todas');
  const lista = filtrarRecentes(despesas);
  const despesasFiltradas = lista.filter(item => categoria === 'Todas' || item.categoria === categoria);
  return <View style={styles.container}>
    <Text>Filtrar por categoria</Text>
    <CategoriaSeletor categoria={categoria} onSelect={setCategoria} filtro />
    <DespesaSaida despesas={despesasFiltradas} periodo="Últimos 7 dias" />
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 20, backgroundColor: colors.white } });

import { useState } from 'react';
import { Alert, Button, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import CategoriaSeletor from '../components/CategoriaSeletor';
import { getDataFormatada } from '../utils/data';
import { colors } from '../styles/colors';

export default function GerenciarDespesa({ route, navigation, despesas, onAdd, onEdit, onDelete }) {
  const despesaId = route.params?.despesaId;
  const selecionada = despesas.find(item => item.id === despesaId);
  const [descricao, setDescricao] = useState(selecionada?.descricao || '');
  const [valor, setValor] = useState(selecionada ? selecionada.valor.toFixed(2) : '');
  const [data, setData] = useState(selecionada?.data || new Date());
  const [categoria, setCategoria] = useState(selecionada?.categoria || '');
  const [showPicker, setShowPicker] = useState(false);

  function tratarValor(texto) {
    const numero = texto.replace(',', '.');
    if (/^\d*\.?\d{0,2}$/.test(numero)) setValor(numero);
  }

  function alterarData(evento, dataSelecionada) {
    setShowPicker(Platform.OS === 'ios');
    if (evento.type === 'set' && dataSelecionada) setData(dataSelecionada);
  }

  function salvarDespesa() {
    const valorNumerico = Number(valor);
    if (!descricao.trim() || !valor.trim() || !Number.isFinite(valorNumerico) || valorNumerico <= 0 || !categoria) {
      Alert.alert('Atenção', 'Preencha a descrição, um valor maior que zero e a categoria.');
      return;
    }
    const dados = { descricao: descricao.trim(), valor: valorNumerico, data, categoria };
    if (despesaId) onEdit(despesaId, dados);
    else onAdd(dados);
    navigation.goBack();
  }

  function excluirDespesa() {
    Alert.alert('Excluir despesa', 'Deseja excluir esta despesa?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => {
        onDelete(despesaId);
        navigation.goBack();
      } },
    ]);
  }

  return <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView contentContainerStyle={styles.formulario} keyboardShouldPersistTaps="handled">
      <Text style={styles.rotulo}>Descrição</Text>
      <TextInput style={styles.input} value={descricao} onChangeText={setDescricao} placeholder="Ex.: Almoço" />
      <Text style={styles.rotulo}>Valor (R$)</Text>
      <TextInput style={styles.input} value={valor} onChangeText={tratarValor} keyboardType="decimal-pad" placeholder="0.00" />
      <Text style={styles.rotulo}>Data</Text>
      <Pressable style={styles.input} onPress={() => setShowPicker(true)}>
        <Text>{getDataFormatada(data)}</Text>
      </Pressable>
      {showPicker && <DateTimePicker value={data} mode="date" onChange={alterarData} />}
      {showPicker && Platform.OS === 'ios' && <Button title="Concluir data" onPress={() => setShowPicker(false)} />}
      <Text style={styles.rotulo}>Categoria</Text>
      <CategoriaSeletor categoria={categoria} onSelect={setCategoria} />
      <View style={styles.botao}><Button title="Salvar" color={colors.orange} onPress={salvarDespesa} /></View>
      <View style={styles.botao}><Button title="Cancelar" color={colors.black} onPress={() => navigation.goBack()} /></View>
      {!!despesaId && <View style={styles.botao}><Button title="Excluir" color={colors.red} onPress={excluirDespesa} /></View>}
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  formulario: { padding: 20 },
  rotulo: { fontSize: 16, fontWeight: '500', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, color: colors.black },
  botao: { marginTop: 12 },
});

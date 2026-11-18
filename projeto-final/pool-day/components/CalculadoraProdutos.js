import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { cores } from '../styles/colors';
import { unidadesDaDose } from '../services/unidades';
import { calcularQuantidadeParaPiscina } from '../services/calculadoraProdutos';

export default function CalculadoraProdutos({ produtos }) {
  const [produtoId, setProdutoId] = useState('');
  const [doseRotulo, setDoseRotulo] = useState('');
  const [litragemPiscina, setLitragemPiscina] = useState('');
  const [unidade, setUnidade] = useState('');
  const [resultado, setResultado] = useState(null);

  function selecionarProduto(id) {
    setProdutoId(id);
    const produto = produtos.find((item) => item.id === id);
    setUnidade(unidadesDaDose(produto?.unidade)[0] || '');
    setDoseRotulo('');
    setLitragemPiscina('');
    setResultado(null);
  }

  function calcular() {
    const quantidade = calcularQuantidadeParaPiscina(doseRotulo, 1000, litragemPiscina);
    const produto = produtos.find((item) => item.id === produtoId);
    if (!produtoId || !produto || quantidade === null || !unidade) {
      setResultado(null);
      Alert.alert('Dados incompletos', 'Informe o produto, a dose do rótulo e a litragem da piscina.');
      return;
    }
    setResultado(quantidade);
  }

  const unidades = unidadesDaDose(produtos.find((item) => item.id === produtoId)?.unidade);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Calculadora de tratamento de choque</Text>
      <Text style={styles.instrucao}>Use a dose indicada no rótulo para cada 1.000 L e informe a litragem da piscina.</Text>
      {produtos.length === 0 ? (
        <Text style={styles.aviso}>Cadastre um produto no estoque para usar a calculadora.</Text>
      ) : (
        <>
          <Text style={styles.rotulo}>Produto</Text>
          <View style={styles.seletor}>
            <Picker accessibilityLabel="Produto para calcular" mode="dropdown" style={styles.pickerProduto} selectedValue={produtoId} onValueChange={selecionarProduto}>
              <Picker.Item label="Selecione um produto" value="" />
              {produtos.map((produto) => <Picker.Item key={produto.id} label={produto.nome} value={produto.id} />)}
            </Picker>
          </View>
          {produtoId ? (
            <>
              <Text style={styles.rotulo}>Dose do rótulo por 1.000 L</Text>
              <View style={styles.linha}>
                <TextInput accessibilityLabel="Dose indicada no rótulo" keyboardType="decimal-pad" style={styles.campo} placeholder="Ex.: 40" value={doseRotulo} onChangeText={setDoseRotulo} />
                <View style={styles.seletorUnidade}>
                  <Picker accessibilityLabel="Unidade da dose do rótulo" mode="dropdown" style={styles.pickerUnidade} selectedValue={unidade} onValueChange={setUnidade}>
                    {unidades.map((item) => <Picker.Item key={item} label={item} value={item} />)}
                  </Picker>
                </View>
              </View>
              <TextInput accessibilityLabel="Litragem da piscina" keyboardType="decimal-pad" style={styles.campo} placeholder="Litragem da piscina (L)" value={litragemPiscina} onChangeText={setLitragemPiscina} />
              <Pressable accessibilityRole="button" onPress={calcular} style={({ pressed }) => [styles.botao, pressed && styles.pressionado]} android_ripple={{ color: cores.azulPiscinaPressionado }}>
                <Text style={styles.textoBotao}>Calcular dose</Text>
              </Pressable>
              {resultado !== null && <Text style={styles.resultado}>Dose calculada para esta piscina: {formatarQuantidade(resultado)} {unidade}</Text>}
            </>
          ) : null}
        </>
      )}
    </View>
  );
}

function formatarQuantidade(valor) {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 4 });
}

const styles = StyleSheet.create({
  container: { backgroundColor: cores.fundoTela, borderRadius: 9, marginBottom: 12, marginTop: 10, padding: 12 },
  titulo: { color: cores.azulEscuro, fontSize: 15, fontWeight: '700', marginBottom: 5 },
  instrucao: { color: cores.textoSecundario, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  aviso: { color: cores.textoSecundario, fontSize: 13 },
  rotulo: { color: cores.textoSecundario, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  seletor: { backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 7, borderWidth: 1, justifyContent: 'center', marginBottom: 9, minHeight: 52 },
  pickerProduto: { color: cores.texto, fontSize: 14, height: 52, paddingVertical: 0, width: '100%' },
  linha: { flexDirection: 'row', gap: 8, marginBottom: 9 },
  campo: { backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 7, borderWidth: 1, color: cores.texto, flex: 1, fontSize: 15, marginBottom: 9, minHeight: 52, paddingHorizontal: 11, paddingVertical: 10 },
  seletorUnidade: { backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 7, borderWidth: 1, justifyContent: 'center', minWidth: 108 },
  pickerUnidade: { color: cores.texto, fontSize: 14, height: 52, paddingVertical: 0, width: 108 },
  botao: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 7, justifyContent: 'center', minHeight: 46, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 10 },
  textoBotao: { color: cores.branco, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  resultado: { color: cores.verde, fontSize: 14, fontWeight: '700', marginTop: 9 },
  pressionado: { opacity: 0.8 },
});

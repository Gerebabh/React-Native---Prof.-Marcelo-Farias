import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { cores } from '../styles/colors';
import { produtosTratamento } from './dadosTratamento';

export default function PadraoTratamento({ piscina, onSalvar }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [quantidades, setQuantidades] = useState(() => carregarQuantidades(piscina.tratamentoPadrao));
  const [observacoes, setObservacoes] = useState(piscina.orientacoesTratamento || '');

  function alterarCampo(produto, campo, valor) {
    setQuantidades((atuais) => ({
      ...atuais,
      [produto]: { ...atuais[produto], [campo]: valor },
    }));
  }

  function cancelarEdicao() {
    setQuantidades(carregarQuantidades(piscina.tratamentoPadrao));
    setObservacoes(piscina.orientacoesTratamento || '');
    setMostrarFormulario(false);
  }

  async function salvar() {
    const itens = [];

    for (const produto of produtosTratamento) {
      const quantidade = quantidades[produto].quantidade.trim();
      const unidade = quantidades[produto].unidade.trim();
      if (!quantidade && !unidade) continue;

      const numero = Number(quantidade.replace(',', '.'));
      if (!quantidade || !unidade || !Number.isFinite(numero) || numero <= 0) {
        Alert.alert('Quantidade inválida', `Informe uma quantidade maior que zero e a unidade de ${produto}.`);
        return;
      }

      itens.push({ produto, quantidade, unidade });
    }

    const salvo = await onSalvar(piscina.id, {
      tratamentoPadrao: itens,
      orientacoesTratamento: observacoes.trim(),
    });
    if (salvo) setMostrarFormulario(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Tratamento normal (sem choque)</Text>
      {mostrarFormulario ? (
        <>
          <Text style={styles.instrucao}>Preencha conforme o rótulo dos produtos usados nesta piscina. Os campos podem ficar vazios.</Text>
          {produtosTratamento.map((produto) => (
            <View key={produto} style={styles.linhaProduto}>
              <Text style={styles.nomeProduto}>{produto}</Text>
              <View style={styles.camposProduto}>
                <TextInput
                  accessibilityLabel={`Quantidade de ${produto}`}
                  keyboardType="decimal-pad"
                  style={[styles.campo, styles.campoQuantidade]}
                  placeholder="Quantidade"
                  value={quantidades[produto].quantidade}
                  onChangeText={(valor) => alterarCampo(produto, 'quantidade', valor)}
                />
                <TextInput
                  accessibilityLabel={`Unidade de ${produto}`}
                  style={[styles.campo, styles.campoUnidade]}
                  placeholder="Unidade"
                  value={quantidades[produto].unidade}
                  onChangeText={(valor) => alterarCampo(produto, 'unidade', valor)}
                />
              </View>
            </View>
          ))}
          <TextInput
            accessibilityLabel="Observações do tratamento padrão"
            style={[styles.campo, styles.campoObservacoes]}
            placeholder="Observações do tratamento"
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
          />
          <Pressable accessibilityRole="button" onPress={salvar} style={({ pressed }) => [styles.botaoSalvar, pressed && styles.pressionado]} android_ripple={{ color: cores.azulPiscinaPressionado }}>
            <Text style={styles.textoBotao}>Salvar padrão</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={cancelarEdicao} style={styles.botaoCancelar}>
            <Text style={styles.textoCancelar}>Cancelar</Text>
          </Pressable>
        </>
      ) : (
        <>
          {piscina.tratamentoPadrao?.length ? (
            piscina.tratamentoPadrao.map((item) => (
              <Text key={item.produto} style={styles.textoResumo}>{item.produto}: {item.quantidade} {item.unidade}</Text>
            ))
          ) : (
            <Text style={styles.instrucao}>Nenhum produto padrão configurado.</Text>
          )}
          {piscina.orientacoesTratamento ? <Text style={styles.textoResumo}>{piscina.orientacoesTratamento}</Text> : null}
          <Pressable accessibilityRole="button" onPress={() => setMostrarFormulario(true)} style={({ pressed }) => [styles.botaoEditar, pressed && styles.pressionado]} android_ripple={{ color: cores.azulClaro }}>
            <Text style={styles.textoBotaoEditar}>{piscina.tratamentoPadrao?.length ? 'Editar padrão' : 'Configurar padrão'}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function carregarQuantidades(tratamentoPadrao = []) {
  return Object.fromEntries(produtosTratamento.map((produto) => {
    const salvo = tratamentoPadrao.find((item) => item.produto === produto);
    return [produto, { quantidade: salvo?.quantidade || '', unidade: salvo?.unidade || '' }];
  }));
}

const styles = StyleSheet.create({
  container: { backgroundColor: cores.fundoCartao, borderRadius: 8, marginTop: 12, padding: 12 },
  titulo: { color: cores.azulEscuro, fontSize: 15, fontWeight: '600', marginBottom: 8 },
  instrucao: { color: cores.textoSecundario, fontSize: 13, lineHeight: 18 },
  linhaProduto: { marginTop: 10 },
  nomeProduto: { color: cores.texto, fontSize: 14, fontWeight: '500', marginBottom: 5 },
  camposProduto: { flexDirection: 'row', gap: 8 },
  campo: { backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 7, borderWidth: 1, fontSize: 14, paddingHorizontal: 10, paddingVertical: 9 },
  campoQuantidade: { flex: 2 },
  campoUnidade: { flex: 1 },
  campoObservacoes: { marginTop: 12, minHeight: 60, textAlignVertical: 'top' },
  botaoSalvar: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 7, marginTop: 12, overflow: 'hidden', padding: 11 },
  textoBotao: { color: cores.branco, fontSize: 14, fontWeight: '600' },
  botaoCancelar: { alignItems: 'center', marginTop: 8, padding: 8 },
  textoCancelar: { color: cores.textoSecundario, fontSize: 14, fontWeight: '600' },
  botaoEditar: { alignSelf: 'flex-start', borderColor: cores.borda, borderRadius: 7, borderWidth: 1, marginTop: 10, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 8 },
  textoBotaoEditar: { color: cores.azulEscuro, fontSize: 13, fontWeight: '600' },
  textoResumo: { color: cores.textoSecundario, fontSize: 13, marginTop: 4 },
  pressionado: { opacity: 0.75 },
});

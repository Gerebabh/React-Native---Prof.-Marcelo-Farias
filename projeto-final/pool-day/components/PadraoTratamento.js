import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { cores } from '../styles/colors';
import { converterParaUnidadeEstoque, unidadesDaDose } from '../services/unidades';

export default function PadraoTratamento({ piscina, produtos, onSalvar, onAbrirProdutos }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [quantidades, setQuantidades] = useState(() => carregarQuantidades(produtos, piscina.tratamentoPadrao));
  const [observacoes, setObservacoes] = useState(piscina.orientacoesTratamento || '');

  useEffect(() => {
    if (!mostrarFormulario) {
      setQuantidades(carregarQuantidades(produtos, piscina.tratamentoPadrao));
      setObservacoes(piscina.orientacoesTratamento || '');
    }
  }, [mostrarFormulario, piscina, produtos]);

  function alterarCampo(produtoId, campo, valor) {
    setQuantidades((atuais) => ({
      ...atuais,
      [produtoId]: { ...atuais[produtoId], [campo]: valor },
    }));
  }

  function cancelarEdicao() {
    setQuantidades(carregarQuantidades(produtos, piscina.tratamentoPadrao));
    setObservacoes(piscina.orientacoesTratamento || '');
    setMostrarFormulario(false);
  }

  async function salvar() {
    const itens = [];

    for (const produto of produtos) {
      const quantidade = quantidades[produto.id]?.quantidade?.trim() || '';
      if (!quantidade) continue;

      const numero = Number(quantidade.replace(',', '.'));
      const unidadeDose = quantidades[produto.id]?.unidade || produto.unidade;
      if (!Number.isFinite(numero) || numero <= 0
        || converterParaUnidadeEstoque(numero, unidadeDose, produto.unidade) === null) {
        Alert.alert('Quantidade inválida', `Informe uma quantidade maior que zero para ${produto.nome}.`);
        return;
      }

      itens.push({ produtoId: produto.id, produto: produto.nome, quantidade, unidade: unidadeDose });
    }

    const itensSemProdutoNoEstoque = (piscina.tratamentoPadrao || []).filter((item) => !item.produtoId
      && !produtos.some((produto) => produto.nome.trim().toLocaleLowerCase('pt-BR') === item.produto?.trim().toLocaleLowerCase('pt-BR')));

    const salvo = await onSalvar(piscina.id, {
      tratamentoPadrao: [...itens, ...itensSemProdutoNoEstoque],
      orientacoesTratamento: observacoes.trim(),
    });
    if (salvo) setMostrarFormulario(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Tratamento normal (sem choque)</Text>
      {mostrarFormulario ? (
        <>
          {produtos.length === 0 ? (
            <>
              <Text style={styles.instrucao}>Cadastre os produtos da empresa antes de configurar o tratamento desta piscina.</Text>
              <Pressable accessibilityRole="button" onPress={onAbrirProdutos} style={({ pressed }) => [styles.botaoEditar, pressed && styles.pressionado]}>
                <Text style={styles.textoBotaoEditar}>Ir para Produtos</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.instrucao}>Informe a quantidade usada em cada aplicação conforme o rótulo. O estoque será descontado com a conversão de unidade.</Text>
              {produtos.map((produto) => (
                <View key={produto.id} style={styles.linhaProduto}>
                  <View style={styles.tituloProduto}>
                    <Text style={styles.nomeProduto}>{produto.nome}</Text>
                    <Text style={styles.unidade}>Estoque: {produto.unidade}</Text>
                  </View>
                  <View style={styles.camposProduto}>
                    <TextInput
                      accessibilityLabel={`Quantidade de ${produto.nome}`}
                      keyboardType="decimal-pad"
                      style={styles.campo}
                      placeholder="Quantidade por aplicação"
                      value={quantidades[produto.id]?.quantidade || ''}
                      onChangeText={(valor) => alterarCampo(produto.id, 'quantidade', valor)}
                    />
                    <View style={styles.seletorUnidade}>
                      <Picker
                        accessibilityLabel={`Unidade de ${produto.nome}`}
                        mode="dropdown"
                        style={styles.campoUnidade}
                        selectedValue={quantidades[produto.id]?.unidade || produto.unidade}
                        onValueChange={(valor) => alterarCampo(produto.id, 'unidade', valor)}
                      >
                        {unidadesDaDose(produto.unidade).map((unidade) => <Picker.Item key={unidade} label={unidade} value={unidade} />)}
                      </Picker>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
          <TextInput
            accessibilityLabel="Observações do tratamento padrão"
            style={[styles.campo, styles.campoObservacoes]}
            placeholder="Observações do tratamento"
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
          />
          {produtos.length > 0 && <Pressable accessibilityRole="button" onPress={salvar} style={({ pressed }) => [styles.botaoSalvar, pressed && styles.pressionado]} android_ripple={{ color: cores.azulPiscinaPressionado }}>
            <Text style={styles.textoBotao}>Salvar padrão</Text>
          </Pressable>}
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

function carregarQuantidades(produtos = [], tratamentoPadrao = []) {
  return Object.fromEntries(produtos.map((produto) => {
    const salvo = tratamentoPadrao.find((item) => item.produtoId === produto.id
      || item.produto?.trim().toLocaleLowerCase('pt-BR') === produto.nome.trim().toLocaleLowerCase('pt-BR'));
    const unidades = unidadesDaDose(produto.unidade);
    return [produto.id, {
      quantidade: salvo?.quantidade || '',
      unidade: unidades.includes(salvo?.unidade) ? salvo.unidade : unidades[0],
    }];
  }));
}

const styles = StyleSheet.create({
  container: { backgroundColor: cores.fundoCartao, borderRadius: 8, marginTop: 12, padding: 12 },
  titulo: { color: cores.azulEscuro, fontSize: 15, fontWeight: '600', marginBottom: 8 },
  instrucao: { color: cores.textoSecundario, fontSize: 13, lineHeight: 18 },
  linhaProduto: { marginTop: 10 },
  nomeProduto: { color: cores.texto, fontSize: 14, fontWeight: '500', marginBottom: 5 },
  tituloProduto: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  unidade: { color: cores.textoSecundario, fontSize: 13 },
  camposProduto: { flexDirection: 'row', gap: 8 },
  campo: { backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 7, borderWidth: 1, flex: 1, fontSize: 14, paddingHorizontal: 10, paddingVertical: 9 },
  seletorUnidade: { backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 7, borderWidth: 1, minWidth: 90 },
  campoUnidade: { height: 44 },
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

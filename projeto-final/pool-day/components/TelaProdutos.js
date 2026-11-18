import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { cores } from '../styles/colors';
import CalculadoraProdutos from './CalculadoraProdutos';

export default function TelaProdutos({ produtos, onSalvar }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [quantidadeEstoque, setQuantidadeEstoque] = useState('');
  const [unidade, setUnidade] = useState('');
  const [valorUnitarioUltimaCompra, setValorUnitarioUltimaCompra] = useState('');

  function abrirCadastro() {
    setProdutoEditando(null);
    setNome('');
    setMarca('');
    setQuantidadeEstoque('');
    setUnidade('');
    setValorUnitarioUltimaCompra('');
    setMostrarFormulario(true);
  }

  function abrirEdicao(produto) {
    setProdutoEditando(produto);
    setNome(produto.nome);
    setMarca(produto.marca || '');
    setQuantidadeEstoque(String(produto.quantidadeEstoque));
    setUnidade(produto.unidade);
    setValorUnitarioUltimaCompra(produto.valorUnitarioUltimaCompra == null ? '' : String(produto.valorUnitarioUltimaCompra).replace('.', ','));
    setMostrarFormulario(true);
  }

  async function salvar() {
    const resultado = await onSalvar({
      id: produtoEditando?.id,
      nome,
      marca,
      quantidadeEstoque,
      unidade,
      valorUnitarioUltimaCompra,
    });

    if (resultado) {
      setMostrarFormulario(false);
      setProdutoEditando(null);
      setNome('');
      setMarca('');
      setQuantidadeEstoque('');
      setUnidade('');
      setValorUnitarioUltimaCompra('');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Produtos e estoque</Text>
      <CalculadoraProdutos produtos={produtos} />
      {mostrarFormulario ? (
        <View style={styles.formulario}>
          <Text style={styles.tituloFormulario}>{produtoEditando ? 'Editar produto' : 'Novo produto'}</Text>
          <TextInput accessibilityLabel="Nome do produto" style={styles.campo} placeholder="Nome do produto" value={nome} onChangeText={setNome} />
          <TextInput accessibilityLabel="Marca do produto" style={styles.campo} placeholder="Marca (opcional)" value={marca} onChangeText={setMarca} />
          <TextInput accessibilityLabel="Quantidade em estoque" style={styles.campo} placeholder="Quantidade em estoque" keyboardType="decimal-pad" value={quantidadeEstoque} onChangeText={setQuantidadeEstoque} />
          <Text style={styles.rotulo}>Unidade do estoque</Text>
          <View style={styles.seletor}>
            <Picker accessibilityLabel="Unidade do produto" mode="dropdown" style={styles.campoSeletor} selectedValue={unidade} onValueChange={setUnidade}>
              <Picker.Item label="Selecione a unidade" value="" />
              <Picker.Item label="Quilograma (kg)" value="kg" />
              <Picker.Item label="Grama (g)" value="g" />
              <Picker.Item label="Litro (L)" value="L" />
              <Picker.Item label="Mililitro (ml)" value="ml" />
              <Picker.Item label="Unidade (UN)" value="UN" />
            </Picker>
          </View>
          <TextInput accessibilityLabel="Valor unitário da última compra" style={styles.campo} placeholder="Valor unitário da última compra (R$)" keyboardType="decimal-pad" value={valorUnitarioUltimaCompra} onChangeText={setValorUnitarioUltimaCompra} />
          <Text style={styles.ajuda}>Informe o preço por {unidade || 'unidade de estoque'} (ex.: R$ 8,67 por UN).</Text>
          <Pressable accessibilityRole="button" onPress={salvar} style={({ pressed }) => [styles.botao, pressed && styles.pressionado]} android_ripple={{ color: cores.azulPiscinaPressionado }}>
            <Text style={styles.textoBotao}>Salvar produto</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setMostrarFormulario(false)} style={styles.botaoCancelar}>
            <Text style={styles.textoCancelar}>Cancelar</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={abrirCadastro} style={({ pressed }) => [styles.botao, pressed && styles.pressionado]} android_ripple={{ color: cores.azulPiscinaPressionado }}>
          <Text style={styles.textoBotao}>Adicionar produto</Text>
        </Pressable>
      )}

      {produtos.length === 0 ? (
        <Text style={styles.vazio}>Nenhum produto cadastrado.</Text>
      ) : produtos.map((produto) => (
        <View key={produto.id} style={styles.cartao}>
          <Text style={styles.nomeProduto}>{produto.nome}</Text>
          {!!produto.marca && <Text style={styles.estoque}>Marca: {produto.marca}</Text>}
          <Text style={styles.estoque}>{formatarQuantidade(produto.quantidadeEstoque)} {produto.unidade}</Text>
          {produto.valorUnitarioUltimaCompra != null && <Text style={styles.estoque}>{formatarMoeda(produto.valorUnitarioUltimaCompra)} / {produto.unidade}</Text>}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Editar produto: ${produto.nome}`}
            onPress={() => abrirEdicao(produto)}
            style={({ pressed }) => [styles.botaoEditar, pressed && styles.pressionado]}
            android_ripple={{ color: cores.azulClaro }}
          >
            <Text style={styles.textoEditar}>Editar produto</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function formatarQuantidade(quantidade) {
  return String(quantidade).replace('.', ',');
}

function formatarMoeda(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  titulo: { color: cores.azulEscuro, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  formulario: { backgroundColor: cores.branco, borderRadius: 14, padding: 18 },
  tituloFormulario: { color: cores.azulEscuro, fontSize: 17, fontWeight: '600', marginBottom: 12 },
  rotulo: { color: cores.textoSecundario, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  seletor: { backgroundColor: cores.fundoCartao, borderColor: cores.borda, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  campoSeletor: { height: 52 },
  campo: { backgroundColor: cores.fundoCartao, borderColor: cores.borda, borderRadius: 8, borderWidth: 1, fontSize: 16, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 11 },
  ajuda: { color: cores.textoSecundario, fontSize: 13, marginBottom: 10, marginTop: -8 },
  botao: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 8, marginTop: 4, overflow: 'hidden', padding: 14 },
  pressionado: { opacity: 0.8 },
  textoBotao: { color: cores.branco, fontSize: 16, fontWeight: '600' },
  botaoCancelar: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  textoCancelar: { color: cores.textoSecundario, fontSize: 15, fontWeight: '600' },
  cartao: { backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 10, borderWidth: 1, marginTop: 12, padding: 14 },
  nomeProduto: { color: cores.texto, fontSize: 16, fontWeight: '600' },
  estoque: { color: cores.textoSecundario, fontSize: 15, marginTop: 5 },
  botaoEditar: { alignSelf: 'flex-start', borderColor: cores.borda, borderRadius: 7, borderWidth: 1, marginTop: 10, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8 },
  textoEditar: { color: cores.azulEscuro, fontSize: 14, fontWeight: '600' },
  vazio: { color: cores.textoSecundario, fontSize: 15, marginTop: 12 },
});

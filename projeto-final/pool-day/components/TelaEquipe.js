import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { cores } from '../styles/colors';

export default function TelaEquipe({ nome, email, tratadores, visitas = [], enviando, onNome, onEmail, onConvidar }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tratadorSelecionado, setTratadorSelecionado] = useState(null);

  async function convidar() {
    const concluido = await onConvidar();
    if (concluido) setMostrarFormulario(false);
  }

  if (tratadorSelecionado) {
    const tratador = tratadores.find((item) => item.id === tratadorSelecionado);
    const visitasDoTratador = visitas
      .filter((item) => item.tratadorUid === tratadorSelecionado)
      .sort((a, b) => compararDatas(a.data, b.data));

    return (
      <View style={styles.container}>
        <Pressable accessibilityRole="button" onPress={() => setTratadorSelecionado(null)} style={styles.botaoVoltar}>
          <Text style={styles.textoVoltar}>‹ Voltar para equipe</Text>
        </Pressable>
        <Text style={styles.tituloSecao}>Agenda de {tratador?.nome || tratador?.email || 'tratador'}</Text>
        {visitasDoTratador.length === 0 ? (
          <Text style={styles.vazio}>Nenhuma visita atribuída a este funcionário.</Text>
        ) : visitasDoTratador.map((visita) => (
          <View key={visita.id} style={styles.cartaoAgenda}>
            <Text style={styles.dataAgenda}>{visita.data || 'Data não informada'}</Text>
            <Text style={styles.localAgenda}>{visita.local || 'Local não informado'}</Text>
            <Text style={styles.servicoAgenda}>{visita.servico || 'Serviço não informado'}</Text>
            <Text style={styles.statusAgenda}>Status: {visita.status || 'Pendente'}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.tituloSecao}>Equipe de tratadores</Text>
      {mostrarFormulario ? (
        <View style={styles.formulario}>
          <TextInput accessibilityLabel="Nome do tratador" style={styles.campo} placeholder="Nome do tratador" value={nome} onChangeText={onNome} />
          <TextInput accessibilityLabel="E-mail do tratador" style={styles.campo} placeholder="E-mail do tratador" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={onEmail} />
          <Pressable accessibilityRole="button" onPress={convidar} disabled={enviando} style={({ pressed }) => [styles.botao, pressed && styles.pressionado, enviando && styles.desativado]}>
            <Text style={styles.textoBotao}>{enviando ? 'Enviando convite...' : 'Convidar tratador'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setMostrarFormulario(false)} style={styles.botaoCancelar}>
            <Text style={styles.textoCancelar}>Cancelar</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setMostrarFormulario(true)} style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}>
          <Text style={styles.textoBotao}>Adicionar tratador</Text>
        </Pressable>
      )}
      {tratadores.length === 0 && <Text style={styles.vazio}>Nenhum tratador cadastrado.</Text>}
      {tratadores.map((item) => (
        <View key={item.id} style={styles.cartao}>
          <Text style={styles.nome}>{item.nome || 'Tratador'}</Text>
          <Text style={styles.email}>{item.email}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver agenda de ${item.nome || item.email}`}
            onPress={() => setTratadorSelecionado(item.id)}
            style={({ pressed }) => [styles.botaoAgenda, pressed && styles.pressionado]}
            android_ripple={{ color: cores.azulPiscinaPressionado }}
          >
            <Text style={styles.textoBotao}>Ver agenda</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  formulario: { backgroundColor: cores.branco, borderRadius: 14, padding: 18 },
  tituloSecao: { color: cores.azulEscuro, fontSize: 19, fontWeight: '600', marginBottom: 12 },
  campo: { backgroundColor: cores.fundoCartao, borderColor: cores.borda, borderRadius: 8, borderWidth: 1, fontSize: 16, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 11 },
  botao: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 8, marginTop: 4, overflow: 'hidden', padding: 14 },
  pressionado: { opacity: 0.85 },
  desativado: { opacity: 0.6 },
  textoBotao: { color: cores.branco, fontSize: 16, fontWeight: '600' },
  botaoCancelar: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  textoCancelar: { color: cores.textoSecundario, fontSize: 15, fontWeight: '600' },
  cartao: { backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 14 },
  cartaoAgenda: { backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 14 },
  botaoAgenda: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 8, marginTop: 12, overflow: 'hidden', padding: 11 },
  botaoVoltar: { alignSelf: 'flex-start', marginBottom: 12, paddingVertical: 6 },
  textoVoltar: { color: cores.azulEscuro, fontSize: 15, fontWeight: '600' },
  nome: { color: cores.texto, fontSize: 16, fontWeight: '600' },
  email: { color: cores.textoSecundario, fontSize: 14, marginTop: 3 },
  dataAgenda: { color: cores.textoSecundario, fontSize: 14 },
  localAgenda: { color: cores.texto, fontSize: 15, fontWeight: '600', marginTop: 5 },
  servicoAgenda: { color: cores.azulEscuro, fontSize: 15, marginTop: 5 },
  statusAgenda: { color: cores.textoSecundario, fontSize: 14, marginTop: 5 },
  vazio: { color: cores.textoSecundario, fontSize: 14, marginTop: 12 },
});

function compararDatas(dataA = '', dataB = '') {
  const converterData = (data) => {
    const [dia, mes, ano] = data.split('/').map(Number);
    return ano && mes && dia ? new Date(ano, mes - 1, dia).getTime() : Number.MAX_SAFE_INTEGER;
  };

  return converterData(dataA) - converterData(dataB);
}

import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [tipoPiscina, setTipoPiscina] = useState('');
  const [litragem, setLitragem] = useState('');
  const [residencia, setResidencia] = useState(null);

  function salvarResidencia() {
    if (!nome.trim() || !endereco.trim() || !tipoPiscina.trim() || !litragem.trim()) {
      Alert.alert('Cadastro incompleto', 'Preencha todos os campos da residência e da piscina.');
      return;
    }

    const volume = Number(litragem.trim());

    if (!Number.isInteger(volume) || volume <= 0) {
      Alert.alert('Litragem inválida', 'Informe uma litragem inteira maior que zero.');
      return;
    }

    setResidencia({
      nome: nome.trim(),
      endereco: endereco.trim(),
      tipoPiscina: tipoPiscina.trim(),
      litragem: volume,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <StatusBar style="light" />

      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Pool Day</Text>
        <Text style={styles.subtitulo}>Cadastro da residência e da piscina</Text>
      </View>

      <View style={styles.formulario}>
        <Text style={styles.tituloSecao}>Dados do local</Text>

        <TextInput
          accessibilityLabel="Nome da residência"
          style={styles.campo}
          placeholder="Nome da residência"
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          accessibilityLabel="Endereço"
          style={styles.campo}
          placeholder="Endereço"
          value={endereco}
          onChangeText={setEndereco}
        />
        <TextInput
          accessibilityLabel="Tipo de piscina"
          style={styles.campo}
          placeholder="Tipo de piscina"
          value={tipoPiscina}
          onChangeText={setTipoPiscina}
        />
        <TextInput
          accessibilityLabel="Litragem em litros (ex.: 13000)"
          style={styles.campo}
          placeholder="Litragem em litros (ex.: 13000)"
          keyboardType="numeric"
          value={litragem}
          onChangeText={setLitragem}
        />

        <Pressable
          accessibilityRole="button"
          onPress={salvarResidencia}
          style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]}
          android_ripple={{ color: '#c65326' }}
        >
          <Text style={styles.textoBotao}>Salvar residência</Text>
        </Pressable>
      </View>

      {residencia && (
        <View style={styles.cartao}>
          <Text style={styles.tituloCartao}>Residência cadastrada</Text>
          <Text style={styles.nomeResidencia}>{residencia.nome}</Text>
          <Text style={styles.dadoResidencia}>Endereço: {residencia.endereco}</Text>
          <Text style={styles.dadoResidencia}>
            Piscina de {residencia.tipoPiscina} • {residencia.litragem} L
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f4f7f8',
    padding: 20,
    paddingTop: 36,
  },
  cabecalho: {
    backgroundColor: '#123b4a',
    borderRadius: 14,
    marginBottom: 20,
    padding: 20,
  },
  titulo: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
  },
  subtitulo: {
    color: '#d5e5e9',
    fontSize: 15,
    marginTop: 6,
  },
  formulario: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
  },
  tituloSecao: {
    color: '#123b4a',
    fontSize: 19,
    fontWeight: '600',
    marginBottom: 12,
  },
  campo: {
    backgroundColor: '#f7f9fa',
    borderColor: '#d5dfe2',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  botao: {
    alignItems: 'center',
    backgroundColor: '#e8703a',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
    padding: 14,
  },
  botaoPressionado: {
    opacity: 0.85,
  },
  textoBotao: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cartao: {
    backgroundColor: '#fff',
    borderColor: '#d5dfe2',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 20,
    padding: 18,
  },
  tituloCartao: {
    color: '#123b4a',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  nomeResidencia: {
    color: '#252d31',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  dadoResidencia: {
    color: '#526168',
    fontSize: 15,
    marginTop: 4,
  },
});

import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MetaInput from './components/MetaInput';
import MetaList from './components/MetaList';

import { colors } from './styles/colors';

const STORAGE_KEY = '@metas_semestre';

export default function App() {
  const [texto, setTexto] = useState('');
  const [metas, setMetas] = useState([]);
  const [carregado, setCarregado] = useState(false);
  const [erroCarga, setErroCarga] = useState(false);

  useEffect(() => {
    async function carregarMetas() {
      try {
        const dados = await AsyncStorage.getItem(STORAGE_KEY);
        if (dados !== null) {
          const salvas = JSON.parse(dados);
          if (!Array.isArray(salvas) || salvas.some(meta =>
            !meta || typeof meta.id !== 'string' ||
            typeof meta.texto !== 'string' || typeof meta.criadaEm !== 'string'
          )) {
            throw new Error('Dados inválidos');
          }
          setMetas(salvas);
        }
        setCarregado(true);
      } catch (erro) {
        setErroCarga(true);
        Alert.alert('Ops!', 'Não foi possível carregar suas metas. Feche e abra o aplicativo para tentar novamente.');
      }
    }
    carregarMetas();
  }, []);

  useEffect(() => {
    if (!carregado) return;
    async function salvarMetas() {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(metas));
      } catch (erro) {
        Alert.alert('Ops!', 'Não foi possível salvar suas metas. Sua última alteração pode não aparecer ao reabrir o aplicativo.');
      }
    }
    salvarMetas();
  }, [metas, carregado]);

  function adicionarMeta() {
    if (!texto.trim()) {
      Alert.alert('Atenção', 'Digite uma meta antes de adicionar.');
      return;
    }
    const novaMeta = {
      id: Date.now().toString() + '-' + Math.random().toString(36).slice(2),
      texto: texto.trim(),
      criadaEm: new Date().toISOString(),
      concluida: false,
    };
    setMetas(anteriores => [...anteriores, novaMeta]);
    setTexto('');
  }

  function removerMeta(id) {
    setMetas(anteriores => anteriores.filter(meta => meta.id !== id));
  }

  function alternarConclusao(id) {
    setMetas(anteriores => anteriores.map(meta =>
      meta.id === id ? { ...meta, concluida: !meta.concluida } : meta
    ));
  }

  const concluidas = metas.filter(meta => meta.concluida).length;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.cabecalho}>
          <Image source={require('./assets/icon.png')} style={styles.imagem} />
          <Text style={styles.titulo}>
            <Text style={{ color: colors.black }}>Metas </Text>
            <Text style={{ color: colors.orange }}>Semestre</Text>
          </Text>
          <Text style={styles.contador}>{metas.length - concluidas} Pendentes | {concluidas} Concluídas</Text>
        </View>
        {carregado ? (
          <>
            <MetaInput value={texto} onChangeText={setTexto} onAdd={adicionarMeta} />
            <Text style={styles.tituloLista}>Minhas metas</Text>
            <MetaList metas={metas} onDelete={removerMeta} onToggle={alternarConclusao} />
          </>
        ) : (
          <Text>{erroCarga ? 'Não foi possível carregar. Reabra o aplicativo para tentar novamente.' : 'Carregando metas...'}</Text>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.white
  },
  cabecalho: {
    alignItems: 'center',
    marginBottom: 20
  },
  imagem: {
    width: 60,
    height: 60,
    marginBottom: 8
  },
  titulo: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.gray[800]
  },
  contador: {
    marginTop: 8,
    color: colors.gray[600]
  },
  tituloLista: {
    fontSize: 25,
    fontWeight: '500',
    marginVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.orange,
    paddingBottom: 8,
  },
});

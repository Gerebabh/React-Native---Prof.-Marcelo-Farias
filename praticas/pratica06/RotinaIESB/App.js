import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CompromissoInput from './components/CompromissoInput';
import CompromissoList from './components/CompromissoList';
import {
  botaoAdicionar,
  listaVazia,
  placeholderCompromisso,
  tituloApp,
  tituloLista,
} from './labels';
import { colors } from './styles/colors';

const STORAGE_KEY = '@rotina_iesb_compromissos';

export default function App() {
  const [texto, setTexto] = useState('');
  const [compromissos, setCompromissos] = useState([]);
  const [carregado, setCarregado] = useState(false);
  const [erroCarga, setErroCarga] = useState(false);

  useEffect(() => {
    async function carregarCompromissos() {
      try {
        const dados = await AsyncStorage.getItem(STORAGE_KEY);
        if (dados !== null) {
          const salvos = JSON.parse(dados);
          if (!Array.isArray(salvos) || salvos.some(item =>
            !item || typeof item.id !== 'string' ||
            typeof item.texto !== 'string' || typeof item.criadoEm !== 'string'
          )) {
            throw new Error('Dados inválidos');
          }
          setCompromissos(salvos);
        }
        setCarregado(true);
      } catch (erro) {
        setErroCarga(true);
        Alert.alert('Ops!', 'Não foi possível carregar sua rotina. Feche e abra o aplicativo para tentar novamente.');
      }
    }

    carregarCompromissos();
  }, []);

  useEffect(() => {
    if (!carregado) return;

    async function salvarCompromissos() {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(compromissos));
      } catch (erro) {
        Alert.alert('Ops!', 'Não foi possível salvar sua rotina. A última alteração pode não aparecer ao reabrir o aplicativo.');
      }
    }

    salvarCompromissos();
  }, [compromissos, carregado]);

  function adicionarCompromisso() {
    if (!texto.trim()) {
      Alert.alert('Atenção', 'Digite um compromisso antes de adicionar.');
      return;
    }

    const novoCompromisso = {
      id: Date.now().toString() + '-' + Math.random().toString(36).slice(2),
      texto: texto.trim(),
      criadoEm: new Date().toISOString(),
      concluido: false,
    };
    setCompromissos(anteriores => [...anteriores, novoCompromisso]);
    setTexto('');
  }

  function removerCompromisso(id) {
    setCompromissos(anteriores => anteriores.filter(item => item.id !== id));
  }

  function alternarConclusao(id) {
    setCompromissos(anteriores => anteriores.map(item =>
      item.id === id ? { ...item, concluido: !item.concluido } : item
    ));
  }

  const pendentes = compromissos.filter(item => !item.concluido).length;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.cabecalho}>
          <Image source={require('./assets/logo.png')} style={styles.imagem} />
          <View>
            <Text style={styles.titulo}>{tituloApp}</Text>
            <Text style={styles.contador}>{pendentes} pendentes</Text>
          </View>
        </View>

        {carregado ? (
          <>
            <CompromissoInput
              value={texto}
              onChangeText={setTexto}
              onAdd={adicionarCompromisso}
              placeholder={placeholderCompromisso}
              botaoAdicionar={botaoAdicionar}
            />
            <Text style={styles.tituloLista}>{tituloLista}</Text>
            <CompromissoList
              itens={compromissos}
              onDelete={removerCompromisso}
              onToggle={alternarConclusao}
              listaVazia={listaVazia}
            />
          </>
        ) : (
          <Text style={styles.carregando}>
            {erroCarga ? 'Não foi possível carregar. Reabra o aplicativo para tentar novamente.' : 'Carregando rotina...'}
          </Text>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.white,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  imagem: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  titulo: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.black,
  },
  contador: {
    marginTop: 4,
    color: colors.gray[600],
  },
  tituloLista: {
    fontSize: 25,
    fontWeight: '500',
    marginVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.orange,
    paddingBottom: 8,
  },
  carregando: {
    color: colors.gray[600],
  },
});

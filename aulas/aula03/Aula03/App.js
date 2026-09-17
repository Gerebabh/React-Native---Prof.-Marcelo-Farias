import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import MetasList from './components/MetasList';
import MetaInput from './components/MetaInput';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from './styles/colors';
import { rotulo_input_meta, rotulo_lista_metas, rotulo_btn_cadastro_meta } from './mensagens';


export default function App() {

  const [metas, setMetas] = useState([]);

  function adicionaMetaHandler(inputMeta) {
    const novaMeta = { id: Math.random().toString(), texto: inputMeta}
    setMetas ([...metas, novaMeta])
  }

  function deletarMetaHandler(id) {
    console.log(id)
    const novasMetas = metas.filter(meta => meta.id !== id)
    setMetas (novasMetas)
  }

  return (
      <View style={styles.mainContainer}>
          <MetaInput onAddMeta={adicionaMetaHandler} />

        <View  style={styles.metaContainer}>
          <MetasList array={metas}
          onDeleteItem={deletarMetaHandler}/>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContainer: {
    padding: 30,
    flex: 1,
    flexDirection: 'column'
  },
  inputText: {
    borderColor: colors.gray[300],
    borderWidth: 1,
    borderRadius: 6,
  },
  metaContainer: {
    flex: 15
  },
  item: {
    margin: 8,
    borderRadius: 5,
    padding: 10,
    backgroundColor: 'lightblue'
  }
});

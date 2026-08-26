import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import { colors } from './styles/colors';
import { rotulo_input_meta, rotulo_lista_metas, rotulo_btn_cadastro_meta } from './mensagens';
import Metaslist from './components/Metaslist';


export default function App() {
  const [inputMetaText, setInputMetaText] = useState('');
  const [metas, setMetas] = useState([
  'Estudar React Native',
  'Aprender JavaScript',
  'Praticar componentes',
  'Aprender Flexbox',
  'Estudar StyleSheet',
  'Aprender useState',
  'Praticar eventos',
  'Estudar TextInput',
  'Estudar Button',
  'Aprender listas',
  'Praticar map',
  'Aprender FlatList',
  'Estudar navegação',
  'Criar uma tela de login',
  'Criar uma tela de cadastro',
  'Aprender consumo de API',
  'Estudar JSON',
  'Praticar requisições HTTP',
  'Aprender AsyncStorage',
  'Estudar autenticação',
  'Criar um aplicativo',
  'Publicar um projeto',
  'Aprender Git',
  'Praticar GitHub',
  'Estudar TypeScript',
  'Aprender Expo',
  'Estudar Android Studio',
  'Testar no celular',
  'Criar um projeto completo',
  'Concluir o curso de React Native'
  ]);

  function metaInputHandler(inputText) {
    setInputMetaText (inputText)
  }

  function adicionaMetaHandler() {
    setMetas ([...metas, inputMetaText])
  }

  return (
      <View style={styles.mainContainer}>
        <View style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between'}}>
          <View style={{width: '65%'}}>
            <TextInput 
              style={styles.inputText}
              placeholder={rotulo_input_meta}
              onChangeText={metaInputHandler}
            />
          </View>
          <View style={{width: "30%"}}>
            <Button title={rotulo_btn_cadastro_meta} 
              onPress={adicionaMetaHandler} />
          </View>
        </View>
        <View  style={styles.metaContainer}>
          <Metaslist array={metas}/>
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

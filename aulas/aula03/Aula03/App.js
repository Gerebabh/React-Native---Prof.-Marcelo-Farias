import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from './styles/colors';
import { rotulo_input_meta, rotulo_lista_metas, rotulo_btn_cadastro_meta } from './mensagens';


export default function App() {
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
            />
          </View>
          <View style={{width: "30%"}}>
            <Button title={rotulo_btn_cadastro_meta} />
          </View>
        </View>
        <View style={styles.metaContainer}>
          <Text>{rotulo_lista_metas} </Text>
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
    flex: 1
  }
});

import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from './styles/colors';
import { rotulo_input_meta, rotulo_lista_metas, rotulo_btn_cadastro_meta } from './mensagens';


export default function App() {
  return (
gi
      <View style={styles.mainContainer}>
        <TextInput placeholder={rotulo_input_meta} />
        <Button title={rotulo_btn_cadastro_meta} />
        <Text>{rotulo_lista_metas} </Text>
      </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.variables.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContainer: {
    padding: 30
  }

});

import { StyleSheet, Text, TextInput, View, Button, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_TITLE, INPUT_PLACEHOLDER,ADD_BUTTON, LIST_TITLE } from './labels';
import { colors } from './styles/colors';

export default function App() {
  return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cardTitulo}>
          <Text style={styles.titulo}>{APP_TITLE}</Text>
        </View>
        <View style={styles.cardInput}>
          <TextInput style={styles.inputText} placeholder={INPUT_PLACEHOLDER} />
          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
            >
              <Text style={styles.buttonText}>{ADD_BUTTON}</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.titleList}>{LIST_TITLE}</Text>
        <View style={styles.listaDisciplinas}>
        {disciplinas.map((disciplina, index) => (
          <View
            key={index}
            style={styles.cardDisciplinas}
          >
            <View>
              <Text>
                <Text style={styles.label}>Disciplina:</Text> {disciplina.nome}
              </Text>
              <Text>
                <Text style={styles.label}>Local:</Text> {disciplina.local}
              </Text>
            </View>
            <View>
              <Text>
                <Text style={styles.label}>Tipo:</Text> {disciplina.tipo}
              </Text>
              <Text>
                <Text style={styles.label}>Horário:</Text> {disciplina.horario}
              </Text>
            </View>
          </View>
        ))}
        </View>
      </SafeAreaView>
  );
}

const disciplinas = [
  {
    nome: 'React Native',
    tipo: 'Presencial',
    local: 'IESB-Asa Sul',
    horario: '19:15',
  },
  {
    nome: 'Banco de Dados',
    tipo: 'Presencial',
    local: 'IESB-Asa Sul',
    horario: '21:00',
  },
  {
    nome: 'Métricas e Arq. de SW',
    tipo: 'Presencial',
    local: 'IESB-Asa Sul',
    horario: '19:15',
  },
  {
    nome: 'Lógica de Programação',
    tipo: 'EAD',
    local: 'IESB-Asa Sul',
    horario: '19:15',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    padding: 20,
    alignItems: 'center',
    justifyContent: "flex-start",
  },

  titulo: {
    fontSize: 30,
    fontWeight: "500",
    borderBottomWidth: 2,
    borderColor: colors.gray[600],
    marginBottom: 15
  },

  cardInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 7
  },

  inputText: {
    width: "70%",
    borderWidth: 1,
    borderColor: colors.gray[500],
    borderRadius: 8
  },

  buttonContainer: {
    width: '28%',
  },
    button: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.gray[600],
    alignItems: 'center',
  },

  buttonPressed: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
  titleList: {
    fontSize: 25,
    fontWeight: "500",
    marginTop: 10,
    marginBottom: 10
  },

  listaDisciplinas: {
    gap: 15
  },

  cardDisciplinas: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray[500],
    borderRadius: 8,
    backgroundColor: colors.gray[100]

  }
});
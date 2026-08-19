import { StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from './styles/colors';


export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MINHAS TAREFAS</Text>
      </View>
      <View style={styles.inputTask}>
        <TextInput 
          style={styles.inputField}
          placeholder="Digite uma tarefa..."
          placeholderTextColor={colors.gray[400]}
        />
        <TouchableOpacity style={styles.addButton}>
          <MaterialIcons name="add" size={32} color={colors.gray[100]}/>
        </TouchableOpacity>
      </View>

      {/* Tarefas */}
      <View style={styles.bodyTasks}>
        <View style={styles.card}>
          <Text style={styles.tasks}>
            Fazer compras de supermercado
          </Text> 
          <TouchableOpacity style={styles.addButton}>
            <MaterialIcons name="delete" size={26} color={colors.gray[100]}/>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bodyTasks}>
        <View style={styles.card}>
          <Text style={styles.tasks}>
            Estudar React Native
          </Text> 
          <TouchableOpacity style={styles.addButton}>
            <MaterialIcons name="delete" size={26} color={colors.gray[100]}/>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bodyTasks}>
        <View style={styles.card}>
          <Text style={styles.tasks}>
            Estudar Python
          </Text> 
          <TouchableOpacity style={styles.addButton}>
            <MaterialIcons name="delete" size={26} color={colors.gray[100]}/>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bodyTasks}>
        <View style={styles.card}>
          <Text style={styles.tasks}>
            Fazer atividades físicas
          </Text> 
          <TouchableOpacity style={styles.addButton}>
            <MaterialIcons name="delete" size={26} color={colors.gray[100]}/>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[950],
    alignItems: "center",
  },
  header: {
    paddingTop: 32,
    paddingBottom: 30,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.variables.orange 
  },
  title: {
    color: colors.variables.orange,
    fontSize: 22,
    fontWeight: "500"
  },
  inputField: {
      height: 52,
      width:"100%",
      backgroundColor: colors.gray[100],
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.gray[800],
      paddingLeft: 8,
      color: colors.gray[800],
      fontSize: 18
  },
  inputTask: {
    width: "100%",
    padding: 12,
    flexDirection: "row",
    gap: 6
  },
  addButton: {
    height: 52,
    width: 52,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    borderColor: colors.gray[100],
    backgroundColor: colors.variables.orange,
  },
    bodyTasks: {
    width: "100%",
    padding: 12,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.gray[600],
    borderRadius: 8,
    marginBottom: 10,
  },
  tasks: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    alignItems: "center",
    paddingLeft: 8,
  }
})

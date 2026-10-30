import { useState } from 'react';
import { router } from 'expo-router';
import { Alert, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { themes } from '../constants/theme';
import { useTasks } from '../store/tasks-context';
import ActionButton from '../components/ActionButton';

export default function NewTask() {
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const { addTask } = useTasks();
  const [title, setTitle] = useState('');

  function handleSave() {
    if (!title.trim()) {
      Alert.alert('Nova tarefa', 'Digite o nome da tarefa.');
      return;
    }
    addTask(title.trim());
    router.back();
  }

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <Text style={[styles.title, { color: colors.text }]}>Nova tarefa</Text>
    <Text style={{ color: colors.secondary }}>Organize seu próximo momento de estudo.</Text>
    <TextInput value={title} onChangeText={setTitle} placeholder="Ex.: Estudar para a prova"
      placeholderTextColor={colors.secondary} maxLength={60}
      style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]} />
    <ActionButton title="Salvar" onPress={handleSave} />
    <ActionButton title="Fechar" onPress={() => router.back()} />
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, gap: 20 },
  title: { fontSize: 24, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
});

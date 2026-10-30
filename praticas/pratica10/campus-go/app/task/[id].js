import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useTasks } from '../../store/tasks-context';
import { themes } from '../../constants/theme';
import ActionButton from '../../components/ActionButton';

export default function TaskDetail() {
  const { id } = useLocalSearchParams();
  const { tasks } = useTasks();
  const task = tasks.find(item => item.id === id);
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <Text style={[styles.title, { color: colors.text }]}>Tarefa número {id}</Text>
    <Text style={{ color: colors.secondary }}>{task ? task.title : 'Detalhes da tarefa selecionada.'}</Text>
    <ActionButton title="Voltar" onPress={() => router.back()} />
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, gap: 20 },
  title: { fontSize: 24, fontWeight: '600' },
});

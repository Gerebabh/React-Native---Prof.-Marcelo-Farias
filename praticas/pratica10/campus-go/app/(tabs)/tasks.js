import { useState } from 'react';
import { router } from 'expo-router';
import { Alert, Linking, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { themes } from '../../constants/theme';
import { useTasks } from '../../store/tasks-context';
import { getCurrentPlace } from '../../services/location';
import { scheduleReminder } from '../../services/notifications';
import ActionButton from '../../components/ActionButton';

export default function Tasks() {
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const { tasks, completeTask } = useTasks();
  const [place, setPlace] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  async function handleCheckIn() {
    setIsLocating(true);
    try {
      const currentPlace = await getCurrentPlace();
      setPlace(currentPlace);
      if (!currentPlace) {
        Alert.alert('Localização', 'Permita o acesso à localização para registrar onde estudou.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir ajustes', onPress: () => Linking.openSettings().catch(() => {
            Alert.alert('Ajustes', 'Abra as configurações do aparelho e confira a permissão de localização.');
          }) },
        ]);
      }
    } catch {
      Alert.alert('Localização', 'Não foi possível encontrar seu local. Confira se a localização está ligada e tente novamente.');
    } finally {
      setIsLocating(false);
    }
  }

  async function handleReminder() {
    setIsScheduling(true);
    try {
      const id = await scheduleReminder('Hora de estudar! Confira sua tarefa.', 10);
      if (id) {
        Alert.alert('Lembrete agendado', 'Você receberá um lembrete em cerca de 10 segundos.');
      } else {
        Alert.alert('Permissão necessária', 'Ative as notificações do Expo Go nos ajustes do aparelho.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir ajustes', onPress: () => Linking.openSettings().catch(() => {
            Alert.alert('Ajustes', 'Abra as configurações do aparelho e ative as notificações do Expo Go.');
          }) },
        ]);
      }
    } catch (error) {
      console.error('Erro ao agendar lembrete local:', error);
      Alert.alert('Lembrete', 'Não foi possível agendar agora. Tente novamente mais tarde.');
    } finally {
      setIsScheduling(false);
    }
  }

  async function handleComplete(id) {
    completeTask(id);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Mesmo sem vibração (por exemplo, no emulador), a conclusão continua.
    }
    Alert.alert('Tarefa concluída', 'Bom estudo!');
  }

  return <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.screen}>
    <Text style={[styles.title, { color: colors.text }]}>Minhas tarefas</Text>
    <ActionButton title="Nova tarefa" onPress={() => router.push('/new-task')} />
    {tasks.map(task => <View key={task.id}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.subtitle, { color: colors.text },
        task.done && { textDecorationLine: 'line-through', opacity: 0.6 }]}>{task.title}</Text>
      <ActionButton title="Ver tarefa" onPress={() => router.push(`/task/${task.id}`)} />
      {task.done ? <Text style={{ color: colors.secondary }}>Concluída</Text>
        : <ActionButton title="Concluir" onPress={() => handleComplete(task.id)} />}
    </View>)}
    <ActionButton title={isLocating ? 'Buscando local...' : 'Estudei aqui'}
      onPress={handleCheckIn} disabled={isLocating} />
    {place && <Text style={{ color: colors.text }}>Local de estudo: {place.label}</Text>}
    <ActionButton title={isScheduling ? 'Agendando...' : 'Lembrar em 10 s'}
      onPress={handleReminder} disabled={isScheduling} />
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { padding: 20, paddingBottom: 40, gap: 16 },
  title: { fontSize: 24, fontWeight: '600' },
  subtitle: { fontSize: 18, fontWeight: '500' },
  card: { padding: 16, borderRadius: 8, borderWidth: 1, gap: 12 },
});

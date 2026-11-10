import { Stack } from 'expo-router';
import { StatusBar, useColorScheme } from 'react-native';
import { ExpensesContextProvider } from '../store/expenses-context';
import { TasksContextProvider } from '../store/tasks-context';
import { themes } from '../constants/theme';

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';
  const colors = themes[dark ? 'dark' : 'light'];

  return <ExpensesContextProvider>
    <TasksContextProvider>
    <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
    <Stack screenOptions={{
      headerStyle: { backgroundColor: colors.card },
      headerTintColor: colors.text,
      contentStyle: { backgroundColor: colors.background },
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="task/[id]" options={{ title: 'Tarefa' }} />
      <Stack.Screen name="new-task" options={{ title: 'Nova tarefa', presentation: 'modal' }} />
    </Stack>
    </TasksContextProvider>
  </ExpensesContextProvider>;
}

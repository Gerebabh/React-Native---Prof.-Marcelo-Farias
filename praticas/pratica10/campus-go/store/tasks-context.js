import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tasks';
const firstTask = { id: '42', title: 'Revisar a aula de hoje' };
const TasksContext = createContext(null);

export function TasksContextProvider({ children }) {
  const [tasks, setTasks] = useState([firstTask]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadTasks() {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        const saved = json ? JSON.parse(json) : null;
        if (Array.isArray(saved)) setTasks(saved);
      } catch {
        // Sem tarefas salvas, o app começa com a tarefa de exemplo.
      } finally {
        setIsLoaded(true);
      }
    }
    loadTasks();
  }, []);

  useEffect(() => {
    if (isLoaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)).catch(() => {});
  }, [tasks, isLoaded]);

  function addTask(title) {
    setTasks(current => [{ id: Date.now().toString(), title }, ...current]);
  }

  function completeTask(id) {
    setTasks(current => current.map(task => task.id === id ? { ...task, done: true } : task));
  }

  return <TasksContext.Provider value={{ tasks, addTask, completeTask }}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) throw new Error('useTasks deve ser usado dentro de TasksContextProvider.');
  return context;
}

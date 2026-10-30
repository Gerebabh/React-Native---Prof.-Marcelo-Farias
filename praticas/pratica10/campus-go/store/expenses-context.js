import { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { themes } from '../constants/theme';

export function expensesReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [action.payload, ...state];
    case 'UPDATE':
      return state.map(item => item.id === action.payload.id ? { ...item, ...action.payload.data } : item);
    case 'DELETE':
      return state.filter(item => item.id !== action.payload);
    case 'SET':
      return [...action.payload];
    default:
      return state;
  }
}

export const ExpensesContext = createContext(null);
const STORAGE_KEY = '@expenses';

export function ExpensesContextProvider({ children }) {
  const [expenses, dispatch] = useReducer(expensesReducer, []);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const saveQueue = useRef(Promise.resolve());
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    let active = true;
    async function loadExpenses() {
      setLoadError(false);
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        const saved = json ? JSON.parse(json) : [];
        if (!Array.isArray(saved)) throw new Error('Lista inválida');
        const restored = saved.map(item => {
          if (!item || typeof item.id !== 'string' || typeof item.description !== 'string' ||
            typeof item.amount !== 'number' || !Number.isFinite(item.amount) || item.amount <= 0 ||
            typeof item.category !== 'string' || typeof item.date !== 'string') throw new Error('Despesa inválida');
          const date = new Date(item.date);
          if (Number.isNaN(date.getTime())) throw new Error('Data inválida');
          return { ...item, date };
        });
        if (active) {
          dispatch({ type: 'SET', payload: restored });
          setIsLoaded(true);
        }
      } catch {
        if (active) setLoadError(true);
      }
    }
    loadExpenses();
    return () => { active = false; };
  }, [retry]);

  useEffect(() => {
    if (!isLoaded) return;
    const json = JSON.stringify(expenses);
    saveQueue.current = saveQueue.current.then(async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, json);
      } catch {
        Alert.alert('Erro ao salvar', 'Não foi possível salvar a última alteração no aparelho.');
      }
    });
  }, [expenses, isLoaded]);

  function addExpense(data) {
    const id = Date.now().toString() + '-' + Math.random().toString(36).slice(2);
    dispatch({ type: 'ADD', payload: { ...data, id } });
  }

  function updateExpense(id, data) {
    dispatch({ type: 'UPDATE', payload: { id, data } });
  }

  function deleteExpense(id) {
    dispatch({ type: 'DELETE', payload: id });
  }

  if (!isLoaded) return <View style={[styles.loading, { backgroundColor: colors.background }]}>
    <Text style={{ color: colors.text }}>{loadError ? 'Não foi possível carregar as despesas.' : 'Carregando despesas...'}</Text>
    {loadError && <Button title="Tentar novamente" color={colors.primary} onPress={() => setRetry(value => value + 1)} />}
  </View>;

  return <ExpensesContext.Provider value={{ expenses, addExpense, updateExpense, deleteExpense }}>
    {children}
  </ExpensesContext.Provider>;
}

export function useExpenses() {
  const context = useContext(ExpensesContext);
  if (!context) throw new Error('useExpenses deve ser usado dentro de ExpensesContextProvider.');
  return context;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 } });

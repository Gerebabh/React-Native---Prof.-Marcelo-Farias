import { useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { ExpensesContextProvider } from './src/store/expenses-context';
import { themes } from './src/constants/theme';
import TodasDespesas from './src/screens/TodasDespesas';
import DespesasRecentes from './src/screens/DespesasRecentes';
import GerenciarDespesa from './src/screens/GerenciarDespesa';
import IconButton from './src/components/IconButton';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabScreen() {
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return <Tab.Navigator screenOptions={({ navigation }) => ({
    headerRight: () => <IconButton icon="add" label="Adicionar despesa" onPress={() => navigation.navigate('GerenciarDespesa')} />,
    tabBarActiveTintColor: colors.primary,
    tabBarLabelStyle: { fontSize: 12 },
  })}>
    <Tab.Screen name="DespesasRecentes" component={DespesasRecentes} options={{ title: 'Despesas Recentes', tabBarLabel: 'Recentes',
      tabBarIcon: ({ color, size }) => <Ionicons name="hourglass-outline" color={color} size={size} /> }} />
    <Tab.Screen name="TodasDespesas" component={TodasDespesas} options={{ title: 'Todas as Despesas', tabBarLabel: 'Todas',
      tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" color={color} size={size} /> }} />
  </Tab.Navigator>;
}

export default function App() {
  const dark = useColorScheme() === 'dark';
  const colors = themes[dark ? 'dark' : 'light'];
  const baseTheme = dark ? DarkTheme : DefaultTheme;
  const theme = { ...baseTheme, colors: { ...baseTheme.colors, primary: colors.primary,
    background: colors.background, card: colors.card, text: colors.text, border: colors.border } };

  return <ExpensesContextProvider>
    <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
    <NavigationContainer theme={theme}>
      <Stack.Navigator>
        <Stack.Screen name="Despesas" component={BottomTabScreen} options={{ headerShown: false }} />
        <Stack.Screen name="GerenciarDespesa" component={GerenciarDespesa} />
      </Stack.Navigator>
    </NavigationContainer>
  </ExpensesContextProvider>;
}

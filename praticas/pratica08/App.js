import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import TodasDespesas from './screens/TodasDespesas';
import DespesasRecentes from './screens/DespesasRecentes';
import GerenciarDespesa from './screens/GerenciarDespesa';
import IconButton from './components/IconButton';
import { colors } from './styles/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabScreen({ despesas }) {
  return (
    <Tab.Navigator screenOptions={({ navigation }) => ({
      headerRight: () => <IconButton icon="add" onPress={() => navigation.navigate('GerenciarDespesa')} />,
      tabBarActiveTintColor: colors.orange,
      tabBarLabelStyle: { fontSize: 12 },
    })}>
      <Tab.Screen name="DespesasRecentes" options={{ title: 'Despesas Recentes', tabBarLabel: 'Recentes',
        tabBarIcon: ({ color, size }) => <Ionicons name="hourglass-outline" color={color} size={size} /> }}>
        {() => <DespesasRecentes despesas={despesas} />}
      </Tab.Screen>
      <Tab.Screen name="TodasDespesas" options={{ title: 'Todas as Despesas', tabBarLabel: 'Todas',
        tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" color={color} size={size} /> }}>
        {() => <TodasDespesas despesas={despesas} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [despesas, setDespesas] = useState([]);

  function adicionarDespesa(dados) {
    const novaDespesa = { ...dados, id: Date.now().toString() + '-' + Math.random().toString(36).slice(2) };
    setDespesas(anteriores => [novaDespesa, ...anteriores]);
  }

  function editarDespesa(id, dados) {
    setDespesas(anteriores => anteriores.map(item => item.id === id ? { ...item, ...dados } : item));
  }

  function removerDespesa(id) {
    setDespesas(anteriores => anteriores.filter(item => item.id !== id));
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Despesas" options={{ headerShown: false }}>
          {() => <BottomTabScreen despesas={despesas} />}
        </Stack.Screen>
        <Stack.Screen name="GerenciarDespesa" options={({ route }) => ({
          title: route.params?.despesaId ? 'Editar despesa' : 'Nova despesa',
        })}>
          {props => <GerenciarDespesa {...props} despesas={despesas}
            onAdd={adicionarDespesa} onEdit={editarDespesa} onDelete={removerDespesa} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
